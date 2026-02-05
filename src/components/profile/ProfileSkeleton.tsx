'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function ProfileSkeleton(): React.ReactElement {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32 mb-4" />

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        </div>

        {/* Radar chart placeholder */}
        <div className="hidden md:flex items-center justify-center">
          <Skeleton className="h-64 w-64 rounded-full" />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {/* Background section */}
        <div className="rounded-xl border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="space-y-3 pt-2">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-20 mt-4" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>
          </div>
        </div>

        {/* How You Think section */}
        <div className="rounded-xl border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-5 w-28" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
          <div className="space-y-3 pt-2">
            <Skeleton className="h-20 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>

        {/* Collapsed sections */}
        <div className="rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-5 w-36" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-10" />
      </div>
    </div>
  );
}
