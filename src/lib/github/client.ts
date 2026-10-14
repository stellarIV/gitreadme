import {
  GitHubRepoResponse,
  GitHubTreeItem,
  GitHubCommitItem,
  GitHubContributorItem,
  GitHubReleaseItem,
  RateLimitInfo,
} from "./types";

export interface ParsedRepoUrl {
  owner: string;
  repo: string;
  branch?: string;
}

export function parseGitHubUrl(input: string): ParsedRepoUrl | null {
  if (!input || typeof input !== "string") return null;
  const cleaned = input.trim().replace(/\.git$/, "").replace(/\/+$/, "");

  // Match "https://github.com/owner/repo" or "github.com/owner/repo"
  const urlMatch = cleaned.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/tree\/([a-zA-Z0-9_.-]+))?/
  );
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      repo: urlMatch[2],
      branch: urlMatch[3],
    };
  }

  // Match "owner/repo"
  const slugMatch = cleaned.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (slugMatch) {
    return {
      owner: slugMatch[1],
      repo: slugMatch[2],
    };
  }

  return null;
}

export class GitHubClient {
  private token?: string;
  private rateLimit: RateLimitInfo = { limit: 60, remaining: 60, resetTime: 0, used: 0 };

  constructor(token?: string) {
    const raw = token?.trim() || process.env.GITHUB_TOKEN?.trim();
    if (
      raw &&
      raw.toUpperCase() !== "NONE" &&
      raw !== "undefined" &&
      raw !== "null" &&
      !raw.includes("your_github")
    ) {
      this.token = raw;
    }
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "gitreadme-RepoIntel/1.0",
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  private updateRateLimit(headers: Headers) {
    const limit = headers.get("x-ratelimit-limit");
    const remaining = headers.get("x-ratelimit-remaining");
    const reset = headers.get("x-ratelimit-reset");
    const used = headers.get("x-ratelimit-used");

    if (limit) this.rateLimit.limit = parseInt(limit, 10);
    if (remaining) this.rateLimit.remaining = parseInt(remaining, 10);
    if (reset) this.rateLimit.resetTime = parseInt(reset, 10);
    if (used) this.rateLimit.used = parseInt(used, 10);
  }

  public getRateLimitInfo(): RateLimitInfo {
    return { ...this.rateLimit };
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 20000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  private async fetchWithRetry(url: string, options: RequestInit = {}, timeoutMs: number = 20000): Promise<Response> {
    try {
      return await this.fetchWithTimeout(url, options, timeoutMs);
    } catch {
      // 1 retry after 800ms
      await new Promise((r) => setTimeout(r, 800));
      return await this.fetchWithTimeout(url, options, timeoutMs + 5000);
    }
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepoResponse> {
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    const res = await this.fetchWithRetry(url, { headers: this.getHeaders() }, 15000);
    this.updateRateLimit(res.headers);

    if (res.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" was not found on GitHub. Verify the repository name or provide a Personal Access Token in Settings if it is private.`);
    }
    if (res.status === 401) {
      throw new Error("Invalid GitHub token. Please verify your Personal Access Token in Settings.");
    }
    if (res.status === 403) {
      const resetDate = this.rateLimit.resetTime ? new Date(this.rateLimit.resetTime * 1000).toLocaleTimeString() : "soon";
      throw new Error(`GitHub API rate limit exceeded. Reset at ${resetDate}. Please provide your GitHub Personal Access Token in Settings to get 5,000 req/hr.`);
    }
    if (!res.ok) {
      throw new Error(`GitHub API error (${res.status}): ${res.statusText}`);
    }

    const data: GitHubRepoResponse = await res.json();
    return data;
  }

  async getTree(owner: string, repo: string, sha: string): Promise<GitHubTreeItem[]> {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`;
      const res = await this.fetchWithRetry(url, { headers: this.getHeaders() }, 25000);
      this.updateRateLimit(res.headers);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tree) && data.tree.length > 0) {
          return data.tree;
        }
      } else if (res.status === 403) {
        console.warn(`GitHub getTree rate-limited or forbidden (${res.status})`);
      }
    } catch (err: unknown) {
      console.warn(`GitHub API getTree error for ${owner}/${repo}:`, err);
    }

    // Secondary fallback: fetch root contents list
    try {
      const contentsUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
      const res = await this.fetchWithTimeout(contentsUrl, { headers: this.getHeaders() }, 10000);
      if (res.ok) {
        const items = await res.json();
        if (Array.isArray(items)) {
          return items.map((it: { path: string; type: string; sha: string; size?: number }) => ({
            path: it.path,
            mode: "100644",
            type: it.type === "dir" ? "tree" : "blob",
            sha: it.sha,
            size: it.size || 0,
            url: "",
          }));
        }
      }
    } catch {
      // ignore
    }

    return [];
  }

  async getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<string | null> {
    try {
      const refParam = ref ? `?ref=${encodeURIComponent(ref)}` : "";
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}${refParam}`;
      const res = await this.fetchWithRetry(url, { headers: this.getHeaders() }, 12000);
      this.updateRateLimit(res.headers);

      if (!res.ok) return null;

      const data = await res.json();
      if (data.content && data.encoding === "base64") {
        try {
          return Buffer.from(data.content, "base64").toString("utf8");
        } catch {
          return null;
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  async getCommits(owner: string, repo: string, since?: string, perPage: number = 50): Promise<GitHubCommitItem[]> {
    try {
      const sinceParam = since ? `&since=${encodeURIComponent(since)}` : "";
      const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${perPage}${sinceParam}`;
      const res = await this.fetchWithRetry(url, { headers: this.getHeaders() }, 15000);
      this.updateRateLimit(res.headers);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // Return empty if commits cannot be loaded
    }
    return [];
  }

  async getContributors(owner: string, repo: string, perPage: number = 10): Promise<GitHubContributorItem[]> {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=${perPage}`;
      const res = await this.fetchWithRetry(url, { headers: this.getHeaders() }, 12000);
      this.updateRateLimit(res.headers);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // ignore
    }
    return [];
  }

  async getReleases(owner: string, repo: string, perPage: number = 5): Promise<GitHubReleaseItem[]> {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=${perPage}`;
      const res = await this.fetchWithRetry(url, { headers: this.getHeaders() }, 10000);
      this.updateRateLimit(res.headers);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // ignore
    }
    return [];
  }

  async pushFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string = "main",
    existingSha?: string
  ): Promise<{ commitSha: string; htmlUrl: string }> {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const body: Record<string, unknown> = {
      message,
      content: Buffer.from(content).toString("base64"),
      branch,
    };
    if (existingSha) {
      body.sha = existingSha;
    }

    const res = await this.fetchWithRetry(url, {
      method: "PUT",
      headers: {
        ...this.getHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }, 15000);
    this.updateRateLimit(res.headers);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Failed to push file to GitHub: ${err.message || res.statusText}`);
    }

    const data = await res.json();
    return {
      commitSha: data.commit?.sha || "",
      htmlUrl: data.content?.html_url || "",
    };
  }
}
