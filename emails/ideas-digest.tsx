import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface Idea {
  id: string;
  name: string;
  pitch: string;
  score: number;
  category: string;
}

interface IdeasDigestEmailProps {
  ideas: Idea[];
  unsubscribeUrl: string;
  appUrl: string;
}

// Helper function to truncate text
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength).trim() + "...";
};

export default function IdeasDigestEmail({
  ideas,
  unsubscribeUrl,
  appUrl,
}: IdeasDigestEmailProps) {
  const ideaCount = ideas.length;
  const previewText =
    ideaCount === 1
      ? "1 new product idea discovered"
      : `${ideaCount} new product ideas discovered`;

  return (
    <Html>
      <Head />
      <Preview>{previewText} from Reddit discussions</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎯 Pain Radar - New Ideas</Heading>
          <Text style={text}>
            We discovered {ideaCount} new product{" "}
            {ideaCount === 1 ? "idea" : "ideas"} from Reddit discussions. Here{" "}
            {ideaCount === 1 ? "is" : "are"} the top{" "}
            {ideaCount === 1 ? "one" : "picks"} for you:
          </Text>

          {ideas.map((idea, index) => (
            <Section key={idea.id} style={ideaCard}>
              <div style={ideaHeader}>
                <Heading as="h2" style={ideaTitle}>
                  {index + 1}. {idea.name}
                </Heading>
                <div style={scoreBadge}>⭐ {idea.score}</div>
              </div>
              <Text style={ideaPitch}>{truncateText(idea.pitch, 120)}</Text>
              <Text style={categoryText}>
                Category: <strong>{idea.category}</strong>
              </Text>
              <Button href={`${appUrl}/dashboard/ideas`} style={ctaButton}>
                View Full Idea in App →
              </Button>
            </Section>
          ))}

          <Section style={viewAllSection}>
            <Text style={viewAllText}>Want to see all ideas and details?</Text>
            <Button href={`${appUrl}/dashboard/ideas`} style={viewAllButton}>
              View All Ideas
            </Button>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this because you subscribed to Pain Radar
              email digests.
            </Text>
            <Text style={footerText}>
              <Link href={unsubscribeUrl} style={link}>
                Unsubscribe
              </Link>{" "}
              from these emails
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0 20px",
  padding: "0 40px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 40px",
  marginBottom: "24px",
};

const ideaCard = {
  margin: "24px 40px",
  padding: "24px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

const ideaHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "12px",
};

const ideaTitle = {
  color: "#111",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0",
  flex: "1",
};

const scoreBadge = {
  backgroundColor: "#fef3c7",
  color: "#92400e",
  fontSize: "14px",
  fontWeight: "600",
  padding: "4px 12px",
  borderRadius: "12px",
  marginLeft: "12px",
  whiteSpace: "nowrap" as const,
};

const ideaPitch = {
  color: "#555",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "12px 0",
};

const categoryText = {
  color: "#666",
  fontSize: "13px",
  margin: "12px 0",
};

const ctaButton = {
  backgroundColor: "#556cd6",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  marginTop: "16px",
};

const viewAllSection = {
  margin: "32px 40px",
  padding: "24px",
  backgroundColor: "#eff6ff",
  borderRadius: "8px",
  textAlign: "center" as const,
};

const viewAllText = {
  color: "#333",
  fontSize: "15px",
  margin: "0 0 16px",
};

const viewAllButton = {
  backgroundColor: "#1e40af",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const footer = {
  padding: "0 40px",
  marginTop: "32px",
  borderTop: "1px solid #e5e7eb",
  paddingTop: "24px",
};

const footerText = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "8px 0",
};

const link = {
  color: "#556cd6",
  textDecoration: "underline",
};
