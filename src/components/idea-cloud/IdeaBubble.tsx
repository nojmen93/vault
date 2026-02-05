'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSimilarNotes } from '@/components/similar-notes';

interface Position {
  x: number;
  y: number;
}

interface IdeaBubbleProps {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  index: number;
  total: number;
  position: Position;
  onPositionChange: (id: string, position: Position) => void;
  onExpand: (id: string) => void;
  isOtherExpanded: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function IdeaBubble({
  id,
  title,
  content,
  createdAt,
  index,
  total,
  position,
  onPositionChange,
  onExpand,
  isOtherExpanded,
  containerRef,
}: IdeaBubbleProps): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);
  const { openModal: openSimilarNotes } = useSimilarNotes();

  const handleSimilarClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    openSimilarNotes(id);
  };

  // Vary bubble size based on content length
  const getSize = (): { className: string; pixels: number } => {
    const len = content.length;
    if (len > 200) return { className: 'h-32 w-32', pixels: 128 };
    if (len > 100) return { className: 'h-28 w-28', pixels: 112 };
    if (len > 50) return { className: 'h-24 w-24', pixels: 96 };
    return { className: 'h-20 w-20', pixels: 80 };
  };

  const size = getSize();
  const animationDelay = `${(index * 0.3) % 3}s`;
  const preview = content.length > 40 ? content.substring(0, 40) + '...' : content;
  const displayTitle = title || preview;

  // Handle mouse down for drag start
  const handleMouseDown = useCallback((e: React.MouseEvent): void => {
    if (e.button !== 0) return; // Only left click

    e.preventDefault();
    e.stopPropagation();

    const container = containerRef.current;
    if (!container || !bubbleRef.current) return;

    const bubbleRect = bubbleRef.current.getBoundingClientRect();

    // Calculate offset from bubble center to mouse position
    const bubbleCenterX = bubbleRect.left + bubbleRect.width / 2;
    const bubbleCenterY = bubbleRect.top + bubbleRect.height / 2;

    setDragOffset({
      x: e.clientX - bubbleCenterX,
      y: e.clientY - bubbleCenterY,
    });

    setIsDragging(true);
    setHasDragged(false);
  }, [containerRef]);

  // Handle mouse move for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent): void => {
      const container = containerRef.current;
      if (!container) return;

      setHasDragged(true);
      const containerRect = container.getBoundingClientRect();

      // Calculate new position as percentage
      const newX = ((e.clientX - dragOffset.x - containerRect.left) / containerRect.width) * 100;
      const newY = ((e.clientY - dragOffset.y - containerRect.top) / containerRect.height) * 100;

      // Clamp to container bounds
      const clampedX = Math.max(5, Math.min(95, newX));
      const clampedY = Math.max(5, Math.min(95, newY));

      onPositionChange(id, { x: clampedX, y: clampedY });
    };

    const handleMouseUp = (): void => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, id, dragOffset, containerRef, onPositionChange]);

  // Handle touch events for mobile drag
  const handleTouchStart = useCallback((e: React.TouchEvent): void => {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const container = containerRef.current;
    if (!container || !bubbleRef.current) return;

    const bubbleRect = bubbleRef.current.getBoundingClientRect();
    const bubbleCenterX = bubbleRect.left + bubbleRect.width / 2;
    const bubbleCenterY = bubbleRect.top + bubbleRect.height / 2;

    setDragOffset({
      x: touch.clientX - bubbleCenterX,
      y: touch.clientY - bubbleCenterY,
    });

    setIsDragging(true);
    setHasDragged(false);
  }, [containerRef]);

  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent): void => {
      if (e.touches.length !== 1) return;

      setHasDragged(true);
      const touch = e.touches[0];
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();

      const newX = ((touch.clientX - dragOffset.x - containerRect.left) / containerRect.width) * 100;
      const newY = ((touch.clientY - dragOffset.y - containerRect.top) / containerRect.height) * 100;

      const clampedX = Math.max(5, Math.min(95, newX));
      const clampedY = Math.max(5, Math.min(95, newY));

      onPositionChange(id, { x: clampedX, y: clampedY });
    };

    const handleTouchEnd = (): void => {
      setIsDragging(false);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, id, dragOffset, containerRef, onPositionChange]);

  // Handle click to expand (only if not dragged significantly)
  const handleClick = (e: React.MouseEvent): void => {
    if (hasDragged) return;
    e.preventDefault();
    e.stopPropagation();
    onExpand(id);
  };

  return (
    <div
      ref={bubbleRef}
      className={cn(
        'absolute transform -translate-x-1/2 -translate-y-1/2 transition-all',
        'rounded-full flex items-center justify-center p-3 text-center',
        'backdrop-blur-md bg-white/30 border border-white/40',
        'cursor-grab select-none',
        size.className,
        isDragging ? [
          'cursor-grabbing z-50 scale-110 shadow-2xl',
          'ring-2 ring-purple-400/50',
        ] : [
          'shadow-lg hover:bg-white/50 hover:scale-105 hover:shadow-xl hover:z-40',
          'animate-float',
        ],
        isOtherExpanded && 'opacity-40 pointer-events-none',
        'duration-200'
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        animationDelay: isDragging ? '0s' : animationDelay,
        animationDuration: `${4 + (index % 3)}s`,
        animationPlayState: isDragging ? 'paused' : 'running',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      onMouseEnter={() => !isDragging && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        className={cn(
          'text-xs font-medium text-foreground/80 line-clamp-3 transition-colors pointer-events-none',
          isHovered && 'text-foreground'
        )}
      >
        {displayTitle}
      </span>

      {/* Similar notes button (visible on hover, not while dragging) */}
      {isHovered && !isDragging && (
        <button
          onClick={handleSimilarClick}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg hover:bg-purple-600 transition-colors z-10"
          title="Find similar ideas"
        >
          <Sparkles className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
