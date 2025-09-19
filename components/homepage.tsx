// D:/PROCESSES/vscode_projects/AI_Lifecoach/chatbot-template/components/homepage.tsx
// In components/homepage.tsx

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export function Homepage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Main container to center content with vast spacing */}
      <div className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden px-4">

        {/* --- ADDITION 1: Menu Icon Trigger --- */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="absolute top-6 right-6 md:top-8 md:right-8 z-30 p-2 group"
          aria-label="Open navigation menu"
        >
          <Image
            src="/menu_icon.png"
            alt="Menu"
            width={32}
            height={32}
            className="transition-transform duration-300 group-hover:scale-110"
          />
        </button>

        {/* Subtle Vertical Kanji - "The Way" */}
        <motion.div
          className="absolute top-0 right-8 h-full flex items-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1.5, delay: 1 }}
        >
          <p className="font-serif text-[#333333] text-xl [writing-mode:vertical-rl] tracking-[0.2em]">
            道
          </p>
        </motion.div>

        {/* Centered Content with animation */}
        <motion.div
          className="text-center flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* Ensō Circle - Using a transparent PNG is key here */}
          <div className="relative w-72 h-72 md:w-96 md:h-96 mb-12">
            <Image
              src="/hero.png"
              alt="Ensō Circle representing wholeness and the journey within"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>

          {/* Headline */}
          <h1
            className="font-serif text-3xl md:text-4xl text-[#1a1a1a] leading-tight max-w-md mb-12"
            style={{ letterSpacing: '0.03em' }}
          >
            Clarity is not found. It is uncovered.
          </h1>

          {/* Call-to-Action with Hanko Stamp */}
          <Link href="/sign-in" className="group">
            <div className="relative w-32 h-32 md:w-36 md:h-36 transition-transform duration-300 ease-in-out group-hover:scale-105">
              <Image
                src="/cta.png"
                alt="A red Hanko stamp"
                fill
                style={{ objectFit: 'contain' }}
              />
              <span
                className="absolute inset-0 flex items-center justify-center font-serif text-lg text-white pointer-events-none"
                style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.2)' }}
              >
              </span>
            </div>
          </Link>
        </motion.div>
      </div>
      
      <section className="py-20 md:py-32 bg-white/50">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="font-serif text-3xl md:text-4xl text-[#1a1a1a] mb-6">
            The Path
          </h2>
          <p className="text-lg text-[#333333] mb-8 leading-relaxed">
            Theia, the voice of Clarity, doesn't provide answers. It reveals the path to your own. Through a gentle, guided conversation, it helps you journey from the noise of the mind to the wisdom of the body. From a feeling of being "unprepared" to the peace of a "quiet garden." This is not a quicker way to think. It is a slower way to know.
          </p>
          <Link href="/how-it-works" className="inline-block bg-[#1a1a1a] text-white font-medium py-3 px-8 rounded-lg text-base transition-colors hover:bg-[#333333]">
            See the Methodology
          </Link>
        </div>
      </section>

      {/* --- ADDITION 2: Navigation Overlay --- */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-6 right-6 md:top-8 md:right-8 z-50 p-2 group"
              aria-label="Close navigation menu"
            >
              <Image
                src="/close_icon.png"
                alt="Close"
                width={32}
                height={32}
                className="transition-transform duration-300 group-hover:scale-110"
              />
            </button>

            <nav className="flex flex-col items-center gap-y-10 text-center">
              <Link href="/how-it-works" onClick={() => setIsMenuOpen(false)} className="font-serif text-3xl text-[#1a1a1a] hover:text-[#333333] transition-colors">
                Methodology
              </Link>
              <Link href="/philosophy" onClick={() => setIsMenuOpen(false)} className="font-serif text-3xl text-[#1a1a1a] hover:text-[#333333] transition-colors">
                Philosophy
              </Link>
              <Link href="/pricing" onClick={() => setIsMenuOpen(false)} className="font-serif text-3xl text-[#1a1a1a] hover:text-[#333333] transition-colors">
                Pricing
              </Link>
              <Link href="/sign-in" onClick={() => setIsMenuOpen(false)} className="font-serif text-3xl text-[#1a1a1a] hover:text-[#333333] transition-colors mt-4">
                Begin
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}