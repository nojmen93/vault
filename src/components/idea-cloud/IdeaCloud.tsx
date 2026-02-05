'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { IdeaBubble } from './IdeaBubble';
import { IdeaExpandedWidget } from './IdeaExpandedWidget';
import { IdeaGrid } from './IdeaGrid';
import { useBubblePositions } from '@/hooks/useBubblePositions';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { EncryptedNote } from '@/types';

interface Position {
  x: number;
  y: number;
}

interface IdeaCloudProps {
  notes: EncryptedNote[];
}

// Generate default position using golden angle distribution
function getDefaultPosition(index: number): Position {
  const seed = index * 137.5; // Golden angle for distribution
  const radius = 30 + (index % 3) * 15; // Vary distance from center
  const angle = (seed % 360) * (Math.PI / 180);
  const centerX = 50;
  const centerY = 50;
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  return {
    x: Math.max(10, Math.min(90, x)),
    y: Math.max(10, Math.min(90, y)),
  };
}

export function IdeaCloud({ notes }: IdeaCloudProps): React.ReactElement {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const containerRef = useRef<HTMLDivElement>(null);
  const { getPosition, setPosition } = useBubblePositions();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Memoize displayed notes (max 20)
  const displayedNotes = useMemo(() => notes.slice(0, 20), [notes]);

  // Handle position change from drag
  const handlePositionChange = useCallback((id: string, position: Position): void => {
    setPosition(id, position);
  }, [setPosition]);

  // Handle expand/collapse
  const handleExpand = useCallback((id: string): void => {
    setExpandedId(id);
  }, []);

  const handleCloseExpanded = useCallback((): void => {
    setExpandedId(null);
  }, []);

  // Get the expanded note
  const expandedNote = useMemo(() => {
    if (!expandedId) return null;
    return notes.find(n => n.id === expandedId) || null;
  }, [expandedId, notes]);

  // Get position for expanded widget
  const expandedPosition = useMemo(() => {
    if (!expandedId) return { x: 50, y: 50 };
    const defaultPos = getDefaultPosition(displayedNotes.findIndex(n => n.id === expandedId));
    return getPosition(expandedId, defaultPos);
  }, [expandedId, displayedNotes, getPosition]);

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
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50/50 via-blue-50/50 to-cyan-50/50"
    >
      {/* Glassmorphism background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-purple-200/30 blur-3xl" />
        <div className="absolute top-1/2 -right-20 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-cyan-200/30 blur-3xl" />
      </div>

      {/* Floating bubbles */}
      <div className="relative h-full w-full">
        {displayedNotes.map((note, index) => {
          const defaultPos = getDefaultPosition(index);
          const position = getPosition(note.id, defaultPos);

          return (
            <IdeaBubble
              key={note.id}
              id={note.id}
              title={note.title || ''}
              content={note.encryptedContent}
              createdAt={note.createdAt}
              index={index}
              total={displayedNotes.length}
              position={position}
              onPositionChange={handlePositionChange}
              onExpand={handleExpand}
              isOtherExpanded={expandedId !== null && expandedId !== note.id}
              containerRef={containerRef}
            />
          );
        })}
      </div>

      {/* Show count if more than 20 */}
      {notes.length > 20 && (
        <div className="absolute bottom-4 right-4 rounded-full bg-white/50 backdrop-blur-sm px-3 py-1 text-xs text-muted-foreground">
          +{notes.length - 20} more ideas
        </div>
      )}

      {/* Expanded widget */}
      {expandedNote && (
        <IdeaExpandedWidget
          note={expandedNote}
          position={expandedPosition}
          onClose={handleCloseExpanded}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
