import {
  Body,
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
  name: string;
  pitch: string;
  score: number;
  category: string;
}

interface IdeasDigestEmailProps {
  ideas: Idea[];
  unsubscribeUrl: string;
}

export default function IdeasDigestEmail({
  ideas,
  unsubscribeUrl,
}: IdeasDigestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your weekly product ideas from Pain Radar</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🎯 Pain Radar Weekly Digest</Heading>
          <Text style={text}>
            Here are the top product ideas we discovered from Reddit this week:
          </Text>

          {ideas.map((idea, index) => (
            <Section key={index} style={ideaCard}>
              <Heading as="h2" style={ideaTitle}>
                {index + 1}. {idea.name}
              </Heading>
              <Text style={ideaPitch}>{idea.pitch}</Text>
              <Text style={ideaMeta}>
                Score: <strong>{idea.score}</strong> | Category:{" "}
                <strong>{idea.category}</strong>
              </Text>
            </Section>
          ))}

          <Section style={footer}>
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
  margin: "40px 0",
  padding: "0 40px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 40px",
};

const ideaCard = {
  margin: "24px 40px",
  padding: "20px",
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
};

const ideaTitle = {
  color: "#111",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const ideaPitch = {
  color: "#555",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 12px",
};

const ideaMeta = {
  color: "#666",
  fontSize: "12px",
  margin: "0",
};

const footer = {
  padding: "0 40px",
  marginTop: "32px",
};

const footerText = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
};

const link = {
  color: "#556cd6",
  textDecoration: "underline",
};
