import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthStatus } from "@/components/auth/auth-status";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Discover Product Ideas from{" "}
              <span className="text-primary">Reddit</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AI-powered analysis of Reddit discussions to uncover real user
              pain points and generate actionable startup ideas with
              attractiveness scores.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>

          <div className="pt-8">
            <AuthStatus showFullStatus />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI agents analyze Reddit discussions to find genuine user
              problems and transform them into viable product opportunities.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto">
                <span className="text-primary-foreground font-bold">1</span>
              </div>
              <h3 className="font-semibold">Analyze Reddit</h3>
              <p className="text-sm text-muted-foreground">
                Scan popular subreddits for user complaints, frustrations, and
                unmet needs
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto">
                <span className="text-primary-foreground font-bold">2</span>
              </div>
              <h3 className="font-semibold">Generate Ideas</h3>
              <p className="text-sm text-muted-foreground">
                AI transforms pain points into concrete product ideas with clear
                value propositions
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto">
                <span className="text-primary-foreground font-bold">3</span>
              </div>
              <h3 className="font-semibold">Score & Deliver</h3>
              <p className="text-sm text-muted-foreground">
                Get attractiveness scores and receive curated ideas via email
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Pain Radar. Built with Next.js and Supabase.</p>
        </div>
      </footer>
    </div>
  );
}
