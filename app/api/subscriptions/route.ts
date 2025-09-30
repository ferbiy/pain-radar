import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { nanoid } from "nanoid";

/**
 * Subscribe to email notifications
 * POST /api/subscriptions
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, topics } = await request.json();

    if (!email || !Array.isArray(topics)) {
      return NextResponse.json(
        { error: "Email and topics are required" },
        { status: 400 }
      );
    }

    // Create subscription with unsubscribe token
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        email,
        topics,
        unsubscribe_token: nanoid(32),
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Duplicate email
        return NextResponse.json(
          { error: "Email already subscribed" },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      subscription: { id: data.id, email: data.email },
    });
  } catch (error) {
    console.error("[Subscriptions] Error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

/**
 * Unsubscribe from email notifications
 * DELETE /api/subscriptions?token=xxx
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Unsubscribe token required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({ is_active: false })
      .eq("unsubscribe_token", token);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Subscriptions] Unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}
