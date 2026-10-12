import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { parseGitHubUrl, GitHubClient } from "@/lib/github/client";
import { parseGitreadmeConfig } from "@/lib/config/gitreadmeConfig";
import { getCachedAnalysis } from "@/lib/db";

export const runtime = "nodejs";

/** Verify HMAC-SHA256 signature from GitHub webhook */
function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex")}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

interface GitHubPushPayload {
  ref?: string;
  after?: string; // head sha
  repository?: {
    full_name?: string;
    default_branch?: string;
    private?: boolean;
  };
  head_commit?: {
    message?: string;
  };
}

interface GitHubPRPayload {
  action?: string;
  pull_request?: {
    head?: { sha?: string };
    base?: { ref?: string };
    title?: string;
  };
  repository?: {
    full_name?: string;
    default_branch?: string;
    private?: boolean;
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

  // Read raw body for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const event = req.headers.get("x-github-event") ?? "";
  const deliveryId = req.headers.get("x-github-delivery") ?? "unknown";

  // ─── Signature Verification ─────────────────────────────────────────────────
  if (webhookSecret) {
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.warn(`[webhook] Rejected delivery ${deliveryId}: invalid signature`);
      return NextResponse.json(
        { error: "Forbidden: signature mismatch" },
        { status: 401 }
      );
    }
  } else {
    // Warn in logs but don't block — graceful degradation when secret not configured
    console.warn("[webhook] GITHUB_WEBHOOK_SECRET not set — signature verification skipped");
  }

  let payload: GitHubPushPayload & GitHubPRPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const fullName = payload.repository?.full_name;
  if (!fullName) {
    return NextResponse.json({ accepted: false, reason: "No repository in payload" }, { status: 202 });
  }

  const parsed = parseGitHubUrl(fullName);
  if (!parsed) {
    return NextResponse.json({ accepted: false, reason: "Could not parse repo name" }, { status: 202 });
  }

  const { owner, repo } = parsed;
  let headSha: string | undefined;
  let triggerReason = "";

  // ─── Event Routing ───────────────────────────────────────────────────────────
  if (event === "push") {
    const pushPayload = payload as GitHubPushPayload;
    headSha = pushPayload.after;
    const commitMsg = pushPayload.head_commit?.message?.slice(0, 80) ?? "";
    triggerReason = `push: ${commitMsg || headSha?.slice(0, 7)}`;
  } else if (event === "pull_request") {
    const prPayload = payload as GitHubPRPayload;
    const action = prPayload.action;
    if (action !== "opened" && action !== "synchronize" && action !== "reopened") {
      // Skip PR closed / labeled / assigned etc
      return NextResponse.json({
        accepted: false,
        reason: `PR action '${action}' does not trigger re-analysis`,
      }, { status: 202 });
    }
    headSha = prPayload.pull_request?.head?.sha;
    triggerReason = `pull_request:${action} — ${prPayload.pull_request?.title?.slice(0, 60) ?? ""}`;
  } else {
    // We only care about push & pull_request
    return NextResponse.json({
      accepted: false,
      reason: `Event '${event}' not handled`,
    }, { status: 202 });
  }

  if (!headSha) {
    return NextResponse.json({ accepted: false, reason: "No SHA found in payload" }, { status: 202 });
  }

  console.log(`[webhook] ${deliveryId} — ${owner}/${repo} — ${triggerReason}`);

  // ─── Check for .gitreadme.yml config ────────────────────────────────────────
  const ghClient = new GitHubClient(); // no token — public repos only for now
  let autoReanalyze = true;
  let configMode: "professional" | "roast" = "professional";

  try {
    const configContent = await ghClient.getFileContent(
      owner,
      repo,
      ".gitreadme.yml",
      payload.repository?.default_branch ?? "main"
    );
    if (configContent) {
      const repoConfig = parseGitreadmeConfig(configContent);
      if (repoConfig.autoPush === false) {
        autoReanalyze = false;
      }
      if (repoConfig.mode) {
        configMode = repoConfig.mode;
      }
    }
  } catch {
    // No config file — use defaults
  }

  if (!autoReanalyze) {
    return NextResponse.json({
      accepted: false,
      reason: "Auto re-analysis disabled by .gitreadme.yml (auto_push: false)",
    }, { status: 202 });
  }

  // ─── Check Cache — Skip if this SHA is already fresh ────────────────────────
  const cached = getCachedAnalysis(owner, repo, headSha, configMode);
  if (cached) {
    console.log(`[webhook] Cache hit for ${owner}/${repo}@${headSha.slice(0, 7)} — no re-analysis needed`);
    return NextResponse.json({
      accepted: true,
      cached: true,
      owner,
      repo,
      sha: headSha,
      reason: triggerReason,
    });
  }

  // ─── Trigger Background Re-analysis ─────────────────────────────────────────
  // Fire-and-forget: call /api/analyze internally so the webhook returns fast
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  // We intentionally don't await this — webhooks must respond within 10s
  fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      repoUrl: `${owner}/${repo}`,
      mode: configMode,
      forceRefresh: true,
      provider: "auto",
    }),
    // Let Node.js handle this in background; no signal/timeout needed
  }).then(async (res) => {
    if (!res.ok) {
      console.error(`[webhook] Background re-analysis failed: ${res.status}`);
      return;
    }
    // Drain the SSE stream so the re-analysis actually runs to completion
    const reader = res.body?.getReader();
    if (!reader) return;
    let streamDone = false;
    while (!streamDone) {
      const chunk = await reader.read();
      streamDone = chunk.done;
    }
    console.log(`[webhook] Re-analysis complete for ${owner}/${repo}@${headSha?.slice(0, 7)}`);
  }).catch((err: unknown) => {
    console.error("[webhook] Re-analysis fetch error:", err instanceof Error ? err.message : String(err));
  });

  return NextResponse.json({
    accepted: true,
    queued: true,
    owner,
    repo,
    sha: headSha,
    mode: configMode,
    reason: triggerReason,
    message: "Re-analysis triggered in background",
  });
}
