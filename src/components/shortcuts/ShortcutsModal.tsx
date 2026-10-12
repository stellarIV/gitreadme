"use client";

import { useEffect } from "react";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { X, Keyboard } from "lucide-react";

export function ShortcutsModal() {
  const {
    isShortcutsOpen,
    setIsShortcutsOpen,
    mode,
    setMode,
    setActiveTab,
    setIsSettingsOpen,
  } = useAnalysisStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore inside text inputs and textareas
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setIsShortcutsOpen(!isShortcutsOpen);
      } else if (e.key === "r" || e.key === "R") {
        setMode(mode === "roast" ? "professional" : "roast");
      } else if (e.key === "1") {
        setActiveTab("overview");
      } else if (e.key === "2") {
        setActiveTab("architecture");
      } else if (e.key === "3") {
        setActiveTab("setup");
      } else if (e.key === "4") {
        setActiveTab("velocity");
      } else if (e.key === "5") {
        setActiveTab("roast");
      } else if (e.key === "6") {
        setActiveTab("editor");
      } else if (e.key === ",") {
        setIsSettingsOpen(true);
      } else if (e.key === "Escape") {
        setIsShortcutsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isShortcutsOpen, setIsShortcutsOpen, mode, setMode, setActiveTab, setIsSettingsOpen]);

  if (!isShortcutsOpen) return null;

  const shortcuts = [
    { key: "?", desc: "Toggle this keyboard shortcuts cheat sheet" },
    { key: "R", desc: "Toggle Roast My Repo mode" },
    { key: "1 - 6", desc: "Switch dashboard tabs (Overview, Architecture, Setup...)" },
    { key: ",", desc: "Open API & Provider Settings" },
    { key: "Esc", desc: "Close any modal" },
    { key: "Enter", desc: "Run analysis on current input" },
  ];

  return (
    <div
      onClick={() => setIsShortcutsOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 text-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-border/80 bg-background/95 p-6 shadow-2xl shadow-black/60 space-y-4 font-mono"
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Keyboard className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-sans">Keyboard Shortcuts</h3>
              <p className="text-[11px] text-white/80">Quick keyboard navigation</p>
            </div>
          </div>
          <button
            onClick={() => setIsShortcutsOpen(false)}
            aria-label="Close shortcuts"
            className="rounded-lg p-1 text-white/70 hover:bg-secondary hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/40 px-3.5 py-2.5 transition-colors hover:bg-secondary/60"
            >
              <span className="text-white font-sans text-xs">{s.desc}</span>
              <kbd className="rounded-lg bg-background/90 px-2.5 py-1 text-[11px] font-bold text-white border border-border/80 shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
