'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageIcon, ArrowUp, Check, Loader2, PlusIcon, BookText, XIcon } from 'lucide-react';
import { createPortal } from 'react-dom';
import { getUserModelSettings, updateUserSelectedModel, getAnthropicResponse, addMessage, getMessagesForChat } from '@/app/actions';
import { SettingsModal } from './settings-modal';
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ContextSelectorModal } from "./context-selector-modal";
import { ContextItem } from '@/app/actions';

const availableModelsForDisplay = [
  { id: 'claude-3-7-sonnet-20250219', displayName: 'Claude 3.7 Sonnet' },
  { id: 'claude-3-opus-20240229', displayName: 'Claude 3 Opus' },
  { id: 'claude-3-5-sonnet-20240620', displayName: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-sonnet-20240229', displayName: 'Claude 3 Sonnet' },
  { id: 'claude-3-haiku-20240307', displayName: 'Claude 3 Haiku' },
];

const getDisplayName = (id: string | null): string | null => {
  if (!id) return null;
  const model = availableModelsForDisplay.find(m => m.id === id);
  return model ? model.displayName : id;
};

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
}

interface ChatInterfaceProps {
  chatId: string;
}

export function ChatInterface({ chatId }: ChatInterfaceProps) {
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [modelDropdownPosition, setModelDropdownPosition] = useState({ top: 0, left: 0 });
  const [enabledModels, setEnabledModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [hasTriggeredInitialResponse, setHasTriggeredInitialResponse] = useState(false);

  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [attachedContextItem, setAttachedContextItem] = useState<ContextItem | null>(null);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const attachmentCount = (attachedContextItem ? 1 : 0) + (attachedImage ? 1 : 0);

  const loadModels = useCallback(async () => {
    setIsLoadingModels(true);
    try {
      const settings = await getUserModelSettings();
      setEnabledModels(settings.enabledModels);
      setSelectedModel(settings.selectedModel);
    } catch (error) {
      console.error("Failed to fetch user model settings:", error);
      setEnabledModels([]);
      setSelectedModel(null);
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

  // MOVED: triggerInitialResponse is now declared BEFORE it is used in useEffect.
  const triggerInitialResponse = useCallback(async (initialUserMessage: Message) => {
      let currentModel = selectedModel;
      if (isLoadingModels) {
          //console.log("Initial response trigger waiting for models to load...");
          let waitCount = 0;
          while (isLoadingModels && waitCount < 50) {
              await new Promise(resolve => setTimeout(resolve, 100));
              waitCount++;
          }
          const settings = await getUserModelSettings();
          currentModel = settings.selectedModel;
          if (!currentModel) {
               console.error("Initial response trigger: Model still not available after waiting.");
               setMessageError("Could not determine AI model to use for initial response.");
               return;
          }
          //console.log(`Initial response trigger: Model loaded (${currentModel}), proceeding.`);
      } else if (!currentModel) {
          console.error("Initial response trigger: No model selected and not loading.");
          setMessageError("No AI model selected for initial response.");
          return;
      }

      //console.log(`ChatInterface triggering AI for initial message:`, initialUserMessage.content);

      setIsAiResponding(true);
      if (textareaRef.current) textareaRef.current.disabled = true;

      try {
        const result = await getAnthropicResponse([initialUserMessage], currentModel);
        let aiContent: string;
        let messageToSave: Message | null = null;

        if (result.success && result.response) {
          aiContent = result.response;
          messageToSave = { id: uuidv4(), sender: 'ai', content: aiContent };
          addMessage(chatId, 'ai', aiContent, currentModel)
             .catch(err => console.error("Error saving initial AI message:", err));
        } else {
          aiContent = `Error: ${result.error || 'Failed to get response from AI.'}`;
          messageToSave = { id: uuidv4(), sender: 'ai', content: aiContent };
          console.error("Initial AI Error:", result.error);
        }
        setMessages(prev => [...prev, messageToSave!]);
      } catch (error) {
        console.error("Error calling getAnthropicResponse (initial flow):", error);
        const errorMsg: Message = { id: uuidv4(), sender: 'ai', content: "An error occurred while processing your request." };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setTimeout(() => {
          setIsAiResponding(false);
          if (textareaRef.current) textareaRef.current.disabled = false;
          textareaRef.current?.focus();
        }, 50);
      }
  }, [chatId, selectedModel, isLoadingModels]);
  
  // This useEffect now safely calls the function declared above.
  useEffect(() => {
    // --- ADDED LOGGING AND GUARD ---
    //console.log(`[ChatInterface Mount/Update] useEffect triggered for chatId: ${chatId}.`);
    if (!chatId) {
      //console.log("[ChatInterface Mount/Update] No chatId provided yet. Aborting effect.");
      return;
    }
    let isMounted = true;
    setIsLoadingMessages(true);
    setMessageError(null);
    setHasTriggeredInitialResponse(false);
    setAttachedContextItem(null);
    setAttachedImage(null);

    //console.log("[ChatInterface Mount/Update] Loading models and messages...");
    loadModels();

    getMessagesForChat(chatId)
      .then(fetchedMessages => {
        if (isMounted) {
          //console.log(`[ChatInterface Mount/Update] Fetched ${fetchedMessages.length} messages.`);
          setMessages(fetchedMessages);
          setIsLoadingMessages(false);
          if (fetchedMessages.length === 1 && fetchedMessages[0].sender === 'user') {
            setHasTriggeredInitialResponse(true);
            triggerInitialResponse(fetchedMessages[0]);
          }
        }
      })
      .catch(error => {
        console.error("[ChatInterface ERROR] Failed to fetch chat messages:", error);
        if (isMounted) {
          setMessageError("Failed to load chat history.");
          setIsLoadingMessages(false);
        }
      });

    return () => { isMounted = false; };

  }, [chatId, loadModels, triggerInitialResponse]);

  // ... rest of the component remains the same
  
  // Effect to trigger initial response if messages load BEFORE models
  useEffect(() => {
    if (!isLoadingMessages && !isLoadingModels && !hasTriggeredInitialResponse && messages.length === 1 && messages[0].sender === 'user') {
      //console.log("Models loaded after messages, triggering initial response now.");
      setHasTriggeredInitialResponse(true);
      triggerInitialResponse(messages[0]);
    }
  }, [isLoadingMessages, isLoadingModels, messages, hasTriggeredInitialResponse, triggerInitialResponse]);

  const handleSettingsChanged = useCallback(() => {
     loadModels();
  }, [loadModels]);

  // ... textarea resize effect ...
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 360);
      textarea.style.height = `${newHeight}px`;
    }
  }, [prompt]);

  // ... dropdown close effect ...
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const dropdownElement = document.querySelector('.fixed.bg-white.rounded-md.shadow-lg');
      if (dropdownElement && !dropdownElement.contains(target) && !dropdownRef.current?.contains(target)) {
        setIsModelDropdownOpen(false);
      }
    }
    if (isModelDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isModelDropdownOpen]);

  // --- Image upload logic (remains, but triggered differently) ---
  const triggerImageUpload = () => {
    if (fileInputRef.current) {
      // Reset value to allow uploading the same file again
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      //console.log("Image selected:", files[0]);
      setAttachedImage(files[0]);
    } else {
      setAttachedImage(null);
    }
  };

  const handleRemoveImage = () => {
      setAttachedImage(null);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleAddContext = (item: ContextItem) => {
    setAttachedContextItem(item);
    textareaRef.current?.focus();
  };

  const handleRemoveContext = () => {
    setAttachedContextItem(null);
    textareaRef.current?.focus();
  };

  const handleSubmit = async () => {
    //console.log("[ChatInterface LOG] handleSubmit triggered.");
    const currentPrompt = prompt.trim();
    if (!currentPrompt) {
        //console.log("[ChatInterface LOG] Submit cancelled: No prompt text.");
        return;
    }
    if (isAiResponding) {
        //console.log("[ChatInterface LOG] Submit cancelled: AI is responding.");
        return;
    }
    if (!selectedModel) {
        console.error("[ChatInterface LOG] Submit cancelled: No model selected.");
        return;
    }

    //console.log("[ChatInterface LOG] Proceeding with message submission.");

    const newUserMessage: Message = {
      id: uuidv4(),
      sender: 'user',
      content: currentPrompt
    };

    const updatedMessagesForApi = [...messages, newUserMessage];
    setMessages(updatedMessagesForApi);

    setPrompt("");
    setAttachedContextItem(null);
    setAttachedImage(null);

    //console.log("[ChatInterface LOG] Calling addMessage for user.");
    addMessage(chatId, 'user', currentPrompt)
      .catch(err => console.error("[ChatInterface ERROR] Error saving user message:", err));

    setIsAiResponding(true);
    if(textareaRef.current) textareaRef.current.disabled = true;
    //console.log(`[ChatInterface LOG] Set isAiResponding to true. Submitting to model ${selectedModel}...`);

    try {
      const result = await getAnthropicResponse(
          updatedMessagesForApi,
          selectedModel,
          attachedContextItem?.id || null
      );
      //console.log("[ChatInterface LOG] Received response from getAnthropicResponse:", result);

      let aiContent: string;
      let messageToSave: Message | null = null;

      if (result.success && result.response) {
        aiContent = result.response;
         messageToSave = {
              id: uuidv4(),
              sender: 'ai',
              content: aiContent
            };
        //console.log("[ChatInterface LOG] AI response successful. Calling addMessage for AI.");
        addMessage(chatId, 'ai', aiContent, selectedModel)
          .catch(err => console.error("[ChatInterface ERROR] Error saving AI message:", err));
      } else {
        aiContent = `Error: ${result.error || 'Failed to get response from AI.'}`;
        messageToSave = {
              id: uuidv4(),
              sender: 'ai',
              content: aiContent
            };
        console.error("[ChatInterface ERROR] Follow-up AI Error:", result.error);
      }
      setMessages(prev => [...prev, messageToSave!]);

    } catch (error) {
      console.error("[ChatInterface ERROR] Error calling getAnthropicResponse (follow-up):", error);
      const errorMsg: Message = {
        id: uuidv4(),
        sender: 'ai',
        content: "An error occurred while processing your request."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      //console.log("[ChatInterface LOG] Finished handleSubmit flow. Setting isAiResponding to false.");
      setIsAiResponding(false);
      if(textareaRef.current) textareaRef.current.disabled = false;
      textareaRef.current?.focus();
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && prompt.trim() && !isAiResponding) {
        e.preventDefault();
        handleSubmit();
    }
  };

  const handleModelSelect = async (modelId: string) => {
    setSelectedModel(modelId);
    setIsModelDropdownOpen(false);
    try {
      await updateUserSelectedModel(modelId);
    } catch (error) {
       console.error("Error calling updateUserSelectedModel:", error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full flex flex-col">
      <main>
        <div className="w-full max-w-3xl mx-auto space-y-6 pb-24">
          {isLoadingMessages && (
            <>
              <Skeleton className="h-10 w-3/4 rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg self-end" />
              <Skeleton className="h-10 w-3/4 rounded-lg" />
            </>
          )}
          {!isLoadingMessages && messageError && (
            <div className="text-center text-red-600 py-4">{messageError}</div>
          )}
          {!isLoadingMessages && !messageError && messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.sender === 'user' && (
                    <div className="max-w-[75%] px-4 py-2 rounded-xl bg-gray-100 text-gray-800">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                )}
                {msg.sender === 'ai' && (
                    <div className="max-w-[90%] text-gray-800">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                )}
            </div>
          ))}

          {isAiResponding && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-500 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="w-full max-w-3xl mx-auto pb-4 sticky bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent pt-4">
        <div className="relative rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="flex flex-col">
            <div className="w-full relative">
              <textarea
                ref={textareaRef}
                className={`w-full resize-none text-base focus:outline-none text-stone-900 placeholder:text-gray-500 bg-transparent px-5 py-3 min-h-[48px] max-h-[360px] pr-10`}
                placeholder={"Ask follow-up..."}
                value={prompt}
                onChange={handlePromptChange}
                onKeyDown={handleTextareaKeyDown}
                rows={1}
                disabled={isAiResponding}
              />
            </div>

            <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative" ref={dropdownRef}>
                   <button
                        className="text-gray-500 flex items-center gap-1 text-sm hover:bg-gray-100 px-2 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={(e) => {
                            if (isLoadingModels) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            setModelDropdownPosition({ top: rect.top - 4, left: rect.left });
                            setIsModelDropdownOpen(!isModelDropdownOpen);
                        }}
                        disabled={isLoadingModels}
                    >
                        <span>
                            {isLoadingModels ? 'Loading...' : getDisplayName(selectedModel) ? getDisplayName(selectedModel) : enabledModels.length > 0 ? 'Select Model' : 'No Models Enabled'}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 10L4 6H12L8 10Z" fill="#6B7280"/></svg>
                    </button>
                    {isModelDropdownOpen && typeof document !== 'undefined' && createPortal(
                        <div className="fixed bg-white rounded-md shadow-lg border border-gray-200 w-56 z-50" style={{ top: `${modelDropdownPosition.top}px`, left: `${modelDropdownPosition.left}px`, transform: 'translateY(-100%)' }}>
                            <div className="p-1.5">
                            {enabledModels.map((modelId) => {
                                const displayName = getDisplayName(modelId);
                                return (
                                    <div
                                        key={modelId}
                                        className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-md"
                                        onClick={() => handleModelSelect(modelId)}
                                    >
                                        <span className="text-gray-800 text-sm">{displayName}</span>
                                        {selectedModel === modelId && <Check className="h-4 w-4 text-black" strokeWidth={2} />}
                                    </div>
                                );
                            })}
                            {enabledModels.length === 0 && !isLoadingModels && (
                                <div className="px-3 py-2 text-sm text-gray-500 text-center"> No models enabled. Go to Settings &gt; Models. </div>
                            )}
                            </div>
                        </div>,
                    document.body)}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative text-gray-500 hover:bg-gray-100 h-8 w-8 p-1.5 rounded-md mr-2"
                      aria-label="Add content"
                    >
                      <PlusIcon className="h-5 w-5" />
                      {attachmentCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-white text-[10px] font-semibold">
                          {attachmentCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {attachedImage ? (
                      <DropdownMenuItem onSelect={handleRemoveImage} className="text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700">
                         <XIcon className="mr-2 h-4 w-4" />
                         <span>Remove Image ({attachedImage.name.length > 15 ? attachedImage.name.substring(0, 15) + '...' : attachedImage.name})</span>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onSelect={triggerImageUpload}>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        <span>Upload Image</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onSelect={() => setIsContextModalOpen(true)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <BookText className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="flex-grow">Add Context</span>
                      </div>
                      {attachedContextItem && <Check className="h-4 w-4 text-black ml-2 flex-shrink-0" strokeWidth={2} />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <button
                className={`flex items-center justify-center h-8 w-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${ prompt.trim() ? "bg-black text-white hover:bg-gray-800" : "bg-white text-gray-400 border border-gray-300"}`}
                aria-label="Submit prompt"
                onClick={handleSubmit}
                disabled={!prompt.trim() || isAiResponding}
              >
                {isAiResponding ? <Loader2 className="h-4 w-4 animate-spin"/> : <ArrowUp className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <SettingsModal
         isOpen={isSettingsModalOpen}
         setIsOpen={setIsSettingsModalOpen}
         onSettingsChanged={handleSettingsChanged}
       />

      <ContextSelectorModal
        isOpen={isContextModalOpen}
        setIsOpen={setIsContextModalOpen}
        onAddContext={handleAddContext}
        attachedContextItemId={attachedContextItem?.id || null}
        onRemoveContext={handleRemoveContext}
      />

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/png,image/jpeg"
        onChange={handleImageChange}
      />
    </div>
  );
}