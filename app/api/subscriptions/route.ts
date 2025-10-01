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
        // user_id omitted for anonymous subscriptions (nullable in schema)
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
 * Unsubscribe from email notifications (via email link)
 * GET /api/subscriptions?token=xxx
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invalid Unsubscribe Link</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f6f9fc; margin: 0; padding: 40px 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              h1 { color: #dc2626; margin: 0 0 16px; }
              p { color: #555; line-height: 1.6; margin: 0 0 24px; }
              a { color: #556cd6; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>❌ Invalid Unsubscribe Link</h1>
              <p>This unsubscribe link is invalid or has expired.</p>
              <p>If you're still receiving emails and want to unsubscribe, please contact us or use the unsubscribe link in the latest email.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}">← Back to Pain Radar</a></p>
            </div>
          </body>
        </html>
        `,
        { status: 400, headers: { "Content-Type": "text/html" } }
      );
    }

    // Unsubscribe user
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({ is_active: false })
      .eq("unsubscribe_token", token);

    if (error) throw error;

    // Return success page
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Successfully Unsubscribed</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f6f9fc; margin: 0; padding: 40px 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            h1 { color: #16a34a; margin: 0 0 16px; }
            p { color: #555; line-height: 1.6; margin: 0 0 16px; }
            .button { display: inline-block; background: #556cd6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 8px; }
            .button:hover { background: #4c5fd6; }
            a { color: #556cd6; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Successfully Unsubscribed</h1>
            <p>You've been unsubscribed from Pain Radar email digests.</p>
            <p>You will no longer receive product idea notifications from us.</p>
            <p>Changed your mind? You can always resubscribe from the <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscriptions">subscription settings</a>.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}" class="button">← Back to Pain Radar</a></p>
          </div>
        </body>
      </html>
      `,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("[Subscriptions] Unsubscribe error:", error);

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Unsubscribe Failed</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f6f9fc; margin: 0; padding: 40px 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            h1 { color: #dc2626; margin: 0 0 16px; }
            p { color: #555; line-height: 1.6; margin: 0 0 24px; }
            a { color: #556cd6; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Unsubscribe Failed</h1>
            <p>We encountered an error while processing your unsubscribe request.</p>
            <p>Please try again later or contact support if the problem persists.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}">← Back to Pain Radar</a></p>
          </div>
        </body>
      </html>
      `,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}

/**
 * Unsubscribe from email notifications (API endpoint)
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
