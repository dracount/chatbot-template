// D:/PROCESSES/vscode_projects/AI_Lifecoach/chatbot-template/app/philosophy/page.tsx
import { PublicHeader } from "@/components/public-header";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PhilosophyPage() {
  return (
    <div className="bg-white/50 min-h-screen">
      <PublicHeader />
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <section className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl text-[#1a1a1a] leading-tight mb-6">
            The Mirror, Not the Map
          </h1>
          <p className="text-lg text-[#333333] leading-relaxed">
            Clarity is built on a single belief: The most profound guidance you will ever receive comes from within. We are taught to seek answers externally, but true breakthroughs come from a different place—a place of feeling, of somatic wisdom, of quiet knowing.
          </p>
          <p className="text-lg text-[#333333] leading-relaxed mt-4">
            Our purpose is not to give you a map drawn by someone else. It is to provide a perfect mirror, so you can finally see the path you are already on.
          </p>
        </section>
        
        <section className="border-t border-b border-gray-200 py-12 mb-16">
          <h2 className="font-serif text-2xl text-center text-[#1a1a1a] mb-8">
            Theia is a space to:
          </h2>
          <ul className="space-y-6 text-lg">
            <li className="flex items-start">
              <span className="font-serif text-[#1a1a1a] mr-4 text-xl">Trust the Unfolding:</span>
              <span className="text-[#333333]">Believe that a clear process is more valuable than a quick fix.</span>
            </li>
            <li className="flex items-start">
              <span className="font-serif text-[#1a1a1a] mr-4 text-xl">Listen to the Body:</span>
              <span className="text-[#333333]">Honor that your physical experience holds its own intelligence.</span>
            </li>
            <li className="flex items-start">
              <span className="font-serif text-[#1a1a1a] mr-4 text-xl">Reclaim Your Knowing:</span>
              <span className="text-[#333333]">Remember that you are the expert on yourself.</span>
            </li>
          </ul>
        </section>

        <section className="text-center text-[#333333] bg-gray-50/70 p-8 rounded-lg">
           <h3 className="font-serif text-xl text-[#1a1a1a] mb-4">A Note on Our Origins</h3>
           <p className="italic">
             Clarity was born from a question: &quot;What if an AI could be trained not on information, but on the principles of presence?&quot; It is an experiment in mindful technology—a quiet space in a noisy world.
           </p>
        </section>

        <section className="text-center mt-20">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 font-serif text-lg text-[#1a1a1a] transition-colors hover:text-[#333333]"
            >
              Begin Your Journey <ArrowRight className="h-5 w-5" />
            </Link>
        </section>
      </main>
    </div>
  );
}