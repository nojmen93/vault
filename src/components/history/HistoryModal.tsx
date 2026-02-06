'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HistorySearch } from './HistorySearch';
import { HistoryModalList } from './HistoryModalList';
import { cn } from '@/lib/utils';

interface HistoryNote {
  id: string;
  title: string | null;
  createdAt: string;
  content?: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: HistoryNote[];
  onNoteClick: (id: string) => void;
}

export function HistoryModal({
  isOpen,
  onClose,
  notes,
  onNoteClick,
}: HistoryModalProps): React.ReactElement | null {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter notes based on search
  const filteredNotes = searchQuery
    ? notes.filter((note) => {
        const query = searchQuery.toLowerCase();
        const titleMatch = note.title?.toLowerCase().includes(query);
        const contentMatch = note.content?.toLowerCase().includes(query);
        return titleMatch || contentMatch;
      })
    : notes;

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const handleNoteClick = (id: string): void => {
    onNoteClick(id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg"
          >
            <div className="bg-background border rounded-xl shadow-lg max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-semibold">Idea History</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Search */}
              <div className="p-4 border-b">
                <HistorySearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search all ideas..."
                />
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-2">
                <HistoryModalList
                  notes={filteredNotes}
                  onNoteClick={handleNoteClick}
                />
              </div>

              {/* Footer */}
              <div className="p-3 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  {filteredNotes.length} idea{filteredNotes.length !== 1 ? 's' : ''}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
