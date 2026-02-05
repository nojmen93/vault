import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NotesList } from "@/components/notes/NotesList";

export default async function NotesPage(): Promise<React.ReactElement> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notes</h1>
      </div>
      <NotesList />
    </div>
  );
}
