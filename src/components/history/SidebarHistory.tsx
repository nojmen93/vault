'use client';

import { useState, useMemo } from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { HistorySearch } from './HistorySearch';
import { HistoryList } from './HistoryList';
import { HistoryModal } from './HistoryModal';
import { cn } from '@/lib/utils';

interface HistoryNote {
  id: string;
  title: string | null;
  createdAt: string;
  content?: string;
}

interface SidebarHistoryProps {
  notes: HistoryNote[];
  onNoteClick: (id: string) => void;
  maxItems?: number;
  className?: string;
}

export function SidebarHistory({
  notes,
  onNoteClick,
  maxItems = 5,
  className,
}: SidebarHistoryProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Filter notes based on search
  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;

    const query = searchQuery.toLowerCase();
    return notes.filter((note) => {
      const titleMatch = note.title?.toLowerCase().includes(query);
      const contentMatch = note.content?.toLowerCase().includes(query);
      return titleMatch || contentMatch;
    });
  }, [notes, searchQuery]);

  // Limit to maxItems for sidebar display
  const displayedNotes = filteredNotes.slice(0, maxItems);
  const hasMore = filteredNotes.length > maxItems;

  return (
    <>
      <div className={cn('flex flex-col border-t', className)}>
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Recent Ideas</span>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <HistorySearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search..."
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-1">
          <HistoryList
            notes={displayedNotes}
            onNoteClick={onNoteClick}
            emptyMessage={searchQuery ? 'No matching ideas' : 'No ideas yet'}
          />
        </div>

        {/* View all */}
        {(hasMore || notes.length > maxItems) && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors border-t"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Full History Modal */}
      <HistoryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        notes={notes}
        onNoteClick={onNoteClick}
      />
    </>
  );
}
