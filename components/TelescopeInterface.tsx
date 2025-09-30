// D:/PROCESSES/vscode_projects/AI_Lifecoach/chatbot-template/components/TelescopeInterface.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
// --- MODIFICATION: Imported new server actions ---
import { getMessagesForChat, addMessage, getOpenRouterResponse, addInsightAction, generateAndUpdateChatTitle, checkFirstSessionStatus, markFirstSessionCompleted  } from '@/app/actions';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { toast } from "sonner";
import { AnimatedResponseMessage } from '@/components/animated-response-message';
import { MODEL_CHAT } from '@/app/config/ai.config';

// --- TYPES ---
interface Message {
  id: string;
  sender: 'user' | 'theia';
  content: string;
  created_at?: string;
}

interface ChatInterfaceProps {
  chatId: string;
}

// --- MODIFICATION: Tutorial and Welcome content separated ---
const FIRST_SESSION_TUTORIAL = [
  {
    id: 'tut-1',
    content: "Welcome to your first session. This is a brief tutorial to help you get started.\n\nYou can click the send button to continue to the next step, or simply type your thoughts and send them to begin your coaching session at any time."
  },
  {
    id: 'tut-2',
    content: "I am Theia. This is a space for you to find clarity. My purpose is not to provide answers, but to help you discover your own. I will listen and ask questions to help you navigate the path from where you are now to where you want to be."
  },
  {
    id: 'tut-3',
    content: "Our conversations are a form of coaching—a partnership focused on your present and future. The goal is to help you identify your aspirations, recognize what might be holding you back, and empower you to move forward. This is a confidential and non-judgmental space for you to think and feel freely."
  },
  {
    id: 'tut-4',
    content: "To get the most out of our time, honesty and openness are key. As we talk, any insights you gain can be saved to your 'Rock Garden' using the save icon that appears next to my messages.\n\nTo begin, what's on your mind right now?"
  }
];

const NEW_SESSION_WELCOME = {
  id: 'welcome-back-1',
  content: "Welcome back. A new path awaits. What would you like to explore in this session?"
};


const WelcomeMessageLine = ({ message }: { message: { id: string; content: string } }) => (
  <div className="group w-full flex items-start gap-4 py-2 justify-start">
    <div className="max-w-2xl text-sm sm:text-base whitespace-pre-wrap leading-relaxed text-left text-[#333333]">
      <AnimatedResponseMessage content={message.content} />
    </div>
  </div>
);


