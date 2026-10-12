/* eslint-disable @next/next/no-img-element */
"use client";

import { GitVelocity } from "@/lib/analyzer/types";
import { Activity, GitCommit, Users, Tag, Calendar, Zap } from "lucide-react";

interface VelocityDashboardProps {
  velocity: GitVelocity;
}

export function VelocityDashboard({ velocity }: VelocityDashboardProps) {
  const getVelocityColor = (rating: GitVelocity["velocityRating"]) => {
    switch (rating) {
      case "breakneck":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      case "steady":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
      case "sporadic":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "stale":
      case "zombie":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  const getHeatmapColor = (count: number) => {
    if (count === 0) return "bg-secondary/40 border-border/40";
    if (count <= 2) return "bg-emerald-950 border-emerald-800 text-emerald-300";
    if (count <= 6) return "bg-emerald-800 border-emerald-600 text-emerald-200";
    if (count <= 12) return "bg-emerald-600 border-emerald-400 text-emerald-100";
    return "bg-emerald-400 border-emerald-300 text-black";
  };

  return (
    <div className="space-y-6">
      {/* Velocity Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Velocity Rating */}
        <div className="rounded-2xl border border-border/80 bg-card/60 p-4 font-mono">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Velocity Score</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">
              {velocity.commitsPerWeek90d}
            </span>
            <span className="text-xs text-muted-foreground">commits/wk</span>
          </div>
          <div className="mt-2">
            <span
              className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getVelocityColor(
                velocity.velocityRating
              )}`}
            >
              {velocity.velocityRating} pace
            </span>
          </div>
        </div>

        {/* Metric 2: Sampled Commits */}
        <div className="rounded-2xl border border-border/80 bg-card/60 p-4 font-mono">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Sampled History</span>
            <GitCommit className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {velocity.totalCommitsSampled}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground truncate">
            Last: {new Date(velocity.lastCommitDate).toLocaleDateString()}
          </div>
        </div>

        {/* Metric 3: Active Contributors */}
        <div className="rounded-2xl border border-border/80 bg-card/60 p-4 font-mono">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Core Team</span>
            <Users className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {velocity.topContributors.length}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Primary contributors
          </div>
        </div>

        {/* Metric 4: Releases */}
        <div className="rounded-2xl border border-border/80 bg-card/60 p-4 font-mono">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Releases</span>
            <Tag className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {velocity.releasesCount}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            Version tags detected
          </div>
        </div>
      </div>

      {/* 12-Week Commit Activity Heatmap */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-5">
        <div className="flex items-center justify-between mb-4 font-mono text-xs text-muted-foreground">
          <span className="font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            12-Week Activity Heatmap
          </span>
          <span className="text-[11px]">Past 90 Days</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2">
          {velocity.activityHeatmap.map((item, idx) => (
            <div
              key={item.date}
              className={`flex flex-col items-center justify-center rounded-xl border p-3 font-mono transition-transform hover:scale-105 ${getHeatmapColor(
                item.count
              )}`}
            >
              <span className="text-base font-black">{item.count}</span>
              <span className="text-[9px] opacity-75 mt-0.5">
                W{idx + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Contributors Grid & Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Contributors */}
        <div className="rounded-2xl border border-border/80 bg-card/60 p-5">
          <h3 className="font-mono text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-400" />
            Top Contributors
          </h3>
          <div className="space-y-2.5">
            {velocity.topContributors.map((c) => (
              <div
                key={c.login}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 p-2.5 font-mono text-xs hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={c.avatarUrl}
                    alt={c.login}
                    className="h-7 w-7 rounded-full border border-border object-cover"
                  />
                  <a
                    href={`https://github.com/${c.login}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-foreground hover:text-primary transition-colors"
                  >
                    @{c.login}
                  </a>
                </div>
                <span className="rounded bg-secondary/80 px-2 py-0.5 text-[11px] text-muted-foreground">
                  {c.contributions} commits
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone Timeline */}
        <div className="rounded-2xl border border-border/80 bg-card/60 p-5">
          <h3 className="font-mono text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-400" />
            Milestones & Releases
          </h3>
          <div className="space-y-3 font-mono text-xs">
            {velocity.recentMilestones.map((m, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                <div className="text-muted-foreground text-xs leading-relaxed">
                  {m}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
