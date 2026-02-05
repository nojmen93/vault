'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function IdeaCloudSkeleton(): React.ReactElement {
  return (
    <div className="relative h-full w-full rounded-xl bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-slate-900 dark:via-purple-900/10 dark:to-blue-900/10 overflow-hidden">
      {/* Floating bubble skeletons */}
      {[...Array(8)].map((_, i) => {
        // Generate pseudo-random positions
        const seed = i * 137.5;
        const radius = 30 + (i % 3) * 15;
        const angle = (seed % 360) * (Math.PI / 180);
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        const size = 80 + (i % 3) * 24;

        return (
          <Skeleton
            key={i}
            className="absolute rounded-full"
            style={{
              top: `${Math.max(10, Math.min(85, y))}%`,
              left: `${Math.max(10, Math.min(85, x))}%`,
              width: `${size}px`,
              height: `${size}px`,
              transform: 'translate(-50%, -50%)',
              opacity: 0.5 - i * 0.05,
            }}
          />
        );
      })}
    </div>
  );
}
