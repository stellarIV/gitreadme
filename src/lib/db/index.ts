import fs from "fs";
import path from "path";
import { RepoAnalysis } from "../analyzer/types";

export interface SavedRepoCard {
  id: string;
  repoFullName: string;
  commitSha: string;
  mode: "professional" | "roast";
  analysis: RepoAnalysis;
  createdAt: string;
  views: number;
}

interface DatabaseSchema {
  cache: Record<string, { analysis: RepoAnalysis; cachedAt: string }>;
  cards: Record<string, SavedRepoCard>;
}

const DB_DIR = path.join(process.cwd(), ".gitreadme_data");
const DB_FILE = path.join(DB_DIR, "store.json");

function ensureDbFile(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = { cache: {}, cards: {} };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(content) as DatabaseSchema;
  } catch (err) {
    console.warn("DB file access warning, fallback to memory:", err);
    return { cache: {}, cards: {} };
  }
}

function saveDb(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to persist database file:", err);
  }
}

// Generate unique 8-character ID for public Repo Cards
export function generateCardId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Caching by strict key: `${owner}/${repo}:${commitSha}:${mode}`
export function getCachedAnalysis(
  owner: string,
  repo: string,
  commitSha: string,
  mode: "professional" | "roast"
): RepoAnalysis | null {
  const key = `${owner.toLowerCase()}/${repo.toLowerCase()}:${commitSha}:${mode}`;
  const db = ensureDbFile();
  const entry = db.cache[key];
  if (entry) {
    return entry.analysis;
  }
  return null;
}

export function setCachedAnalysis(
  owner: string,
  repo: string,
  commitSha: string,
  mode: "professional" | "roast",
  analysis: RepoAnalysis
): void {
  const key = `${owner.toLowerCase()}/${repo.toLowerCase()}:${commitSha}:${mode}`;
  const db = ensureDbFile();
  db.cache[key] = {
    analysis,
    cachedAt: new Date().toISOString(),
  };
  saveDb(db);
}

// Repo Cards management
export function saveRepoCard(analysis: RepoAnalysis): SavedRepoCard {
  const db = ensureDbFile();
  const id = generateCardId();
  const card: SavedRepoCard = {
    id,
    repoFullName: analysis.metadata.fullName,
    commitSha: analysis.metadata.commitSha,
    mode: analysis.mode,
    analysis,
    createdAt: new Date().toISOString(),
    views: 1,
  };
  db.cards[id] = card;
  saveDb(db);
  return card;
}

export function getRepoCard(id: string): SavedRepoCard | null {
  const db = ensureDbFile();
  const card = db.cards[id];
  if (card) {
    // Increment view count
    card.views = (card.views || 0) + 1;
    saveDb(db);
    return card;
  }
  return null;
}
