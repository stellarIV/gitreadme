import { PreparedAnalysisContext } from "./mapReduce";
import { RepoMetadata } from "./types";

export function buildAnalysisSystemPrompt(mode: "professional" | "roast" = "professional"): string {
  const toneInstruction =
    mode === "roast"
      ? `TONE REQUIREMENT: You are an elite, hilarious, brutally honest principal engineer doing a "Roast My Repo" code audit. Be witty, slightly savage, and technically perceptive. Roast bad patterns, over-engineering, dependency bloat, questionable architecture, and "this could have been a bash script" vibes. BUT NEVER be mean-spirited to individuals, and ALWAYS provide genuine, constructive architectural remedies at the end.`
      : `TONE REQUIREMENT: You are an elite principal software architect and technical lead. Provide crystal-clear, deeply accurate, and authoritative technical documentation, architecture blueprints, and local setup steps.`;

  return `You are RepoIntel (gitreadme), the world-class repository intelligence platform.
Your task is to analyze a codebase from its file tree, directory digests, and critical file contents, then produce a comprehensive, structured repository intelligence report in strict JSON format.

${toneInstruction}

IMPORTANT RULES:
1. Always output valid JSON matching the exact schema requested. Do not wrap the JSON in markdown codeblocks (no \`\`\`json). Return raw JSON only.
2. Architecture Mermaid Diagram: Output valid Mermaid.js flowchart syntax (e.g. \`flowchart TD\` or \`graph TD\`). Only use alphanumeric characters or double-quoted labels like \`A["Client (Next.js)"] --> B["API Gateway"]\`. Never use invalid syntax or unescaped parentheses in node IDs.
3. Setup Steps: Provide exact, executable shell commands based on the detected package manager and configuration files.
4. Functional & Non-Functional: Extract real functionality from routes, controllers, and APIs, not generic placeholders.
5. Roast Section: Always populate the roast section with high-wit, technically sharp commentary.`;
}

export function buildAnalysisUserPrompt(
  metadata: RepoMetadata,
  context: PreparedAnalysisContext,
  mode: "professional" | "roast" = "professional"
): string {
  const summariesText = context.directorySummaries
    .map(
      (d) =>
        `- Directory: ${d.directory} (${d.fileCount} files)\n  Role: ${d.inferredRole}\n  Tech: ${d.technologies.join(", ") || "General"}\n  Key Files: ${d.criticalFiles.join(", ")}`
    )
    .join("\n");

  const filesText = context.criticalFileSnippets
    .map((f) => `=== FILE: ${f.path} ===\n${f.content}\n`)
    .join("\n\n");

  return `Analyze this repository:
Repository: ${metadata.fullName}
Description: ${metadata.description || "No description provided"}
Primary Language: ${metadata.language || "Unknown"}
Default Branch: ${metadata.defaultBranch}
Stars: ${metadata.stars} | Forks: ${metadata.forks}
Analysis Mode: ${mode}

TREE OVERVIEW:
\`\`\`
${context.fileTreeOutline}
\`\`\`

DIRECTORY SUMMARIES:
${summariesText}

CRITICAL FILE CONTENTS:
${filesText}

OUTPUT FORMAT: Return a valid JSON object matching this TypeScript interface:
{
  "techStack": [
    { "category": "frontend" | "backend" | "database" | "cache" | "queue" | "auth" | "devops" | "testing" | "tooling", "name": string, "version": string, "detectedFrom": string, "purpose": string }
  ],
  "architecture": {
    "textualOverview": string,
    "components": [
      { "name": string, "role": string, "tech": string, "paths": string[] }
    ],
    "dataFlow": [string],
    "diagramMermaid": string, // Valid Mermaid flowchart TD with quoted labels
    "entryPoints": [
      { "name": string, "path": string, "description": string }
    ]
  },
  "setupGuide": {
    "packageManager": "pnpm" | "npm" | "yarn" | "bun" | "poetry" | "pip" | "cargo" | "go" | "unknown",
    "runtimeVersion": string,
    "envVars": [
      { "name": string, "defaultValue": string, "description": string, "required": boolean }
    ],
    "installCommands": [string],
    "devCommands": [string],
    "testCommands": [string],
    "buildCommands": [string],
    "deploymentTargets": [
      { "target": string, "notes": string }
    ],
    "missingFilesWarnings": [string]
  },
  "functional": [
    { "category": string, "features": [string] }
  ],
  "nonFunctional": {
    "authStrategy": string,
    "securityPractices": [string],
    "caching": string,
    "rateLimiting": string,
    "testingMaturity": "none" | "minimal" | "moderate" | "robust",
    "observability": string
  },
  "roast": {
    "scoreOutOf100": number, // 0 - 100
    "verdictTitle": string,
    "oneLinerRoast": string,
    "savageRoasts": [string],
    "techSins": [
      { "sin": string, "explanation": string, "howToRedeem": string }
    ],
    "couldHaveBeenAScript": boolean,
    "dependencyWeightVerdict": string,
    "constructiveSummary": string
  }
}`;
}
