import fs from "fs";
import path from "path";

export interface QuotaStatus {
  tier: "free" | "pro";
  limit: number;
  used: number;
  remaining: number;
  allowed: boolean;
  reason?: string;
  resetAt: string;
}

interface QuotaRecord {
  tier: "free" | "pro";
  count: number;
  dateStr: string; // YYYY-MM-DD
}

const QUOTA_DIR = path.join(process.cwd(), ".gitreadme_data");
const QUOTA_FILE = path.join(QUOTA_DIR, "quota.json");

const FREE_DAILY_LIMIT = 5;
const PRO_DAILY_LIMIT = 100;

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function getEndOfDayIso(): string {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d.toISOString();
}

function loadQuotas(): Record<string, QuotaRecord> {
  try {
    if (!fs.existsSync(QUOTA_DIR)) {
      fs.mkdirSync(QUOTA_DIR, { recursive: true });
    }
    if (!fs.existsSync(QUOTA_FILE)) {
      return {};
    }
    const raw = fs.readFileSync(QUOTA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveQuotas(data: Record<string, QuotaRecord>): void {
  try {
    if (!fs.existsSync(QUOTA_DIR)) {
      fs.mkdirSync(QUOTA_DIR, { recursive: true });
    }
    fs.writeFileSync(QUOTA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to persist quotas:", err);
  }
}

export function checkQuota(clientId: string, isPro: boolean = false): QuotaStatus {
  const today = getTodayString();
  const quotas = loadQuotas();
  const record = quotas[clientId];

  const tier = isPro ? "pro" : "free";
  const limit = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;

  let used = 0;
  if (record && record.dateStr === today) {
    used = record.count;
  }

  const remaining = Math.max(0, limit - used);
  const allowed = remaining > 0;

  return {
    tier,
    limit,
    used,
    remaining,
    allowed,
    resetAt: getEndOfDayIso(),
    reason: allowed ? undefined : `Daily ${tier.toUpperCase()} limit of ${limit} repository analyses reached. Resets at midnight UTC.`,
  };
}

export function consumeQuota(
  clientId: string,
  isPro: boolean = false,
  isPrivate: boolean = false
): { success: boolean; status: QuotaStatus } {
  // Free tier cannot analyze private repos
  if (isPrivate && !isPro) {
    const status = checkQuota(clientId, false);
    return {
      success: false,
      status: {
        ...status,
        allowed: false,
        reason: "Private repository analysis requires gitreadme Pro.",
      },
    };
  }

  const status = checkQuota(clientId, isPro);
  if (!status.allowed) {
    return { success: false, status };
  }

  // Deduct
  const today = getTodayString();
  const quotas = loadQuotas();
  const currentCount = quotas[clientId]?.dateStr === today ? quotas[clientId].count : 0;

  quotas[clientId] = {
    tier: isPro ? "pro" : "free",
    count: currentCount + 1,
    dateStr: today,
  };
  saveQuotas(quotas);

  return {
    success: true,
    status: {
      ...status,
      used: currentCount + 1,
      remaining: Math.max(0, status.limit - (currentCount + 1)),
    },
  };
}
