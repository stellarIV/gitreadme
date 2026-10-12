"use client";

import { useState } from "react";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { X, UploadCloud, CheckCircle2, AlertCircle, Loader2, Key } from "lucide-react";

export function PushModal() {
  const { analysis, isPushModalOpen, setIsPushModalOpen, settings, updateSettings } = useAnalysisStore();
  const [filePath, setFilePath] = useState("README.md");
  const [branch, setBranch] = useState("main");
  const [commitMessage, setCommitMessage] = useState("docs: update living documentation via gitreadme");
  const [token, setToken] = useState(settings.githubToken || "");
  const [isPushing, setIsPushing] = useState(false);
  const [result, setResult] = useState<{ commitSha?: string; htmlUrl?: string; error?: string } | null>(null);

  if (!isPushModalOpen || !analysis) return null;

  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setResult({ error: "Please provide a GitHub Personal Access Token with repo write permissions." });
      return;
    }

    setIsPushing(true);
    setResult(null);

    // Save token to store for convenience
    updateSettings({ githubToken: token.trim() });

    try {
      const res = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: analysis.metadata.owner,
          repo: analysis.metadata.name,
          path: filePath,
          content: analysis.markdown,
          commitMessage,
          branch,
          token: token.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to commit changes to GitHub");
      }

      setResult({ commitSha: data.commitSha, htmlUrl: data.htmlUrl });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to push file to repository.";
      setResult({ error: message });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div
      onClick={() => setIsPushModalOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 font-mono text-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-foreground">Push to GitHub Repository</h3>
          </div>
          <button
            onClick={() => setIsPushModalOpen(false)}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {result?.commitSha ? (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5 space-y-3 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-foreground">Changes Pushed Successfully!</h4>
            <p className="text-muted-foreground text-[11px]">
              Committed to {branch} at ref {result.commitSha.slice(0, 7)}
            </p>
            {result.htmlUrl && (
              <a
                href={result.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
              >
                View File on GitHub
              </a>
            )}
          </div>
        ) : (
          <form onSubmit={handlePush} className="space-y-3.5">
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Target File Path</label>
              <select
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-foreground focus:outline-none"
              >
                <option value="README.md">README.md (Root)</option>
                <option value="docs/ARCHITECTURE.md">docs/ARCHITECTURE.md</option>
                <option value="docs/README.md">docs/README.md</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Target Branch</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-foreground focus:outline-none"
                placeholder="main"
              />
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Commit Message</label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-foreground focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Key className="h-3 w-3 text-amber-400" />
                  GitHub Personal Access Token (repo scope)
                </label>
              </div>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-foreground focus:outline-none"
              />
              <span className="text-[10px] text-muted-foreground block mt-1">
                Token is securely sent directly to GitHub and never stored in plain text on servers.
              </span>
            </div>

            {result?.error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-red-400 text-[11px]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{result.error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPushModalOpen(false)}
                className="rounded-xl px-4 py-2 text-muted-foreground hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPushing}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {isPushing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isPushing ? "Committing..." : "Commit & Push"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
