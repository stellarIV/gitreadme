import { NextRequest, NextResponse } from "next/server";
import { saveRepoCard } from "@/lib/db";
import { RepoAnalysis } from "@/lib/analyzer/types";

export async function POST(req: NextRequest) {
  try {
    const analysis: RepoAnalysis = await req.json();
    if (!analysis || !analysis.metadata) {
      return NextResponse.json({ error: "Invalid analysis payload" }, { status: 400 });
    }

    const savedCard = saveRepoCard(analysis);
    return NextResponse.json({
      success: true,
      cardId: savedCard.id,
      cardUrl: `/card/${savedCard.id}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save Repo Card";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
