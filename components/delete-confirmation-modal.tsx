'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  itemTitle: string | null;
  itemType?: 'path' | 'insight' | 'item';
  onConfirmDelete: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  setIsOpen,
  itemTitle,
  itemType = 'item',
  onConfirmDelete,
  isDeleting
}: DeleteConfirmationModalProps) {

  const handleOpenChange = (open: boolean) => {
    if (!isDeleting) {
      setIsOpen(open);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {itemType === 'path' ? 'Delete Path?' :
             itemType === 'insight' ? 'Remove Insight?' :
             'Delete Item?'}
          </DialogTitle>
          <DialogDescription>
            {itemType === 'path' ?
              `Permanently delete the path "${itemTitle || 'this path'}"? This cannot be undone.` :
              itemType === 'insight' ?
                `Remove the insight "${itemTitle || 'this insight'}"? This cannot be undone.` :
                `Permanently delete "${itemTitle || 'this item'}"? This cannot be undone.`
            }
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isDeleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ?
              (itemType === 'path' ? "Deleting..." :
               itemType === 'insight' ? "Removing..." :
               "Deleting...") :
              (itemType === 'path' ? "Delete Path" :
               itemType === 'insight' ? "Remove Insight" :
               "Delete")
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 