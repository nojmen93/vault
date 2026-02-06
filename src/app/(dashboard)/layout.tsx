import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { QuickCaptureProvider, QuickCaptureModal } from "@/components/quick-capture";
import { SimilarNotesProvider, SimilarNotesModal } from "@/components/similar-notes";
import { DeleteConfirmationProvider, DeleteConfirmationModal } from "@/components/delete-confirmation";
import { ProfileMilestoneNotifier } from "@/components/profile";
import { getNotes } from "@/actions/notes.actions";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps): Promise<React.ReactElement> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Fetch notes for sidebar history
  const notesResult = await getNotes();
  const historyNotes = notesResult.success
    ? notesResult.data.map((note) => ({
        id: note.id,
        title: note.title,
        createdAt: note.createdAt,
      }))
    : [];

  return (
    <QuickCaptureProvider>
      <SimilarNotesProvider>
        <DeleteConfirmationProvider>
          <div className="flex h-screen">
            <Sidebar notes={historyNotes} />
            <div className="flex flex-1 flex-col">
              <Header />
              <main className="flex-1 overflow-auto p-6">{children}</main>
            </div>
          </div>
          <QuickCaptureModal />
          <SimilarNotesModal />
          <DeleteConfirmationModal />
          <ProfileMilestoneNotifier />
        </DeleteConfirmationProvider>
      </SimilarNotesProvider>
    </QuickCaptureProvider>
  );
}
