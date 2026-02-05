import { Suspense } from 'react';
import { getNotes } from '@/actions/notes.actions';
import { IncubatorPanel } from '@/components/incubator/IncubatorPanel';
import { IncubatorSkeleton } from '@/components/incubator/IncubatorSkeleton';

export const metadata = {
  title: 'Incubator | Vault',
  description: 'Analyze and develop your ideas with AI',
};

async function IncubatorContent(): Promise<React.ReactElement> {
  const result = await getNotes();
  const notes = result.success ? result.data : [];

  return <IncubatorPanel notes={notes} />;
}

export default function IncubatorPage(): React.ReactElement {
  return (
    <div className="h-full">
      <Suspense fallback={<IncubatorSkeleton />}>
        <IncubatorContent />
      </Suspense>
    </div>
  );
}
