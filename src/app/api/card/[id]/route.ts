import { NextRequest, NextResponse } from "next/server";
import { getRepoCard } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const card = getRepoCard(id);

    if (!card) {
      return NextResponse.json({ error: "Repo Card not found" }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve Repo Card";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
