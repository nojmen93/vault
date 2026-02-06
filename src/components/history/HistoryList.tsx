'use client';

import { HistoryItem } from './HistoryItem';
import { cn } from '@/lib/utils';

interface HistoryNote {
  id: string;
  title: string | null;
  createdAt: string;
}

interface HistoryListProps {
  notes: HistoryNote[];
  onNoteClick: (id: string) => void;
  emptyMessage?: string;
  className?: string;
}

export function HistoryList({
  notes,
  onNoteClick,
  emptyMessage = 'No ideas yet',
  className,
}: HistoryListProps): React.ReactElement {
  if (notes.length === 0) {
    return (
      <div className={cn('py-4 text-center', className)}>
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {notes.map((note) => (
        <HistoryItem
          key={note.id}
          id={note.id}
          title={note.title}
          createdAt={note.createdAt}
          onClick={onNoteClick}
        />
      ))}
    </div>
  );
}
