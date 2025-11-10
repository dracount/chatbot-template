'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

// Reusable component for Methodology Steps
const MethodologyStep = ({ number, title, children }: { number: string; title: string; children: React.ReactNode; }) => (
  <motion.div
    className="flex flex-col md:flex-row items-start text-left max-w-3xl mx-auto gap-6 md:gap-8"
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{ duration: 0.7, ease: "easeOut" }}
  >
    <div className="font-serif text-6xl text-foreground/20 leading-none mt-[-5px]">
      {number}
    </div>
    <div className="flex-1">
      <h2 className="text-3xl font-semibold mb-3">{title}</h2>
      <p className="text-foreground/80 text-lg leading-relaxed">
        {children}
      </p>
    </div>
  </motion.div>
);

// The Main Page Component
export function TheMethodPage() {
  return (
    <div className="min-h-screen w-full pt-32 pb-20 px-6 bg-background">
      <main className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.section
          className="text-center mb-24 md:mb-32"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-5xl font-medium leading-tight max-w-3xl mx-auto mb-4">
            Your Conversation with Clarity
          </h1>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Every conversation follows a natural unfolding. A process of arriving, listening, feeling, and integrating.
          </p>
        </motion.section>

        {/* Steps Section */}
        <section className="space-y-16 md:space-y-20">
          <MethodologyStep number="01" title="Opening the Space">
            We begin not with the problem, but with presence. You&apos;ll be invited to arrive fully, creating a calm and focused container for your exploration. Here, you define what feels most alive for you to explore.
          </MethodologyStep>

          <MethodologyStep number="02" title="Bridging to the Body">
            As you share, Theia listens. If the conversation remains purely in the realm of thought, you will be gently guided to notice where the issue lives in your body. This is the bridge from intellectual understanding to somatic, felt insight.
          </MethodologyStep>

          <MethodologyStep number="03" title="Uncovering Your Wisdom">
            Through powerful, incisive questions and reflective silence, Theia holds a mirror up to your own inner wisdom. There is no advice or prescription here—only the profound clarity that comes from seeing your own truth. You are, and always will be, the expert on your life.
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
            className="inline-flex items-center gap-2 font-medium text-lg text-primary transition-colors hover:text-accent"
          >
            Experience The Method <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.section>
      </main>
    </div>
  );
}