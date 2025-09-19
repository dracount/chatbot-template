// D:/PROCESSES/vscode_projects/AI_Lifecoach/chatbot-template/components/dashboard-client.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteInsightAction } from '@/app/actions';
import { toast } from 'sonner';

// --- CONSTANTS (No changes) ---
const STONE_WIDTH = 128;
const STONE_HEIGHT = 128;
const PLACEMENT_PADDING = 20;
const MAX_PLACEMENT_ATTEMPTS = 100;

// --- TYPES (No changes) ---
interface GardenItem {
  id: string;
  title: string;
  content?: string;
  type: 'chat' | 'insight';
  variation: number;
  x: number;
  y: number;
}

interface DashboardClientProps {
  initialHistory: { id: string; title: string; }[];
  initialInsights: { id: string; title: string; content: string; date: string; }[];
}

// --- HELPER FUNCTION (No changes) ---
const checkOverlap = (rect1: DOMRect, rect2: DOMRect) => {
  return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);
};

// --- SUB-COMPONENTS ---
const Stone = ({ item, onRemove }: { item: GardenItem; onRemove: (id: string, type: 'chat' | 'insight') => void; }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top');

  const stoneRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const stoneVariations = ['/stone-foundation.png', '/stone-river.png', '/stone-contemplation.png', '/stone-irregular.png'];
  const stoneImage = stoneVariations[item.variation];

  useEffect(() => {
    if (isHovered && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      if (rect.top < 20) {
        setTooltipPosition('bottom');
      } else {
        setTooltipPosition('top');
      }
    }
  }, [isHovered]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (item.type === 'insight') {
      e.preventDefault();
      setContextMenu({ x: e.pageX, y: e.pageY });
    }
  };

  const handleRemove = () => {
    onRemove(item.id, item.type);
    setContextMenu(null);
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu) setContextMenu(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  const StoneComponent = (
    <motion.div
      ref={stoneRef}
      className="absolute cursor-grab active:cursor-grabbing"
      initial={{ x: item.x, y: item.y, scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: Math.random() * 0.5 }}
      drag
      dragMomentum={false}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onContextMenu={handleContextMenu}
      whileHover={{ scale: 1.1, zIndex: 10 }}
      whileTap={{ scale: 1.05, zIndex: 10, cursor: 'grabbing' }}
    >
      <div className="relative w-28 h-28 md:w-32 md:h-32">
        <Image src={stoneImage} alt="An insight stone" fill style={{ objectFit: 'contain', pointerEvents: 'none' }} />
      </div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            ref={tooltipRef}
            className={`absolute left-1/2 -translate-x-1/2 w-64 p-3 bg-black/70 backdrop-blur-sm text-white rounded-lg shadow-xl z-20 pointer-events-none
              ${tooltipPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
            `}
            initial={{ opacity: 0, y: tooltipPosition === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: tooltipPosition === 'top' ? 10 : -10 }}
          >
            {/* --- FIX IS HERE --- */}
            {/* Changed text-[#1a1a1a] to text-white and text-[#333333] to text-white/80 */}
            <h4 className="font-serif font-bold text-white text-sm leading-tight truncate">{item.title}</h4>
            {item.content && <p className="text-white/80 text-xs mt-1 leading-snug line-clamp-3">{item.content}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contextMenu && (
          <motion.div
            className="fixed bg-white rounded-md shadow-lg z-50 p-1"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <button onClick={handleRemove} className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded">
              Return to the sand
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return item.type === 'chat' ? (
    <Link href={`/c/${item.id}`} className="absolute" style={{ top: 0, left: 0 }}>{StoneComponent}</Link>
  ) : (
    <div className="absolute" style={{ top: 0, left: 0 }}>{StoneComponent}</div>
  );
};

// --- MAIN CLIENT COMPONENT (No changes needed below this line) ---
export function DashboardClient({ initialHistory, initialInsights }: DashboardClientProps) {
  const [stones, setStones] = useState<GardenItem[]>([]);
  const gardenRef = useRef<HTMLDivElement>(null);
  const [gardenDimensions, setGardenDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const gardenNode = gardenRef.current;
    if (!gardenNode) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setGardenDimensions({ width, height });
      }
    });

    resizeObserver.observe(gardenNode);
    return () => resizeObserver.unobserve(gardenNode);
  }, []);

  useEffect(() => {
    if (gardenDimensions.width === 0 || !initialHistory || !initialInsights) return;

    const combinedItems = [
      ...initialHistory.map(chat => ({ ...chat, type: 'chat' as const })),
      ...initialInsights.map(insight => ({ ...insight, type: 'insight' as const })),
    ];

    const positionedStones: GardenItem[] = [];

    combinedItems.forEach((item) => {
      let newStoneRect: DOMRect;
      let isValidPosition = false;
      let x = 0;
      let y = 0;

      for (let i = 0; i < MAX_PLACEMENT_ATTEMPTS; i++) {
        x = Math.random() * (gardenDimensions.width - STONE_WIDTH - PLACEMENT_PADDING * 2) + PLACEMENT_PADDING;
        y = Math.random() * (gardenDimensions.height - STONE_HEIGHT - PLACEMENT_PADDING * 2) + PLACEMENT_PADDING;

        newStoneRect = new DOMRect(x, y, STONE_WIDTH, STONE_HEIGHT);

        let hasOverlap = false;
        for (const placedStone of positionedStones) {
          const placedStoneRect = new DOMRect(placedStone.x, placedStone.y, STONE_WIDTH, STONE_HEIGHT);
          if (checkOverlap(newStoneRect, placedStoneRect)) {
            hasOverlap = true;
            break;
          }
        }

        if (!hasOverlap) {
          isValidPosition = true;
          break;
        }
      }

      if (!isValidPosition) {
        x = PLACEMENT_PADDING + (positionedStones.length % 5) * (STONE_WIDTH + PLACEMENT_PADDING);
        y = PLACEMENT_PADDING;
      }

      positionedStones.push({
        ...item,
        variation: Math.floor(Math.random() * 4),
        x,
        y,
      });
    });

    setStones(positionedStones);
  }, [gardenDimensions, initialHistory, initialInsights]);

  const handleRemoveStone = (id: string, type: 'chat' | 'insight') => {
    if (type === 'insight') {
      setStones(prevStones => prevStones.filter(stone => stone.id !== id));
      toast.promise(deleteInsightAction(id), {
        loading: "Returning stone to the sand...",
        success: "The garden is clear.",
        error: (err) => err.message || "Could not remove stone.",
      });
    } else {
      toast.info("Conversations can be removed from the main sidebar.");
    }
  };

  const isEmpty = initialHistory.length === 0 && initialInsights.length === 0;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div
        ref={gardenRef}
        className="relative flex-1 w-full"
        style={{ backgroundImage: `url(/raked_sand.png)`, backgroundSize: 'cover' }}
      >
        <AnimatePresence>
          {isEmpty && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              <p className="font-serif text-lg text-center text-[#333333]/80 max-w-xs">
                Your garden is a space for reflection. Save an insight from your conversation to place your first stone.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {stones.map(item => (
          <Stone key={item.id} item={item} onRemove={handleRemoveStone} />
        ))}

        <Link href="/welcome" className="absolute bottom-6 right-6 group">
          <motion.div
            className="relative w-40 h-40 md:w-48 md:h-48 transition-transform duration-300 ease-in-out group-hover:scale-105"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <Image src="/stone-foundation.png" alt="Start a new conversation" fill style={{ objectFit: 'contain' }} />
            <span className="absolute inset-0 flex items-center justify-center font-serif text-white/80 pointer-events-none text-center text-sm leading-tight px-4">
              Begin a New Conversation
            </span>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}