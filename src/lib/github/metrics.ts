import {
  GitHubCommitItem,
  GitHubContributorItem,
  GitHubReleaseItem,
} from "./types";
import { GitVelocity, HeatmapItem } from "../analyzer/types";

export function calculateGitVelocity(
  commits: GitHubCommitItem[],
  contributors: GitHubContributorItem[],
  releases: GitHubReleaseItem[],
  repoCreatedAt: string
): GitVelocity {
  const totalCommitsSampled = commits.length;

  if (totalCommitsSampled === 0) {
    return {
      totalCommitsSampled: 0,
      commitsPerWeek90d: 0,
      velocityRating: "stale",
      firstCommitDate: repoCreatedAt,
      lastCommitDate: repoCreatedAt,
      topContributors: [],
      branchesCount: 1,
      releasesCount: 0,
      activityHeatmap: [],
      recentMilestones: ["Repository created"],
    };
  }

  const lastCommitDate = commits[0]?.commit?.author?.date || repoCreatedAt;
  const firstCommitDate = commits[commits.length - 1]?.commit?.author?.date || repoCreatedAt;

  // Calculate commits in the last 90 days
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const commitsLast90d = commits.filter((c) => {
    const commitDate = new Date(c.commit.author.date);
    return commitDate >= ninetyDaysAgo;
  });

  const weeksIn90d = 90 / 7;
  const commitsPerWeek90d = Number((commitsLast90d.length / weeksIn90d).toFixed(1));

  // Determine velocity rating
  let velocityRating: GitVelocity["velocityRating"] = "steady";
  const daysSinceLastCommit = Math.max(
    0,
    Math.round((now.getTime() - new Date(lastCommitDate).getTime()) / (1000 * 60 * 60 * 24))
  );

  if (daysSinceLastCommit > 180) {
    velocityRating = "zombie";
  } else if (daysSinceLastCommit > 60) {
    velocityRating = "stale";
  } else if (commitsPerWeek90d >= 10) {
    velocityRating = "breakneck";
  } else if (commitsPerWeek90d >= 2) {
    velocityRating = "steady";
  } else {
    velocityRating = "sporadic";
  }

  // Construct 12-week activity heatmap
  const heatmapMap = new Map<string, number>();
  // Initialize last 12 weeks with 0
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const dateStr = weekStart.toISOString().split("T")[0];
    heatmapMap.set(dateStr, 0);
  }

  // Populate heatmap counts
  for (const c of commits) {
    const d = new Date(c.commit.author.date);
    // Find closest week bucket
    for (const weekStr of Array.from(heatmapMap.keys())) {
      const bucketDate = new Date(weekStr);
      const diffDays = (d.getTime() - bucketDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays < 7) {
        heatmapMap.set(weekStr, (heatmapMap.get(weekStr) || 0) + 1);
        break;
      }
    }
  }

  const activityHeatmap: HeatmapItem[] = Array.from(heatmapMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  // Top contributors
  const topContributors = contributors.slice(0, 8).map((c) => ({
    login: c.login,
    avatarUrl: c.avatar_url,
    contributions: c.contributions,
  }));

  // Milestones from releases or notable commits
  const milestones: string[] = [];
  if (releases && releases.length > 0) {
    for (const rel of releases.slice(0, 4)) {
      milestones.push(`Release ${rel.tag_name || rel.name} (${new Date(rel.published_at).toLocaleDateString()})`);
    }
  } else {
    // Pick first commit and recent significant commit messages
    milestones.push(`Initial codebase commit (${new Date(firstCommitDate).toLocaleDateString()})`);
    const significant = commits.filter(
      (c) =>
        c.commit.message.toLowerCase().includes("feat") ||
        c.commit.message.toLowerCase().includes("release") ||
        c.commit.message.toLowerCase().includes("v1.")
    );
    if (significant[0]) {
      milestones.push(`${significant[0].commit.message.split("\n")[0]} (${new Date(significant[0].commit.author.date).toLocaleDateString()})`);
    }
  }

  return {
    totalCommitsSampled,
    commitsPerWeek90d,
    velocityRating,
    firstCommitDate,
    lastCommitDate,
    topContributors,
    branchesCount: 1,
    releasesCount: releases.length,
    activityHeatmap,
    recentMilestones: milestones,
  };
}
