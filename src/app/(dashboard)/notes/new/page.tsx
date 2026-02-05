import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NoteEditor } from "@/components/notes/NoteEditor";

export default async function NewNotePage(): Promise<React.ReactElement> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Note</h1>
      <NoteEditor />
    </div>
  );
}
