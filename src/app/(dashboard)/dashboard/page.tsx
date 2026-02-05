import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getNotes } from "@/actions/notes.actions";
import { IdeaCloud } from "@/components/idea-cloud";

export default async function DashboardPage(): Promise<React.ReactElement> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const result = await getNotes();
  const notes = result.success ? result.data : [];

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Ideas</h1>
          <p className="text-sm text-muted-foreground">
            {notes.length} {notes.length === 1 ? 'idea' : 'ideas'} in your vault
          </p>
        </div>
      </div>

      {/* Idea Cloud */}
      <div className="flex-1 min-h-[500px]">
        <IdeaCloud notes={notes} />
      </div>
    </div>
  );
}
