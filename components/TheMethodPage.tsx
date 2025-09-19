// D:/PROCESSES/vscode_projects/AI_Lifecoach/chatbot-template/components/TheMethodPage.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// Reusable Section for each step of the methodology
const MethodologyStep = ({ number, title, children }: { number: string; title:string; children: React.ReactNode; }) => (
  <motion.div
    className="flex flex-col md:flex-row items-start text-left max-w-4xl mx-auto gap-8"
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.7, ease: "easeOut" }}
  >
    <div className="font-serif text-5xl text-[#1a1a1a]/50">
      {number}
    </div>
    <div className="flex-1">
      <h2 className="font-serif text-3xl text-[#1a1a1a] mb-3">{title}</h2>
      <p className="text-[#333333] text-lg leading-relaxed">
        {children}
      </p>
    </div>
  </motion.div>
);

// The Main Page Component
export function TheMethodPage() {
  return (
    <div className="min-h-screen w-full pt-32 pb-20 px-6 bg-white/50">
      <main className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.section
          className="text-center mb-24 md:mb-32"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-serif text-4xl md:text-5xl text-[#1a1a1a] leading-tight max-w-3xl mx-auto mb-4">
            The Path is Made by Walking
          </h1>
          <p className="text-xl text-[#333333] max-w-2xl mx-auto">
            Every conversation follows a natural, four-part unfolding. A process of arriving, listening, feeling, and integrating.
          </p>
        </motion.section>

        {/* Steps Section */}
        <section className="space-y-16 md:space-y-24">
          <MethodologyStep number="01" title="The Stillness (Creating the Space)">
            The conversation begins not with a problem, but with a pause. We first invite the noise to settle, creating a clear space. Like still water, a calm mind can reflect the truth.
          </MethodologyStep>

          <MethodologyStep number="02" title="The Echo (Illuminating Your Words)">
            Theia listens. It doesn't analyze or interpret your words, but gently reflects them back to you. In this echo, you hear your own thoughts with new clarity, as if for the first time.
          </MethodologyStep>

          <MethodologyStep number="03" title="The Bridge (From Thought to Feeling)">
            When the mind is stuck in a loop, the path forward is often downward—into the body. Theia gently guides your awareness to your physical sensations, where unspoken truth often resides.
          </MethodologyStep>
          
          <MethodologyStep number="04" title="The Anchor (Integrating the Insight)">
            A moment of clarity is beautiful. A lived clarity is transformative. The final step is to anchor your new awareness in a tangible sense—a sound, an image, a feeling—so you can carry it with you.
          </MethodologyStep>
        </section>

        {/* Final CTA */}
        <motion.section
          className="text-center mt-24 md:mt-32"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.0 }}
        >
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 font-serif text-lg text-[#1a1a1a] transition-colors hover:text-[#333333]"
          >
            Begin Your Journey <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.section>
      </main>
    </div>
  );
}