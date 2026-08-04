import { createPreferencesEmbedding } from "@/services/aiService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const preferencelist = await request.json();
  if (preferencelist !== null) {
    return NextResponse.json(await createPreferencesEmbedding(preferencelist));
  }
}
