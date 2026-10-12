export interface RepoMetadata {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  commitSha: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  topics: string[];
  license: string | null;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
  isPrivate?: boolean;
}

export interface TechStackItem {
  category: "frontend" | "backend" | "database" | "cache" | "queue" | "auth" | "devops" | "testing" | "tooling";
  name: string;
  version?: string;
  detectedFrom: string;
  purpose: string;
}

export interface ArchitectureComponent {
  name: string;
  role: string;
  tech: string;
  paths: string[];
}

export interface ArchitectureInsight {
  textualOverview: string;
  components: ArchitectureComponent[];
  dataFlow: string[];
  diagramMermaid: string;
  entryPoints: { name: string; path: string; description: string }[];
}

export interface EnvVariableSpec {
  name: string;
  defaultValue?: string;
  description: string;
  required: boolean;
}

export interface SetupGuide {
  packageManager: "pnpm" | "npm" | "yarn" | "bun" | "poetry" | "pip" | "cargo" | "go" | "maven" | "gradle" | "unknown";
  runtimeVersion?: string;
  envVars: EnvVariableSpec[];
  installCommands: string[];
  devCommands: string[];
  testCommands: string[];
  buildCommands: string[];
  deploymentTargets: { target: string; notes: string }[];
  missingFilesWarnings: string[];
}

export interface ContributorMetric {
  login: string;
  avatarUrl: string;
  contributions: number;
}

export interface HeatmapItem {
  date: string;
  count: number;
}

export interface GitVelocity {
  totalCommitsSampled: number;
  commitsPerWeek90d: number;
  velocityRating: "breakneck" | "steady" | "sporadic" | "stale" | "zombie";
  firstCommitDate: string;
  lastCommitDate: string;
  topContributors: ContributorMetric[];
  branchesCount: number;
  releasesCount: number;
  activityHeatmap: HeatmapItem[];
  recentMilestones: string[];
}

export interface FunctionalCategory {
  category: string;
  features: string[];
}

export interface NonFunctionalSpecs {
  authStrategy: string;
  securityPractices: string[];
  caching: string;
  rateLimiting: string;
  testingMaturity: "none" | "minimal" | "moderate" | "robust";
  observability: string;
}

export interface BestPracticeIssue {
  issue: string;
  severity: "critical" | "warning" | "info";
  fix: string;
}

export interface SecretWarning {
  file: string;
  line: number;
  type: string;
  maskedSnippet: string; // NEVER raw secret, e.g. "sk_live_****"
  remediation: string;
}

export interface TechSin {
  sin: string;
  explanation: string;
  howToRedeem: string;
}

export interface RoastAnalysis {
  scoreOutOf100: number;
  verdictTitle: string;
  oneLinerRoast: string;
  savageRoasts: string[];
  techSins: TechSin[];
  couldHaveBeenAScript: boolean;
  dependencyWeightVerdict: string;
  constructiveSummary: string;
}

export interface RepoAnalysis {
  id?: string;
  metadata: RepoMetadata;
  techStack: TechStackItem[];
  architecture: ArchitectureInsight;
  setupGuide: SetupGuide;
  gitVelocity: GitVelocity;
  functional: FunctionalCategory[];
  nonFunctional: NonFunctionalSpecs;
  missingPractices: BestPracticeIssue[];
  secretsWarnings: SecretWarning[];
  roast: RoastAnalysis;
  isMonorepo: boolean;
  monorepoWorkspaces: string[];
  markdown: string;
  generatedAt: string;
  mode: "professional" | "roast";
}

export interface ProgressEventPayload {
  step:
    | "parsing_url"
    | "fetching_metadata"
    | "scanning_tree"
    | "reading_critical_files"
    | "map_reduce_monorepo"
    | "synthesizing_architecture"
    | "running_velocity"
    | "scanning_secrets"
    | "cooking_roast"
    | "generating_markdown"
    | "complete"
    | "error";
  progress: number; // 0 - 100
  title: string;
  detail: string;
  timestamp: number;
}
