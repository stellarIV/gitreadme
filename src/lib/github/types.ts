export interface GitHubRepoResponse {
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics?: string[];
  license?: {
    spdx_id?: string;
    name?: string;
  } | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  private: boolean;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubCommitItem {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author?: {
    login: string;
    avatar_url: string;
  } | null;
}

export interface GitHubContributorItem {
  login: string;
  avatar_url: string;
  contributions: number;
}

export interface GitHubReleaseItem {
  tag_name: string;
  name: string;
  published_at: string;
  body?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number; // Unix timestamp
  used: number;
}
