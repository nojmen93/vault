'use client';

import { useMemo } from 'react';
import { isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { HistoryItem } from './HistoryItem';
import { cn } from '@/lib/utils';

interface HistoryNote {
  id: string;
  title: string | null;
  createdAt: string;
}

interface HistoryModalListProps {
  notes: HistoryNote[];
  onNoteClick: (id: string) => void;
  className?: string;
}

interface GroupedNotes {
  today: HistoryNote[];
  yesterday: HistoryNote[];
  thisWeek: HistoryNote[];
  thisMonth: HistoryNote[];
  older: HistoryNote[];
}

function groupNotesByDate(notes: HistoryNote[]): GroupedNotes {
  const groups: GroupedNotes = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  };

  notes.forEach((note) => {
    const date = new Date(note.createdAt);

    if (isToday(date)) {
      groups.today.push(note);
    } else if (isYesterday(date)) {
      groups.yesterday.push(note);
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(note);
    } else if (isThisMonth(date)) {
      groups.thisMonth.push(note);
    } else {
      groups.older.push(note);
    }
  });

  return groups;
}

interface GroupSectionProps {
  title: string;
  notes: HistoryNote[];
  onNoteClick: (id: string) => void;
}

function GroupSection({ title, notes, onNoteClick }: GroupSectionProps): React.ReactElement | null {
  if (notes.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
        {title}
      </h3>
      <div className="flex flex-col">
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
    </div>
  );
}

export function HistoryModalList({
  notes,
  onNoteClick,
  className,
}: HistoryModalListProps): React.ReactElement {
  const groupedNotes = useMemo(() => groupNotesByDate(notes), [notes]);

  if (notes.length === 0) {
    return (
      <div className={cn('py-12 text-center', className)}>
        <p className="text-muted-foreground">No ideas found</p>
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      <GroupSection title="Today" notes={groupedNotes.today} onNoteClick={onNoteClick} />
      <GroupSection title="Yesterday" notes={groupedNotes.yesterday} onNoteClick={onNoteClick} />
      <GroupSection title="This Week" notes={groupedNotes.thisWeek} onNoteClick={onNoteClick} />
      <GroupSection title="This Month" notes={groupedNotes.thisMonth} onNoteClick={onNoteClick} />
      <GroupSection title="Older" notes={groupedNotes.older} onNoteClick={onNoteClick} />
    </div>
  );
}
