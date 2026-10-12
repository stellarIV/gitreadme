"use client";

import { useState } from "react";
import {
  ExternalLink,
  Flame,
  LayoutDashboard,
  GitGraph,
  Terminal,
  Activity,
  ShieldAlert,
  FileCode,
  Share2,
  RefreshCw,
  Copy,
  AlertTriangle,
  FolderTree,
} from "lucide-react";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { MermaidDiagram } from "./MermaidDiagram";
import { VelocityDashboard } from "./VelocityDashboard";
import { RoastCard } from "./RoastCard";
import { SplitEditor } from "./SplitEditor";

export function AnalysisDashboard() {
  const {
    analysis,
    activeTab,
    setActiveTab,
    mode,
    setMode,
    analyze,
    isAnalyzing,
    setIsShareModalOpen,
  } = useAnalysisStore();

  const [copiedEnv, setCopiedEnv] = useState(false);

  if (!analysis) return null;

  const { metadata, techStack, architecture, setupGuide, gitVelocity, nonFunctional, missingPractices, secretsWarnings, roast } = analysis;

  const handleCopyEnvSample = () => {
    const text = setupGuide.envVars.map((v) => `${v.name}=${v.defaultValue || ""}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto my-8 space-y-6">
      {/* Top Header Card */}
      <div className="rounded-3xl border border-border/80 bg-card/90 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-mono text-2xl sm:text-3xl font-black text-foreground">
                {metadata.fullName}
              </h1>
              <a
                href={metadata.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Open on GitHub"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
              {analysis.isMonorepo && (
                <span className="rounded-full bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                  Monorepo ({analysis.monorepoWorkspaces.length} workspaces)
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground max-w-2xl">
              {metadata.description || "No description provided on GitHub."}
            </p>

            <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground pt-1 flex-wrap">
              <span>★ {metadata.stars.toLocaleString()} stars</span>
              <span>•</span>
              <span>⑂ {metadata.forks.toLocaleString()} forks</span>
              <span>•</span>
              <span>Ref: {metadata.defaultBranch}</span>
              <span>•</span>
              <span className="text-[11px] bg-secondary/80 px-2 py-0.5 rounded">
                SHA: {metadata.commitSha.slice(0, 7)}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            {/* Roast Mode Toggle */}
            <button
              onClick={() => {
                const nextMode = mode === "roast" ? "professional" : "roast";
                setMode(nextMode);
                setActiveTab(nextMode === "roast" ? "roast" : "overview");
              }}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-mono font-bold transition-all ${
                mode === "roast"
                  ? "bg-orange-500/20 text-orange-400 border-orange-500/40 dev-glow-orange"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              <Flame className={`h-4 w-4 ${mode === "roast" ? "fill-orange-400 text-orange-400" : ""}`} />
              <span>{mode === "roast" ? "Roast: ON" : "Roast: OFF"}</span>
            </button>

            {/* Share Card Modal */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/70 px-3.5 py-2 text-xs font-mono font-bold text-foreground hover:bg-secondary transition-colors"
            >
              <Share2 className="h-4 w-4 text-cyan-400" />
              <span>Share Card</span>
            </button>

            {/* Force Refresh */}
            <button
              onClick={() => analyze(metadata.fullName, true)}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/70 px-3 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Re-run fresh analysis"
            >
              <RefreshCw className={`h-4 w-4 ${isAnalyzing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Secret Warnings Banner if leaked */}
        {secretsWarnings.length > 0 && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 font-mono text-xs text-red-300">
            <div className="flex items-center gap-2 font-bold mb-1">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              <span>Potential Credential Exposure Warning</span>
            </div>
            <p className="text-[11px] text-red-200/90 leading-relaxed">
              Found {secretsWarnings.length} potential credential pattern(s). Values are strictly masked.
              Review locations: {secretsWarnings.map((s) => `${s.file}:${s.line} (${s.type})`).join(", ")}.
            </p>
          </div>
        )}

        {/* Tab Navigation Navigation Bar */}
        <div className="mt-6 flex items-center gap-1.5 overflow-x-auto border-t border-border/60 pt-4 font-mono text-xs">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "architecture", label: "Architecture & Blueprint", icon: GitGraph },
            { id: "setup", label: "Setup Guide", icon: Terminal },
            { id: "velocity", label: "Git Velocity", icon: Activity },
            { id: "requirements", label: "Requirements & Security", icon: ShieldAlert },
            { id: "roast", label: "Roast Mode 🔥", icon: Flame },
            { id: "editor", label: "Live Markdown Export", icon: FileCode },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "overview" | "architecture" | "setup" | "velocity" | "requirements" | "roast" | "editor")}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground dev-glow"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Tech Stack Pills */}
          <div className="rounded-2xl border border-border/80 bg-card/60 p-6">
            <h2 className="font-mono text-sm font-semibold text-foreground mb-4">
              Detected Technology Stack ({techStack.length} components)
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {techStack.map((tech, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/40 px-3 py-1.5 font-mono text-xs"
                >
                  <span className="font-bold text-foreground">{tech.name}</span>
                  {tech.version && (
                    <span className="text-[10px] text-muted-foreground bg-card/80 px-1.5 py-0.5 rounded">
                      {tech.version}
                    </span>
                  )}
                  <span className="text-[10px] text-primary/80">({tech.category})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Architecture Summary Callout */}
          <div className="rounded-2xl border border-border/80 bg-card/60 p-6 font-mono">
            <h2 className="text-sm font-semibold text-foreground mb-2">
              Architecture Overview
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {architecture.textualOverview}
            </p>
          </div>

          {/* Entry points list */}
          <div className="rounded-2xl border border-border/80 bg-card/60 p-6 font-mono">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-cyan-400" />
              Primary Code Entry Points
            </h2>
            <div className="space-y-2">
              {architecture.entryPoints.map((ep, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-border/60 bg-secondary/20 p-3 text-xs gap-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{ep.name}</span>
                    <code className="text-primary text-[11px]">{ep.path}</code>
                  </div>
                  <span className="text-muted-foreground text-[11px]">{ep.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Architecture */}
      {activeTab === "architecture" && (
        <div className="space-y-6">
          <MermaidDiagram chart={architecture.diagramMermaid} />

          {/* Subsystems Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {architecture.components.map((comp, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/80 bg-card/60 p-5 font-mono text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-foreground">{comp.name}</span>
                  <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                    {comp.tech}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{comp.role}</p>
                <div className="pt-2 text-[11px] text-muted-foreground/80">
                  <span>Paths: </span>
                  <code className="text-cyan-400">{comp.paths.join(", ")}</code>
                </div>
              </div>
            ))}
          </div>

          {/* Data Flow */}
          <div className="rounded-2xl border border-border/80 bg-card/60 p-6 font-mono text-xs">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Data Flow Pipeline
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              {architecture.dataFlow.map((step, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="text-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Tab 3: Setup Guide */}
      {activeTab === "setup" && (
        <div className="space-y-6 font-mono text-xs">
          {/* Prerequisites */}
          <div className="rounded-2xl border border-border/80 bg-card/60 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              1. Prerequisites & Installation
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-muted-foreground">
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Runtime:</span>
                <p className="text-foreground font-bold mt-1">{setupGuide.runtimeVersion || "Node.js 18+"}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Package Manager:</span>
                <p className="text-foreground font-bold mt-1">{setupGuide.packageManager}</p>
              </div>
            </div>

            <div className="rounded-xl bg-background/80 border border-border p-4">
              <span className="text-[10px] text-muted-foreground uppercase font-bold mb-2 block">
                Install dependencies:
              </span>
              <pre className="text-emerald-400 overflow-x-auto">
                {setupGuide.installCommands.join("\n")}
              </pre>
            </div>
          </div>

          {/* Environment Variables Table */}
          {setupGuide.envVars.length > 0 && (
            <div className="rounded-2xl border border-border/80 bg-card/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">
                  2. Environment Configuration (.env)
                </h2>
                <button
                  onClick={handleCopyEnvSample}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/80 px-2.5 py-1 text-[11px] text-foreground hover:bg-secondary"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedEnv ? "Copied .env" : "Copy Template"}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border text-muted-foreground">
                    <tr>
                      <th className="pb-2">Variable</th>
                      <th className="pb-2">Required</th>
                      <th className="pb-2">Default</th>
                      <th className="pb-2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {setupGuide.envVars.map((v) => (
                      <tr key={v.name} className="hover:bg-secondary/20">
                        <td className="py-2.5 font-bold text-cyan-400">{v.name}</td>
                        <td className="py-2.5">
                          {v.required ? (
                            <span className="text-amber-400 font-bold">Required</span>
                          ) : (
                            <span className="text-muted-foreground">Optional</span>
                          )}
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {v.defaultValue || "—"}
                        </td>
                        <td className="py-2.5 text-muted-foreground">{v.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Run & Test Commands */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-2">
              <span className="font-semibold text-foreground block">3. Local Development</span>
              <pre className="rounded-xl bg-background/80 border border-border p-3 text-emerald-400 overflow-x-auto">
                {setupGuide.devCommands.join("\n")}
              </pre>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-2">
              <span className="font-semibold text-foreground block">4. Build & Test</span>
              <pre className="rounded-xl bg-background/80 border border-border p-3 text-cyan-400 overflow-x-auto">
                {setupGuide.testCommands.concat(setupGuide.buildCommands).join("\n")}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Git Velocity */}
      {activeTab === "velocity" && <VelocityDashboard velocity={gitVelocity} />}

      {/* Tab 5: Requirements & Security */}
      {activeTab === "requirements" && (
        <div className="space-y-6 font-mono text-xs">
          {/* Missing Best Practices */}
          <div className="rounded-2xl border border-border/80 bg-card/60 p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Best Practice Audit & Recommendations ({missingPractices.length})
            </h2>
            <div className="space-y-3">
              {missingPractices.map((issue, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border/60 bg-secondary/30 p-3.5 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        issue.severity === "critical"
                          ? "bg-red-500/20 text-red-400 border border-red-500/40"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      }`}
                    >
                      {issue.severity}
                    </span>
                    <span className="font-bold text-foreground">{issue.issue}</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed pt-1">
                    Recommendation: {issue.fix}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Non-Functional Specs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-2">
              <span className="font-bold text-foreground">Authentication & Session Model</span>
              <p className="text-muted-foreground">{nonFunctional.authStrategy}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-2">
              <span className="font-bold text-foreground">Caching Architecture</span>
              <p className="text-muted-foreground">{nonFunctional.caching}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-2">
              <span className="font-bold text-foreground">Rate Limiting & Boundary Protection</span>
              <p className="text-muted-foreground">{nonFunctional.rateLimiting}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-2">
              <span className="font-bold text-foreground">Testing Maturity Level</span>
              <span className="inline-block rounded bg-primary/20 border border-primary/30 px-2 py-0.5 text-primary uppercase font-bold text-[10px]">
                {nonFunctional.testingMaturity}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Roast Mode */}
      {activeTab === "roast" && <RoastCard roast={roast} repoName={metadata.name} />}

      {/* Tab 7: Markdown Live Editor */}
      {activeTab === "editor" && <SplitEditor />}
    </div>
  );
}