// The Message component, styled like a script
const MessageLine = ({ message }: { message: Message }) => {
  const isUser = message.sender === 'user';

  const handleSaveInsight = () => {
    toast.promise(addInsightAction(message.content), {
      loading: "Saving insight to your Rock Garden...",
      success: "Insight Saved!",
      error: (err) => err.message || "Could not save insight.",
    });
  };

  return (
    <div className={cn(
      "group w-full flex items-start gap-4 py-2",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div
        className={cn(
          "max-w-2xl text-sm sm:text-base whitespace-pre-wrap leading-relaxed",
          isUser ? "text-right text-[#1a1a1a] font-medium" : "text-left text-[#333333]"
        )}
      >
        {isUser ? (
          message.content
        ) : (
          <AnimatedResponseMessage content={message.content} />
        )}
      </div>
      {!isUser && (
        <button
          onClick={handleSaveInsight}
          className="self-center transition-opacity opacity-0 group-hover:opacity-60 hover:!opacity-100"
          aria-label="Save as insight"
        >
          <Image
            src="/save_icon.png"
            alt="Save Insight"
            width={24}
            height={24}
          />
        </button>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
export const TelescopeInterface = ({ chatId }: ChatInterfaceProps) => {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTheiaResponding, setIsTheiaResponding] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [messageError, setMessageError] = useState<string | null>(null);

  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  
  // --- MODIFICATION: New state to manage session type ---
  const [isFirstSessionEver, setIsFirstSessionEver] = useState(false);
  const [sessionTypeChecked, setSessionTypeChecked] = useState(false);


  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingMessages(true);
    setSessionTypeChecked(false); // Reset on each chat load

    getMessagesForChat(chatId)
      .then(async (fetchedMessages) => {
        if (isMounted) {
          setMessages(fetchedMessages.map(m => ({ ...m, sender: m.sender === 'ai' ? 'theia' : 'user' })));
          
          if (fetchedMessages.length === 0) {
            // --- MODIFICATION: Check session status for empty chats ---
            const isFirst = !(await checkFirstSessionStatus());
            setIsFirstSessionEver(isFirst);
            setIsTutorialActive(true);
            setTutorialStep(0);
          } else {
            setIsTutorialActive(false);
          }
          setSessionTypeChecked(true); // Mark that we have determined the session type
        }
      })
      .catch(error => {
        console.error("Failed to fetch messages:", error);
        if (isMounted) setMessageError("Could not load this conversation.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingMessages(false);
      });
    return () => { isMounted = false; };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTheiaResponding, tutorialStep]);

  const handleSubmit = async () => {
    const currentPrompt = prompt.trim();

    if (isTutorialActive) {
      if (currentPrompt) {
        // User typed something, so they are starting the session.
        setIsTutorialActive(false);
        // --- MODIFICATION: Mark first session as completed if it was their first time ---
        if (isFirstSessionEver) {
          markFirstSessionCompleted();
        }
      } else if (isFirstSessionEver) {
        // User clicked send without typing, and it's the full tutorial.
        if (tutorialStep < FIRST_SESSION_TUTORIAL.length - 1) {
          setTutorialStep(prev => prev + 1);
        }
        return; // Stop to prevent sending an empty message.
      } else {
        // User clicked send on the "Welcome Back" message.
        // The prompt is empty, so we do nothing.
        return;
      }
    }


    if (!currentPrompt || isTheiaResponding) return;

    const userMessagesCount = messages.filter(m => m.sender === 'user').length;
    const shouldGenerateTitle = userMessagesCount === 2;

    const newUserMessage: Message = { id: uuidv4(), sender: 'user', content: currentPrompt };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setPrompt("");

    const selectedModel = MODEL_CHAT;
    await addMessage(chatId, 'user', currentPrompt, selectedModel);
    setIsTheiaResponding(true);

    try {
      const result = await getOpenRouterResponse(updatedMessages.map(m => ({ ...m, sender: m.sender === 'theia' ? 'ai' : 'user' })), selectedModel);
      let theiaResponse: Message;

      if (result.success && result.response) {
        theiaResponse = { id: uuidv4(), sender: 'theia', content: result.response };
        await addMessage(chatId, 'ai', result.response, selectedModel);
        const messagesForTitle = [...updatedMessages, theiaResponse];
        if (shouldGenerateTitle) {
            const titleResult = await generateAndUpdateChatTitle(chatId, messagesForTitle);
            if (titleResult.success && titleResult.newTitle) {
              window.dispatchEvent(new CustomEvent('chatUpdated', {
                detail: {
                  chatId: chatId,
                  newTitle: titleResult.newTitle
                }
              }));
            }
        }
      } else {
        theiaResponse = { id: uuidv4(), sender: 'theia', content: `Error: ${result.error || 'Failed to get a response.'}` };
      }
      setMessages(prev => [...prev, theiaResponse]);
    } catch (error) {
      console.error("Error during API call:", error);
      const errorMsg: Message = { id: uuidv4(), sender: 'theia', content: "A cosmic interference occurred. Please try again." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTheiaResponding(false);
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="h-full w-full">
      {/* Scrollable message container */}
      <div className="h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-28 sm:pt-12 sm:pb-32 space-y-4">
          {/* --- MODIFICATION: Show loader until session type is checked --- */}
          {isLoadingMessages || !sessionTypeChecked ? (
            <div className="flex justify-center pt-10"><Loader2 className="h-8 w-8 text-[#333333] animate-spin" /></div>
          ) : messageError ? (
            <div className="text-center text-[#bc4747]">{messageError}</div>
          // --- MODIFICATION: Conditionally render tutorial or welcome message ---
          ) : isTutorialActive ? (
            isFirstSessionEver ? (
              FIRST_SESSION_TUTORIAL.slice(0, tutorialStep + 1).map((msg) => (
                <WelcomeMessageLine key={msg.id} message={msg} />
              ))
            ) : (
              <WelcomeMessageLine message={NEW_SESSION_WELCOME} />
            )
          ) : (
            messages.map((msg) => <MessageLine key={msg.id} message={msg} />)
          )}
          <AnimatePresence>
            {isTheiaResponding && (
              <motion.div
                className="flex justify-start py-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Image
                    src="/hero.png"
                    alt="Thinking..."
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-stone-200">
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex items-end gap-2 sm:gap-4">
            <textarea
              ref={textareaRef}
              className="flex-1 resize-none text-base text-[#1a1a1a] placeholder:text-gray-400 bg-transparent focus:outline-none border-b-2 border-gray-300 focus:border-[#1a1a1a] p-2 transition-colors duration-300"
              placeholder={
                isTutorialActive && isFirstSessionEver
                  ? "Type here to begin, or click send to continue the tutorial..."
                  : "Your thoughts..."
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              rows={1}
              disabled={isTheiaResponding}
            />
            <button
              className="group transition-transform duration-300 ease-in-out hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              onClick={handleSubmit}
              disabled={
                isTheiaResponding ||
                // Disable if tutorial is finished and prompt is empty
                (isTutorialActive && isFirstSessionEver && !prompt.trim() && tutorialStep >= FIRST_SESSION_TUTORIAL.length - 1) ||
                // Disable on welcome back message if prompt is empty
                (isTutorialActive && !isFirstSessionEver && !prompt.trim())
              }
              aria-label="Send"
            >
              <div className="relative w-10 h-10 sm:w-12 sm:h-12">
                 <Image src="/cta.png" alt="Send" fill style={{ objectFit: 'contain' }} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};