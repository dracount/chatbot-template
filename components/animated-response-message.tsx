"use client";

import { motion } from "framer-motion";

interface AnimatedResponseMessageProps {
  content: string;
}

export function AnimatedResponseMessage({ content }: AnimatedResponseMessageProps) {
  // Variants for animating the entire message block as a single unit.
  const messageVariants = {
    hidden: { opacity: 0, y: 15 }, // Start invisible and slightly below its final position.
    visible: {
      opacity: 1,
      y: 0, // Animate to be fully visible at its final position.
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 20,
        duration: 0.6,
      },
    },
  };

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
    >
      {content}
    </motion.div>
  );
}