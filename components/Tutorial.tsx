'use client';

import { motion } from 'framer-motion';
import { AnimatedResponseMessage } from '@/components/animated-response-message';

// --- TYPES ---
interface TutorialMessage {
  id: string;
  content: string;
}

// --- TUTORIAL CONTENT ---
const TUTORIAL_MESSAGES: TutorialMessage[] = [
  {
    id: 'tut-1',
    content: "Welcome. I am Theia. This is a space for you to find clarity. My purpose is not to provide answers, but to help you discover your own. I will listen and ask questions to help you navigate the path from where you are now to where you want to be.",
  },
  {
    id: 'tut-2',
    content: "Our conversations are a form of coaching—a partnership focused on your present and future. The goal is to help you identify your aspirations, recognize what might be holding you back, and empower you to move forward. This is a confidential and non-judgmental space for you to think and feel freely.",
  },
  {
    id: 'tut-3',
    content: "To get the most out of our time, honesty and openness are key. You can start with whatever is most present for you—a challenge, a goal, or just a feeling. There's no right or wrong place to begin.\n\nAs we talk, any insights you gain can be saved to your 'Rock Garden' using the save icon that appears next to my messages.\n\nTo begin, what's on your mind right now?",
  },
];

// --- SUB-COMPONENTS ---
const TutorialMessageLine = ({ message }: { message: TutorialMessage }) => {
  return (
    <div className="group w-full flex items-start gap-4 py-2 justify-start">
      <div className="max-w-2xl text-sm sm:text-base whitespace-pre-wrap leading-relaxed text-left text-[#333333]">
        <AnimatedResponseMessage content={message.content} />
      </div>
    </div>
  );
};


// --- MAIN COMPONENT ---
export const Tutorial = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {TUTORIAL_MESSAGES.map((msg) => (
        <TutorialMessageLine key={msg.id} message={msg} />
      ))}
    </motion.div>
  );
};