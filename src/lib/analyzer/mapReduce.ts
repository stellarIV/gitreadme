import { TreeSummary } from "../github/tree";
import { summarizeDirectoryCluster, DirectorySummary } from "./summarizeDirectory";

export interface PreparedAnalysisContext {
  isLargeOrMonorepo: boolean;
  directorySummaries: DirectorySummary[];
  criticalFileSnippets: { path: string; content: string }[];
  fileTreeOutline: string;
  totalFiles: number;
}

export function prepareAnalysisContext(
  treeSummary: TreeSummary,
  filesMap: Map<string, string>,
  charLimitPerFile: number = 3000
): PreparedAnalysisContext {
  const isLargeOrMonorepo = treeSummary.isMonorepo || treeSummary.totalFiles > 80;

  // Hierarchical Directory Summaries (Map phase)
  const directorySummaries = summarizeDirectoryCluster(treeSummary.filteredFiles, filesMap);

  // Critical files with bounded snippets
  const criticalFileSnippets: { path: string; content: string }[] = [];
  for (const file of treeSummary.prioritizedFilesToRead) {
    const raw = filesMap.get(file.path);
    if (raw) {
      const truncated =
        raw.length > charLimitPerFile
          ? raw.slice(0, charLimitPerFile) + `\n\n... [Truncated for brevity - ${raw.length} chars total]`
          : raw;
      criticalFileSnippets.push({
        path: file.path,
        content: truncated,
      });
    }
  }

  return {
    isLargeOrMonorepo,
    directorySummaries,
    criticalFileSnippets,
    fileTreeOutline: treeSummary.treeStructureAscii,
    totalFiles: treeSummary.totalFiles,
  };
}
