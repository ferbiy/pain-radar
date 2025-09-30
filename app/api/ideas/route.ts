import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ProductIdea } from "@/types";

/**
 * GET /api/ideas - Fetch all product ideas from database
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    let query = supabaseAdmin
      .from("ideas")
      .select("*")
      .order("score", { ascending: false })
      .limit(limit);

    // Filter by category if provided
    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[API:Ideas] Error fetching ideas:", error);

      return NextResponse.json(
        { error: "Failed to fetch ideas" },
        { status: 500 }
      );
    }

    // Map database schema to ProductIdea type
    const ideas: ProductIdea[] = (data || []).map((idea) => ({
      id: idea.id.toString(),
      name: idea.title,
      pitch: idea.pitch,
      painPoint: idea.pain_point || "",
      targetAudience: idea.target_audience || "",
      category: idea.category || "Other",
      sources: (idea.sources as unknown as string[]) || [],
      score: idea.score || 0,
      scoreBreakdown:
        idea.score_breakdown as unknown as ProductIdea["scoreBreakdown"],
      generatedAt: idea.created_at,
      isNew: idea.is_new || false,
      confidence: idea.confidence || 0,
    }));

    return NextResponse.json({
      success: true,
      ideas,
      count: ideas.length,
    });
  } catch (error) {
    console.error("[API:Ideas] Unexpected error:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
