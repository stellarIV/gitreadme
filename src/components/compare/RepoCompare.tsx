"use client";

import { useState } from "react";
import { GitCompare, Loader2 } from "lucide-react";
import { RepoAnalysis } from "@/lib/analyzer/types";

export function RepoCompare() {
  const [repoAUrl, setRepoAUrl] = useState("vercel/next.js");
  const [repoBUrl, setRepoBUrl] = useState("expressjs/express");
  const [analysisA, setAnalysisA] = useState<RepoAnalysis | null>(null);
  const [analysisB, setAnalysisB] = useState<RepoAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRepo = async (url: string): Promise<RepoAnalysis> => {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl: url, mode: "professional" }),
    });

    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    if (!res.body) throw new Error("No response body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let finalAnalysis: RepoAnalysis | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim().startsWith("data:")) {
          const payload = JSON.parse(line.trim().slice(5).trim());
          if (payload.step === "complete" && payload.data) {
            finalAnalysis = payload.data;
          }
        }
      }
    }

    if (!finalAnalysis) throw new Error(`Could not complete analysis for ${url}`);
    return finalAnalysis;
  };

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoAUrl.trim() || !repoBUrl.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const [resA, resB] = await Promise.all([
        fetchRepo(repoAUrl.trim()),
        fetchRepo(repoBUrl.trim()),
      ]);
      setAnalysisA(resA);
      setAnalysisB(resB);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to compare repositories.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 space-y-8 font-mono text-xs">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs text-cyan-400">
          <GitCompare className="h-3.5 w-3.5" />
          <span>Repo Intel Battleground // Side-by-Side Architectural Audit</span>
        </div>
        <h1 className="text-3xl font-black text-foreground">Compare Repositories</h1>
        <p className="text-muted-foreground text-sm">
          Benchmark architecture, commit velocity, tech dependencies, and roast scores head-to-head.
        </p>
      </div>

      {/* Inputs Form */}
      <form onSubmit={handleCompare} className="rounded-2xl border border-border bg-card p-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Repository A</label>
            <input
              type="text"
              value={repoAUrl}
              onChange={(e) => setRepoAUrl(e.target.value)}
              placeholder="e.g. vercel/next.js"
              className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-foreground focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Repository B</label>
            <input
              type="text"
              value={repoBUrl}
              onChange={(e) => setRepoBUrl(e.target.value)}
              placeholder="e.g. expressjs/express"
              className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-foreground focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompare className="h-4 w-4" />}
            <span>{isLoading ? "Analyzing Repositories..." : "Run Side-by-Side Comparison"}</span>
          </button>
        </div>
      </form>

      {/* Comparison Grid Results */}
      {analysisA && analysisB && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs divide-y divide-border/60">
            <thead className="bg-secondary/40">
              <tr>
                <th className="p-4 w-1/4 text-muted-foreground">Dimension</th>
                <th className="p-4 w-3/8 text-emerald-400 font-bold text-sm">
                  {analysisA.metadata.fullName}
                </th>
                <th className="p-4 w-3/8 text-cyan-400 font-bold text-sm">
                  {analysisB.metadata.fullName}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr>
                <td className="p-4 text-muted-foreground">GitHub Stars</td>
                <td className="p-4 font-bold text-foreground">★ {analysisA.metadata.stars.toLocaleString()}</td>
                <td className="p-4 font-bold text-foreground">★ {analysisB.metadata.stars.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="p-4 text-muted-foreground">Primary Language</td>
                <td className="p-4 text-foreground">{analysisA.metadata.language || "Unknown"}</td>
                <td className="p-4 text-foreground">{analysisB.metadata.language || "Unknown"}</td>
              </tr>
              <tr>
                <td className="p-4 text-muted-foreground">Velocity (90d)</td>
                <td className="p-4 text-foreground">
                  <span className="font-bold text-emerald-400">{analysisA.gitVelocity.commitsPerWeek90d}</span> commits/wk ({analysisA.gitVelocity.velocityRating})
                </td>
                <td className="p-4 text-foreground">
                  <span className="font-bold text-cyan-400">{analysisB.gitVelocity.commitsPerWeek90d}</span> commits/wk ({analysisB.gitVelocity.velocityRating})
                </td>
              </tr>
              <tr>
                <td className="p-4 text-muted-foreground">Architecture Score</td>
                <td className="p-4 font-bold text-emerald-400 text-sm">
                  {analysisA.roast.scoreOutOf100}/100
                </td>
                <td className="p-4 font-bold text-cyan-400 text-sm">
                  {analysisB.roast.scoreOutOf100}/100
                </td>
              </tr>
              <tr>
                <td className="p-4 text-muted-foreground">Recognized Tech</td>
                <td className="p-4 text-muted-foreground">
                  {analysisA.techStack.map((t) => t.name).join(", ")}
                </td>
                <td className="p-4 text-muted-foreground">
                  {analysisB.techStack.map((t) => t.name).join(", ")}
                </td>
              </tr>
              <tr>
                <td className="p-4 text-muted-foreground">Monorepo Structure</td>
                <td className="p-4 text-foreground">{analysisA.isMonorepo ? "Yes (Monorepo)" : "Single Package"}</td>
                <td className="p-4 text-foreground">{analysisB.isMonorepo ? "Yes (Monorepo)" : "Single Package"}</td>
              </tr>
              <tr>
                <td className="p-4 text-muted-foreground">Roast Verdict</td>
                <td className="p-4 italic text-muted-foreground">&ldquo;{analysisA.roast.oneLinerRoast}&rdquo;</td>
                <td className="p-4 italic text-muted-foreground">&ldquo;{analysisB.roast.oneLinerRoast}&rdquo;</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
