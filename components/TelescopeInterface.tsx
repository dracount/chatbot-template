'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { getMessagesForChat, addMessage, getOpenRouterResponse, addInsightAction, generateAndUpdateChatTitle  } from '@/app/actions';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { toast } from "sonner";
import { AnimatedResponseMessage } from '@/components/animated-response-message';
import { Tutorial } from '@/components/Tutorial'; // Import the new component
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

// --- SUB-COMPONENTS ---

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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingMessages(true);
    getMessagesForChat(chatId)
      .then(fetchedMessages => {
        if (isMounted) setMessages(fetchedMessages.map(m => ({ ...m, sender: m.sender === 'ai' ? 'theia' : 'user' })));
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
  }, [messages, isTheiaResponding]);

  const handleSubmit = async () => {
    const currentPrompt = prompt.trim();
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
        {/* --- MODIFICATION: Increased bottom padding to prevent content from hiding under the fixed input bar --- */}
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-28 sm:pt-12 sm:pb-32 space-y-4">
          {isLoadingMessages ? (
            <div className="flex justify-center pt-10"><Loader2 className="h-8 w-8 text-[#333333] animate-spin" /></div>
          ) : messageError ? (
            <div className="text-center text-[#bc4747]">{messageError}</div>
          ) : messages.length === 0 ? (
            <Tutorial /> // MODIFICATION: Show tutorial if there are no messages
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

      {/* --- MODIFICATION: Input area is now FIXED to the bottom of the viewport --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-stone-200">
        <div className="max-w-3xl mx-auto p-4">
          <div className="flex items-end gap-2 sm:gap-4">
            <textarea
              ref={textareaRef}
              className="flex-1 resize-none text-base text-[#1a1a1a] placeholder:text-gray-400 bg-transparent focus:outline-none border-b-2 border-gray-300 focus:border-[#1a1a1a] p-2 transition-colors duration-300"
              placeholder="Your thoughts..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              rows={1}
              disabled={isTheiaResponding}
            />
            <button
              className="group transition-transform duration-300 ease-in-out hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              onClick={handleSubmit}
              disabled={!prompt.trim() || isTheiaResponding}
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