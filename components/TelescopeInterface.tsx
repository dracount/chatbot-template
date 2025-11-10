'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Save, ArrowUp } from 'lucide-react'; // CORRECTED THIS LINE: Added ArrowUp
import { getMessagesForChat, addMessage, getOpenRouterResponse, addInsightAction, generateAndUpdateChatTitle, checkFirstSessionStatus, markFirstSessionCompleted } from '@/app/actions';
import { cn } from '@/lib/utils';
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

const FIRST_SESSION_TUTORIAL = [
  {
    id: 'tut-1',
    content: "Welcome. This is your space to explore freely. My purpose is not to provide answers, but to help you discover your own wisdom. I will listen and ask questions to guide you.\n\nTo continue this introduction, simply click the send button. Or, to begin your session now, type what's on your mind."
  },
  {
    id: 'tut-2',
    content: "Our conversations are a partnership. The goal is to help you find clarity and empower you to move forward. This is a confidential and non-judgmental space for you to think and feel without pressure."
  },
  {
    id: 'tut-3',
    content: "To get the most out of our time, honesty and openness are key. As we talk, any insights you gain can be saved to your 'Insights' collection using the save icon that appears next to my messages.\n\nTo begin, what feels most alive for you to explore right now?"
  }
];

const NEW_SESSION_WELCOME = {
  id: 'welcome-back-1',
  content: "Welcome back. A new path awaits. What would you like to explore in this session?"
};

// --- SUB-COMPONENTS ---
const WelcomeMessageLine = ({ message }: { message: { id: string; content: string } }) => (
  <div className="group w-full flex items-start gap-4 py-4 justify-start">
    <div className="max-w-2xl text-base md:text-lg whitespace-pre-wrap leading-relaxed text-left text-foreground/90">
      <AnimatedResponseMessage content={message.content} />
    </div>
  </div>
);

const MessageLine = ({ message }: { message: Message }) => {
  const isUser = message.sender === 'user';

  const handleSaveInsight = () => {
    toast.promise(addInsightAction(message.content), {
      loading: "Saving insight...",
      success: "Insight Saved!",
      error: (err) => err.message || "Could not save insight.",
    });
  };

  return (
    <div className={cn(
      "group w-full flex items-start gap-3 py-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <button
          onClick={handleSaveInsight}
          className="self-start mt-1 transition-opacity opacity-0 group-hover:opacity-60 hover:!opacity-100 text-muted-foreground hover:text-primary"
          aria-label="Save as insight"
        >
          <Save className="h-5 w-5" />
        </button>
      )}
      <div
        className={cn(
          "max-w-2xl text-base md:text-lg whitespace-pre-wrap leading-relaxed",
          isUser ? "text-right text-foreground font-normal" : "text-left text-foreground/90"
        )}
      >
        {isUser ? (
          message.content
        ) : (
          <AnimatedResponseMessage content={message.content} />
        )}
      </div>
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

  const [isFirstSessionEver, setIsFirstSessionEver] = useState(false);
  const [_sessionTypeChecked, setSessionTypeChecked] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) {
      return;
    }
    let isMounted = true;
    setIsLoadingMessages(true);
    setSessionTypeChecked(false);

    getMessagesForChat(chatId)
      .then(async (fetchedMessages) => {
        if (isMounted) {
          setMessages(fetchedMessages.map(m => ({ ...m, sender: m.sender === 'ai' ? 'theia' : 'user' })));

          if (fetchedMessages.length === 0) {
            const hasCompletedBefore = await checkFirstSessionStatus();
            setIsFirstSessionEver(!hasCompletedBefore);
            setIsTutorialActive(true);
            setTutorialStep(0);
          } else {
            setIsTutorialActive(false);
          }
          setSessionTypeChecked(true);
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
  
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 256); // Max height of 256px
        textarea.style.height = `${newHeight}px`;
    }
  }, [prompt]);

  const handleSubmit = async () => {
    const currentPrompt = prompt.trim();

    if (isTutorialActive) {
      if (currentPrompt) {
        setIsTutorialActive(false);
        if (isFirstSessionEver) {
          markFirstSessionCompleted();
        }
      } else {
        if (tutorialStep < FIRST_SESSION_TUTORIAL.length - 1) {
          setTutorialStep(prev => prev + 1);
        } else {
            setIsTutorialActive(false);
            if (isFirstSessionEver) {
                markFirstSessionCompleted();
            }
        }
        return;
      }
    }

    if (!currentPrompt) {
      return;
    }
    if (isTheiaResponding) {
      return;
    }

    const userMessagesCount = messages.filter(m => m.sender === 'user').length;
    const shouldGenerateTitle = userMessagesCount === 2;

    const newUserMessage: Message = { id: uuidv4(), sender: 'user', content: currentPrompt };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setPrompt("");

    const selectedModel = MODEL_CHAT;
    addMessage(chatId, 'user', currentPrompt, selectedModel).catch(err => console.error("Failed to save user message:", err));
    
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
                detail: { chatId: chatId, newTitle: titleResult.newTitle }
              }));
            }
        }
      } else {
        theiaResponse = { id: uuidv4(), sender: 'theia', content: `Error: ${result.error || 'Failed to get a response.'}` };
        console.error("AI response was not successful:", result.error);
      }
      setMessages(prev => [...prev, theiaResponse]);
    } catch (error) {
      console.error("Error during API call:", error);
      const errorMsg: Message = { id: uuidv4(), sender: 'theia', content: "An unexpected error occurred. Please try again." };
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
    <div className="h-full w-full relative">
      <div className="h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-36 md:pt-16 md:pb-40 space-y-4">
          {isLoadingMessages ? (
            <div className="flex justify-center pt-10"><Loader2 className="h-8 w-8 text-muted-foreground animate-spin" /></div>
          ) : messageError ? (
            <div className="text-center text-destructive">{messageError}</div>
          ) : (
            <>
              {isTutorialActive && isFirstSessionEver && (
                FIRST_SESSION_TUTORIAL.slice(0, tutorialStep + 1).map((msg) => (
                  <WelcomeMessageLine key={msg.id} message={msg} />
                ))
              )}
              {isTutorialActive && !isFirstSessionEver && (
                 <WelcomeMessageLine message={NEW_SESSION_WELCOME} />
              )}
              {!isTutorialActive && messages.map((msg) => <MessageLine key={msg.id} message={msg} />)}
            </>
          )}
          <AnimatePresence>
            {isTheiaResponding && (
              <motion.div
                className="flex items-center gap-3 justify-start py-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin"/>
                <span className="text-muted-foreground">Theia is thinking...</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-3xl mx-auto p-4">
          <div className="relative">
            <textarea
              ref={textareaRef}
              className="w-full resize-none text-base text-foreground placeholder:text-muted-foreground bg-background focus:outline-none border-t border-border focus:border-primary pt-4 pr-16 pb-4 pl-4 transition-colors duration-300"
              placeholder={
                isTutorialActive && isFirstSessionEver
                  ? "Type here to begin, or click send to continue..."
                  : "What's on your mind?"
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              rows={1}
              disabled={isTheiaResponding}
            />
             <button
              className="absolute right-4 bottom-3 flex items-center justify-center h-10 w-10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-secondary"
              onClick={handleSubmit}
              disabled={
                isTheiaResponding ||
                (!prompt.trim() && isTutorialActive && tutorialStep >= FIRST_SESSION_TUTORIAL.length - 1) ||
                (!prompt.trim() && isTutorialActive && !isFirstSessionEver)
              }
              aria-label="Send message"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};