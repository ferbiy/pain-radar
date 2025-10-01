import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendIdeasDigest } from "@/lib/email/resend";

/**
 * Cron endpoint to send email digests
 * POST /api/cron/email
 *
 * Security: Requires CRON_SECRET header
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify cron secret
    const secret = request.headers.get("x-cron-secret");

    if (!process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Email Cron] Starting email dispatch job");

    // Get new ideas (limit to top 3 by score)
    const { data: ideas, error: ideasError } = await supabaseAdmin
      .from("ideas")
      .select("*")
      .eq("is_new", true)
      .order("score", { ascending: false })
      .limit(3);

    if (ideasError) throw ideasError;

    if (!ideas || ideas.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No new ideas to send",
        emailsSent: 0,
      });
    }

    console.log(`[Email Cron] Found ${ideas.length} new ideas`);

    // Get active subscriptions
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("is_active", true);

    if (subsError) throw subsError;

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active subscriptions",
        emailsSent: 0,
      });
    }

    console.log(`[Email Cron] Sending to ${subscriptions.length} subscribers`);

    // Send emails
    const emailResults = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        // Filter ideas by subscriber topics and limit to max 3
        const filteredIdeas = ideas
          .filter((idea) => sub.topics.includes(idea.category))
          .slice(0, 3);

        if (filteredIdeas.length === 0) return null;

        await sendIdeasDigest({
          to: sub.email,
          ideas: filteredIdeas.map((idea) => ({
            id: idea.id.toString(),
            name: idea.title,
            pitch: idea.pitch,
            score: idea.score,
            category: idea.category,
          })),
          unsubscribeToken: sub.unsubscribe_token,
        });

        // Update last_email_sent
        await supabaseAdmin
          .from("subscriptions")
          .update({ last_email_sent: new Date().toISOString() })
          .eq("id", sub.id);

        return sub.email;
      })
    );

    // Mark ideas as sent
    await supabaseAdmin
      .from("ideas")
      .update({ is_new: false })
      .eq("is_new", true);

    const emailsSent = emailResults.filter(
      (r) => r.status === "fulfilled" && r.value !== null
    ).length;

    console.log(`[Email Cron] Successfully sent ${emailsSent} emails`);

    return NextResponse.json({
      success: true,
      emailsSent,
      ideasIncluded: ideas.length,
    });
  } catch (error) {
    console.error("[Email Cron] Error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
