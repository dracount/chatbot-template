'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteInsightAction } from '@/app/actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal';
import { Plus, Trash2 } from 'lucide-react';

// --- TYPES ---
interface InsightItem {
  id: string;
  title: string;
  content: string;
  date: string;
}

interface DashboardClientProps {
  initialHistory: { id: string; title: string; }[];
  initialInsights: InsightItem[];
}

// --- SUB-COMPONENTS ---
const InsightCard = ({ insight, onRemove }: { insight: InsightItem; onRemove: (id: string) => void; }) => {
    const [isHovered, setIsHovered] = useState(false);

    const formattedDate = new Date(insight.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <motion.div
            layout
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="relative bg-background border border-border rounded-xl p-6 group"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            <h3 className="font-semibold text-lg mb-2 text-primary">{insight.title}</h3>
            <p className="text-foreground/80 leading-relaxed line-clamp-4 mb-4">{insight.content}</p>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
            
            <AnimatePresence>
            {isHovered && (
                 <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                 >
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-4 right-4 h-8 w-8"
                        onClick={() => onRemove(insight.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </motion.div>
            )}
            </AnimatePresence>
        </motion.div>
    );
};


// --- MAIN CLIENT COMPONENT ---
export function DashboardClient({ initialHistory, initialInsights }: DashboardClientProps) {
  const [insights, setInsights] = useState<InsightItem[]>(initialInsights);
  const [insightToDelete, setInsightToDelete] = useState<InsightItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRemoveInsight = (id: string) => {
    const insight = insights.find(i => i.id === id);
    if (insight) {
      setInsightToDelete(insight);
    }
  };

  const handleConfirmDelete = async () => {
    if (!insightToDelete) return;
    
    const originalInsights = insights;
    const deletedId = insightToDelete.id;
    
    // Optimistic update
    setInsights(prevInsights => prevInsights.filter(insight => insight.id !== deletedId));
    setIsDeleting(true);
    setInsightToDelete(null);

    try {
      const result = await deleteInsightAction(deletedId);
      if (!result.success) {
        // Revert on error
        setInsights(originalInsights);
        toast.error(result.error || "Could not remove insight.");
      } else {
        toast.success("Insight removed.");
      }
    } catch (error) {
      // Revert on error
      setInsights(originalInsights);
      toast.error("Could not remove insight.");
    } finally {
      setIsDeleting(false);
    }
  };

  const isEmpty = insights.length === 0;

  return (
    <div className="h-full w-full bg-background">
        <header className="p-6 md:p-8 border-b border-border">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-semibold text-primary">Your Insights</h1>
                    <p className="text-muted-foreground mt-1">A collection of your moments of clarity.</p>
                </div>
                <Link href="/welcome" passHref>
                    <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span>New Path</span>
                    </Button>
                </Link>
            </div>
        </header>
      <main
        className="max-w-6xl mx-auto p-6 md:p-8"
      >
        <AnimatePresence>
          {isEmpty ? (
            <motion.div
              className="flex flex-col items-center justify-center text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h2 className="text-2xl font-semibold text-primary mb-2">Your space is ready.</h2>
              <p className="text-muted-foreground max-w-md">
                This is your personal collection of insights. When you have a moment of clarity in a conversation, save it to see it here.
              </p>
            </motion.div>
          ) : (
             <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {insights.map(item => (
                    <InsightCard key={item.id} insight={item} onRemove={handleRemoveInsight} />
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {insightToDelete && (
        <DeleteConfirmationModal
          isOpen={!!insightToDelete}
          setIsOpen={() => setInsightToDelete(null)}
          itemTitle={insightToDelete.title}
          itemType="insight"
          onConfirmDelete={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}