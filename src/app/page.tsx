import Link from "next/link";
import { Lock, Brain, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Vault
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight">
            Your ideas deserve
            <span className="text-primary"> zero-knowledge </span>
            protection
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Vault is an AI-powered idea incubator that connects your fragmented
            thoughts, validates concepts, and generates roadmaps — all with
            client-side encryption. Your ideas never leave your device unencrypted.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg">Start for Free</Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t bg-muted/40 py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold">
              Built for entrepreneurs and developers
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Capture ideas securely, let AI find connections, and turn fragments
              into actionable plans.
            </p>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<Lock className="h-8 w-8" />}
                title="Zero-Knowledge Encryption"
                description="AES-256-GCM encryption happens in your browser. We never see your unencrypted data."
              />
              <FeatureCard
                icon={<Brain className="h-8 w-8" />}
                title="AI-Powered Connections"
                description="Semantic search finds hidden links between your ideas using vector embeddings."
              />
              <FeatureCard
                icon={<Zap className="h-8 w-8" />}
                title="Incubator Mode"
                description="Claude analyzes your ideas, validates concepts, and generates project roadmaps."
              />
              <FeatureCard
                icon={<Shield className="h-8 w-8" />}
                title="Privacy First"
                description="Your encryption key never leaves your device. Not even we can read your notes."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold">Ready to secure your ideas?</h2>
            <p className="mt-4 text-muted-foreground">
              Join entrepreneurs who trust Vault with their most valuable thoughts.
            </p>
            <Link href="/sign-up" className="mt-8 inline-block">
              <Button size="lg">Create Your Vault</Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Vault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({
  icon,
  title,
  description,
}: FeatureCardProps): React.ReactElement {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="text-primary">{icon}</div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
