'use client';

import React, { useState, useRef, useEffect } from "react"; // CORRECTED THIS LINE
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ChevronLeft, Plus, Settings, LogOut, User, Pencil, Star, Trash2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseClient } from "@/utils/supabase/client";
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
  onClose?: () => void;
  onOpenSettings: () => void;
}

// --- MAIN COMPONENT ---
export function SidebarComponent({ isAuthenticated, activePlanName, onClose, onOpenSettings }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const [chatToDelete, setChatToDelete] = useState<ChatHistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const updatedHistory = await getChatHistory();
      setChatHistory(updatedHistory);
      toast.dismiss();
      router.push(`/c/${newChatId}`);
      onClose?.();
    } else {
      console.error("Failed to create new chat session:", result.error);
      toast.error("Could not create new observation.", {
        description: result.error
      });
    }
  };

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
    if (editingChatId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingChatId]);

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
  }, []);

  const handleSignOut = async () => {
    await createSupabaseClient().auth.signOut();
    router.push('/sign-in');
    router.refresh();
    onClose?.();
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
      if (!originalChat || originalChat.title === editingChatName.trim()) {
        setEditingChatId(null);
        return;
      }

      const newTitle = editingChatName.trim();
      const originalTitle = originalChat.title;
      const chatToUpdateId = editingChatId;

      setChatHistory(prev =>
        prev.map(c => (c.id === chatToUpdateId ? { ...c, title: newTitle } : c))
      );
      setEditingChatId(null);

      const result = await updateChatName(chatToUpdateId, newTitle);

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
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
    }
  };

  return (
    <>
      <aside className={cn(
        "flex h-full flex-col text-foreground/70 bg-secondary/40 border-r border-border transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}>
        {/* Header */}
        <div className="flex items-center p-4 h-16">
          {!isCollapsed && <span className="font-serif text-2xl font-medium text-primary">Theia</span>}
          {/* Mobile-only Close Button */}
          <Button variant="ghost" size="icon" className="rounded-full ml-auto hover:bg-secondary md:hidden" onClick={onClose}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          {/* Desktop-only Collapse Button */}
          <Button variant="ghost" size="icon" className="rounded-full ml-auto hover:bg-secondary hidden md:block" onClick={() => setIsCollapsed(!isCollapsed)}>
            <ChevronLeft className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* New Chat */}
        <div className="px-3 space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-3 px-3 h-10 text-base font-normal hover:bg-secondary hover:text-primary" onClick={handleNewChat}>
            <Plus className="h-5 w-5" />
            {!isCollapsed && <span>New Path</span>}
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 px-3 h-10 text-base font-normal hover:bg-secondary hover:text-primary" onClick={() => { router.push('/dashboard'); onClose?.(); }}>
            <Star className="h-5 w-5" />
            {!isCollapsed && <span>Insights</span>}
          </Button>
        </div>

        <Separator className="my-4" />

        {/* Chat History (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto px-3">
          <p className="px-3 text-sm text-muted-foreground mb-2">{isCollapsed ? 'Paths' : 'Recent Paths'}</p>
          {isCollapsed ? (
            <div className="space-y-2">
              {chatHistory.map(chat => (
                <Button key={chat.id} variant="ghost" size="icon" className="w-full h-10 rounded-lg hover:bg-secondary" onClick={() => { router.push(`/c/${chat.id}`); onClose?.(); }}>
                  <span className="font-serif">{chat.title.charAt(0).toUpperCase()}</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {isLoadingHistory ? (
                <>
                  <Skeleton className="h-9 w-full bg-secondary" />
                  <Skeleton className="h-9 w-full bg-secondary" />
                  <Skeleton className="h-9 w-full bg-secondary" />
                </>
              ) : (
                chatHistory.map(chat => (
                  <div key={chat.id} className="group flex items-center rounded-lg hover:bg-secondary">
                    {editingChatId === chat.id ? (
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={editingChatName}
                        onChange={(e) => setEditingChatName(e.target.value)}
                        onKeyDown={handleRenameKeyDown}
                        onBlur={handleRenameSubmit}
                        className="h-9 flex-1 bg-transparent px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded-md"
                      />
                    ) : (
                      <Button variant="ghost" className="h-9 flex-1 justify-start truncate px-3 font-normal text-foreground/80 hover:bg-transparent hover:text-primary" onClick={() => { router.push(`/c/${chat.id}`); onClose?.(); }}>
                        {chat.title}
                      </Button>
                    )}
                    <div className="flex items-center pr-1">
                       <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => handleRenameStart(chat)}>
                         <Pencil className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive/70 hover:text-destructive" onClick={() => setChatToDelete(chat)}>
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
          <Separator className="mb-3" />
          <div className="relative">
            <Button variant="ghost" className="w-full h-11 justify-start gap-3 px-3 hover:bg-secondary" onClick={() => setShowProfileMenu(p => !p)}>
              <User className="h-5 w-5" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left text-foreground">Profile</span>
                  <span className="rounded-md bg-secondary border border-border px-1.5 py-0.5 text-xs text-muted-foreground">{capitalizeFirstLetter(activePlanName)}</span>
                </>
              )}
            </Button>
            {showProfileMenu && (
              <div ref={profileMenuRef} className="absolute bottom-full mb-2 w-full rounded-lg border border-border bg-background p-1 shadow-lg z-20">
                <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-secondary hover:text-primary font-normal" onClick={() => { onOpenSettings(); setShowProfileMenu(false); }}>
                  <Settings className="h-4 w-4" /> Settings
                </Button>
                <Separator className="my-1" />
                <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive font-normal" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {chatToDelete && (
        <DeleteConfirmationModal
          isOpen={!!chatToDelete}
          setIsOpen={() => setChatToDelete(null)}
          itemTitle={chatToDelete.title}
          itemType="path"
          onConfirmDelete={handleDeleteChat}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}