import {
  EnvVariableSpec,
  SecretWarning,
  TechStackItem,
  BestPracticeIssue,
} from "../analyzer/types";

// Safe Secret Patterns: Match real credentials and mask immediately
const SECRET_PATTERNS = [
  {
    type: "AWS Access Key",
    regex: /(?:AKIA[0-9A-Z]{16})/g,
    mask: (match: string) => `AKIA${match.slice(4, 7)}...****`,
  },
  {
    type: "Stripe Secret Key",
    regex: /(?:sk_live_[0-9a-zA-Z]{24,})/g,
    mask: () => `sk_live_...****`,
  },
  {
    type: "GitHub Personal Access Token",
    regex: /(?:ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})/g,
    mask: () => `ghp_...****`,
  },
  {
    type: "Slack Token",
    regex: /(?:xox[baprs]-[0-9a-zA-Z-]{10,48})/g,
    mask: () => `xox...****`,
  },
  {
    type: "Private RSA / OpenSSH Key",
    regex: /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/g,
    mask: () => `-----BEGIN PRIVATE KEY----- [MASKED]`,
  },
  {
    type: "OpenAI API Key",
    regex: /(?:sk-[a-zA-Z0-9]{32,})/g,
    mask: () => `sk-...****`,
  },
  {
    type: "Generic High-Entropy API Secret",
    regex: /(?:(?:api_key|secret_key|private_key|auth_token)\s*[:=]\s*["'])([a-zA-Z0-9_\-]{24,})(["'])/gi,
    mask: () => `[MASKED_SECRET_STRING]`,
  },
];

export function scanFileForSecrets(filePath: string, content: string): SecretWarning[] {
  const warnings: SecretWarning[] = [];
  if (!content) return warnings;

  // Don't flag sample/example env files as actual leaked secrets
  const isSampleEnv =
    filePath.includes(".example") ||
    filePath.includes(".sample") ||
    filePath.includes(".template") ||
    filePath.includes("test") ||
    filePath.includes("mock");

  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of SECRET_PATTERNS) {
      const match = pattern.regex.exec(line);
      if (match) {
        // If it's a sample file with dummy text like "your_api_key_here", skip
        if (
          isSampleEnv &&
          (line.includes("your-") ||
            line.includes("xxx") ||
            line.includes("placeholder") ||
            line.includes("change_me") ||
            line.includes("insert_here"))
        ) {
          continue;
        }

        warnings.push({
          file: filePath,
          line: i + 1,
          type: pattern.type,
          maskedSnippet: pattern.mask(match[0] || ""),
          remediation: `Remove secret from git history using git filter-repo or BFG Repo-Cleaner, and rotate the key immediately.`,
        });
      }
    }
  }

  return warnings;
}

