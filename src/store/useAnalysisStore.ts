import { create } from "zustand";
import { RepoAnalysis, ProgressEventPayload } from "@/lib/analyzer/types";

export interface AppSettings {
  provider: "gemini" | "openai" | "anthropic" | "ollama" | "auto";
  apiKey: string;
  model: string;
  githubToken: string;
  ollamaBaseUrl: string;
}

interface AnalysisStore {
  repoUrl: string;
  mode: "professional" | "roast";
  analysis: RepoAnalysis | null;
  isAnalyzing: boolean;
  progress: ProgressEventPayload | null;
  error: string | null;
  activeTab: "overview" | "architecture" | "setup" | "velocity" | "requirements" | "roast" | "editor";
  settings: AppSettings;
  isSettingsOpen: boolean;
  isShortcutsOpen: boolean;
  isPushModalOpen: boolean;
  isShareModalOpen: boolean;

  setRepoUrl: (url: string) => void;
  setMode: (mode: "professional" | "roast") => void;
  setAnalysis: (analysis: RepoAnalysis | null) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setProgress: (progress: ProgressEventPayload | null) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: AnalysisStore["activeTab"]) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsShortcutsOpen: (open: boolean) => void;
  setIsPushModalOpen: (open: boolean) => void;
  setIsShareModalOpen: (open: boolean) => void;
  updateMarkdown: (newMarkdown: string) => void;
  analyze: (targetUrl?: string, forceRefresh?: boolean) => Promise<void>;
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  repoUrl: "",
  mode: "professional",
  analysis: null,
  isAnalyzing: false,
  progress: null,
  error: null,
  activeTab: "overview",
  isSettingsOpen: false,
  isShortcutsOpen: false,
  isPushModalOpen: false,
  isShareModalOpen: false,
  settings: {
    provider: "auto",
    apiKey: "",
    model: "",
    githubToken: "",
    ollamaBaseUrl: "http://localhost:11434",
  },

  setRepoUrl: (repoUrl) => set({ repoUrl }),
  setMode: (mode) => set({ mode }),
  setAnalysis: (analysis) => set({ analysis }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  setIsShortcutsOpen: (isShortcutsOpen) => set({ isShortcutsOpen }),
  setIsPushModalOpen: (isPushModalOpen) => set({ isPushModalOpen }),
  setIsShareModalOpen: (isShareModalOpen) => set({ isShareModalOpen }),

  updateSettings: (newSettings) =>
    set((state) => {
      const merged = { ...state.settings, ...newSettings };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("gitreadme_settings", JSON.stringify(merged));
        } catch {
          // ignore
        }
      }
      return { settings: merged };
    }),

  updateMarkdown: (newMarkdown) =>
    set((state) => {
      if (!state.analysis) return state;
      return {
        analysis: {
          ...state.analysis,
          markdown: newMarkdown,
        },
      };
    }),

  analyze: async (targetUrl?: string, forceRefresh: boolean = false) => {
    const { repoUrl, mode, settings } = get();
    const urlToAnalyze = targetUrl || repoUrl;
    if (!urlToAnalyze.trim()) {
      set({ error: "Please enter a GitHub repository URL or slug (e.g. vercel/next.js)" });
      return;
    }

    set({
      isAnalyzing: true,
      error: null,
      progress: {
        step: "parsing_url",
        progress: 5,
        title: "Starting Analysis",
        detail: "Connecting to intelligence stream...",
        timestamp: Date.now(),
      },
    });

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: urlToAnalyze,
          mode,
          forceRefresh,
          provider: settings.provider,
          apiKey: settings.apiKey,
          model: settings.model,
          githubToken: settings.githubToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response stream received from analysis service.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            const jsonStr = trimmed.slice(5).trim();
            try {
              const payload = JSON.parse(jsonStr);

              if (payload.step === "error") {
                set({ error: payload.detail || payload.title, isAnalyzing: false });
                return;
              }

              set({ progress: payload });

              if (payload.step === "complete" && payload.data) {
                set({
                  analysis: payload.data,
                  isAnalyzing: false,
                  activeTab: mode === "roast" ? "roast" : "overview",
                });
              }
            } catch (err) {
              console.warn("Failed to parse SSE line:", err);
            }
          }
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to analyze repository.";
      set({
        error: errMsg,
        isAnalyzing: false,
      });
    }
  },
}));
