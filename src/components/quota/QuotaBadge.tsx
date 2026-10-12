"use client";

import { useEffect, useState } from "react";
import { Zap, TrendingUp } from "lucide-react";

interface QuotaData {
  tier: "free" | "pro";
  limit: number;
  used: number;
  remaining: number;
  allowed: boolean;
  resetAt: string;
}

export function QuotaBadge() {
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/quota")
      .then((r) => r.json())
      .then((data: { quota: QuotaData }) => {
        if (!cancelled) setQuota(data.quota);
      })
      .catch(() => {
        // Graceful degradation — hide badge on error
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading || !quota) return null;

  const pct = Math.round(((quota.limit - quota.remaining) / quota.limit) * 100);
  const isPro = quota.tier === "pro";
  const isAlmostOut = quota.remaining <= 1 && !isPro;

  return (
    <div
      title={`${quota.remaining}/${quota.limit} analyses remaining today • Resets at midnight UTC`}
      className={`hidden sm:flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-mono transition-colors ${
        isPro
          ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
          : isAlmostOut
          ? "border-red-500/40 bg-red-500/10 text-red-400 animate-pulse"
          : "border-border/60 bg-secondary/50 text-muted-foreground"
      }`}
    >
      {isPro ? (
        <TrendingUp className="h-3 w-3 text-amber-400" />
      ) : (
        <Zap className="h-3 w-3" />
      )}
      <span>
        {isPro ? (
          <>Pro &middot; {quota.remaining} left</>
        ) : (
          <>{quota.remaining}/{quota.limit} today</>
        )}
      </span>
      {/* Progress pip */}
      {!isPro && (
        <div className="h-1 w-10 rounded-full bg-border/60 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isAlmostOut ? "bg-red-400" : "bg-primary"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
