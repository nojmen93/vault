'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, ExternalLink, Trash2, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  note: {
    id: string;
    title: string | null;
    encryptedContent: string;
    createdAt: string;
  };
  isOptimistic?: boolean;
  onDelete?: (id: string) => void;
  onFindSimilar?: (id: string) => void;
}

export function ChatMessage({
  note,
  isOptimistic,
  onDelete,
  onFindSimilar,
}: ChatMessageProps): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={cn(
        'group flex justify-end',
        isOptimistic && 'opacity-60'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Actions (visible on hover) */}
      <div
        className={cn(
          'flex items-center gap-1 mr-2 transition-opacity',
          isHovered && !isOptimistic ? 'opacity-100' : 'opacity-0'
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onFindSimilar?.(note.id)}
          title="Find similar ideas"
        >
          <Sparkles className="h-3.5 w-3.5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/notes/${note.id}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open as note
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete?.(note.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Message bubble */}
      <div className="max-w-[80%]">
        <div
          className={cn(
            'rounded-2xl rounded-br-md px-4 py-2.5',
            'bg-primary text-primary-foreground',
            'shadow-sm'
          )}
        >
          <p className="whitespace-pre-wrap text-sm">
            {note.encryptedContent}
          </p>
        </div>
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {isOptimistic ? 'Sending...' : formatTime(note.createdAt)}
        </p>
      </div>
    </div>
  );
}
