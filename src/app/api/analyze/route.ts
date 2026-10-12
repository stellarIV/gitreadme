import { NextRequest } from "next/server";
import { parseGitHubUrl, GitHubClient } from "@/lib/github/client";
import { filterAndPrioritizeTree } from "@/lib/github/tree";
import {
  scanFileForSecrets,
  extractEnvVariables,
  detectTechStack,
  detectMissingBestPractices,
} from "@/lib/github/detector";
import { calculateGitVelocity } from "@/lib/github/metrics";
import { prepareAnalysisContext } from "@/lib/analyzer/mapReduce";
import { runAIAnalysis } from "@/lib/analyzer/ai";
import { synthesizeHeuristicAnalysis } from "@/lib/analyzer/heuristic";
import { generateMarkdownDoc } from "@/lib/analyzer/markdown";
import { getCachedAnalysis, setCachedAnalysis } from "@/lib/db";
import { consumeQuota } from "@/lib/quota/quotaManager";
import { parseGitreadmeConfig } from "@/lib/config/gitreadmeConfig";
import {
  ProgressEventPayload,
  RepoAnalysis,
  SecretWarning,
  TechStackItem,
  ArchitectureInsight,
  SetupGuide,
  FunctionalCategory,
  NonFunctionalSpecs,
  RoastAnalysis,
} from "@/lib/analyzer/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  // Create real SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(payload: ProgressEventPayload, extraData?: unknown) {
        const data = JSON.stringify({ ...payload, data: extraData });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }

      try {
        const body = await req.json().catch(() => ({}));
        const {
          repoUrl,
          mode = "professional",
          forceRefresh = false,
          provider = "auto",
          apiKey,
          model,
          githubToken,
        } = body;

        sendEvent({
          step: "parsing_url",
          progress: 5,
          title: "Parsing Repository Target",
          detail: `Validating URL: ${repoUrl}`,
          timestamp: Date.now(),
        });

        const parsed = parseGitHubUrl(repoUrl);
        if (!parsed) {
          sendEvent({
            step: "error",
            progress: 0,
            title: "Invalid GitHub URL",
            detail: "Please provide a valid format like 'owner/repo' or 'https://github.com/owner/repo'",
            timestamp: Date.now(),
          });
          controller.close();
          return;
        }

        const { owner, repo } = parsed;

        // ─── Quota Enforcement ──────────────────────────────────────────────
        // Extract client IP — respects x-forwarded-for from proxies
        const forwardedFor = req.headers.get("x-forwarded-for");
        const clientIp = (forwardedFor ? forwardedFor.split(",")[0] : "127.0.0.1").trim();
        const isPro = Boolean(req.headers.get("x-gitreadme-pro")); // set by auth layer later

        const quotaResult = consumeQuota(clientIp, isPro, false /* private unknown yet */);
        if (!quotaResult.success) {
          sendEvent({
            step: "error",
            progress: 0,
            title: "Daily Analysis Limit Reached",
            detail: `${quotaResult.status.reason ?? "Quota exceeded"} — Upgrade to Pro for unlimited analyses.`,
            timestamp: Date.now(),
          }, { quota: quotaResult.status, upgradeUrl: "/settings?upgrade=1" });
          controller.close();
          return;
        }

        const ghClient = new GitHubClient(githubToken);

        sendEvent({
          step: "fetching_metadata",
          progress: 15,
          title: "Connecting to GitHub API",
          detail: `Fetching repository metadata for ${owner}/${repo}...`,
          timestamp: Date.now(),
        });

        const repoMeta = await ghClient.getRepo(owner, repo);
        const commits = await ghClient.getCommits(owner, repo, undefined, 40);
        const headSha = commits[0]?.sha || "HEAD";

        // Check strict commit SHA cache unless forceRefresh is true
        if (!forceRefresh) {
          const cached = getCachedAnalysis(owner, repo, headSha, mode);
          if (cached) {
            sendEvent({
              step: "complete",
              progress: 100,
              title: "Instant Cache Hit",
              detail: `Loaded analysis for commit ${headSha.slice(0, 7)} from cache`,
              timestamp: Date.now(),
            }, cached);
            controller.close();
            return;
          }
        }

        sendEvent({
          step: "scanning_tree",
          progress: 30,
          title: "Scanning Repository Tree",
          detail: `Inspecting directory layout at ref ${repoMeta.default_branch}...`,
          timestamp: Date.now(),
        });

        const rawTree = await ghClient.getTree(owner, repo, repoMeta.default_branch);
        const treeSummary = filterAndPrioritizeTree(rawTree, 25);

        sendEvent({
          step: "reading_critical_files",
          progress: 45,
          title: "Ingesting Critical Manifests & Configs",
          detail: `Identified ${treeSummary.prioritizedFilesToRead.length} high-signal files from ${rawTree.length} total nodes...`,
          timestamp: Date.now(),
        });

        // Read prioritized files in parallel (batched in chunks of 5)
        const filesMap = new Map<string, string>();
        const filesToRead = treeSummary.prioritizedFilesToRead.slice(0, 20);

        for (let i = 0; i < filesToRead.length; i += 5) {
          const chunk = filesToRead.slice(i, i + 5);
          await Promise.all(
            chunk.map(async (file) => {
              const content = await ghClient.getFileContent(owner, repo, file.path, repoMeta.default_branch);
              if (content) {
                filesMap.set(file.path, content);
              }
            })
          );
        }

        // Map-Reduce Context for large/monorepo trees
        if (treeSummary.isMonorepo || treeSummary.totalFiles > 100) {
          sendEvent({
            step: "map_reduce_monorepo",
            progress: 60,
            title: "Executing Map-Reduce Summaries",
            detail: `Detected monorepo workspaces: ${treeSummary.monorepoWorkspaces.join(", ") || "Multiple packages"}`,
            timestamp: Date.now(),
          });
        }

        const analysisContext = prepareAnalysisContext(treeSummary, filesMap);

        // ─── Fetch .gitreadme.yml repo config ───────────────────────────────
        // Try both .gitreadme.yml and .gitreadme.yaml
        let repoConfig = {};
        for (const configPath of [".gitreadme.yml", ".gitreadme.yaml"]) {
          // Check if we already fetched it during file ingestion
          const cached = filesMap.get(configPath);
          if (cached) {
            repoConfig = parseGitreadmeConfig(cached);
            break;
          }
          // Try fetching directly
          try {
            const configContent = await ghClient.getFileContent(owner, repo, configPath, repoMeta.default_branch);
            if (configContent) {
              repoConfig = parseGitreadmeConfig(configContent);
              break;
            }
          } catch {
            // No .gitreadme.yml — proceed without it
          }
        }


        sendEvent({
          step: "scanning_secrets",
          progress: 70,
          title: "Security & Credential Audit",
          detail: "Auditing manifests and code for credential leaks...",
          timestamp: Date.now(),
        });

        const allSecretWarnings: SecretWarning[] = [];
        for (const [path, content] of filesMap.entries()) {
          const warnings = scanFileForSecrets(path, content);
          allSecretWarnings.push(...warnings);
        }

        // Extract Tech Stack and Best Practices
        const detectedTech = detectTechStack(filesMap, treeSummary.filteredFiles.map((f) => f.path));
        const detectedIssues = detectMissingBestPractices(
          treeSummary.filteredFiles.map((f) => f.path),
          filesMap,
          allSecretWarnings.length > 0
        );

        // Git Velocity & Contributors
        sendEvent({
          step: "running_velocity",
          progress: 80,
          title: "Computing Git Velocity & Timeline",
          detail: "Analyzing commit frequency, release milestones, and top contributors...",
          timestamp: Date.now(),
        });

        const [contributors, releases] = await Promise.all([
          ghClient.getContributors(owner, repo, 10),
          ghClient.getReleases(owner, repo, 5),
        ]);

        const gitVelocity = calculateGitVelocity(commits, contributors, releases, repoMeta.created_at);

        // AI Synthesis or Heuristic Engine
        sendEvent({
          step: mode === "roast" ? "cooking_roast" : "synthesizing_architecture",
          progress: 88,
          title: mode === "roast" ? "Cooking Savage Roast" : "Synthesizing Architecture Blueprint",
          detail: "Formulating system diagrams, setup guides, and architectural flows...",
          timestamp: Date.now(),
        });

        const baseMeta = {
          owner: repoMeta.owner.login,
          name: repoMeta.name,
          fullName: repoMeta.full_name,
          defaultBranch: repoMeta.default_branch,
          commitSha: headSha,
          description: repoMeta.description,
          stars: repoMeta.stargazers_count,
          forks: repoMeta.forks_count,
          openIssues: repoMeta.open_issues_count,
          language: repoMeta.language,
          topics: repoMeta.topics || [],
          license: repoMeta.license?.spdx_id || repoMeta.license?.name || null,
          createdAt: repoMeta.created_at,
          updatedAt: repoMeta.updated_at,
          htmlUrl: repoMeta.html_url,
          isPrivate: repoMeta.private,
        };

        // Try AI first
        const aiResult = await runAIAnalysis(baseMeta, analysisContext, mode, {
          provider,
          apiKey,
          model,
        });

        // Fallback to Heuristic engine if AI not configured or failed
        const heuristicResult = synthesizeHeuristicAnalysis(
          baseMeta,
          detectedTech,
          analysisContext,
          detectedIssues,
          mode,
          repoConfig
        );

        // Merge results
        const finalTechStack = (aiResult?.techStack as TechStackItem[] | undefined) || heuristicResult.techStack;
        const finalArchitecture = (aiResult?.architecture as ArchitectureInsight | undefined) || heuristicResult.architecture;
        const finalSetup = (aiResult?.setupGuide as SetupGuide | undefined) || heuristicResult.setupGuide;

        // Supplement extracted env vars from files if not filled
        const extractedEnvs = extractEnvVariables(filesMap);
        if (extractedEnvs.length > 0 && (!finalSetup.envVars || finalSetup.envVars.length === 0)) {
          finalSetup.envVars = extractedEnvs;
        }

        const finalFunctional = (aiResult?.functional as FunctionalCategory[] | undefined) || heuristicResult.functional;
        const finalNonFunctional = (aiResult?.nonFunctional as NonFunctionalSpecs | undefined) || heuristicResult.nonFunctional;
        const finalRoast = (aiResult?.roast as RoastAnalysis | undefined) || heuristicResult.roast;

        sendEvent({
          step: "generating_markdown",
          progress: 96,
          title: "Rendering Documentation Markdown",
          detail: "Assembling final Markdown and Mermaid diagram schemas...",
          timestamp: Date.now(),
        });

        const analysis: RepoAnalysis = {
          metadata: baseMeta,
          techStack: finalTechStack,
          architecture: finalArchitecture,
          setupGuide: finalSetup,
          gitVelocity,
          functional: finalFunctional,
          nonFunctional: finalNonFunctional,
          missingPractices: detectedIssues,
          secretsWarnings: allSecretWarnings,
          roast: finalRoast,
          isMonorepo: treeSummary.isMonorepo,
          monorepoWorkspaces: treeSummary.monorepoWorkspaces,
          markdown: "",
          generatedAt: new Date().toISOString(),
          mode,
        };

        analysis.markdown = generateMarkdownDoc(analysis, "readme");

        // Cache the result
        setCachedAnalysis(owner, repo, headSha, mode, analysis);

        sendEvent({
          step: "complete",
          progress: 100,
          title: "Analysis Ready",
          detail: `Successfully processed ${owner}/${repo}`,
          timestamp: Date.now(),
        }, analysis);

        controller.close();
      } catch (err: unknown) {
        console.error("Analysis pipeline error:", err);
        const errMsg = err instanceof Error ? err.message : "An unexpected error occurred while analyzing the repository.";
        sendEvent({
          step: "error",
          progress: 0,
          title: "Analysis Failed",
          detail: errMsg,
          timestamp: Date.now(),
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
