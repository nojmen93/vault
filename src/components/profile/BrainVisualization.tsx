'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface BrainVisualizationProps {
  isActive?: boolean;
  className?: string;
}

// Minimalist brain outline path - single continuous line
const BRAIN_PATH = `
  M 50 15
  C 35 15 25 25 25 35
  C 25 38 26 41 28 44
  C 22 46 18 52 18 58
  C 18 65 23 71 30 73
  C 30 78 35 82 42 83
  C 44 87 47 90 50 90
  C 53 90 56 87 58 83
  C 65 82 70 78 70 73
  C 77 71 82 65 82 58
  C 82 52 78 46 72 44
  C 74 41 75 38 75 35
  C 75 25 65 15 50 15
  M 50 25
  C 50 25 45 30 45 40
  C 45 50 50 55 50 55
  M 50 55
  C 50 55 55 50 55 40
  C 55 30 50 25 50 25
  M 35 45
  C 35 45 40 50 40 58
  M 65 45
  C 65 45 60 50 60 58
  M 38 65
  C 38 65 44 70 50 70
  C 56 70 62 65 62 65
`;

export function BrainVisualization({
  isActive = true,
  className,
}: BrainVisualizationProps): React.ReactElement {
  const [isDrawn, setIsDrawn] = useState(false);

  useEffect(() => {
    // Trigger draw animation on mount
    const timer = setTimeout(() => setIsDrawn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Pulsing glow effect behind */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center pointer-events-none',
          isActive && 'animate-glow'
        )}
      >
        <div className="w-32 h-32 rounded-full bg-white/5 blur-xl" />
      </div>

      {/* Brain SVG */}
      <svg
        viewBox="0 0 100 100"
        className={cn(
          'w-48 h-48 transition-all duration-1000',
          isDrawn ? 'opacity-100' : 'opacity-0',
          isActive && 'animate-breathe'
        )}
      >
        {/* Main brain outline */}
        <path
          d={BRAIN_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            'text-neutral-400 transition-all duration-[3000ms]',
            isDrawn ? 'brain-drawn' : 'brain-hidden',
            isActive && 'drop-shadow-glow'
          )}
        />

        {/* Inner details - subtle */}
        <circle
          cx="40"
          cy="45"
          r="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.4"
          className={cn(
            'text-neutral-500/50 transition-all duration-[3500ms] delay-500',
            isDrawn ? 'opacity-100' : 'opacity-0'
          )}
        />
        <circle
          cx="60"
          cy="45"
          r="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.4"
          className={cn(
            'text-neutral-500/50 transition-all duration-[3500ms] delay-700',
            isDrawn ? 'opacity-100' : 'opacity-0'
          )}
        />
      </svg>
    </div>
  );
}
