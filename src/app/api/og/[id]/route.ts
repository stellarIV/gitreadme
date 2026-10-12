import { NextRequest } from "next/server";
import { getRepoCard } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const card = getRepoCard(id);

  const title = card ? card.repoFullName : "gitreadme (RepoIntel)";
  const score = card?.analysis?.roast?.scoreOutOf100 || 85;
  const verdict = card?.analysis?.roast?.verdictTitle || "Architectural Intelligence";
  const stars = card?.analysis?.metadata?.stars || 0;
  const lang = card?.analysis?.metadata?.language || "TypeScript";
  const oneLiner = card?.analysis?.roast?.oneLinerRoast || "Living Documentation & Repository Intelligence";

  // Escape XML characters
  const cleanTitle = escapeXml(title);
  const cleanVerdict = escapeXml(verdict);
  const cleanOneLiner = escapeXml(oneLiner.slice(0, 100));

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)" />
  <circle cx="1100" cy="100" r="300" fill="#10b981" opacity="0.08" />
  <circle cx="100" cy="500" r="250" fill="#06b6d4" opacity="0.08" />

  <!-- Brand header -->
  <g transform="translate(80, 80)">
    <rect width="40" height="40" rx="10" fill="#10b981" />
    <path d="M12 20 L20 28 L28 12" stroke="#090d16" stroke-width="4" fill="none" stroke-linecap="round" />
    <text x="56" y="28" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800" letter-spacing="1">GITREADME <tspan fill="#10b981">.DEV</tspan></text>
    <text x="320" y="28" fill="#64748b" font-family="monospace" font-size="16">REPOINTEL // AUDIT</text>
  </g>

  <!-- Repo Title -->
  <text x="80" y="220" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900">${cleanTitle}</text>
  
  <!-- One Liner -->
  <text x="80" y="280" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="24">${cleanOneLiner}...</text>

  <!-- Badges / Stats Container -->
  <g transform="translate(80, 360)">
    <!-- Score Box -->
    <rect width="220" height="120" rx="16" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
    <text x="24" y="44" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="16" font-weight="600">ARCH SCORE</text>
    <text x="24" y="96" fill="#10b981" font-family="monospace" font-size="44" font-weight="900">${score}<tspan font-size="24" fill="#64748b">/100</tspan></text>

    <!-- Verdict Box -->
    <g transform="translate(250, 0)">
      <rect width="420" height="120" rx="16" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
      <text x="24" y="44" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="16" font-weight="600">VERDICT</text>
      <text x="24" y="90" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="26" font-weight="700">${cleanVerdict}</text>
    </g>

    <!-- Language & Stars -->
    <g transform="translate(700, 0)">
      <rect width="240" height="120" rx="16" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
      <text x="24" y="44" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="16" font-weight="600">METRICS</text>
      <text x="24" y="90" fill="#38bdf8" font-family="monospace" font-size="24" font-weight="700">★ ${stars} | ${escapeXml(lang)}</text>
    </g>
  </g>

  <!-- Footer link -->
  <text x="80" y="560" fill="#64748b" font-family="monospace" font-size="18">Analyze your repo in 1-click at https://gitreadme.dev</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
