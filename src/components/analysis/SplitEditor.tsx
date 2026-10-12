"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Download, UploadCloud, Check, FileText, Code2, Eye } from "lucide-react";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { generateMarkdownDoc } from "@/lib/analyzer/markdown";

export function SplitEditor() {
  const { analysis, updateMarkdown, setIsPushModalOpen } = useAnalysisStore();
  const [copied, setCopied] = useState(false);
  const [docType, setDocType] = useState<"readme" | "architecture">("readme");
  const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">("split");

  if (!analysis) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = docType === "architecture" ? "ARCHITECTURE.md" : "README.md";
    const blob = new Blob([analysis.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSwitchDocType = (type: "readme" | "architecture") => {
    setDocType(type);
    const newDoc = generateMarkdownDoc(analysis, type);
    updateMarkdown(newDoc);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-border/80 bg-card/80 overflow-hidden shadow-2xl">
      {/* Editor Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-border/60 bg-secondary/40 p-3 sm:px-4 gap-2 font-mono text-xs">
        {/* Document type switch */}
        <div className="flex items-center gap-1.5 bg-card/60 p-1 rounded-xl border border-border/60">
          <button
            onClick={() => handleSwitchDocType("readme")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-colors ${
              docType === "readme" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>README.md</span>
          </button>
          <button
            onClick={() => handleSwitchDocType("architecture")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-colors ${
              docType === "architecture" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>ARCHITECTURE.md</span>
          </button>
        </div>

        {/* View Mode (mobile friendly) */}
        <div className="flex items-center gap-1 bg-card/60 p-1 rounded-xl border border-border/60 sm:flex hidden">
          <button
            onClick={() => setViewMode("split")}
            className={`px-2.5 py-1 rounded-lg ${viewMode === "split" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
          >
            Split
          </button>
          <button
            onClick={() => setViewMode("edit")}
            className={`px-2.5 py-1 rounded-lg ${viewMode === "edit" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
          >
            Editor
          </button>
          <button
            onClick={() => setViewMode("preview")}
            className={`px-2.5 py-1 rounded-lg ${viewMode === "preview" ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
          >
            Preview
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download .md</span>
          </button>

          <button
            onClick={() => setIsPushModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/30 transition-colors"
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Push to GitHub</span>
          </button>
        </div>
      </div>

      {/* Editor & Preview Split Panes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/60 min-h-[550px] max-h-[750px]">
        {/* Left Pane: Markdown Textarea */}
        <div className={`p-4 flex flex-col bg-background/50 ${viewMode === "preview" ? "hidden" : "block"}`}>
          <div className="text-[11px] font-mono text-muted-foreground mb-2 flex items-center justify-between">
            <span>Live Markdown Source (Editable)</span>
            <span>{analysis.markdown.length} characters</span>
          </div>
          <textarea
            value={analysis.markdown}
            onChange={(e) => updateMarkdown(e.target.value)}
            className="flex-1 w-full resize-none rounded-xl border border-border/50 bg-card/40 p-4 font-mono text-xs text-foreground focus:outline-none focus:border-primary/50 leading-relaxed overflow-y-auto"
            placeholder="Markdown content..."
          />
        </div>

        {/* Right Pane: Live Rendered Preview */}
        <div className={`p-6 overflow-y-auto bg-card/20 prose prose-invert prose-emerald max-w-none ${viewMode === "edit" ? "hidden" : "block"}`}>
          <div className="text-[11px] font-mono text-muted-foreground mb-4 flex items-center gap-1.5 not-prose">
            <Eye className="h-3.5 w-3.5 text-cyan-400" />
            <span>Live Rendered Preview</span>
          </div>
          <div className="prose-headings:font-mono prose-headings:tracking-tight prose-pre:bg-secondary/70 prose-pre:border prose-pre:border-border text-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {analysis.markdown}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
