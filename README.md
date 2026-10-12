# gitreadme (RepoIntel / ReadMyRepo)

> The AI-powered repository intelligence platform and brutal code roast engine.

[![Next.js 15](https://img.shields.io/badge/Next.js-15.2.0-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

**Gitreadme** turns any GitHub repository into an interactive documentation site, living Mermaid architecture diagram, local development setup guide, Git velocity dashboard, and witty "Roast My Repo" technical audit — all in one click.

---

## ⚡ Key Capabilities

1. **Smart Architecture & Component Mapping**
   - Automatically detects frameworks, manifests, databases, queues, and entry points.
   - Generates interactive, zoomable **Mermaid.js** flowcharts.
2. **Automated Setup & How-To Guides**
   - Extracts real environment variables from `.env.example`, `.env.sample`, and docker-compose files.
   - Detects package managers (`pnpm`, `npm`, `yarn`, `bun`, `poetry`, `cargo`, `go`) and provides exact commands.
3. **Git Timeline & Velocity Analytics**
   - Computes commits/week over the last 90 days, pace ratings (`breakneck`, `steady`, `sporadic`, `stale`, `zombie`).
   - 12-week activity heatmap and top contributors with avatars.
4. **Hierarchical Map-Reduce Engine for Massive Repos**
   - Clustered directory summarization (`summarizeDirectory.ts` + `mapReduce.ts`) so monorepos and 100k+ file trees never blow LLM context windows.
5. **Masked Security & Secret Scanner**
   - Flags committed API keys (AWS, Stripe, GitHub PAT, RSA keys).
   - **Strict Privacy**: Values are permanently masked (`sk_live_...****`) and never displayed or stored in plain text.
6. **"Roast My Repo" Mode**
   - Witty, technically sharp critiques of dependency bloat, over-engineering, missing tests, and "could have been a bash script" codebases, paired with constructive redemption advice.
7. **Live Markdown Split-View & Output Actions**
   - Live editable split pane with synchronized GitHub-flavored Markdown preview.
   - 1-click Copy, Download `.md`, or **Push to GitHub** directly via GitHub API.
   - Permanent shareable **Repo Cards** (`/card/[id]`) with dynamic SVG OpenGraph social banners.
8. **Multi-Model & Zero-Config Offline Heuristics**
   - First-class support for Gemini 2.0, OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet, and local Ollama.
   - Includes a deterministic, high-fidelity offline heuristic analyzer that works instantly with zero API keys.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm, pnpm, or bun

### Local Development
```bash
# 1. Clone repository
git clone https://github.com/stellarIV/pict-io.git
cd gitreadme

# 2. Install dependencies
npm install

# 3. (Optional) Configure environment variables
cp .env.example .env.local

# 4. Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :---: | :--- |
| `?` | Toggle keyboard shortcuts cheat sheet |
| `R` | Toggle "Roast My Repo" mode |
| `1` - `6` | Switch dashboard tabs (Overview, Architecture, Setup, Velocity, Roast, Editor) |
| `,` | Open API & Provider Settings |
| `Enter` | Trigger repository analysis |
| `Esc` | Close open modals |

---

## 🏛️ Enterprise: GitHub App Upgrade Path

For organizations requiring higher rate limits (5,000+ req/hr) and seamless private repo auditing without individual user tokens:
1. Register a GitHub App under your Organization Settings.
2. Grant read access to repository contents and metadata.
3. Configure `GITHUB_APP_ID` and `GITHUB_APP_PRIVATE_KEY` in your environment.

---

## 📄 License
MIT © 2026 gitreadme team.
