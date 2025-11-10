// D:/PROCESSES/vscode_projects/AI_Lifecoach/chatbot-template/app/faq/page.tsx
'use client';

import { useState } from 'react';
import { PublicHeader } from "@/components/public-header";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from 'lucide-react';
import Link from 'next/link';

const faqData = [
  {
    question: "What is Clarity, exactly?",
    answer: "Clarity is a web-based conversational tool, Theia, designed to guide you through a process of self-inquiry using principles of presence and somatic awareness. It is a space to uncover your own wisdom."
  },
  {
    question: "Is this therapy?",
    answer: "No. This is a crucial distinction. Theia is a tool for coaching and self-exploration. It is not a substitute for professional mental health support, medical advice, or diagnosis."
  },
  {
    question: "Who is this for?",
    answer: "This is for anyone feeling stuck, seeking insight, or wishing to cultivate a deeper connection between their mind and body. It is for those who believe the answers they seek are already within them."
  },
  {
    question: "Is my conversation private?",
    answer: "Yes. Privacy is the foundation of trust. Your conversations are confidential and protected. You can read our full Privacy Policy for more details."
  }
];

const AccordionItem = ({ q, a }: { q: string; a: string; }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-200 py-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left"
            >
                <h3 className="text-lg font-serif text-[#1a1a1a]">{q}</h3>
                {isOpen ? <Minus className="h-5 w-5 text-gray-500" /> : <Plus className="h-5 w-5 text-gray-500" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: '16px' }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <p className="text-[#333333] leading-relaxed">{a.includes('Privacy Policy') ? <>Yes. Privacy is the foundation of trust. Your conversations are confidential and protected. You can read our full <Link href="#" className="underline">Privacy Policy</Link> for more details.</> : a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}


export default function FaqPage() {
  return (
    <div className="bg-white/50 min-h-screen">
      <PublicHeader />
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <header className="text-center mb-16">
            <h1 className="font-serif text-4xl md:text-5xl text-[#1a1a1a]">Questions & Clarity</h1>
        </header>

        <div>
            {faqData.map((item, index) => (
                <AccordionItem key={index} q={item.question} a={item.answer} />
            ))}
        </div>
      </main>
    </div>
  );
}