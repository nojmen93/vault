import { Suspense } from 'react';
import { getNotes, getNoteById } from '@/actions/notes.actions';
import { IncubatorPanel } from '@/components/incubator/IncubatorPanel';
import { IncubatorSkeleton } from '@/components/incubator/IncubatorSkeleton';

export const metadata = {
  title: 'Incubator | Vault',
  description: 'Analyze and develop your ideas with AI',
};

interface IncubatorPageProps {
  searchParams: Promise<{ noteId?: string; idea?: string }>;
}

async function IncubatorContent({
  noteId,
  ideaText
}: {
  noteId?: string;
  ideaText?: string;
}): Promise<React.ReactElement> {
  const result = await getNotes();
  const notes = result.success ? result.data : [];

  // If noteId provided, pre-select that note
  let preSelectedNoteId: string | undefined;
  if (noteId) {
    const noteResult = await getNoteById(noteId);
    if (noteResult.success) {
      preSelectedNoteId = noteId;
    }
  }

  return (
    <IncubatorPanel
      notes={notes}
      preSelectedNoteId={preSelectedNoteId}
      initialIdeaText={ideaText}
    />
  );
}

export default async function IncubatorPage({
  searchParams
}: IncubatorPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const noteId = params.noteId;
  const ideaText = params.idea;

  return (
    <div className="h-full">
      <Suspense fallback={<IncubatorSkeleton />}>
        <IncubatorContent noteId={noteId} ideaText={ideaText} />
      </Suspense>
    </div>
  );
}