export function extractEnvVariables(filesMap: Map<string, string>): EnvVariableSpec[] {
  const envMap = new Map<string, EnvVariableSpec>();

  // 1. Check .env.example, .env.sample, .env.template
  const envFileNames = [
    ".env.example",
    ".env.sample",
    ".env.template",
    ".env.local.example",
    ".env",
  ];

  for (const name of envFileNames) {
    for (const [path, content] of filesMap.entries()) {
      if (path.endsWith(name) && content) {
        const lines = content.split("\n");
        let lastComment = "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("#")) {
            lastComment = trimmed.replace(/^#\s*/, "");
            continue;
          }
          if (!trimmed || !trimmed.includes("=")) continue;

          const eqIdx = trimmed.indexOf("=");
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();

          if (key && /^[A-Z0-9_]+$/.test(key)) {
            if (!envMap.has(key)) {
              envMap.set(key, {
                name: key,
                defaultValue: val ? (val.startsWith('"') && val.endsWith('"') ? val.slice(1, -1) : val) : undefined,
                description: lastComment || inferEnvDescription(key),
                required: !val || val === "your_key_here" || val === "",
              });
            }
          }
          lastComment = "";
        }
      }
    }
  }

  // 2. Fallback: Search code files for process.env.XXX or os.environ.get("XXX")
  for (const [path, content] of filesMap.entries()) {
    if (path.endsWith(".ts") || path.endsWith(".js") || path.endsWith(".tsx") || path.endsWith(".py")) {
      const regex = /(?:process\.env\.([A-Z0-9_]{3,})|os\.environ(?:\[["']|\.get\(["'])([A-Z0-9_]{3,}))/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const key = match[1] || match[2];
        if (key && !envMap.has(key) && key !== "NODE_ENV" && key !== "PORT") {
          envMap.set(key, {
            name: key,
            description: inferEnvDescription(key),
            required: true,
          });
        }
      }
    }
  }

  return Array.from(envMap.values());
}

function inferEnvDescription(key: string): string {
  const k = key.toLowerCase();
  if (k.includes("database_url") || k.includes("db_url")) return "Connection string for the primary database";
  if (k.includes("redis_url") || k.includes("upstash")) return "Redis cache or queue connection URI";
  if (k.includes("api_key") || k.includes("secret")) return "Secret API authentication credential";
  if (k.includes("jwt") || k.includes("auth_secret") || k.includes("nextauth_secret")) return "Cryptographic secret for signing tokens";
  if (k.includes("github_id") || k.includes("github_secret")) return "GitHub OAuth App credentials";
  if (k.includes("port")) return "Network port for the HTTP server";
  return `Configuration variable for ${key}`;
}

export function detectTechStack(filesMap: Map<string, string>, filePaths: string[]): TechStackItem[] {
  const items: TechStackItem[] = [];
  const added = new Set<string>();

  const add = (item: TechStackItem) => {
    if (!added.has(item.name)) {
      added.add(item.name);
      items.push(item);
    }
  };

  // Inspect package.json
  const packageJsonStr = filesMap.get("package.json");
  if (packageJsonStr) {
    try {
      const pkg = JSON.parse(packageJsonStr);
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      // Frontend
      if (allDeps["next"]) add({ category: "frontend", name: "Next.js", version: allDeps["next"], detectedFrom: "package.json", purpose: "React full-stack framework" });
      if (allDeps["react"]) add({ category: "frontend", name: "React", version: allDeps["react"], detectedFrom: "package.json", purpose: "UI component library" });
      if (allDeps["vue"]) add({ category: "frontend", name: "Vue.js", version: allDeps["vue"], detectedFrom: "package.json", purpose: "Progressive JavaScript framework" });
      if (allDeps["svelte"]) add({ category: "frontend", name: "Svelte", version: allDeps["svelte"], detectedFrom: "package.json", purpose: "Compiled reactive UI" });
      if (allDeps["tailwindcss"]) add({ category: "frontend", name: "Tailwind CSS", version: allDeps["tailwindcss"], detectedFrom: "package.json", purpose: "Utility-first CSS styling" });
      if (allDeps["@tanstack/react-query"]) add({ category: "frontend", name: "TanStack Query", version: allDeps["@tanstack/react-query"], detectedFrom: "package.json", purpose: "Async state management" });
      if (allDeps["zustand"]) add({ category: "frontend", name: "Zustand", version: allDeps["zustand"], detectedFrom: "package.json", purpose: "Lightweight state management" });
      if (allDeps["framer-motion"]) add({ category: "frontend", name: "Framer Motion", version: allDeps["framer-motion"], detectedFrom: "package.json", purpose: "Production-ready animation" });

      // Backend
      if (allDeps["express"]) add({ category: "backend", name: "Express.js", version: allDeps["express"], detectedFrom: "package.json", purpose: "Node HTTP microframework" });
      if (allDeps["@nestjs/core"]) add({ category: "backend", name: "NestJS", version: allDeps["@nestjs/core"], detectedFrom: "package.json", purpose: "Enterprise TypeScript backend" });
      if (allDeps["hono"]) add({ category: "backend", name: "Hono", version: allDeps["hono"], detectedFrom: "package.json", purpose: "Ultrafast edge web framework" });
      if (allDeps["fastify"]) add({ category: "backend", name: "Fastify", version: allDeps["fastify"], detectedFrom: "package.json", purpose: "High-performance Node server" });

      // Database & ORM
      if (allDeps["prisma"] || allDeps["@prisma/client"]) add({ category: "database", name: "Prisma", version: allDeps["@prisma/client"] || allDeps["prisma"], detectedFrom: "package.json", purpose: "Type-safe ORM" });
      if (allDeps["drizzle-orm"]) add({ category: "database", name: "Drizzle ORM", version: allDeps["drizzle-orm"], detectedFrom: "package.json", purpose: "TypeScript SQL ORM" });
      if (allDeps["mongoose"]) add({ category: "database", name: "Mongoose / MongoDB", version: allDeps["mongoose"], detectedFrom: "package.json", purpose: "MongoDB object modeling" });
      if (allDeps["pg"]) add({ category: "database", name: "PostgreSQL Client", version: allDeps["pg"], detectedFrom: "package.json", purpose: "Direct Postgres client" });

      // Cache & Queues
      if (allDeps["ioredis"] || allDeps["redis"]) add({ category: "cache", name: "Redis", detectedFrom: "package.json", purpose: "In-memory caching layer" });
      if (allDeps["bullmq"] || allDeps["bull"]) add({ category: "queue", name: "BullMQ", detectedFrom: "package.json", purpose: "Distributed background job queue" });

      // Auth
      if (allDeps["next-auth"] || allDeps["@auth/core"]) add({ category: "auth", name: "NextAuth / Auth.js", detectedFrom: "package.json", purpose: "Authentication & OAuth handling" });
      if (allDeps["@clerk/nextjs"] || allDeps["@clerk/clerk-sdk-node"]) add({ category: "auth", name: "Clerk", detectedFrom: "package.json", purpose: "Managed user identity" });
      if (allDeps["jsonwebtoken"]) add({ category: "auth", name: "JWT (jsonwebtoken)", detectedFrom: "package.json", purpose: "Stateless JWT token handling" });

      // Testing
      if (allDeps["jest"]) add({ category: "testing", name: "Jest", detectedFrom: "package.json", purpose: "Unit testing runner" });
      if (allDeps["vitest"]) add({ category: "testing", name: "Vitest", detectedFrom: "package.json", purpose: "Next-gen unit testing" });
      if (allDeps["@playwright/test"]) add({ category: "testing", name: "Playwright", detectedFrom: "package.json", purpose: "End-to-end browser automation" });
      if (allDeps["cypress"]) add({ category: "testing", name: "Cypress", detectedFrom: "package.json", purpose: "End-to-end testing" });
    } catch {
      // JSON parse error handled gracefully
    }
  }

  // Inspect Python requirements or pyproject.toml
  const reqsStr = filesMap.get("requirements.txt") || filesMap.get("pyproject.toml");
  if (reqsStr) {
    if (reqsStr.includes("fastapi")) add({ category: "backend", name: "FastAPI", detectedFrom: "requirements.txt", purpose: "Modern, fast Python web API" });
    if (reqsStr.includes("django")) add({ category: "backend", name: "Django", detectedFrom: "requirements.txt", purpose: "Full-stack Python web framework" });
    if (reqsStr.includes("flask")) add({ category: "backend", name: "Flask", detectedFrom: "requirements.txt", purpose: "Lightweight Python WSGI app" });
    if (reqsStr.includes("sqlalchemy")) add({ category: "database", name: "SQLAlchemy", detectedFrom: "requirements.txt", purpose: "Python SQL toolkit and ORM" });
    if (reqsStr.includes("celery")) add({ category: "queue", name: "Celery", detectedFrom: "requirements.txt", purpose: "Distributed task queue" });
    if (reqsStr.includes("pytest")) add({ category: "testing", name: "Pytest", detectedFrom: "requirements.txt", purpose: "Python testing framework" });
  }

  // Inspect Go
  const goModStr = filesMap.get("go.mod");
  if (goModStr) {
    add({ category: "backend", name: "Go", detectedFrom: "go.mod", purpose: "Compiled backend runtime" });
    if (goModStr.includes("gin-gonic/gin")) add({ category: "backend", name: "Gin", detectedFrom: "go.mod", purpose: "High performance Go web framework" });
    if (goModStr.includes("gorm.io/gorm")) add({ category: "database", name: "GORM", detectedFrom: "go.mod", purpose: "Developer-friendly Go ORM" });
  }

  // Inspect Rust
  const cargoStr = filesMap.get("Cargo.toml");
  if (cargoStr) {
    add({ category: "backend", name: "Rust", detectedFrom: "Cargo.toml", purpose: "Memory-safe systems programming" });
    if (cargoStr.includes("axum")) add({ category: "backend", name: "Axum", detectedFrom: "Cargo.toml", purpose: "Ergonomic modular web framework" });
    if (cargoStr.includes("tokio")) add({ category: "backend", name: "Tokio", detectedFrom: "Cargo.toml", purpose: "Async runtime for Rust" });
  }

  // Docker & DevOps
  if (filePaths.some((p) => p.toLowerCase().includes("dockerfile") || p.toLowerCase().includes("docker-compose"))) {
    add({ category: "devops", name: "Docker", detectedFrom: "Dockerfile / compose", purpose: "Containerization & multi-service orchestrator" });
  }
  if (filePaths.some((p) => p.includes("fly.toml"))) {
    add({ category: "devops", name: "Fly.io", detectedFrom: "fly.toml", purpose: "Edge server hosting" });
  }
  if (filePaths.some((p) => p.includes("vercel.json") || p.includes("next.config"))) {
    add({ category: "devops", name: "Vercel", detectedFrom: "config", purpose: "Serverless frontend deployment" });
  }

  return items;
}

export function detectMissingBestPractices(
  filePaths: string[],
  filesMap: Map<string, string>,
  hasSecretWarnings: boolean
): BestPracticeIssue[] {
  const issues: BestPracticeIssue[] = [];

  // 1. Tests detection
  const hasTests = filePaths.some(
    (p) =>
      p.includes("__tests__") ||
      p.includes(".test.") ||
      p.includes(".spec.") ||
      p.includes("tests/") ||
      p.includes("test_")
  );
  if (!hasTests) {
    issues.push({
      issue: "No automated tests detected",
      severity: "critical",
      fix: "Add unit tests (e.g. Vitest, Jest, or Pytest) to establish a test coverage safety net.",
    });
  }

  // 2. Missing .env.example
  const hasEnvSample = filePaths.some(
    (p) =>
      p.endsWith(".env.example") ||
      p.endsWith(".env.sample") ||
      p.endsWith(".env.template")
  );
  const mentionsEnvInCode = Array.from(filesMap.values()).some(
    (c) => c && (c.includes("process.env.") || c.includes("os.environ"))
  );
  if (!hasEnvSample && mentionsEnvInCode) {
    issues.push({
      issue: "Missing .env.example / .env.sample template",
      severity: "warning",
      fix: "Create a committed .env.example file listing all required environment keys with placeholder values.",
    });
  }

  // 3. CI / GitHub Actions
  const hasCi = filePaths.some(
    (p) => p.startsWith(".github/workflows/") || p.includes(".gitlab-ci") || p.includes("circleci")
  );
  if (!hasCi) {
    issues.push({
      issue: "Missing Continuous Integration (CI) workflow",
      severity: "warning",
      fix: "Create a GitHub Actions workflow (.github/workflows/ci.yml) to run linting and tests on every pull request.",
    });
  }

  // 4. Committed Secrets
  if (hasSecretWarnings) {
    issues.push({
      issue: "Potentially exposed credentials / API keys detected in source code",
      severity: "critical",
      fix: "Immediately rotate any leaked credentials and remove them from git tracking using git filter-repo.",
    });
  }

  // 5. Missing License
  const hasLicense = filePaths.some(
    (p) => p.toLowerCase() === "license" || p.toLowerCase().startsWith("license.")
  );
  if (!hasLicense) {
    issues.push({
      issue: "No explicit LICENSE file in repository root",
      severity: "info",
      fix: "Add an open-source license (such as MIT or Apache 2.0) to clarify legal usage rights.",
    });
  }

  return issues;
}
