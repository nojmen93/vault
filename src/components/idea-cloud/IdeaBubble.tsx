'use client';

import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  isHoveredOther: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  containerSize: { width: number; height: number };
  isMobile: boolean;
}

// Grayscale palette
const GRAY_COLORS = [
  'rgba(229, 229, 229, 0.8)', // #e5e5e5
  'rgba(212, 212, 212, 0.8)', // #d4d4d4
  'rgba(163, 163, 163, 0.75)', // #a3a3a3
  'rgba(115, 115, 115, 0.75)', // #737373
  'rgba(82, 82, 82, 0.7)', // #525252
  'rgba(64, 64, 64, 0.7)', // #404040
];

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
  isHoveredOther,
  onHoverStart,
  onHoverEnd,
  containerSize,
  isMobile,
}: IdeaBubbleProps): React.ReactElement {
  const { openModal: openSimilarNotes } = useSimilarNotes();
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [currentPos, setCurrentPos] = useState(position);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Sync position from props when not dragging
  useEffect(() => {
    if (!isDragging) {
      setCurrentPos(position);
    }
  }, [position, isDragging]);

  // Size based on content length (min 80px, max 160px)
  const size = useMemo(() => {
    const len = content.length;
    if (len > 300) return 160;
    if (len > 200) return 140;
    if (len > 100) return 120;
    if (len > 50) return 100;
    return 85;
  }, [content.length]);

  // Random gray color based on index
  const bgColor = useMemo(() => {
    return GRAY_COLORS[index % GRAY_COLORS.length];
  }, [index]);

  // Unique animation parameters per bubble
  const floatDuration = useMemo(() => 10 + (index % 6) * 2, [index]);
  const floatDelay = useMemo(() => (index * 0.5) % 4, [index]);

  const preview = content.length > 35 ? content.substring(0, 35) + '...' : content;
  const displayTitle = title || preview;

  const handleSimilarClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    openSimilarNotes(id);
  };

  // Pointer down - start drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isMobile || isOtherExpanded) return;

    e.preventDefault();
    e.stopPropagation();

    const element = bubbleRef.current;
    if (!element) return;

    // Capture pointer for smooth tracking
    element.setPointerCapture(e.pointerId);

    // Calculate offset from pointer to bubble center
    const rect = element.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    };

    setIsDragging(true);
    setHasDragged(false);
  }, [isMobile, isOtherExpanded]);

  // Pointer move - update position
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    e.preventDefault();

    const container = bubbleRef.current?.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    // Calculate position relative to container
    const x = e.clientX - containerRect.left - dragOffset.current.x;
    const y = e.clientY - containerRect.top - dragOffset.current.y;

    // Convert to percentage
    const xPercent = (x / containerRect.width) * 100;
    const yPercent = (y / containerRect.height) * 100;

    // Clamp to edges (keep bubble visible)
    const padding = (size / 2 / containerRect.width) * 100;
    const clampedX = Math.max(padding, Math.min(100 - padding, xPercent));
    const clampedY = Math.max(padding, Math.min(100 - padding, yPercent));

    setCurrentPos({ x: clampedX, y: clampedY });
    setHasDragged(true);
  }, [isDragging, size]);

  // Pointer up - end drag and save
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    const element = bubbleRef.current;
    if (element) {
      element.releasePointerCapture(e.pointerId);
    }

    setIsDragging(false);

    // Save final position
    if (hasDragged) {
      onPositionChange(id, currentPos);
    }
  }, [isDragging, hasDragged, id, currentPos, onPositionChange]);

  // Click to expand (only if didn't drag)
  const handleClick = useCallback(() => {
    if (!hasDragged) {
      onExpand(id);
    }
    setHasDragged(false);
  }, [hasDragged, id, onExpand]);

  // Calculate pixel position
  const pixelX = (currentPos.x / 100) * containerSize.width;
  const pixelY = (currentPos.y / 100) * containerSize.height;

  return (
    <motion.div
      ref={bubbleRef}
      className={cn(
        'absolute select-none touch-none',
        'rounded-full flex items-center justify-center p-3 text-center',
        'backdrop-blur-md border border-white/10',
        !isMobile && !isOtherExpanded && 'cursor-grab',
        isDragging && 'cursor-grabbing',
        isMobile && 'cursor-pointer',
      )}
      style={{
        width: size,
        height: size,
        left: pixelX,
        top: pixelY,
        transform: 'translate(-50%, -50%)',
        backgroundColor: bgColor,
        willChange: 'transform',
        boxShadow: isDragging
          ? '0 0 40px rgba(255, 255, 255, 0.2), 0 20px 40px rgba(0, 0, 0, 0.4)'
          : '0 0 20px rgba(255, 255, 255, 0.05), 0 8px 24px rgba(0, 0, 0, 0.3)',
        zIndex: isDragging ? 100 : 'auto',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: isOtherExpanded ? 0.3 : isHoveredOther ? 0.5 : 1,
        scale: isDragging ? 1.05 : 1,
      }}
      whileHover={!isMobile && !isDragging ? {
        scale: 1.05,
        boxShadow: '0 0 50px rgba(255, 255, 255, 0.25), 0 12px 32px rgba(0, 0, 0, 0.4)',
      } : undefined}
      transition={{
        opacity: { duration: 0.2 },
        scale: { type: 'spring', damping: 20, stiffness: 300 },
      }}
    >
      {/* Floating animation (only when not dragging) */}
      {!isDragging && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{
            y: [-3, 3, -3],
            x: [-2, 2, -2],
          }}
          transition={{
            duration: floatDuration,
            delay: floatDelay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Content */}
      <span
        className="text-xs font-medium text-white/90 line-clamp-3 z-10 pointer-events-none px-1"
        style={{ fontSize: size < 100 ? '10px' : '11px' }}
      >
        {displayTitle}
      </span>

      {/* Similar notes button */}
      <motion.button
        onClick={handleSimilarClick}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-white/20 text-white/80 flex items-center justify-center hover:bg-white/30 transition-colors z-20 backdrop-blur-sm"
        title="Find similar ideas"
        initial={{ opacity: 0, scale: 0 }}
        whileHover={{ scale: 1.1 }}
        animate={{ opacity: 0.8, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Sparkles className="h-2.5 w-2.5" />
      </motion.button>
    </motion.div>
  );
}
