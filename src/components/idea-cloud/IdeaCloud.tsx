'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
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
  const radius = 25 + (index % 4) * 12;
  const angle = (seed % 360) * (Math.PI / 180);
  const centerX = 50;
  const centerY = 50;
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  return {
    x: Math.max(15, Math.min(85, x)),
    y: Math.max(15, Math.min(85, y)),
  };
}

// Placeholder bubble for empty state
function PlaceholderBubble({ index, delay }: { index: number; delay: number }): React.ReactElement {
  const positions = [
    { x: 30, y: 35 },
    { x: 70, y: 40 },
    { x: 50, y: 65 },
    { x: 25, y: 60 },
    { x: 75, y: 30 },
  ];
  const pos = positions[index % positions.length];
  const size = 70 + (index % 3) * 20;

  return (
    <motion.div
      className="absolute rounded-full bg-gradient-to-br from-purple-100/40 to-blue-100/40 backdrop-blur-sm border border-white/30 flex items-center justify-center"
      style={{
        width: size,
        height: size,
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0.3, 0.5, 0.3],
        scale: [0.95, 1, 0.95],
        y: [-5, 5, -5],
      }}
      transition={{
        opacity: { duration: 4, repeat: Infinity, delay },
        scale: { duration: 4, repeat: Infinity, delay },
        y: { duration: 6, repeat: Infinity, delay: delay * 0.5, ease: 'easeInOut' },
      }}
    >
      <Plus className="h-5 w-5 text-purple-300/60" />
    </motion.div>
  );
}

export function IdeaCloud({ notes }: IdeaCloudProps): React.ReactElement {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const containerRef = useRef<HTMLDivElement>(null);
  const { getPosition, setPosition } = useBubblePositions();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // Track container size for pixel calculations
  useEffect(() => {
    const updateSize = (): void => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

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
    const idx = displayedNotes.findIndex(n => n.id === expandedId);
    const defaultPos = getDefaultPosition(idx >= 0 ? idx : 0);
    return getPosition(expandedId, defaultPos);
  }, [expandedId, displayedNotes, getPosition]);

  // Empty state
  if (notes.length === 0) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50/80 via-blue-50/80 to-cyan-50/80">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-purple-200/40 blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl"
            animate={{ x: [0, 25, 0], y: [0, -15, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Placeholder bubbles */}
        <div className="absolute inset-0">
          {[0, 1, 2, 3, 4].map((i) => (
            <PlaceholderBubble key={i} index={i} delay={i * 0.5} />
          ))}
        </div>

        {/* Empty state message */}
        <div className="relative flex h-full items-center justify-center">
          <motion.div
            className="text-center z-10 bg-white/60 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="h-8 w-8 text-purple-500" />
            </motion.div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Your ideas will appear here</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Capture your first thought and watch your idea cloud come to life
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <kbd className="px-2 py-1 rounded-md bg-muted/80 font-mono text-xs shadow-sm">⌘K</kbd>
              <span>to capture an idea</span>
            </div>
          </motion.div>
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
      className="relative h-full w-full overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(135deg, rgba(243, 232, 255, 0.8) 0%, rgba(219, 234, 254, 0.8) 50%, rgba(207, 250, 254, 0.8) 100%)',
      }}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-purple-200/50 blur-[100px]"
          animate={{
            x: [0, 40, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 -right-32 h-[400px] w-[400px] rounded-full bg-blue-200/50 blur-[80px]"
          animate={{
            x: [0, -30, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 left-1/4 h-[450px] w-[450px] rounded-full bg-cyan-200/50 blur-[90px]"
          animate={{
            x: [0, 35, 0],
            y: [0, -25, 0],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 h-[300px] w-[300px] rounded-full bg-pink-200/30 blur-[70px]"
          style={{ transform: 'translate(-50%, -50%)' }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Floating bubbles */}
      <AnimatePresence>
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
                isHoveredOther={hoveredId !== null && hoveredId !== note.id}
                onHoverStart={() => setHoveredId(note.id)}
                onHoverEnd={() => setHoveredId(null)}
                containerSize={containerSize}
                isMobile={isMobile}
              />
            );
          })}
        </div>
      </AnimatePresence>

      {/* Show count if more than 20 */}
      {notes.length > 20 && (
        <motion.div
          className="absolute bottom-4 right-4 rounded-full bg-white/70 backdrop-blur-sm px-4 py-2 text-xs text-muted-foreground shadow-lg border border-white/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          +{notes.length - 20} more ideas
        </motion.div>
      )}

      {/* Expanded widget */}
      <AnimatePresence>
        {expandedNote && (
          <IdeaExpandedWidget
            note={expandedNote}
            position={expandedPosition}
            onClose={handleCloseExpanded}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
