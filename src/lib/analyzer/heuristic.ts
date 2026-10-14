import {
  RepoMetadata,
  TechStackItem,
  ArchitectureInsight,
  SetupGuide,
  FunctionalCategory,
  NonFunctionalSpecs,
  RoastAnalysis,
  BestPracticeIssue,
} from "./types";
import { PreparedAnalysisContext } from "./mapReduce";
import { GitreadmeConfig } from "../config/gitreadmeConfig";

export function synthesizeHeuristicAnalysis(
  metadata: RepoMetadata,
  techStack: TechStackItem[],
  context: PreparedAnalysisContext,
  detectedIssues: BestPracticeIssue[],
  _mode: "professional" | "roast" = "professional",
  config: GitreadmeConfig = {}
): {
  techStack: TechStackItem[];
  architecture: ArchitectureInsight;
  setupGuide: SetupGuide;
  functional: FunctionalCategory[];
  nonFunctional: NonFunctionalSpecs;
  roast: RoastAnalysis;
} {
  const hasFrontend = techStack.some((t) => t.category === "frontend");
  const hasBackend = techStack.some((t) => t.category === "backend");
  const hasDb = techStack.some((t) => t.category === "database");
  const hasCache = techStack.some((t) => t.category === "cache");
  const hasDocker = techStack.some((t) => t.name === "Docker");
  const hasNext = techStack.some((t) => t.name === "Next.js");
  const hasReact = techStack.some((t) => t.name.includes("React"));
  const hasFastAPI = techStack.some((t) => t.name === "FastAPI");
  const hasExpress = techStack.some((t) => t.name === "Express.js");
  const hasPrisma = techStack.some((t) => t.name === "Prisma");
  const hasAuth = techStack.some((t) => t.category === "auth");

  // Determine Package Manager & Commands
  let packageManager: SetupGuide["packageManager"] = "npm";
  let installCmd = "npm install";
  let devCmd = "npm run dev";
  let testCmd = "npm test";
  let buildCmd = "npm run build";

  if (context.criticalFileSnippets.some((f) => f.path.includes("pnpm-lock.yaml"))) {
    packageManager = "pnpm";
    installCmd = "pnpm install";
    devCmd = "pnpm dev";
    testCmd = "pnpm test";
    buildCmd = "pnpm build";
  } else if (context.criticalFileSnippets.some((f) => f.path.includes("yarn.lock"))) {
    packageManager = "yarn";
    installCmd = "yarn install";
    devCmd = "yarn dev";
    testCmd = "yarn test";
    buildCmd = "yarn build";
  } else if (context.criticalFileSnippets.some((f) => f.path.includes("bun.lockb"))) {
    packageManager = "bun";
    installCmd = "bun install";
    devCmd = "bun dev";
    testCmd = "bun test";
    buildCmd = "bun run build";
  } else if (techStack.some((t) => t.name === "FastAPI" || t.name === "Django" || t.name === "Flask")) {
    packageManager = "poetry";
    installCmd = "poetry install";
    devCmd = "poetry run uvicorn main:app --reload";
    testCmd = "poetry run pytest";
    buildCmd = "poetry build";
  } else if (techStack.some((t) => t.name === "Go")) {
    packageManager = "go";
    installCmd = "go mod download";
    devCmd = "go run .";
    testCmd = "go test ./...";
    buildCmd = "go build -o bin/app";
  } else if (techStack.some((t) => t.name === "Rust")) {
    packageManager = "cargo";
    installCmd = "cargo check";
    devCmd = "cargo run";
    testCmd = "cargo test";
    buildCmd = "cargo build --release";
  }

  // Build Architecture Components
  const components: ArchitectureInsight["components"] = [];
  const entryPoints: ArchitectureInsight["entryPoints"] = [];

  if (hasNext) {
    components.push({
      name: "Next.js Full-Stack App",
      role: "Server-side rendering, App Router pages, and Edge/Node API route handlers",
      tech: "Next.js / React / TypeScript",
      paths: ["src/app", "src/pages", "src/components"],
    });
    entryPoints.push({
      name: "Root Layout / Entry",
      path: "src/app/layout.tsx",
      description: "Root HTML wrapper, theme provider, and global styles bootstrap",
    });
  } else if (hasReact) {
    components.push({
      name: "Client Single Page App",
      role: "Client-side interactive user interface and view rendering",
      tech: "React / Vite",
      paths: ["src/", "public/"],
    });
    entryPoints.push({
      name: "Client Entry",
      path: "src/main.tsx",
      description: "React DOM mount point",
    });
  }

  if (hasBackend || hasExpress || hasFastAPI) {
    components.push({
      name: "API & Business Logic Server",
      role: "HTTP REST / GraphQL endpoint controllers, routing, and request validation",
      tech: hasFastAPI ? "FastAPI / Python" : hasExpress ? "Express.js / Node" : "HTTP Server",
      paths: ["src/api", "src/routes", "src/controllers"],
    });
    entryPoints.push({
      name: "Server Main Entry",
      path: hasFastAPI ? "main.py" : "src/index.ts",
      description: "Server initialization, middleware pipeline, and port binding",
    });
  }

  if (hasDb || hasPrisma) {
    components.push({
      name: "Persistence Layer",
      role: "Database connection management, migrations, and model schemas",
      tech: hasPrisma ? "Prisma ORM / PostgreSQL" : "Relational Database",
      paths: ["prisma/schema.prisma", "src/db"],
    });
  }

  if (hasCache) {
    components.push({
      name: "In-Memory Cache",
      role: "High-throughput session storage and query caching layer",
      tech: "Redis",
      paths: ["src/lib/redis", "src/cache"],
    });
  }

  // Construct Multi-Tier Mermaid Flowchart with subgraphs
  let diagramMermaid = `flowchart TD
    subgraph ClientTier ["🖥️ Presentation Layer"]
      User["Client / Web Browser"]
    end
    subgraph AppTier ["⚙️ Application Core"]
      Gateway["Application Engine (${metadata.name})"]
    end
    User --> Gateway`;

  if (hasBackend && hasFrontend) {
    diagramMermaid = `flowchart TD
    subgraph ClientTier ["🖥️ Presentation Tier"]
      User["Web Browser / Client"]
      Frontend["Frontend UI (${hasNext ? "Next.js App" : "React Client"})"]
    end
    subgraph ServiceTier ["⚙️ Backend & API Services"]
      Backend["API Service (${hasExpress ? "Express API" : hasFastAPI ? "FastAPI Router" : "Server Handlers"})"]
    end
    subgraph DataTier ["💾 Data & Persistence Tier"]
      DB[("Primary Database (${hasPrisma ? "Prisma ORM" : "Data Store"})")]
      Cache[("Cache Layer (Redis)")]
    end
    User --> Frontend
    Frontend --> Backend
    Backend --> DB
    Backend --> Cache`;
  } else if (hasNext) {
    diagramMermaid = `flowchart TD
    subgraph ClientTier ["🖥️ Client & Hydration Layer"]
      User["Web Browser"]
      NextUI["Next.js React Server Components & UI"]
    end
    subgraph ServerTier ["⚙️ App Router & Edge Runtime"]
      APIRoutes["API Route Handlers & Server Actions"]
      Middleware["Request Middleware & Auth"]
    end
    subgraph StorageTier ["💾 Storage & External Integrations"]
      DB[("Database (${hasPrisma ? "Prisma / Postgres" : "Persistent Store"})")]
      Cache[("Cache & Session Store")]
    end
    User --> NextUI
    NextUI --> Middleware
    Middleware --> APIRoutes
    APIRoutes --> DB
    APIRoutes --> Cache`;
  } else if (hasBackend) {
    diagramMermaid = `flowchart TD
    subgraph IngressTier ["🌐 Ingress & Routing"]
      Client["API Consumers & HTTP Clients"]
      Router["HTTP Router & Middleware"]
    end
    subgraph ServiceTier ["⚙️ Core Business Logic"]
      Server["Application Service (${hasFastAPI ? "FastAPI" : "Node.js Core"})"]
    end
    subgraph PersistenceTier ["💾 Data & Storage"]
      DB[("Persistent Database / Storage")]
    end
    Client --> Router
    Router --> Server
    Server --> DB`;
  }

  // Generate Setup Guide
  const setupGuide: SetupGuide = {
    packageManager,
    runtimeVersion: hasFastAPI ? "Python 3.11+" : "Node.js 18+ / 20+",
    envVars: [],
    installCommands: [installCmd],
    devCommands: [devCmd],
    testCommands: [testCmd],
    buildCommands: [buildCmd],
    deploymentTargets: [
      ...(hasNext ? [{ target: "Vercel", notes: "Zero-config deployment with native Next.js edge support" }] : []),
      ...(hasDocker ? [{ target: "Docker Container", notes: "Build with `docker build -t app .` or run via `docker compose up -d`" }] : []),
      { target: "Railway / Render / Fly.io", notes: "Containerized or Node/Python buildpack deployment" },
    ],
    missingFilesWarnings: detectedIssues.map((d) => d.issue),
  };

  // Functional features
  const functional: FunctionalCategory[] = [
    {
      category: "Core Features",
      features: [
        metadata.description || `Primary repository functions for ${metadata.name}`,
        `Modular codebase structured into ${context.directorySummaries.length} key subsystems`,
        hasAuth ? "User authentication, session tracking, and credential validation" : "Public service processing and API endpoints",
        hasDb ? "Data persistence with structured schema models and queries" : "Stateless computation and utility processing",
      ],
    },
    {
      category: "Developer Experience & Workflows",
      features: [
        `Automated build lifecycle via \`${buildCmd}\``,
        context.isLargeOrMonorepo ? "Monorepo workspace organization" : "Streamlined single-package repository layout",
        `Configured script execution for testing and local live-reload development`,
      ],
    },
  ];

  // Non-functional specs
  const nonFunctional: NonFunctionalSpecs = {
    authStrategy: hasAuth ? "Token-based / OAuth session management" : "No centralized auth (stateless / public API)",
    securityPractices: [
      "Environment-based configuration isolation",
      "Strict input parsing on boundary routes",
      detectedIssues.some((i) => i.issue.includes("secrets"))
        ? "Action needed: Audit committed credentials"
        : "No unmasked secret leaks detected in primary manifests",
    ],
    caching: hasCache ? "Distributed Redis memory cache" : "Standard in-process memory and HTTP response headers",
    rateLimiting: "Recommended reverse-proxy or edge token bucket rate limiting",
    testingMaturity: detectedIssues.some((i) => i.issue.includes("No automated tests")) ? "none" : "moderate",
    observability: "Console output, standard error logging, and HTTP status codes",
  };

  // Generate Roast
  const techSins: RoastAnalysis["techSins"] = [];
  const savageRoasts: string[] = [];

  const depCount = techStack.length;
  if (depCount > 15) {
    savageRoasts.push(`You have ${depCount} recognized tech dependencies in here. Is this an enterprise repository or a museum of modern JavaScript artifacts?`);
    techSins.push({
      sin: "Dependency Gluttony",
      explanation: "Too many heavy third-party packages for what could probably be accomplished with standard library calls.",
      howToRedeem: "Audit package manifests with `npm depcheck` or `cargo prune` and shed unused transitive dependencies.",
    });
  } else {
    savageRoasts.push(`Lean dependency profile. Either you're genuinely disciplined, or you haven't implemented the hard features yet.`);
  }

  if (detectedIssues.some((i) => i.issue.includes("No automated tests"))) {
    savageRoasts.push("Zero automated test files detected. Your QA strategy appears to be 'let users test in production and file GitHub issues'.");
    techSins.push({
      sin: "Testing in Production",
      explanation: "No test runner configured or test suites detected anywhere in the tree.",
      howToRedeem: "Install a test runner like Vitest or Pytest and write at least one smoke test before your next merge.",
    });
  }

  if (context.isLargeOrMonorepo) {
    savageRoasts.push("Monorepo syndrome detected: You broke a 500-line utility into 8 workspaces because you saw a tech influencer do it on Twitter.");
    techSins.push({
      sin: "Premature Micro-Packaging",
      explanation: "Monorepo overhead before hitting multiple deployment targets or team boundaries.",
      howToRedeem: "Consolidate tightly coupled workspaces back into a shared `lib/` until independent versioning is mandatory.",
    });
  }

  if (!metadata.description) {
    savageRoasts.push("The repository doesn't even have a GitHub description. We had to reverse-engineer your code just to find out what you built.");
    techSins.push({
      sin: "The Silent Mystery",
      explanation: "Missing repo description makes discovery impossible.",
      howToRedeem: "Add a crisp 1-sentence description on GitHub.",
    });
  }

  const couldHaveBeenAScript = metadata.stars < 100 && techStack.length < 5 && context.totalFiles < 20;
  if (couldHaveBeenAScript) {
    savageRoasts.push("Diagnosis: This entire repository could realistically have been a 45-line bash or python script.");
  }

  // Calculate Roast Score (0-100, where higher is cleaner architecture, lower is more chaotic)
  let score = _mode === "roast" ? 78 : 82;
  if (detectedIssues.some((i) => i.issue.includes("No automated tests"))) score -= 18;
  if (detectedIssues.some((i) => i.issue.includes("secrets"))) score -= 25;
  if (!metadata.description) score -= 5;
  if (detectedIssues.some((i) => i.issue.includes("Missing .env.example"))) score -= 8;
  if (score < 20) score = 24;

  const verdictTitle =
    score > 80
      ? "Actually Respectable Engineering"
      : score > 60
      ? "Functioning Chaos (Works On My Machine)"
      : "Architectural Hazard Zone";

  const oneLinerRoast =
    savageRoasts[0] ||
    `A classic case of developer optimism meeting production realities in ${metadata.name}.`;

  const roast: RoastAnalysis = {
    scoreOutOf100: score,
    verdictTitle,
    oneLinerRoast,
    savageRoasts,
    techSins,
    couldHaveBeenAScript,
    dependencyWeightVerdict: depCount > 10 ? "Heavyweight (NPM black hole)" : "Lightweight & Agile",
    constructiveSummary: `All jokes aside, ${metadata.name} has solid foundational bones in ${metadata.language || "TypeScript"}. Addressing the ${detectedIssues.length} flagged items (adding automated smoke tests and locking down configuration templates) will elevate this from a quick project into a rock-solid production service.`,
  };

  // ─── Apply .gitreadme.yml config overrides ────────────────────────────────
  // Filter out components whose paths are in ignorePaths
  const ignorePaths = config.ignorePaths ?? [];
  const filteredComponents = ignorePaths.length > 0
    ? components.filter((c) =>
        !c.paths.some((p) =>
          ignorePaths.some((ignore) => p.startsWith(ignore) || p.includes(ignore))
        )
      )
    : components;

  // Build enriched textual overview using focusAreas and customRules
  const focusAreas = config.focusAreas ?? [];
  const customRules = config.customRules ?? [];
  const baseOverview = `${metadata.name} is architected as a ${
    hasNext ? "full-stack Next.js web application" : hasBackend ? "modular backend service" : "modern software project"
  } built in ${metadata.language || "TypeScript"}. It coordinates ${filteredComponents.length} primary architectural layers with dedicated entry points and modular directory boundaries.`;

  const focusNote = focusAreas.length > 0
    ? ` Analysis focused on: ${focusAreas.join(", ")}.`
    : "";
  const rulesNote = customRules.length > 0
    ? ` Custom team rules applied: ${customRules.join("; ")}.`
    : "";

  return {
    techStack,
    architecture: {
      textualOverview: baseOverview + focusNote + rulesNote,
      components: filteredComponents,
      dataFlow: [
        "Inbound client requests are received and routed via top-level entry points.",
        "Middlewares execute validation, headers, and environment credential resolution.",
        "Core business logic modules process state and interact with persistent data layers.",
        "Structured responses or rendered views are dispatched back to the caller.",
      ],
      diagramMermaid,
      entryPoints,
    },
    setupGuide,
    functional,
    nonFunctional,
    roast,
  };
}
