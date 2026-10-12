"use client";

import Link from "next/link";
import { Terminal, Settings, Keyboard, GitCompare, Github } from "lucide-react";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { QuotaBadge } from "@/components/quota/QuotaBadge";

export function Navbar() {
  const { setIsSettingsOpen, setIsShortcutsOpen, settings } = useAnalysisStore();
  const hasCustomKey = Boolean(settings.apiKey || settings.githubToken);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-background dev-glow">
            <Terminal className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-lg font-black tracking-tight text-foreground">
                gitreadme
              </span>
              <span className="rounded-full bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                v1.0
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono -mt-1 hidden sm:inline">
              RepoIntel // ReadMyRepo
            </span>
          </div>
        </Link>

        {/* Action icons & links */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/compare"
            className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <GitCompare className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Compare</span>
          </Link>

          <QuotaBadge />

          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="flex items-center gap-1 rounded-lg border border-border/60 bg-secondary/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span className="hidden md:inline font-mono text-[10px]">?</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="relative flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Settings className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Settings</span>
            {hasCustomKey && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 animate-pulse" />
            )}
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            <span className="hidden sm:inline font-mono">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
