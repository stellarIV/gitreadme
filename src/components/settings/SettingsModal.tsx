"use client";

import { useState } from "react";
import { useAnalysisStore, AppSettings } from "@/store/useAnalysisStore";
import { X, Settings, Key, Shield, Save, Check, Info } from "lucide-react";

export function SettingsModal() {
  const { isSettingsOpen, setIsSettingsOpen } = useAnalysisStore();

  if (!isSettingsOpen) return null;

  return <SettingsModalDialog onClose={() => setIsSettingsOpen(false)} />;
}

function SettingsModalDialog({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useAnalysisStore();
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 text-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-background/95 p-6 shadow-2xl shadow-black/60 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Settings className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Intelligence &amp; API Provider Settings
              </h3>
              <p className="text-[11px] text-white/80 font-mono">
                Configure LLM providers and GitHub access tokens
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="rounded-lg p-1 text-white/70 hover:bg-secondary hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 font-mono">
          {/* AI Provider selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white block">
              AI Model Provider
            </label>
            <select
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value as AppSettings["provider"] })}
              className="w-full rounded-xl border border-border/80 bg-white px-3.5 py-2.5 text-black focus:outline-none focus:border-primary/70 focus:ring-1 focus:ring-primary/40 transition-all text-xs [&>option]:text-black [&>option]:bg-white"
            >
              <option value="auto" className="text-black bg-white">Auto (Default: Gemini 3.8 Flash / Heuristic)</option>
              <option value="gemini" className="text-black bg-white">Google Gemini (Gemini 3.8 Flash / Recommended)</option>
              <option value="openai" className="text-black bg-white">OpenAI (GPT-4o / GPT-4o-mini)</option>
              <option value="anthropic" className="text-black bg-white">Anthropic Claude (Requires Custom Key — Server is NONE)</option>
              <option value="ollama" className="text-black bg-white">Local Ollama (Self-Hosted)</option>
            </select>
          </div>

          {/* Custom API Key */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-cyan-400" />
              <span>AI Provider API Key</span>
            </label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="AIza... or sk-..."
              className="w-full rounded-xl border border-border/80 bg-white px-3.5 py-2.5 text-black placeholder:text-neutral-500 focus:outline-none focus:border-primary/70 focus:ring-1 focus:ring-primary/40 transition-all text-xs"
            />
            <span className="text-[10px] text-white/70 block">
              Leave blank to use server environment variables or offline heuristic synthesis.
            </span>
          </div>

          {/* Ollama Endpoint */}
          {formData.provider === "ollama" && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-white block">
                Ollama Base URL
              </label>
              <input
                type="text"
                value={formData.ollamaBaseUrl}
                onChange={(e) => setFormData({ ...formData, ollamaBaseUrl: e.target.value })}
                placeholder="http://localhost:11434"
                className="w-full rounded-xl border border-border/80 bg-white px-3.5 py-2.5 text-black placeholder:text-neutral-500 focus:outline-none focus:border-primary/70 focus:ring-1 focus:ring-primary/40 transition-all text-xs"
              />
            </div>
          )}

          {/* GitHub Token */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-white flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span>GitHub Token (Personal Access Token)</span>
            </label>
            <input
              type="password"
              value={formData.githubToken}
              onChange={(e) => setFormData({ ...formData, githubToken: e.target.value })}
              placeholder="ghp_..."
              className="w-full rounded-xl border border-border/80 bg-white px-3.5 py-2.5 text-black placeholder:text-neutral-500 focus:outline-none focus:border-primary/70 focus:ring-1 focus:ring-primary/40 transition-all text-xs"
            />
            <span className="text-[10px] text-white/70 block">
              Stored locally in your browser. Increases rate limit to 5,000 req/hr and enables private repo access.
            </span>
          </div>

          {/* GitHub App upgrade path callout */}
          <div className="rounded-xl border border-border/70 bg-secondary/30 p-3 space-y-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <Info className="h-3.5 w-3.5 text-cyan-400" />
              <span>Enterprise &amp; GitHub App Upgrade Path</span>
            </div>
            <p className="text-white/80 leading-relaxed text-[10px]">
              For teams requiring private repo analysis without individual user tokens, configure a GitHub App in your deployment (<code className="text-white font-semibold">GITHUB_APP_ID</code>, <code className="text-white font-semibold">GITHUB_APP_PRIVATE_KEY</code>).
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-white/80 hover:bg-secondary hover:text-white transition-colors font-sans text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 font-bold text-white hover:opacity-90 transition-opacity font-sans text-xs dev-glow"
            >
              {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              <span>{saved ? "Saved" : "Save Settings"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
