'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface IdeaBubbleProps {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  index: number;
  total: number;
}

export function IdeaBubble({
  id,
  title,
  content,
  createdAt,
  index,
  total,
}: IdeaBubbleProps): React.ReactElement {
  const [isHovered, setIsHovered] = useState(false);

  // Generate pseudo-random position based on index
  const getPosition = (): { top: string; left: string } => {
    const seed = index * 137.5; // Golden angle for distribution
    const radius = 30 + (index % 3) * 15; // Vary distance from center
    const angle = (seed % 360) * (Math.PI / 180);
    const centerX = 50;
    const centerY = 50;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return {
      top: `${Math.max(10, Math.min(85, y))}%`,
      left: `${Math.max(10, Math.min(85, x))}%`,
    };
  };

  // Vary bubble size based on content length
  const getSize = (): string => {
    const len = content.length;
    if (len > 200) return 'h-32 w-32';
    if (len > 100) return 'h-28 w-28';
    if (len > 50) return 'h-24 w-24';
    return 'h-20 w-20';
  };

  // Animation delay based on index
  const animationDelay = `${(index * 0.3) % 3}s`;

  const position = getPosition();
  const size = getSize();

  const preview = content.length > 40 ? content.substring(0, 40) + '...' : content;
  const displayTitle = title || preview;

  return (
    <Link
      href={`/dashboard/notes/${id}`}
      className={cn(
        'absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300',
        'rounded-full flex items-center justify-center p-3 text-center',
        'backdrop-blur-md bg-white/30 border border-white/40 shadow-lg',
        'hover:bg-white/50 hover:scale-110 hover:shadow-xl hover:z-50',
        'cursor-pointer animate-float',
        size
      )}
      style={{
        top: position.top,
        left: position.left,
        animationDelay,
        animationDuration: `${4 + (index % 3)}s`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        className={cn(
          'text-xs font-medium text-foreground/80 line-clamp-3 transition-colors',
          isHovered && 'text-foreground'
        )}
      >
        {displayTitle}
      </span>
    </Link>
  );
}
