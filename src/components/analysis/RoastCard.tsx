"use client";

import { RoastAnalysis } from "@/lib/analyzer/types";
import { Flame, AlertOctagon, Wrench, CheckCircle, Share2 } from "lucide-react";

interface RoastCardProps {
  roast: RoastAnalysis;
  repoName: string;
}

export function RoastCard({ roast, repoName }: RoastCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
    if (score >= 60) return "text-amber-400 border-amber-500/40 bg-amber-500/10";
    return "text-red-400 border-red-500/40 bg-red-500/10";
  };

  const handleShareTwitter = () => {
    const text = `My repo ${repoName} just got roasted on gitreadme:\n\n"${roast.oneLinerRoast}"\n\nArchitecture Score: ${roast.scoreOutOf100}/100 💀\n\nAnalyze yours: https://gitreadme.dev`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Roast Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-br from-card via-card to-orange-950/20 p-6 sm:p-8 dev-glow-orange">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20 border border-orange-500/30 text-orange-400">
              <Flame className="h-7 w-7 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-orange-400">
                  Roast My Repo Mode
                </span>
                <span className="rounded bg-secondary/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                  Brutally Honest
                </span>
              </div>
              <h2 className="font-mono text-2xl font-black text-foreground mt-0.5">
                {roast.verdictTitle}
              </h2>
            </div>
          </div>

          {/* Architecture Score Badge */}
          <div className="flex items-center gap-3">
            <div
              className={`flex flex-col items-center justify-center rounded-2xl border px-5 py-2.5 font-mono ${getScoreColor(
                roast.scoreOutOf100
              )}`}
            >
              <span className="text-3xl font-black">{roast.scoreOutOf100}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                Score / 100
              </span>
            </div>

            <button
              onClick={handleShareTwitter}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary/70 px-3.5 py-3 text-xs font-mono font-bold text-foreground hover:bg-secondary transition-colors"
            >
              <Share2 className="h-4 w-4 text-cyan-400" />
              <span className="hidden sm:inline">Share Roast</span>
            </button>
          </div>
        </div>

        {/* Punchline Quote */}
        <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 sm:p-5">
          <p className="font-mono text-base sm:text-lg italic text-orange-200/90 leading-relaxed">
            &ldquo;{roast.oneLinerRoast}&rdquo;
          </p>
        </div>

        {/* Diagnostic Badges */}
        <div className="mt-4 flex flex-wrap gap-2 font-mono text-xs">
          <span className="rounded-lg border border-border bg-secondary/50 px-3 py-1 text-muted-foreground">
            Weight: <strong className="text-foreground">{roast.dependencyWeightVerdict}</strong>
          </span>
          {roast.couldHaveBeenAScript && (
            <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-300">
              ⚠️ Diagnosis: Could have been a bash script
            </span>
          )}
        </div>
      </div>

      {/* Savage Critiques List */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-6">
        <h3 className="font-mono text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-red-400" />
          Brutal Observations
        </h3>
        <div className="space-y-3 font-mono text-xs">
          {roast.savageRoasts.map((savage, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/20 p-3.5 hover:border-orange-500/30 transition-colors"
            >
              <span className="text-orange-400 font-bold text-sm">0{idx + 1}.</span>
              <p className="text-foreground leading-relaxed">{savage}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Sins & Redemption */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-6">
        <h3 className="font-mono text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-400" />
          Technical Sins & The Path to Redemption
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roast.techSins.map((sin, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-4 font-mono text-xs space-y-3"
            >
              <div>
                <span className="inline-block rounded bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">
                  Sin #{idx + 1}: {sin.sin}
                </span>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  {sin.explanation}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] uppercase mb-1">
                  <Wrench className="h-3 w-3" />
                  <span>How to Redeem</span>
                </div>
                <p className="text-emerald-200/80 text-[11px] leading-relaxed">
                  {sin.howToRedeem}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Constructive Closing Summary */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 font-mono text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
          <CheckCircle className="h-4 w-4" />
          <span>Constructive Senior Engineer Takeaway</span>
        </div>
        <p className="text-emerald-100/90 leading-relaxed text-sm">
          {roast.constructiveSummary}
        </p>
      </div>
    </div>
  );
}
