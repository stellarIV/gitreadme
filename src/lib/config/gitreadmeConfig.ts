export interface GitreadmeConfig {
  version?: number;
  mode?: "professional" | "roast";
  outputPath?: string;
  autoPush?: boolean;
  focusAreas?: string[];
  ignorePaths?: string[];
  customRules?: string[];
}

/**
 * Lightweight, zero-dependency YAML/JSON parser for .gitreadme.yml
 */
export function parseGitreadmeConfig(content: string): GitreadmeConfig {
  if (!content || !content.trim()) return {};

  const config: GitreadmeConfig = {
    focusAreas: [],
    ignorePaths: [],
    customRules: [],
  };

  const lines = content.split("\n");
  let currentArrayKey: "focusAreas" | "ignorePaths" | "customRules" | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    // Detect array elements
    if (line.startsWith("- ") && currentArrayKey) {
      const item = line.slice(2).trim().replace(/^["']|["']$/g, "");
      if (item) {
        config[currentArrayKey]?.push(item);
      }
      continue;
    }

    // Key-value pairs
    if (line.includes(":")) {
      currentArrayKey = null;
      const colonIdx = line.indexOf(":");
      const key = line.slice(0, colonIdx).trim().toLowerCase();
      const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, "");

      if (key === "mode") {
        if (val === "roast" || val === "professional") {
          config.mode = val;
        }
      } else if (key === "output_path" || key === "outputpath") {
        config.outputPath = val;
      } else if (key === "auto_push" || key === "autopush") {
        config.autoPush = val.toLowerCase() === "true" || val === "1";
      } else if (key === "focus_areas" || key === "focusareas") {
        currentArrayKey = "focusAreas";
      } else if (key === "ignore_paths" || key === "ignorepaths") {
        currentArrayKey = "ignorePaths";
      } else if (key === "custom_rules" || key === "customrules" || key === "rules") {
        currentArrayKey = "customRules";
      }
    }
  }

  return config;
}
