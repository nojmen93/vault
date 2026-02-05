'use client';

import { useRef, useMemo, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, PanInfo } from 'framer-motion';
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
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Calculate pixel position from percentage
  const pixelX = (position.x / 100) * containerSize.width;
  const pixelY = (position.y / 100) * containerSize.height;

  // Motion values for smooth dragging
  const x = useMotionValue(pixelX);
  const y = useMotionValue(pixelY);

  // Spring physics for smooth release with momentum
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Update motion values when position prop changes (not during drag)
  useMemo(() => {
    if (!isDragging.current) {
      x.set(pixelX);
      y.set(pixelY);
    }
  }, [pixelX, pixelY, x, y]);

  // Size based on content length (min 80px, max 180px)
  const size = useMemo(() => {
    const len = content.length;
    if (len > 300) return 180;
    if (len > 200) return 160;
    if (len > 100) return 130;
    if (len > 50) return 110;
    return 90;
  }, [content.length]);

  // Unique animation parameters per bubble
  const floatDuration = useMemo(() => 12 + (index % 8) * 1.5, [index]);
  const floatDelay = useMemo(() => (index * 0.7) % 5, [index]);
  const pulseDelay = useMemo(() => (index * 0.4) % 3, [index]);

  // Depth effect - further bubbles are smaller/faded
  const depthScale = useMemo(() => 0.9 + (index % 5) * 0.025, [index]);
  const depthOpacity = useMemo(() => 0.85 + (index % 5) * 0.03, [index]);

  // Gradient colors based on index
  const gradientColors = useMemo(() => {
    const palettes = [
      ['from-purple-200/90', 'to-blue-200/80'],
      ['from-blue-200/90', 'to-cyan-200/80'],
      ['from-cyan-200/90', 'to-teal-200/80'],
      ['from-pink-200/90', 'to-purple-200/80'],
      ['from-amber-200/90', 'to-orange-200/80'],
    ];
    return palettes[index % palettes.length];
  }, [index]);

  const preview = content.length > 40 ? content.substring(0, 40) + '...' : content;
  const displayTitle = title || preview;

  const handleSimilarClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    openSimilarNotes(id);
  };

  const handleDragStart = useCallback(() => {
    if (isMobile) return;
    isDragging.current = true;
    hasDragged.current = false;
    dragStartPos.current = { x: x.get(), y: y.get() };
  }, [isMobile, x, y]);

  const handleDrag = useCallback((_: unknown, info: PanInfo) => {
    if (isMobile) return;

    const deltaX = Math.abs(info.offset.x);
    const deltaY = Math.abs(info.offset.y);
    if (deltaX > 5 || deltaY > 5) {
      hasDragged.current = true;
    }
  }, [isMobile]);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (isMobile) return;

    isDragging.current = false;

    // Calculate final position with momentum
    const velocityFactor = 0.1;
    let finalX = x.get() + info.velocity.x * velocityFactor;
    let finalY = y.get() + info.velocity.y * velocityFactor;

    // Elastic snap-back if out of bounds
    const padding = size / 2 + 20;
    const minX = padding;
    const maxX = containerSize.width - padding;
    const minY = padding;
    const maxY = containerSize.height - padding;

    // Apply elastic bounds
    if (finalX < minX) finalX = minX + (finalX - minX) * 0.3;
    if (finalX > maxX) finalX = maxX + (finalX - maxX) * 0.3;
    if (finalY < minY) finalY = minY + (finalY - minY) * 0.3;
    if (finalY > maxY) finalY = maxY + (finalY - maxY) * 0.3;

    // Clamp to valid range
    finalX = Math.max(minX, Math.min(maxX, finalX));
    finalY = Math.max(minY, Math.min(maxY, finalY));

    // Update springs for smooth momentum
    springX.set(finalX);
    springY.set(finalY);

    // Convert back to percentage and save
    const newPosition = {
      x: (finalX / containerSize.width) * 100,
      y: (finalY / containerSize.height) * 100,
    };
    onPositionChange(id, newPosition);
  }, [isMobile, x, y, springX, springY, containerSize, size, id, onPositionChange]);

  const handleClick = useCallback(() => {
    if (!hasDragged.current) {
      onExpand(id);
    }
    hasDragged.current = false;
  }, [id, onExpand]);

  return (
    <motion.div
      className={cn(
        'absolute select-none touch-none',
        'rounded-full flex items-center justify-center p-4 text-center',
        'bg-gradient-to-br backdrop-blur-md',
        'border border-white/50',
        gradientColors[0],
        gradientColors[1],
        !isMobile && 'cursor-grab active:cursor-grabbing',
        isMobile && 'cursor-pointer',
      )}
      style={{
        width: size,
        height: size,
        x: isMobile ? pixelX - size / 2 : springX,
        y: isMobile ? pixelY - size / 2 : springY,
        marginLeft: isMobile ? 0 : -size / 2,
        marginTop: isMobile ? 0 : -size / 2,
        willChange: 'transform',
        transform: 'translateZ(0)',
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.08),
          0 0 60px rgba(147, 51, 234, 0.1),
          inset 0 1px 1px rgba(255, 255, 255, 0.4)
        `,
      }}
      drag={!isMobile && !isOtherExpanded}
      dragMomentum={false}
      dragElastic={0.1}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: isOtherExpanded ? 0.3 : isHoveredOther ? 0.6 : depthOpacity,
        scale: depthScale,
      }}
      whileHover={!isMobile ? {
        scale: depthScale * 1.08,
        boxShadow: `
          0 12px 40px rgba(0, 0, 0, 0.12),
          0 0 80px rgba(147, 51, 234, 0.2),
          inset 0 1px 1px rgba(255, 255, 255, 0.5)
        `,
      } : undefined}
      whileDrag={{
        scale: depthScale * 1.05,
        boxShadow: `
          0 20px 60px rgba(0, 0, 0, 0.15),
          0 0 100px rgba(147, 51, 234, 0.25),
          inset 0 1px 1px rgba(255, 255, 255, 0.6)
        `,
        zIndex: 100,
      }}
      transition={{
        opacity: { duration: 0.3 },
        scale: { type: 'spring', damping: 20, stiffness: 300 },
      }}
    >
      {/* Floating animation wrapper */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          y: [-4, 4, -4],
          x: [-2, 2, -2],
        }}
        transition={{
          duration: floatDuration,
          delay: floatDelay,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          animationPlayState: isDragging.current ? 'paused' : 'running',
        }}
      />

      {/* Pulse animation */}
      <motion.div
        className="absolute inset-0 rounded-full bg-white/10"
        animate={{
          scale: [1, 1.02, 1],
          opacity: [0.5, 0.3, 0.5],
        }}
        transition={{
          duration: 3.5,
          delay: pulseDelay,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Content */}
      <span
        className="text-xs font-medium text-foreground/80 line-clamp-3 z-10 pointer-events-none px-1"
        style={{ fontSize: size < 100 ? '10px' : '12px' }}
      >
        {displayTitle}
      </span>

      {/* Similar notes button */}
      <motion.button
        onClick={handleSimilarClick}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg hover:bg-purple-600 transition-colors z-20"
        title="Find similar ideas"
        initial={{ opacity: 0, scale: 0 }}
        whileHover={{ scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Sparkles className="h-3 w-3" />
      </motion.button>
    </motion.div>
  );
}
