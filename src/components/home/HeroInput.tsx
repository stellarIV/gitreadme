"use client";

import { useRef, useEffect, useState } from "react";
import {
  Search,
  Flame,
  ArrowRight,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useAnalysisStore } from "@/store/useAnalysisStore";

const POPULAR_REPOS = [
  { label: "vercel/next.js", desc: "React Fullstack" },
  { label: "pmndrs/zustand", desc: "State Mgmt" },
  { label: "tiangolo/fastapi", desc: "Python API" },
  { label: "supabase/supabase", desc: "BaaS" },
  { label: "expressjs/express", desc: "Node HTTP" },
  { label: "tailwindlabs/tailwindcss", desc: "CSS Engine" },
];

export function HeroInput() {
  const { repoUrl, setRepoUrl, mode, setMode, isAnalyzing, error, analyze } =
    useAnalysisStore();

  const [inputVal, setInputVal] = useState(repoUrl || "");
  const [forceFresh, setForceFresh] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount — the input IS the product
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    setRepoUrl(trimmed);
    analyze(trimmed, forceFresh);
  };

  const handleSelectExample = (slug: string) => {
    setInputVal(slug);
    setRepoUrl(slug);
    analyze(slug, false);
  };

  return (
    <div className="w-full flex flex-col items-center text-center gap-6">
      {/* ── Badge ──────────────────────────────────────────────────── */}
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-mono text-primary dev-glow">
        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
        <span>RepoIntel 2026 // Next-Gen Living Documentation &amp; Roast Engine</span>
      </div>

      {/* ── Headline ───────────────────────────────────────────────── */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight font-mono leading-[1.05] max-w-3xl">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
          Understand any repo
        </span>
        <br />
        <span className="text-foreground">in one click.</span>
      </h1>

      <p className="text-sm sm:text-base text-muted-foreground max-w-lg leading-relaxed font-mono">
        Architecture diagrams &middot; Setup guide &middot; Git velocity &middot; Security audit
        {mode === "roast" && (
          <span className="text-orange-400"> &middot; Brutal roast</span>
        )}
      </p>

      {/* ── THE MAIN INPUT ─────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <div
          className={`relative flex items-center rounded-2xl border bg-card/90 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-300 focus-within:shadow-primary/20 focus-within:shadow-[0_0_40px_-4px] ${
            mode === "roast"
              ? "border-orange-500/50 focus-within:border-orange-400/70"
              : "border-border/80 focus-within:border-primary/60"
          }`}
        >
          <Search className="absolute left-4 h-5 w-5 text-muted-foreground pointer-events-none" />

          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="github.com/owner/repo  or  owner/repo"
            className="flex-1 bg-transparent py-4 pl-12 pr-3 text-sm sm:text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none font-mono"
            disabled={isAnalyzing}
            autoComplete="off"
            spellCheck={false}
          />

          {/* Roast Toggle */}
          <button
            type="button"
            onClick={() => setMode(mode === "roast" ? "professional" : "roast")}
            className={`hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold font-mono transition-all duration-200 border mr-1 ${
              mode === "roast"
                ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                : "bg-secondary/40 text-muted-foreground border-border hover:text-foreground"
            }`}
            title="Toggle Brutal Roast Mode"
          >
            <Flame
              className={`h-4 w-4 ${mode === "roast" ? "text-orange-400 fill-orange-400" : ""}`}
            />
            <span>{mode === "roast" ? "Roast ON" : "Roast"}</span>
          </button>

          {/* Submit */}
          <button
            type="submit"
            disabled={isAnalyzing || !inputVal.trim()}
            className={`flex items-center justify-center gap-2 rounded-xl m-1.5 px-5 py-2.5 text-sm font-bold font-mono text-primary-foreground transition-all duration-200 hover:opacity-90 disabled:opacity-50 dev-glow whitespace-nowrap ${
              mode === "roast"
                ? "bg-gradient-to-r from-orange-500 to-amber-500"
                : "bg-primary"
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Options row */}
        <div className="mt-2.5 flex items-center justify-between px-1 text-[11px] text-muted-foreground font-mono">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors">
            <input
              type="checkbox"
              checked={forceFresh}
              onChange={(e) => setForceFresh(e.target.checked)}
              className="rounded border-border bg-card accent-primary"
            />
            <span>Force re-analyze (bypass cache)</span>
          </label>
          <span className="hidden sm:inline opacity-60">Press Enter ↵</span>
        </div>
      </form>

      {/* ── Error Banner ───────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-400 font-mono text-left w-full max-w-2xl animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Quick-launch popular repos ──────────────────────────────── */}
      <div className="flex flex-col items-center gap-2.5 w-full max-w-2xl">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
          or try a popular repo
        </span>
        <div className="flex flex-wrap justify-center gap-2">
          {POPULAR_REPOS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleSelectExample(item.label)}
              disabled={isAnalyzing}
              className="group flex items-center gap-1 rounded-lg border border-border/50 bg-card/50 px-3 py-1.5 text-xs font-mono text-muted-foreground hover:border-primary/50 hover:bg-secondary hover:text-foreground transition-all duration-150 disabled:opacity-40"
            >
              <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
              <span className="text-foreground/80">{item.label}</span>
              <span className="text-[10px] text-muted-foreground/50 hidden sm:inline">
                {item.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
