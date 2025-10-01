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

    // Get all subscriptions (no need to filter by is_active since we delete on unsubscribe)
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from("subscriptions")
      .select("*");

    if (subsError) throw subsError;

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active subscriptions",
        emailsSent: 0,
      });
    }

    console.log(`[Email Cron] Sending to ${subscriptions.length} subscribers`);

    // Track which idea IDs were actually sent to at least one subscriber
    const sentIdeaIds = new Set<number>();

    // Send emails
    const emailResults = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          // Filter ideas by subscriber topics and limit to max 3
          const filteredIdeas = ideas
            .filter((idea) => sub.topics.includes(idea.category))
            .slice(0, 3);

          if (filteredIdeas.length === 0) {
            console.log(
              `[Email Cron] No matching topics for ${sub.email}, skipping`
            );

            return null;
          }

          console.log(
            `[Email Cron] Sending ${filteredIdeas.length} ideas to ${sub.email}`
          );

          // Send email
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

          // Only track ideas as sent AFTER successful email send
          filteredIdeas.forEach((idea) => sentIdeaIds.add(idea.id));

          // Update last_email_sent
          await supabaseAdmin
            .from("subscriptions")
            .update({ last_email_sent: new Date().toISOString() })
            .eq("id", sub.id);

          console.log(
            `[Email Cron] ✅ Email sent successfully to ${sub.email}`
          );

          return sub.email;
        } catch (error) {
          console.error(
            `[Email Cron] ❌ Failed to send to ${sub.email}:`,
            error
          );
          throw error;
        }
      })
    );

    // Only mark ideas as sent if they were actually included in at least one email
    if (sentIdeaIds.size > 0) {
      const sentIdeaIdsArray = Array.from(sentIdeaIds);

      console.log(
        `[Email Cron] Marking ${sentIdeaIdsArray.length} ideas as sent (IDs: ${sentIdeaIdsArray.join(", ")})`
      );

      await supabaseAdmin
        .from("ideas")
        .update({ is_new: false })
        .in("id", sentIdeaIdsArray);
    } else {
      console.log(
        "[Email Cron] No ideas were sent (topic mismatch), keeping all ideas as new"
      );
    }

    const emailsSent = emailResults.filter(
      (r) => r.status === "fulfilled" && r.value !== null
    ).length;

    console.log(`[Email Cron] Successfully sent ${emailsSent} emails`);

    return NextResponse.json({
      success: true,
      emailsSent,
      ideasAvailable: ideas.length,
      ideasActuallySent: sentIdeaIds.size,
      markedAsNotNew: sentIdeaIds.size > 0,
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
