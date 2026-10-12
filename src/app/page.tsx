"use client";

import { HeroInput } from "@/components/home/HeroInput";
import { AnalysisProgress } from "@/components/analysis/AnalysisProgress";
import { AnalysisDashboard } from "@/components/analysis/AnalysisDashboard";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { GitGraph, Terminal, Flame, Zap, Shield, GitBranch } from "lucide-react";

const FEATURES = [
  {
    icon: GitGraph,
    color: "primary",
    colorClass: "text-primary bg-primary/10 border-primary/20 hover:border-primary/50",
    title: "Living Architecture Diagrams",
    desc: "Automatic component detection, entry points mapping, and interactive Mermaid.js flowcharts rendered as clickable SVG — each node links directly to its source.",
  },
  {
    icon: Terminal,
    color: "cyan",
    colorClass: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/50",
    title: "Exact Setup How-To",
    desc: "Extracts real env vars from .env templates, detects your package manager, generates runnable local dev steps.",
  },
  {
    icon: Flame,
    color: "orange",
    colorClass: "text-orange-400 bg-orange-500/10 border-orange-500/20 hover:border-orange-500/50",
    title: "Roast My Repo™",
    desc: "Brutally honest, hilarious critique of dependency hell, over-engineering, and code smells — with constructive recovery steps.",
  },
  {
    icon: Zap,
    color: "amber",
    colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/20 hover:border-amber-500/50",
    title: "Git Velocity Dashboard",
    desc: "12-week commit heatmap, top contributors, release timeline, and bus-factor risk score.",
  },
  {
    icon: Shield,
    color: "emerald",
    colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50",
    title: "Security Audit",
    desc: "Scans for hardcoded secrets and leaked credentials — file locations flagged, values never exposed.",
  },
  {
    icon: GitBranch,
    color: "violet",
    colorClass: "text-violet-400 bg-violet-500/10 border-violet-500/20 hover:border-violet-500/50",
    title: "Webhook Auto-Sync",
    desc: "Connect your repo once. Every push or PR auto-triggers a fresh analysis — living docs, always current.",
  },
];

export default function Home() {
  const { analysis, isAnalyzing } = useAnalysisStore();

  return (
    <div className="flex-1 flex flex-col">
      {/* ── HERO: full-viewport, input centred above fold ─────────────────── */}
      <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden">
        {/* Animated background grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Radial glow blob — emerald */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(16,185,129,0.08) 0%, transparent 70%)",
          }}
        />
        {/* Radial glow blob — cyan right */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-1/2 h-[400px] w-[400px] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(56,189,248,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center">
          <HeroInput />
        </div>
      </section>

      {/* ── PROGRESS (appears below hero during analysis) ──────────────────── */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <AnalysisProgress />

        {/* ── RESULTS ──────────────────────────────────────────────────────── */}
        {analysis && !isAnalyzing ? (
          <AnalysisDashboard />
        ) : (
          !isAnalyzing && (
            /* Feature grid — visible before first analysis */
            <div className="pb-24 pt-4 space-y-10 border-t border-border/30">
              <div className="text-center space-y-2 pt-8">
                <h2 className="font-mono text-xl sm:text-2xl font-bold text-foreground">
                  Engineered for Real Codebases
                </h2>
                <p className="font-mono text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
                  Not another generic README template generator. A deep repository intelligence suite.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 font-mono text-xs">
                {FEATURES.map(({ icon: Icon, colorClass, title, desc }) => (
                  <div
                    key={title}
                    className={`rounded-2xl border bg-card/60 p-6 space-y-3 transition-colors ${colorClass}`}
                  >
                    <div
                      className={`h-10 w-10 rounded-xl border flex items-center justify-center ${colorClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{title}</h3>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
