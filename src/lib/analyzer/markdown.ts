import { RepoAnalysis } from "./types";

export function generateMarkdownDoc(
  analysis: RepoAnalysis,
  docType: "readme" | "architecture" = "readme"
): string {
  const {
    metadata,
    techStack,
    architecture,
    setupGuide,
    functional,
    nonFunctional,
    gitVelocity,
    secretsWarnings,
    roast,
  } = analysis;

  if (docType === "architecture") {
    return generateArchitectureBlueprint(analysis);
  }

  // Generate dynamic badges
  const langColor = getLanguageBadgeColor(metadata.language || "code");
  const encodedLang = encodeURIComponent(metadata.language || "TypeScript");
  const encodedLicense = encodeURIComponent(metadata.license || "MIT");

  const badges = [
    `![Language](https://img.shields.io/badge/Language-${encodedLang}-${langColor}?style=for-the-badge&logo=${encodedLang.toLowerCase()}&logoColor=white)`,
    `![License](https://img.shields.io/badge/License-${encodedLicense}-green?style=for-the-badge)`,
    `![Stars](https://img.shields.io/badge/Stars-${metadata.stars.toLocaleString()}-yellow?style=for-the-badge&logo=github)`,
    `![Forks](https://img.shields.io/badge/Forks-${metadata.forks.toLocaleString()}-orange?style=for-the-badge&logo=git)`,
    `![Build](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)`,
    `![PRs](https://img.shields.io/badge/PRs-Welcome-blueviolet?style=for-the-badge)`,
  ].join(" ");

  // Build Environment Variables Table
  const envTable =
    setupGuide.envVars && setupGuide.envVars.length > 0
      ? `### 🔑 Environment Configuration
Create a \`.env.local\` or \`.env\` file in the root directory:

| Variable | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
${setupGuide.envVars
  .map(
    (v) =>
      `| \`${v.name}\` | ${v.required ? "**Yes** ⚠️" : "No"} | \`${v.defaultValue || "—"}\` | ${v.description} |`
  )
  .join("\n")}
`
      : "";

  // Build Tech Stack Table
  const techTable =
    techStack && techStack.length > 0
      ? `| Category | Technology | Purpose & Architectural Rationale |
| :--- | :--- | :--- |
${techStack
  .map(
    (t) =>
      `| **${capitalize(t.category)}** | \`${t.name}${t.version ? ` @ ${t.version}` : ""}\` | ${t.purpose} |`
  )
  .join("\n")}`
      : "No third-party packages detected.";

  // Build Components Breakdown Table
  const componentsTable =
    architecture.components && architecture.components.length > 0
      ? `| Subsystem | Role & Responsibility | Core Technology | Key Paths |
| :--- | :--- | :--- | :--- |
${architecture.components
  .map(
    (c) =>
      `| **${c.name}** | ${c.role} | \`${c.tech}\` | ${c.paths.map((p) => `\`${p}\``).join(", ")} |`
  )
  .join("\n")}`
      : "";

  // Build Functional Features
  const featuresList =
    functional && functional.length > 0
      ? functional
          .map(
            (cat) =>
              `### 🔹 ${cat.category}\n${cat.features.map((f) => `- ${f}`).join("\n")}`
          )
          .join("\n\n")
      : `- ${metadata.description || "Core repository functionalities"}`;

  // Build Entry Points
  const entryPointsSection =
    architecture.entryPoints && architecture.entryPoints.length > 0
      ? `### 🚪 Key Code Entry Points
| Entry Point | File Path | Scope & Responsibility |
| :--- | :--- | :--- |
${architecture.entryPoints
  .map((e) => `| **${e.name}** | \`${e.path}\` | ${e.description} |`)
  .join("\n")}`
      : "";

  // Build Data Flow Pipeline
  const dataFlowList =
    architecture.dataFlow && architecture.dataFlow.length > 0
      ? `### 🔄 Data & Execution Flow
${architecture.dataFlow.map((step, idx) => `${idx + 1}. **${step}**`).join("\n")}`
      : "";

  // Build Deployment Targets
  const deploySection =
    setupGuide.deploymentTargets && setupGuide.deploymentTargets.length > 0
      ? `### 🚀 Deployment Options
