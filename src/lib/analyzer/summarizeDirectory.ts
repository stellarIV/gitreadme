import { FilteredFileItem } from "../github/tree";

export interface DirectorySummary {
  directory: string;
  fileCount: number;
  criticalFiles: string[];
  inferredRole: string;
  technologies: string[];
}

export function summarizeDirectoryCluster(
  files: FilteredFileItem[],
  filesMap: Map<string, string>
): DirectorySummary[] {
  const dirBuckets = new Map<string, FilteredFileItem[]>();

  for (const file of files) {
    const parts = file.path.split("/");
    let group = "root";
    if (parts.length > 1) {
      if (
        parts[0] === "packages" ||
        parts[0] === "apps" ||
        parts[0] === "services" ||
        parts[0] === "modules"
      ) {
        group = parts.length > 2 ? `${parts[0]}/${parts[1]}` : parts[0];
      } else {
        group = parts[0];
      }
    }

    if (!dirBuckets.has(group)) {
      dirBuckets.set(group, []);
    }
    dirBuckets.get(group)!.push(file);
  }

  const summaries: DirectorySummary[] = [];

  for (const [dir, dirFiles] of dirBuckets.entries()) {
    const criticalFiles = dirFiles.map((f) => f.path);
    const techSet = new Set<string>();

    let inferredRole = "Supporting utilities and modules";
    const dirLower = dir.toLowerCase();

    if (dir === "root") {
      inferredRole = "Root project configuration, orchestration, and top-level manifests";
    } else if (dirLower.includes("app") || dirLower.includes("web") || dirLower.includes("client") || dirLower.includes("frontend")) {
      inferredRole = "User-facing frontend web client or mobile application";
    } else if (dirLower.includes("api") || dirLower.includes("server") || dirLower.includes("backend")) {
      inferredRole = "Core backend REST/GraphQL API and business logic services";
    } else if (dirLower.includes("worker") || dirLower.includes("queue") || dirLower.includes("jobs")) {
      inferredRole = "Asynchronous task workers and background event processing";
    } else if (dirLower.includes("ui") || dirLower.includes("design-system") || dirLower.includes("components")) {
      inferredRole = "Shared UI component library and design system";
    } else if (dirLower.includes("core") || dirLower.includes("common") || dirLower.includes("shared")) {
      inferredRole = "Shared core utilities, type definitions, and common business models";
    } else if (dirLower.includes("docs")) {
      inferredRole = "Documentation site and project guides";
    }

    // Check technologies from files
    for (const file of dirFiles) {
      const content = filesMap.get(file.path) || "";
      if (file.name === "package.json" && content) {
        try {
          const pkg = JSON.parse(content);
          if (pkg.name) techSet.add(`Package: ${pkg.name}`);
        } catch {
          // ignore
        }
      }
      if (file.extension === "tsx" || file.extension === "jsx") techSet.add("React UI");
      if (file.extension === "ts") techSet.add("TypeScript");
      if (file.extension === "py") techSet.add("Python");
      if (file.extension === "go") techSet.add("Go");
      if (file.extension === "rs") techSet.add("Rust");
      if (file.name.includes("docker")) techSet.add("Docker container");
      if (file.name.includes("prisma")) techSet.add("Prisma schema");
    }

    summaries.push({
      directory: dir,
      fileCount: dirFiles.length,
      criticalFiles: criticalFiles.slice(0, 10),
      inferredRole,
      technologies: Array.from(techSet),
    });
  }

  return summaries;
}
