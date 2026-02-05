'use client';

import { IdeaBubble } from './IdeaBubble';
import { IdeaGrid } from './IdeaGrid';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { EncryptedNote } from '@/types';

interface IdeaCloudProps {
  notes: EncryptedNote[];
}

export function IdeaCloud({ notes }: IdeaCloudProps): React.ReactElement {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (notes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
            <span className="text-4xl">💭</span>
          </div>
          <h3 className="text-lg font-medium text-foreground">No ideas yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Press <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">⌘K</kbd> to capture your first idea
          </p>
        </div>
      </div>
    );
  }

  // On mobile, show grid instead of cloud
  if (isMobile) {
    return <IdeaGrid notes={notes} />;
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50/50 via-blue-50/50 to-cyan-50/50">
      {/* Glassmorphism background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-purple-200/30 blur-3xl" />
        <div className="absolute top-1/2 -right-20 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-cyan-200/30 blur-3xl" />
      </div>

      {/* Floating bubbles */}
      <div className="relative h-full w-full">
        {notes.slice(0, 20).map((note, index) => (
          <IdeaBubble
            key={note.id}
            id={note.id}
            title={note.title || ''}
            content={note.encryptedContent}
            createdAt={note.createdAt}
            index={index}
            total={notes.length}
          />
        ))}
      </div>

      {/* Show count if more than 20 */}
      {notes.length > 20 && (
        <div className="absolute bottom-4 right-4 rounded-full bg-white/50 backdrop-blur-sm px-3 py-1 text-xs text-muted-foreground">
          +{notes.length - 20} more ideas
        </div>
      )}
    </div>
  );
}
