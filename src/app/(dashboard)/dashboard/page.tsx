import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getNotes } from "@/actions/notes.actions";
import { IdeaCloud, IdeaCloudSkeleton } from "@/components/idea-cloud";
import { Skeleton } from "@/components/ui/skeleton";

async function DashboardContent(): Promise<React.ReactElement> {
  const result = await getNotes();
  const notes = result.success ? result.data : [];

  return (
    <>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Ideas</h1>
          <p className="text-sm text-muted-foreground">
            {notes.length} {notes.length === 1 ? 'idea' : 'ideas'} in your vault
          </p>
        </div>
      </div>

      {/* Idea Cloud */}
      <div className="flex-1 min-h-0">
        <IdeaCloud notes={notes} />
      </div>
    </>
  );
}

function DashboardSkeleton(): React.ReactElement {
  return (
    <>
      {/* Header skeleton */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      {/* Idea Cloud skeleton */}
      <div className="flex-1 min-h-0">
        <IdeaCloudSkeleton />
      </div>
    </>
  );
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