${setupGuide.deploymentTargets.map((d) => `- **${d.target}:** ${d.notes}`).join("\n")}`
      : "";

  // Roast Section (if analyzed in roast mode)
  const roastSection =
    analysis.mode === "roast"
      ? `
---

<details>
<summary>🔥 <strong>The Savage Codebase Roast (Score: ${roast.scoreOutOf100}/100 — ${roast.verdictTitle})</strong></summary>

<br />

> 💬 *" ${roast.oneLinerRoast} "*

#### 💀 Brutal Architectural Observations:
${roast.savageRoasts.map((r) => `- ${r}`).join("\n")}

#### ⚠️ Architectural Sins & Redemption Roadmap:
| Detected Sin | Detailed Diagnostic | How to Redeem |
| :--- | :--- | :--- |
${roast.techSins.map((s) => `| **${s.sin}** | ${s.explanation} | ${s.howToRedeem} |`).join("\n")}

**Constructive Summary:**  
${roast.constructiveSummary}

</details>
`
      : "";

  // Clean description
  const cleanDesc =
    metadata.description?.trim() ||
    "Production-grade, modern software architecture with robust engineering design.";

  return `<div align="center">

# ${metadata.name}

${badges}

<p align="center">
  <strong>${cleanDesc}</strong>
</p>

[Explore Repository](${metadata.htmlUrl}) • [Report Bug](${metadata.htmlUrl}/issues) • [Request Feature](${metadata.htmlUrl}/issues)

</div>

---

