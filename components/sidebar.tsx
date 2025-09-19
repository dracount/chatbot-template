// D:/PROCESSES/vscode_projects/AI_Lifecoach/chatbot-template/components/sidebar.tsx
'use client';

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ChevronLeft, Plus, Settings, LogOut, User, Pencil, Star, Trash2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseClient } from "@/utils/supabase/client";
import { SettingsModal } from "./settings-modal";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { getChatHistory, deleteChat, updateChatName } from "@/app/actions";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createChatSession } from "@/app/actions";
import { v4 as uuidv4 } from 'uuid';

// --- TYPES & HELPERS ---
interface ChatHistoryItem {
  id: string;
  title: string;
}

const capitalizeFirstLetter = (string: string | null) => {
  if (!string) return 'Free';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export interface SidebarProps {
  isAuthenticated: boolean;
  activePlanName: string | null;
}

// --- MAIN COMPONENT ---
export function SidebarComponent({ isAuthenticated, activePlanName }: SidebarProps) {
    // ... component logic remains the same
    // --- INTERNAL STATE ---
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // State for deleting chats
  const [chatToDelete, setChatToDelete] = useState<ChatHistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for renaming chats
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatName, setEditingChatName] = useState("");

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleNewChat = async () => {
    toast.loading("Creating new path...");
    const newChatId = uuidv4();
    const result = await createChatSession(newChatId);

    if (result.success) {
      // On success, refresh the chat history to get the new chat
      const updatedHistory = await getChatHistory();
      setChatHistory(updatedHistory);
      toast.dismiss(); // Remove the "loading" toast
      router.push(`/c/${newChatId}`);
    } else {
      console.error("Failed to create new chat session:", result.error);
      toast.error("Could not create new observation.", {
        description: result.error
      });
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingHistory(true);
      getChatHistory()
        .then(setChatHistory)
        .catch(() => console.error("Failed to load chat history."))
        .finally(() => setIsLoadingHistory(false));
    } else {
      setChatHistory([]);
      setIsLoadingHistory(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Focus the input field when editing starts
    if (editingChatId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingChatId]);

  // Listen for automatic chat title updates from the chat interface
  useEffect(() => {
    const handleChatUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { chatId, newTitle } = customEvent.detail;

      setChatHistory(prevHistory =>
        prevHistory.map(chat =>
          chat.id === chatId ? { ...chat, title: newTitle } : chat
        )
      );
    };

    window.addEventListener('chatUpdated', handleChatUpdate);

    return () => {
      window.removeEventListener('chatUpdated', handleChatUpdate);
    };
  }, []); // Empty dependency array means this runs once on mount

  // --- HANDLERS ---
  const handleSignOut = async () => {
    await createSupabaseClient().auth.signOut();
    router.push('/sign-in');
    router.refresh();
  };

  const handleDeleteChat = async () => {
    if (!chatToDelete) return;
    setIsDeleting(true);
    const result = await deleteChat(chatToDelete.id);
    if (result.success) {
      setChatHistory(prev => prev.filter(chat => chat.id !== chatToDelete.id));
      if (pathname === `/c/${chatToDelete.id}`) router.push('/dashboard');
    } else {
      console.error("Failed to delete chat:", result.error);
    }
    setIsDeleting(false);
    setChatToDelete(null);
  };

  const handleRenameStart = (chat: ChatHistoryItem) => {
    setEditingChatId(chat.id);
    setEditingChatName(chat.title);
  };

  const handleRenameSubmit = async () => {
      if (!editingChatId || !editingChatName.trim()) {
        setEditingChatId(null);
        return;
      }

      const originalChat = chatHistory.find(c => c.id === editingChatId);
      // Exit if the chat is not found or the title hasn't changed.
      if (!originalChat || originalChat.title === editingChatName.trim()) {
        setEditingChatId(null);
        return;
      }

      const newTitle = editingChatName.trim();
      const originalTitle = originalChat.title;
      const chatToUpdateId = editingChatId; // CAPTURE the ID before it's set to null.

      // --- Optimistic Update ---
      setChatHistory(prev =>
        prev.map(c => (c.id === chatToUpdateId ? { ...c, title: newTitle } : c))
      );
      setEditingChatId(null); // Finish editing UI state

      // --- Server Call ---
      const result = await updateChatName(chatToUpdateId, newTitle); // USE the captured ID

      // --- Revert on Failure ---
      if (!result.success) {
        console.error("Failed to update chat name:", result.error);
        toast.error(`Could not rename chat: ${result.error}`);
        setChatHistory(prev =>
          prev.map(c => (c.id === chatToUpdateId ? { ...c, title: originalTitle } : c))
        );
      }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // This triggers the onBlur event, which handles the submission.
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
    }
  };

  return (
    <>
      <aside className={cn("flex h-full flex-col text-zinc-400 bg-zinc-900 border-r border-zinc-800 transition-all duration-300", isCollapsed ? "w-20" : "w-64")}>
        {/* Header */}
        <div className="flex items-center p-4">
          {!isCollapsed && <span className="text-2xl font-bold text-white">Theia</span>}
          <Button variant="ghost" size="icon" className="rounded-full ml-auto hover:bg-zinc-800 hover:text-zinc-50" onClick={() => setIsCollapsed(!isCollapsed)}>
            <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* New Chat */}
        <div className="px-3">
          <Button variant="ghost" className="w-full justify-center gap-2 hover:bg-zinc-800 hover:text-zinc-50" onClick={handleNewChat}>
            <Plus className="h-4 w-4" />
            {!isCollapsed && <span className="flex-1 text-left">New Path</span>}
          </Button>
          <Button variant="ghost" className="w-full justify-center gap-2 hover:bg-zinc-800 hover:text-zinc-50 mt-1" onClick={() => router.push('/dashboard')}>
            <Star className="h-4 w-4" />
            {!isCollapsed && <span className="flex-1 text-left">Star Chart</span>}
          </Button>
        </div>

        <Separator className="my-2 bg-zinc-800" />

        {/* Chat History (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto px-3">
          {isCollapsed ? (
            <div className="space-y-2">
              {chatHistory.map(chat => (
                <Button key={chat.id} variant="ghost" size="icon" className="w-full rounded-lg hover:bg-zinc-800" onClick={() => router.push(`/c/${chat.id}`)}>
                  <span>{chat.title.charAt(0).toUpperCase()}</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {isLoadingHistory ? (
                <>
                  <Skeleton className="h-8 w-full bg-zinc-800" />
                  <Skeleton className="h-8 w-full bg-zinc-800" />
                </>
              ) : (
                chatHistory.map(chat => (
                  <div key={chat.id} className="group flex items-center rounded-lg hover:bg-zinc-800">
                    {editingChatId === chat.id ? (
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={editingChatName}
                        onChange={(e) => setEditingChatName(e.target.value)}
                        onKeyDown={handleRenameKeyDown}
                        onBlur={handleRenameSubmit}
                        className="h-9 flex-1 bg-transparent px-3 text-sm text-white focus:outline-none"
                      />
                    ) : (
                      <Button variant="ghost" className="h-auto flex-1 justify-start truncate py-2 text-zinc-400 hover:bg-transparent hover:text-zinc-50" onClick={() => router.push(`/c/${chat.id}`)}>
                        {chat.title}
                      </Button>
                    )}
                    <div className="flex items-center pr-1">
                       <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => handleRenameStart(chat)}>
                         <Pencil className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => setChatToDelete(chat)}>
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="mt-auto flex flex-col p-3">
          <Separator className="mb-2 bg-zinc-800" />
          <div className="relative">
            <Button variant="ghost" className="w-full justify-center gap-2 hover:bg-zinc-800" onClick={() => setShowProfileMenu(p => !p)}>
              <User className="h-4 w-4" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left text-zinc-300">Profile</span>
                  <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">{capitalizeFirstLetter(activePlanName)}</span>
                </>
              )}
            </Button>
            {showProfileMenu && (
              <div ref={profileMenuRef} className="absolute bottom-full mb-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 p-1 shadow-lg">
                <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-zinc-800 hover:text-zinc-50" onClick={() => { setIsSettingsModalOpen(true); setShowProfileMenu(false); }}>
                  <Settings className="h-4 w-4" /> Settings
                </Button>
                <Separator className="bg-zinc-800 my-1" />
                <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:bg-zinc-800 hover:text-red-500" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Modals */}
      <SettingsModal isOpen={isSettingsModalOpen} setIsOpen={setIsSettingsModalOpen} onSettingsChanged={() => router.refresh()} />
      {chatToDelete && (
        <DeleteConfirmationModal
          isOpen={!!chatToDelete}
          setIsOpen={() => setChatToDelete(null)}
          itemTitle={chatToDelete.title}
          onConfirmDelete={handleDeleteChat}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}