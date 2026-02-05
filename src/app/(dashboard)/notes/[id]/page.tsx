import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NoteEditor } from "@/components/notes/NoteEditor";

interface NotePageProps {
  params: Promise<{ id: string }>;
}

export default async function NotePage({
  params,
}: NotePageProps): Promise<React.ReactElement> {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <NoteEditor noteId={id} />
    </div>
  );
}
