import { Resend } from "resend";
import { render } from "@react-email/render";
import IdeasDigestEmail from "@/emails/ideas-digest";

const resend = new Resend(process.env.RESEND_API_KEY);

interface Idea {
  id: string;
  name: string;
  pitch: string;
  score: number;
  category: string;
}

interface SendDigestParams {
  to: string;
  ideas: Idea[];
  unsubscribeToken: string;
}

export async function sendIdeasDigest({
  to,
  ideas,
  unsubscribeToken,
}: SendDigestParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const unsubscribeUrl = `${appUrl}/api/subscriptions?token=${unsubscribeToken}`;

  const html = await render(
    IdeasDigestEmail({
      ideas,
      unsubscribeUrl,
      appUrl,
    })
  );

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Pain Radar <ideas@painradar.com>",
    to,
    subject: `🎯 ${ideas.length} New Product Ideas from Reddit`,
    html,
  });

  if (error) {
    console.error("[Email] Failed to send:", error);
    throw error;
  }

  return data;
}
