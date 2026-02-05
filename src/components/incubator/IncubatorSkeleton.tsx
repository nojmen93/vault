'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function IncubatorSkeleton(): React.ReactElement {
  return (
    <div className="grid h-full gap-6 lg:grid-cols-2">
      {/* Left panel skeleton */}
      <div className="flex flex-col rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>

        <div className="border-t p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-48 mx-auto mt-2" />
        </div>
      </div>

      {/* Right panel skeleton */}
      <div className="flex flex-col rounded-xl border bg-card">
        <div className="border-b p-4">
          <Skeleton className="h-6 w-36" />
        </div>

        <div className="flex-1 p-4">
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
              <Skeleton className="h-4 w-56 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
