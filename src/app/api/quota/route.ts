import { NextRequest, NextResponse } from "next/server";
import { checkQuota } from "@/lib/quota/quotaManager";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const authHeader = req.headers.get("authorization");
  const isPro = authHeader?.includes("pro_tier") || false;

  const status = checkQuota(ip, isPro);
  return NextResponse.json(status);
}
