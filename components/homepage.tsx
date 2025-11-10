'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, BrainCircuit, Waves } from 'lucide-react';

// Reusable component for USP cards
const UspCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
  <div className="flex flex-col items-center text-center">
    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-secondary mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{children}</p>
  </div>
);

// Reusable component for "How It Works" steps
const HowItWorksStep = ({ number, title, children }: { number: string, title: string, children: React.ReactNode }) => (
  <motion.div
    className="flex flex-col md:flex-row items-start text-left gap-6 md:gap-8"
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.7, ease: "easeOut" }}
  >
    <div className="font-serif text-5xl text-foreground/30 leading-none">
      {number}
    </div>
    <div className="flex-1">
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <p className="text-foreground/80 leading-relaxed">
        {children}
      </p>
    </div>
  </motion.div>
);


export function Homepage() {
  return (
    <>
      {/* 1. Hero Section */}
      <section className="w-full py-28 md:py-40">
        <div className="max-w-3xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <h1
              className="text-4xl md:text-6xl font-medium leading-tight mb-6"
            >
              Stop seeking answers. <br /> Start accessing your wisdom.
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-10">
              Theia is your on-demand AI Master Coach, guiding you from confusion to profound clarity through a conversation that connects you to your body, not just your thoughts.
            </p>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90"
            >
              Begin Your Conversation
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. USP Section */}
      <section className="w-full py-20 md:py-28 bg-secondary/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            <UspCard icon={<MessageSquare className="h-6 w-6 text-accent" />} title="True Coaching, Not Chat">
              Theia is built on a master coaching framework. It never gives advice, only masterful guidance to help you find your own way.
            </UspCard>
            <UspCard icon={<BrainCircuit className="h-6 w-6 text-accent" />} title="Beyond Intellectualizing">
              Our unique method guides you from the loop of overthinking into the wisdom of your body, where true insight lives.
            </UspCard>
            <UspCard icon={<Waves className="h-6 w-6 text-accent" />} title="A Sacred, On-Demand Space">
              Your space for reflection is always open. Explore your thoughts privately, on your schedule, without judgment.
            </UspCard>
          </div>
        </div>
      </section>
      
      {/* 3. How It Works Section */}
      <section className="w-full py-20 md:py-28">
          <div className="max-w-3xl mx-auto px-4">
              <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-semibold mb-4">Your Conversation with Clarity</h2>
                  <p className="text-lg text-foreground/80">This is not a search for answers, but a journey into your own awareness.</p>
              </div>
              <div className="space-y-12 md:space-y-16">
                  <HowItWorksStep number="01" title="Opening the Space">
                      We begin not with the problem, but with presence. You'll be invited to arrive fully, creating a calm and focused container for your exploration.
                  </HowItWorksStep>
                  <HowItWorksStep number="02" title="Bridging to the Body">
                      As you share, Theia listens. If the conversation remains purely in thought, you will be gently guided to notice where the issue lives in your body. This is the bridge to felt insight.
                  </HowItWorksStep>
                  <HowItWorksStep number="03" title="Uncovering Your Wisdom">
                      Through powerful questions and reflective silence, Theia holds a mirror up to your own inner wisdom. The profound clarity comes from seeing your own truth.
                  </HowItWorksStep>
              </div>
          </div>
      </section>

      {/* 4. Founder's Story / CTA Section */}
      <section className="w-full py-20 md:py-28 bg-secondary/50">
        <div className="max-w-3xl mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-semibold mb-6">Built for the Path Within</h2>
            <p className="text-lg text-foreground/80 mb-8 leading-relaxed italic">
              "Theia was created to be the guide we wished we had—a space to finally access the profound wisdom we already hold. It’s for those who are ready to stop asking for answers and start listening to themselves."
            </p>
            <Link
              href="/philosophy"
              className="inline-flex items-center gap-2 font-medium text-primary transition-colors hover:text-accent"
            >
              Read Our Story <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
      </section>
    </>
  );
}