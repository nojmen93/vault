import { Suspense } from 'react';
import { getNotes } from '@/actions/notes.actions';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ChatSkeleton } from '@/components/chat/ChatSkeleton';

export const metadata = {
  title: 'Idea Stream | Vault',
  description: 'Capture ideas in a chat-style interface',
};

async function ChatContent(): Promise<React.ReactElement> {
  const result = await getNotes();
  const notes = result.success ? result.data : [];

  return <ChatInterface initialNotes={notes} />;
}

export default function ChatPage(): React.ReactElement {
  return (
    <div className="h-full -m-6">
      <Suspense fallback={<ChatSkeleton />}>
        <ChatContent />
      </Suspense>
    </div>
  );
}
