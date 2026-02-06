'use client';

import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface HistoryItemProps {
  id: string;
  title: string | null;
  createdAt: string;
  onClick: (id: string) => void;
  className?: string;
}

export function HistoryItem({
  id,
  title,
  createdAt,
  onClick,
  className,
}: HistoryItemProps): React.ReactElement {
  const displayTitle = title || 'Untitled idea';
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        'w-full text-left px-3 py-2 rounded-md transition-colors',
        'hover:bg-accent/50 focus:bg-accent/50 focus:outline-none',
        'group',
        className
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium truncate text-foreground group-hover:text-primary">
          {displayTitle}
        </span>
        <span className="text-xs text-muted-foreground">
          {timeAgo}
        </span>
      </div>
    </button>
  );
}
