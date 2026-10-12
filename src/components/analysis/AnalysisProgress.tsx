"use client";

import { useAnalysisStore } from "@/store/useAnalysisStore";
import { Loader2, GitBranch, Cpu, ShieldCheck, Flame, FileText, CheckCircle2 } from "lucide-react";

export function AnalysisProgress() {
  const { progress, isAnalyzing } = useAnalysisStore();

  if (!isAnalyzing || !progress) return null;

  const getStepIcon = () => {
    switch (progress.step) {
      case "scanning_tree":
        return <GitBranch className="h-5 w-5 text-cyan-400 animate-pulse" />;
      case "reading_critical_files":
      case "map_reduce_monorepo":
        return <Cpu className="h-5 w-5 text-indigo-400 animate-pulse" />;
      case "scanning_secrets":
        return <ShieldCheck className="h-5 w-5 text-amber-400 animate-pulse" />;
      case "cooking_roast":
        return <Flame className="h-5 w-5 text-orange-400 animate-bounce" />;
      case "generating_markdown":
        return <FileText className="h-5 w-5 text-emerald-400 animate-pulse" />;
      case "complete":
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      default:
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-8 rounded-2xl border border-primary/30 bg-card/90 p-6 shadow-2xl backdrop-blur-xl dev-glow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 border border-border">
            {getStepIcon()}
          </div>
          <div>
            <h3 className="font-mono text-base font-bold text-foreground">
              {progress.title}
            </h3>
            <p className="font-mono text-xs text-muted-foreground">
              {progress.detail}
            </p>
          </div>
        </div>
        <div className="font-mono text-sm font-bold text-primary">
          {progress.progress}%
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300 ease-out"
          style={{ width: `${Math.max(5, progress.progress)}%` }}
        />
      </div>

      {/* Terminal Steps Indicator */}
      <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-muted-foreground/70">
        <span className={progress.progress >= 20 ? "text-emerald-400" : ""}>Tree Scan</span>
        <span>→</span>
        <span className={progress.progress >= 50 ? "text-emerald-400" : ""}>Manifests</span>
        <span>→</span>
        <span className={progress.progress >= 75 ? "text-emerald-400" : ""}>Security</span>
        <span>→</span>
        <span className={progress.progress >= 88 ? "text-emerald-400" : ""}>Synthesis</span>
        <span>→</span>
        <span className={progress.progress >= 100 ? "text-emerald-400" : ""}>Ready</span>
      </div>
    </div>
  );
}
