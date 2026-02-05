'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function ChatSkeleton(): React.ReactElement {
  return (
    <div className="flex h-full flex-col">
      {/* Messages skeleton */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="flex flex-col-reverse gap-4 py-4">
          {/* Simulate several message bubbles */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-end">
              <div className="max-w-[70%]">
                <Skeleton
                  className="h-20 rounded-2xl rounded-br-md"
                  style={{ width: `${200 + (i % 3) * 80}px` }}
                />
                <div className="flex justify-end mt-1">
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input area skeleton */}
      <div className="border-t bg-background p-4">
        <div className="flex items-end gap-2">
          <Skeleton className="h-11 flex-1 rounded-md" />
          <Skeleton className="h-11 w-11 rounded-full shrink-0" />
        </div>
        <Skeleton className="h-4 w-48 mt-2" />
      </div>
    </div>
  );
}
