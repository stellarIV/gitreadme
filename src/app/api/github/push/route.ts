import { NextRequest, NextResponse } from "next/server";
import { GitHubClient } from "@/lib/github/client";

export async function POST(req: NextRequest) {
  try {
    const {
      owner,
      repo,
      path = "README.md",
      content,
      commitMessage = "docs: update documentation via gitreadme (RepoIntel)",
      branch = "main",
      token,
    } = await req.json();

    if (!owner || !repo || !content || !token) {
      return NextResponse.json(
        { error: "Missing required parameters: owner, repo, content, or GitHub token." },
        { status: 400 }
      );
    }

    const client = new GitHubClient(token);

    // Fetch existing file SHA if updating an existing file
    let existingSha: string | undefined;
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "gitreadme-RepoIntel",
        },
      });
      if (res.ok) {
        const data = await res.json();
        existingSha = data.sha;
      }
    } catch {
      // New file creation
    }

    const pushResult = await client.pushFile(
      owner,
      repo,
      path,
      content,
      commitMessage,
      branch,
      existingSha
    );

    return NextResponse.json({
      success: true,
      commitSha: pushResult.commitSha,
      htmlUrl: pushResult.htmlUrl,
    });
  } catch (err: unknown) {
    console.error("GitHub push error:", err);
    const message = err instanceof Error ? err.message : "Failed to commit and push file to GitHub.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
