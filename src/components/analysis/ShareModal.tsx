/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { X, Share2, Copy, Check, Twitter, ExternalLink, Loader2 } from "lucide-react";

export function ShareModal() {
  const { analysis, isShareModalOpen, setIsShareModalOpen } = useAnalysisStore();
  const [cardId, setCardId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);

  if (!isShareModalOpen || !analysis) return null;

  const handleGenerateCard = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/card/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analysis),
      });
      const data = await res.json();
      if (data.cardId) {
        setCardId(data.cardId);
      }
    } catch (err) {
      console.error("Failed to generate Repo Card:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "https://gitreadme.dev";
  const shareUrl = cardId ? `${origin}/card/${cardId}` : "";
  const ogImageUrl = cardId ? `${origin}/api/og/${cardId}` : "";
  const badgeSnippet = `[![RepoIntel](${ogImageUrl})](${shareUrl})`;

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTweet = () => {
    const text = `Check out the architectural intelligence report for ${analysis.metadata.fullName} on gitreadme:\n\n${shareUrl}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div
      onClick={() => setIsShareModalOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 font-mono text-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-foreground">Permanent Public Repo Card</h3>
          </div>
          <button
            onClick={() => setIsShareModalOpen(false)}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!cardId ? (
          <div className="space-y-4 text-center py-4">
            <p className="text-muted-foreground text-xs leading-relaxed">
              Generate a permanent, shareable public Repo Card for <strong>{analysis.metadata.fullName}</strong>.
              Includes social OpenGraph preview and verifiable commit SHA snapshot.
            </p>
            <button
              onClick={handleGenerateCard}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 dev-glow"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              <span>{isSaving ? "Creating Repo Card..." : "Generate Permanent Share Link"}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Public Shareable URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-foreground font-mono text-xs"
                />
                <button
                  onClick={() => handleCopy(shareUrl, setCopiedLink)}
                  className="rounded-xl border border-border bg-secondary px-3 py-2 hover:bg-secondary/80 flex items-center gap-1"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedLink ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* OpenGraph Preview */}
            <div className="rounded-xl border border-border/80 bg-black/40 p-2 overflow-hidden">
              <span className="text-[10px] text-muted-foreground block mb-1">Social Card Preview</span>
              <img
                src={ogImageUrl}
                alt="Social Card Preview"
                className="w-full h-auto rounded-lg border border-border/40"
              />
            </div>

            {/* Markdown Badge Snippet */}
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Embed Badge in README</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={badgeSnippet}
                  className="flex-1 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-muted-foreground font-mono text-[11px]"
                />
                <button
                  onClick={() => handleCopy(badgeSnippet, setCopiedBadge)}
                  className="rounded-xl border border-border bg-secondary px-3 py-2 hover:bg-secondary/80"
                >
                  {copiedBadge ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Social Share Button */}
            <div className="flex items-center justify-between pt-2">
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline text-xs"
              >
                <span>Open Card</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <button
                onClick={handleTweet}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 px-4 py-2 font-bold text-cyan-300 hover:bg-cyan-500/30"
              >
                <Twitter className="h-3.5 w-3.5" />
                <span>Share on X</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
