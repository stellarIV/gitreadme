"use client";

import { useEffect } from "react";
import { SavedRepoCard } from "@/lib/db";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { AnalysisDashboard } from "@/components/analysis/AnalysisDashboard";
import { ShieldCheck, Eye, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CardViewerProps {
  card: SavedRepoCard;
}

export function CardViewer({ card }: CardViewerProps) {
  const { setAnalysis, setMode } = useAnalysisStore();

  useEffect(() => {
    setAnalysis(card.analysis);
    setMode(card.mode);
  }, [card, setAnalysis, setMode]);

  return (
    <div className="space-y-6">
      {/* Top Permanent Card Banner */}
      <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 font-mono text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 dev-glow-cyan">
        <div className="flex items-center gap-2 text-cyan-300">
          <ShieldCheck className="h-5 w-5 text-cyan-400" />
          <span>
            Permanent Verified Repo Card (ID: <strong className="text-white">{card.id}</strong>)
          </span>
        </div>

        <div className="flex items-center gap-4 text-muted-foreground text-[11px]">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(card.createdAt).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {card.views} views
          </span>
          <Link
            href="/"
            className="flex items-center gap-1 text-foreground hover:text-primary transition-colors font-bold ml-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Analyze New Repo</span>
          </Link>
        </div>
      </div>

      {/* Main Analysis Dashboard */}
      <AnalysisDashboard />
    </div>
  );
}
