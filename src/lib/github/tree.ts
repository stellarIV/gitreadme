import { GitHubTreeItem } from "./types";

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".github",
  "vendor",
  "dist",
  "build",
  ".next",
  "out",
  ".turbo",
  "coverage",
  ".nyc_output",
  "__pycache__",
  ".pytest_cache",
  ".venv",
  "venv",
  "env",
  "target",
  "bin",
  "obj",
  ".idea",
  ".vscode",
  "bower_components",
  ".cargo",
]);

const IGNORED_EXTENSIONS = new Set([
  // Images & Media
  "png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "bmp", "tiff",
  "mp4", "webm", "mov", "avi", "mp3", "wav", "flac",
  // Fonts & Documents
  "woff", "woff2", "ttf", "eot", "otf", "pdf", "doc", "docx",
  // Archives & Binaries
  "zip", "tar", "gz", "tgz", "rar", "7z", "iso", "bin", "exe", "dll", "so", "dylib", "wasm",
  // Source maps & lockfiles
  "map",
]);

const LOCKFILES = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "cargo.lock",
  "poetry.lock",
  "gemfile.lock",
  "composer.lock",
  "go.sum",
  "mix.lock",
]);

export interface FilteredFileItem {
  path: string;
  name: string;
  extension: string;
  size: number;
  score: number;
  category: "manifest" | "config" | "entry" | "schema" | "route" | "code" | "doc" | "docker";
}

export interface TreeSummary {
  totalFiles: number;
  filteredFiles: FilteredFileItem[];
  prioritizedFilesToRead: FilteredFileItem[];
  isMonorepo: boolean;
  monorepoWorkspaces: string[];
  treeStructureAscii: string;
}

export function filterAndPrioritizeTree(tree: GitHubTreeItem[], maxFilesToRead: number = 30): TreeSummary {
  const filtered: FilteredFileItem[] = [];
  const monorepoRoots = new Set<string>();

  for (const item of tree) {
    if (item.type !== "blob") continue;

    const parts = item.path.split("/");
    // Check if any directory segment is in ignored list
    const hasIgnoredDir = parts.some((p, idx) => idx < parts.length - 1 && IGNORED_DIRECTORIES.has(p.toLowerCase()));
    if (hasIgnoredDir) continue;

    const fileName = parts[parts.length - 1];
    const fileNameLower = fileName.toLowerCase();

    // Skip lockfiles
    if (LOCKFILES.has(fileNameLower)) continue;

    const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : "";

    // Skip ignored extensions
    if (IGNORED_EXTENSIONS.has(ext)) continue;

    // Detect monorepo workspaces (apps/xxx, packages/xxx, services/xxx)
    if (parts.length >= 2) {
      const topDir = parts[0].toLowerCase();
      if (topDir === "packages" || topDir === "apps" || topDir === "services" || topDir === "modules" || topDir === "crates") {
        monorepoRoots.add(`${parts[0]}/${parts[1]}`);
      }
    }

    let score = 20;
    let category: FilteredFileItem["category"] = "code";

    // Scoring heuristics
    if (
      fileNameLower === "package.json" ||
      fileNameLower === "requirements.txt" ||
      fileNameLower === "pyproject.toml" ||
      fileNameLower === "go.mod" ||
      fileNameLower === "cargo.toml" ||
      fileNameLower === "pom.xml" ||
      fileNameLower === "build.gradle" ||
      fileNameLower === "mix.exs" ||
      fileNameLower === "gemfile"
    ) {
      score = 100;
      category = "manifest";
    } else if (
      fileNameLower.startsWith("docker-compose") ||
      fileNameLower === "dockerfile" ||
      fileNameLower.endsWith(".dockerfile") ||
      fileNameLower === "procfile" ||
      fileNameLower === "fly.toml"
    ) {
      score = 95;
      category = "docker";
    } else if (
      fileNameLower === ".env.example" ||
      fileNameLower === ".env.sample" ||
      fileNameLower === ".env.template" ||
      fileNameLower === ".env.local.example"
    ) {
      score = 95;
      category = "config";
    } else if (
      fileNameLower.startsWith("readme") ||
      fileNameLower.startsWith("contributing") ||
      fileNameLower === "architecture.md"
    ) {
      score = 90;
      category = "doc";
    } else if (
      fileNameLower === "schema.prisma" ||
      fileNameLower.endsWith(".sql") ||
      fileNameLower.includes("schema") ||
      fileNameLower.includes("graphql")
    ) {
      score = 85;
      category = "schema";
    } else if (
      fileNameLower === "next.config.js" ||
      fileNameLower === "next.config.ts" ||
      fileNameLower === "next.config.mjs" ||
      fileNameLower === "vite.config.ts" ||
      fileNameLower === "vite.config.js" ||
      fileNameLower === "nest-cli.json" ||
      fileNameLower === "tsconfig.json" ||
      fileNameLower === "angular.json"
    ) {
      score = 80;
      category = "config";
    } else if (
      fileNameLower === "index.ts" ||
      fileNameLower === "index.js" ||
      fileNameLower === "main.ts" ||
      fileNameLower === "main.py" ||
      fileNameLower === "main.go" ||
      fileNameLower === "app.py" ||
      fileNameLower === "app.ts" ||
      fileNameLower === "server.ts" ||
      fileNameLower === "server.js" ||
      fileNameLower === "layout.tsx"
    ) {
      score = 75;
      category = "entry";
    } else if (
      item.path.includes("route") ||
      item.path.includes("controller") ||
      item.path.includes("router") ||
      item.path.includes("api/") ||
      item.path.includes("endpoints")
    ) {
      score = 65;
      category = "route";
    }

    // Root-level manifests and configs get an extra boost
    if (parts.length === 1) {
      score += 15;
    }

    filtered.push({
      path: item.path,
      name: fileName,
      extension: ext,
      size: item.size || 0,
      score,
      category,
    });
  }

  // Sort descending by score
  filtered.sort((a, b) => b.score - a.score);

  const prioritized = filtered.slice(0, maxFilesToRead);
  const isMonorepo = monorepoRoots.size > 0;
  const monorepoWorkspaces = Array.from(monorepoRoots).slice(0, 15);

  // Generate ASCII tree overview of top level structure (capped at top 30 key paths)
  const treeStructureAscii = generateAsciiTree(filtered.slice(0, 45).map((f) => f.path));

  return {
    totalFiles: tree.length,
    filteredFiles: filtered,
    prioritizedFilesToRead: prioritized,
    isMonorepo,
    monorepoWorkspaces,
    treeStructureAscii,
  };
}

interface TreeNode {
  [key: string]: TreeNode;
}

function generateAsciiTree(paths: string[]): string {
  const root: TreeNode = {};
  for (const path of paths) {
    const parts = path.split("/");
    let current = root;
    for (const part of parts) {
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
  }

  const lines: string[] = ["."];
  function traverse(node: TreeNode, prefix: string = "") {
    const keys = Object.keys(node);
    keys.forEach((key, index) => {
      const isLast = index === keys.length - 1;
      const connector = isLast ? "└── " : "├── ";
      lines.push(`${prefix}${connector}${key}`);
      const childPrefix = isLast ? "    " : "│   ";
      traverse(node[key], `${prefix}${childPrefix}`);
    });
  }
  traverse(root);
  return lines.slice(0, 50).join("\n");
}
