'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, LayoutGrid, Cloud } from 'lucide-react';
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

// Generate random position for first load - stay well within bounds
function getRandomPosition(index: number): Position {
  // Use golden angle for nice distribution
  const seed = index * 137.5;
  const radius = 12 + (index % 4) * 8; // Smaller radius to keep closer to center
  const angle = (seed % 360) * (Math.PI / 180);
  const centerX = 50;
  const centerY = 50;
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  // Keep bubbles well within bounds (18-82% range accounts for bubble size)
  return {
    x: Math.max(18, Math.min(82, x)),
    y: Math.max(18, Math.min(82, y)),
  };
}

// Generate grid position based on index and container size
function getGridPosition(index: number, total: number, containerWidth: number, containerHeight: number): Position {
  // Calculate optimal columns based on container aspect ratio
  const aspectRatio = containerWidth / containerHeight;
  const cols = Math.max(2, Math.min(5, Math.ceil(Math.sqrt(total * aspectRatio))));
  const rows = Math.ceil(total / cols);

  const col = index % cols;
  const row = Math.floor(index / cols);

  // Calculate spacing with padding from edges
  const paddingX = 15; // percentage from edges
  const paddingY = 15;
  const usableWidth = 100 - (paddingX * 2);
  const usableHeight = 100 - (paddingY * 2);

  const cellWidth = usableWidth / cols;
  const cellHeight = usableHeight / rows;

  return {
    x: paddingX + (col * cellWidth) + (cellWidth / 2),
    y: paddingY + (row * cellHeight) + (cellHeight / 2),
  };
}

// Placeholder bubble for empty state - positioned within safe area
function PlaceholderBubble({ index, delay }: { index: number; delay: number }): React.ReactElement {
  const positions = [
    { x: 35, y: 35 },
    { x: 65, y: 38 },
    { x: 50, y: 55 },
    { x: 30, y: 52 },
    { x: 68, y: 58 },
  ];
  const pos = positions[index % positions.length];
  const size = 50 + (index % 3) * 12;
  const grayShade = 0.15 + (index % 3) * 0.05;

  return (
    <motion.div
      className="absolute rounded-full backdrop-blur-sm border border-white/5 flex items-center justify-center"
      style={{
        width: size,
        height: size,
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        backgroundColor: `rgba(255, 255, 255, ${grayShade})`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0.2, 0.4, 0.2],
        scale: [0.95, 1, 0.95],
        y: [-4, 4, -4],
      }}
      transition={{
        opacity: { duration: 5, repeat: Infinity, delay },
        scale: { duration: 5, repeat: Infinity, delay },
        y: { duration: 7, repeat: Infinity, delay: delay * 0.5, ease: 'easeInOut' },
      }}
    >
      <Plus className="h-4 w-4 text-white/30" />
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
  const [isGridMode, setIsGridMode] = useState(false);

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
    const defaultPos = getRandomPosition(idx >= 0 ? idx : 0);
    return getPosition(expandedId, defaultPos);
  }, [expandedId, displayedNotes, getPosition]);

  // Empty state
  if (notes.length === 0) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#0a0a0a]">
        {/* Subtle ambient glow */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full blur-[150px]"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
            animate={{
              x: [0, 30, 0],
              y: [0, 20, 0],
              opacity: [0.03, 0.05, 0.03],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full blur-[120px]"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
            animate={{
              x: [0, -20, 0],
              y: [0, 30, 0],
              opacity: [0.02, 0.04, 0.02],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Placeholder bubbles */}
        <div className="absolute inset-0">
          {[0, 1, 2, 3, 4].map((i) => (
            <PlaceholderBubble key={i} index={i} delay={i * 0.6} />
          ))}
        </div>

        {/* Empty state message */}
        <div className="relative flex h-full items-center justify-center">
          <motion.div
            className="text-center z-10 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="mx-auto mb-4 h-16 w-16 rounded-full bg-white/10 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Sparkles className="h-7 w-7 text-white/60" />
            </motion.div>
            <h3 className="text-lg font-medium text-white/90 mb-2">Your ideas will appear here</h3>
            <p className="text-sm text-white/50 mb-4 max-w-xs">
              Capture your first thought and watch your idea cloud come to life
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-white/40">
              <kbd className="px-2 py-1 rounded-md bg-white/10 font-mono text-xs">⌘K</kbd>
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
      className="relative h-full w-full overflow-hidden rounded-2xl bg-[#0a0a0a]"
    >
      {/* Subtle ambient glow - grayscale only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full blur-[150px]"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
          animate={{
            x: [0, 40, 0],
            y: [0, 30, 0],
            opacity: [0.04, 0.06, 0.04],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 -right-20 h-[400px] w-[400px] rounded-full blur-[120px]"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
          animate={{
            x: [0, -30, 0],
            y: [0, 40, 0],
            opacity: [0.03, 0.05, 0.03],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-20 left-1/3 h-[350px] w-[350px] rounded-full blur-[100px]"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.025)' }}
          animate={{
            x: [0, 35, 0],
            y: [0, -25, 0],
            opacity: [0.025, 0.04, 0.025],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Layout toggle button */}
      <motion.button
        onClick={() => setIsGridMode(!isGridMode)}
        className="absolute top-4 right-4 z-20 rounded-full bg-white/10 backdrop-blur-sm p-2.5 text-white/70 border border-white/10 hover:bg-amber-600/30 hover:text-amber-300 hover:border-amber-500/30 transition-colors"
        title={isGridMode ? 'Switch to cloud view' : 'Organize in grid'}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isGridMode ? <Cloud className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
      </motion.button>

      {/* Floating bubbles */}
      <AnimatePresence>
        <div className="relative h-full w-full">
          {displayedNotes.map((note, index) => {
            // Use grid position when in grid mode, otherwise use saved/random position
            const position = isGridMode
              ? getGridPosition(index, displayedNotes.length, containerSize.width, containerSize.height)
              : getPosition(note.id, getRandomPosition(index));

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
                onPositionChange={isGridMode ? () => {} : handlePositionChange}
                onExpand={handleExpand}
                isOtherExpanded={expandedId !== null && expandedId !== note.id}
                isHoveredOther={hoveredId !== null && hoveredId !== note.id}
                onHoverStart={() => setHoveredId(note.id)}
                onHoverEnd={() => setHoveredId(null)}
                containerSize={containerSize}
                isMobile={isMobile || isGridMode}
              />
            );
          })}
        </div>
      </AnimatePresence>

      {/* Show count if more than 20 */}
      {notes.length > 20 && (
        <motion.div
          className="absolute bottom-4 right-4 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-xs text-white/60 border border-white/10"
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
