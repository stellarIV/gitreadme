import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { ShortcutsModal } from "@/components/shortcuts/ShortcutsModal";
import { PushModal } from "@/components/analysis/PushModal";
import { ShareModal } from "@/components/analysis/ShareModal";

export const metadata: Metadata = {
  title: "gitreadme // RepoIntel & ReadMyRepo",
  description:
    "The AI-powered repository intelligence platform. Transforms any GitHub codebase into living architecture, setup blueprints, velocity analytics, and brutal technical roasts.",
  keywords: ["GitHub", "README generator", "architecture diagrams", "Mermaid", "code audit", "repo roast"],
  authors: [{ name: "gitreadme team" }],
  openGraph: {
    title: "gitreadme // Repository Intelligence Platform",
    description: "Living architecture, setup guides, velocity analytics, and hilarious repo roasts.",
    type: "website",
    url: "https://gitreadme.dev",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground min-h-screen flex flex-col bg-grid-pattern">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>

        {/* Global Modals */}
        <SettingsModal />
        <ShortcutsModal />
        <PushModal />
        <ShareModal />

        {/* Devtopia Footer */}
        <footer className="w-full border-t border-border/40 bg-background/80 py-8 text-center font-mono text-xs text-muted-foreground backdrop-blur-sm">
          <div className="container mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">gitreadme</span>
              <span>{"//"} Devtopia Engineering 2026</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Press <kbd className="rounded bg-secondary px-1.5 py-0.5 border border-border text-foreground">?</kbd> for shortcuts</span>
              <span>•</span>
              <a href="/compare" className="hover:text-foreground">Compare Repos</a>
              <span>•</span>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
