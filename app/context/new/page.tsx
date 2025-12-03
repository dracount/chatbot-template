'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon, ArrowLeftIcon } from '@radix-ui/react-icons';
import { addContextItem } from '@/app/actions';
import { toast } from 'sonner';

export default function NewContextItemPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine validity based on state
  const isValid = name.trim().length > 0 && content.trim().length > 0;

  // Reusable save function (independent of FormEvent)
  const onSave = async () => {
    if (!isValid || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await addContextItem(name, content);
      if (result.success && result.newItem) {
        toast.success(`Context item "${result.newItem.name}" added!`);
        router.push('/context');
      } else {
        throw new Error(result.error || "Failed to add item.");
      }
    } catch (err: unknown) {
      console.error("Add context item error:", err);
      const errorMessage = err instanceof Error ? err.message : "Could not add context item.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle standard form submission (e.g. Enter key)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className="container max-w-3xl mx-auto py-10 px-4 md:px-6">
        <div className="flex justify-between items-center mb-8">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.back()} 
                className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 px-2"
            >
                 <ArrowLeftIcon className="h-4 w-4"/>
                 <span>Back</span>
            </Button>
            
            {/* Save Button now calls onSave directly */}
            <Button 
                id="save-context-button" 
                size="sm"
                onClick={onSave} 
                disabled={!isValid || isSubmitting}
                className="h-8 px-4" 
            >
               {isSubmitting ? "Saving..." : "Save"}
            </Button>
        </div>

        <form onSubmit={handleFormSubmit} id="new-context-form">
            <input
                 type="text"
                 id="context-name"
                 placeholder="Untitled"
                 value={name}
                 onChange={(e) => setName(e.target.value)} 
                 required
                 disabled={isSubmitting}
                 className="w-full border-0 focus:ring-0 focus:outline-none p-0 text-4xl font-semibold h-auto mb-4 bg-transparent text-stone-700 placeholder:text-4xl placeholder:font-semibold placeholder:text-stone-400/70"
            />

            <Textarea
                 id="context-content"
                 placeholder="Start writing your context here... Type '/' for commands." 
                 value={content}
                 onChange={(e) => setContent(e.target.value)}
                 required
                 disabled={isSubmitting}
                 className="w-full border-0 focus-visible:ring-0 focus:outline-none min-h-[300px] bg-white shadow-none text-base text-stone-900 resize-none placeholder:text-stone-500 py-2 leading-relaxed"
            />
            
             {error && (
               <Alert variant="destructive" className="mt-6 text-sm p-3">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
               </Alert>
             )}
        </form>
    </div>
  );
}