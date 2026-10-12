"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { Copy, Check, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        darkMode: true,
        background: "#090d16",
        primaryColor: "#10b981",
        primaryTextColor: "#ffffff",
        primaryBorderColor: "#34d399",
        lineColor: "#38bdf8",
        secondaryColor: "#1e293b",
        tertiaryColor: "#0f172a",
      },
      securityLevel: "loose",
      fontFamily: "JetBrains Mono, monospace",
    });

    let isMounted = true;
    const renderChart = async () => {
      try {
        setError(null);
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to render Mermaid diagram.";
          setError(message);
        }
      }
    };

    renderChart();
    return () => {
      isMounted = false;
    };
  }, [chart]);

  // Intercept all anchor clicks inside the rendered SVG so they open in a
  // secure new tab (noopener, noreferrer) — needed because Mermaid's
  // securityLevel:'loose' injects raw <a> tags that would navigate away.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !svgContent) return;

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") || anchor.getAttribute("xlink:href");
      if (!href || href.startsWith("#")) return;
      // Only intercept absolute http(s) URLs
      if (!href.startsWith("http://") && !href.startsWith("https://")) return;
      e.preventDefault();
      e.stopPropagation();
      window.open(href, "_blank", "noopener,noreferrer");
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [svgContent]);

  const handleCopy = () => {
    navigator.clipboard.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-2xl border border-border/80 bg-card/60 p-4 overflow-hidden">
      {/* Controls Bar */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4 font-mono text-xs text-muted-foreground">
        <span className="font-semibold text-foreground flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Architecture Flowchart
          <span className="text-[10px] text-muted-foreground/60 font-normal hidden md:inline">
            · click nodes → source
          </span>
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setScale((s) => Math.min(s + 0.15, 2))}
            className="rounded p-1 hover:bg-secondary text-muted-foreground hover:text-foreground"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(s - 0.15, 0.6))}
            className="rounded p-1 hover:bg-secondary text-muted-foreground hover:text-foreground"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => setScale(1)}
            className="rounded p-1 hover:bg-secondary text-muted-foreground hover:text-foreground"
            title="Reset Zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded bg-secondary/80 px-2.5 py-1 text-xs hover:bg-secondary text-foreground ml-2"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy Code"}</span>
          </button>
        </div>
      </div>

      {/* SVG Container */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto py-6 flex items-center justify-center min-h-[300px] transition-transform duration-200"
        style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
      >
        {error ? (
          <div className="text-center font-mono text-xs text-amber-400 p-4 bg-amber-400/10 rounded-xl border border-amber-400/20 max-w-lg">
            <p className="font-bold mb-2">Mermaid Render Fallback</p>
            <pre className="text-left bg-black/40 p-3 rounded-lg overflow-x-auto text-[11px] text-muted-foreground">
              {chart}
            </pre>
          </div>
        ) : svgContent ? (
          <div
            dangerouslySetInnerHTML={{ __html: svgContent }}
            className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
          />
        ) : (
          <div className="font-mono text-xs text-muted-foreground animate-pulse">
            Rendering Architecture Diagram...
          </div>
        )}
      </div>
    </div>
  );
}