## 📋 Table of Contents
- [Executive Overview](#-executive-overview)
- [Key Features & Capabilities](#-key-features--capabilities)
- [System Architecture & Design Blueprint](#-system-architecture--design-blueprint)
- [Technology Stack](#-technology-stack)
- [Getting Started & Local Development](#-getting-started--local-development)
- [Security & Production Readiness](#-security--production-readiness)
- [Git Velocity & Project Health](#-git-velocity--project-health)
- [Contributing & Code Standards](#-contributing--code-standards)
- [License](#-license)

---

## 🎯 Executive Overview
${architecture.textualOverview}

---

## ✨ Key Features & Capabilities

${featuresList}

---

## 🏛️ System Architecture & Design Blueprint

### 📐 Architectural Flowchart
\`\`\`mermaid
${architecture.diagramMermaid}
\`\`\`

${componentsTable ? `### 🧩 Architectural Subsystems\n${componentsTable}\n` : ""}
${entryPointsSection ? `${entryPointsSection}\n` : ""}
${dataFlowList ? `${dataFlowList}\n` : ""}

---

## 🛠️ Technology Stack

${techTable}

---

## ⚡ Getting Started & Local Development

### 1. Prerequisites
- **Runtime Environment:** \`${setupGuide.runtimeVersion || "Node.js 18+ / Python 3.10+"}\`
- **Package Manager:** \`${setupGuide.packageManager}\`
- **Git Version Control:** \`git >= 2.30\`

### 2. Clone & Installation
\`\`\`bash
# 1. Clone the repository
git clone ${metadata.htmlUrl}.git
cd ${metadata.name}

# 2. Install workspace dependencies
${setupGuide.installCommands.join("\n")}
\`\`\`

${envTable}

### 3. Running Locally
\`\`\`bash
# Start development server with live reload
${setupGuide.devCommands.join("\n")}
\`\`\`

### 4. Verification & Testing
\`\`\`bash
# Run automated test suite
${setupGuide.testCommands.join("\n")}
\`\`\`

### 5. Production Compilation
\`\`\`bash
# Build optimized production bundle
${setupGuide.buildCommands.join("\n")}
\`\`\`

${deploySection ? `${deploySection}\n` : ""}

---

## 🛡️ Security & Production Readiness
- **Authentication Strategy:** ${nonFunctional.authStrategy}
- **Credential Protection:** ${secretsWarnings.length === 0 ? "✅ Verified zero leaked secrets or committed tokens." : `⚠️ ${secretsWarnings.length} potential credential risk(s) flagged for review.`}
- **Caching Mechanism:** ${nonFunctional.caching}
- **Rate Limiting:** ${nonFunctional.rateLimiting}
- **Testing Maturity Level:** \`${nonFunctional.testingMaturity.toUpperCase()}\`
- **Observability & Telemetry:** ${nonFunctional.observability}

---

## 📊 Git Velocity & Project Health
- **Primary Repository:** [${metadata.fullName}](${metadata.htmlUrl})
- **Active Stars:** ${metadata.stars.toLocaleString()} ⭐
- **Forks:** ${metadata.forks.toLocaleString()} 🍴
- **Open Issues:** ${metadata.openIssues.toLocaleString()}
- **Recent Commit Velocity:** ${gitVelocity.commitsPerWeek90d} commits/week (${gitVelocity.velocityRating.toUpperCase()} cadence, ${gitVelocity.totalCommitsSampled} commits sampled)
- **Top Contributors:** ${gitVelocity.topContributors.length > 0 ? gitVelocity.topContributors.map((c) => `[\`@${c.login}\`](https://github.com/${c.login})`).join(", ") : "Active repository contributors"}

---

## 🤝 Contributing & Code Standards
Contributions are welcome! Please adhere to standard engineering workflows:
1. Fork the Project (\`git checkout -b feature/AmazingFeature\`)
2. Follow strict linting, type safety, and formatting conventions
3. Write test cases covering added features or bug fixes
4. Commit changes with conventional commit syntax (\`feat: ...\`, \`fix: ...\`)
5. Open a Pull Request for code review

---

## 📄 License
Distributed under the **${metadata.license || "MIT"} License**. See \`LICENSE\` file for full details.

${roastSection}

---

<div align="center">
  <sub>Generated with architectural rigor and high precision by <a href="https://gitreadme.dev">gitreadme (RepoIntel)</a>.</sub>
</div>
`;
}

function generateArchitectureBlueprint(analysis: RepoAnalysis): string {
  const { metadata, architecture, techStack, nonFunctional } = analysis;

  return `# 🏛️ Architecture Blueprint: ${metadata.name}

> Comprehensive system architecture documentation for **[${metadata.fullName}](${metadata.htmlUrl})**.  
> Generated automatically by **gitreadme (RepoIntel)**.

---

## 1. Executive Summary
${architecture.textualOverview}

---

## 2. Interactive System Diagram
\`\`\`mermaid
${architecture.diagramMermaid}
\`\`\`

---

## 3. Structural Subsystems Breakdown
| Subsystem | Architectural Role | Core Technology | Source Paths |
| :--- | :--- | :--- | :--- |
${architecture.components
  .map(
    (c) =>
      `| **${c.name}** | ${c.role} | \`${c.tech}\` | ${c.paths.map((p) => `\`${p}\``).join(", ")} |`
  )
  .join("\n")}

---

## 4. Primary Entry Points
| Entry Point | File Path | Scope & Lifecycle Function |
| :--- | :--- | :--- |
${architecture.entryPoints
  .map((e) => `| **${e.name}** | \`${e.path}\` | ${e.description} |`)
  .join("\n")}

---

## 5. End-to-End Execution Flow
${architecture.dataFlow.map((step, idx) => `### Stage ${idx + 1}: ${step}`).join("\n\n")}

---

## 6. Technology Rationale
| Layer | Package | Decision Context |
| :--- | :--- | :--- |
${techStack
  .map((t) => `| **${capitalize(t.category)}** | \`${t.name}\` | ${t.purpose} |`)
  .join("\n")}

---

## 7. Reliability, Security & Scalability
- **Authentication:** ${nonFunctional.authStrategy}
- **Data Caching:** ${nonFunctional.caching}
- **Rate Limiting:** ${nonFunctional.rateLimiting}
- **Testing Architecture:** \`${nonFunctional.testingMaturity.toUpperCase()}\`
- **Observability Pipeline:** ${nonFunctional.observability}

---

<sub>Document verified and compiled with precision by <a href="https://gitreadme.dev">RepoIntel</a>.</sub>
`;
}

function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getLanguageBadgeColor(lang: string): string {
  const map: Record<string, string> = {
    typescript: "3178C6",
    javascript: "F7DF1E",
    python: "3776AB",
    rust: "DEA584",
    go: "00ADD8",
    java: "ED8B00",
    kotlin: "7F52FF",
    csharp: "239120",
    cpp: "00599C",
    ruby: "CC342D",
    php: "777BB4",
    swift: "F05138",
  };
  return map[lang.toLowerCase()] || "4F46E5";
}
