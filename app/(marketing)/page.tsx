import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { CTA } from "@/components/marketing/cta";
import { Footer } from "@/components/marketing/footer";
import { ImageDivider } from "@/components/marketing/image-divider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pain Radar - AI-Powered Product Ideas from Reddit",
  description:
    "Discover validated product ideas by analyzing real user pain points from Reddit. Let AI identify opportunities and generate actionable startup ideas.",
  keywords: [
    "product ideas",
    "startup ideas",
    "reddit analysis",
    "ai product discovery",
    "pain point analysis",
    "market validation",
  ],
  openGraph: {
    title: "Pain Radar - AI-Powered Product Ideas from Reddit",
    description:
      "Discover validated product ideas by analyzing real user pain points from Reddit.",
    type: "website",
    url: "https://painradar.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pain Radar - AI-Powered Product Ideas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pain Radar - AI-Powered Product Ideas from Reddit",
    description:
      "Discover validated product ideas by analyzing real user pain points from Reddit.",
    images: ["/og-image.png"],
  },
};

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Hero />
      <ImageDivider index={0} />
      <Features />
      <ImageDivider index={1} />
      <HowItWorks />
      <ImageDivider index={2} />
      <CTA />
      <Footer />
    </main>
  );
}
