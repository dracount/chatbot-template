import { PublicHeader } from "@/components/public-header";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PhilosophyPage() {
  return (
    <div className="bg-background min-h-screen">
      <PublicHeader />
      <main className="max-w-2xl mx-auto px-6 pt-32 pb-20">
        <section className="mb-16">
          <h1 className="font-serif text-4xl md:text-5xl text-foreground leading-tight mb-8 text-center">
            Our Story
          </h1>
          <div className="text-foreground/80 space-y-6">
            <p className="text-xl">
              The emergence of powerful AI presented a fascinating mirror for the human mind. In its raw potential, we saw an incredible tool for reflection. But a mirror that simply gives you the answers you want to hear isn’t a tool for growth; it’s a cage. True transformation doesn’t come from more information, but from deeper awareness.
            </p>
            <p className="text-lg">
              Our mission became clear: to meticulously sculpt this raw power into an instrument of self-discovery. We stripped away the noise of generic advice and instilled the patient, grounded principles of master coaching. We didn’t just enhance an AI; we gave it a philosophy.
            </p>
            <p className="text-lg">
              Theia was created to be the guide we wished we had—a sacred, on-demand space where you can finally access the profound wisdom you already hold within. It’s for those who are ready to stop asking for answers and start listening to themselves.
            </p>
          </div>
        </section>

        <section className="border-t border-border pt-12 mt-16">
            <h2 className="font-serif text-2xl text-center text-foreground mb-8">
                Theia is a space to:
            </h2>
            <ul className="space-y-4 text-lg max-w-md mx-auto">
                <li className="flex items-start gap-3">
                    <span className="text-accent mt-1">◆</span>
                    <span className="text-foreground/80">
                        <strong>Trust the Unfolding:</strong> Believe that a clear process is more valuable than a quick fix.
                    </span>
                </li>
                <li className="flex items-start gap-3">
                    <span className="text-accent mt-1">◆</span>
                    <span className="text-foreground/80">
                        <strong>Listen to the Body:</strong> Honor that your physical experience holds its own intelligence.
                    </span>
                </li>
                <li className="flex items-start gap-3">
                    <span className="text-accent mt-1">◆</span>
                    <span className="text-foreground/80">
                        <strong>Reclaim Your Knowing:</strong> Remember that you are the expert on yourself.
                    </span>
                </li>
            </ul>
        </section>

        <section className="text-center mt-20">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 font-medium text-lg text-primary transition-colors hover:text-accent"
            >
              Begin Your Journey <ArrowRight className="h-5 w-5" />
            </Link>
        </section>
      </main>
    </div>
  );
}