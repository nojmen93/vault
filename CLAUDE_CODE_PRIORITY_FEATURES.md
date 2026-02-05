# Claude Code Task List: Priority Features

Three high-impact features to implement. Execute in order.

---

## Feature 1: Quick Capture (Cmd+K)

Global command palette for instant idea capture from anywhere in the app.

### 1.1 Install Command Component

```bash
pnpm dlx shadcn@latest add command dialog
```

### 1.2 Create Quick Capture Provider

Create `src/components/quick-capture/QuickCaptureProvider.tsx`:

```typescript
'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface QuickCaptureContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const QuickCaptureContext = createContext<QuickCaptureContextType | null>(null);

export function useQuickCapture() {
  const context = useContext(QuickCaptureContext);
  if (!context) throw new Error('useQuickCapture must be used within QuickCaptureProvider');
  return context;
}

export function QuickCaptureProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle, close]);

  return (
    <QuickCaptureContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </QuickCaptureContext.Provider>
  );
}
```

### 1.3 Create Quick Capture Modal

Create `src/components/quick-capture/QuickCaptureModal.tsx`:

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useQuickCapture } from './QuickCaptureProvider';
import { quickCaptureNote } from '@/actions/notes.actions';

export function QuickCaptureModal() {
  const { isOpen, close } = useQuickCapture();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Reset content when modal closes
  useEffect(() => {
    if (!isOpen) setContent('');
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setSaving(true);
    try {
      // Extract title from first line or first 50 chars
      const firstLine = content.split('\n')[0];
      const title = firstLine.length > 50 
        ? firstLine.substring(0, 50) + '...' 
        : firstLine;

      await quickCaptureNote({
        title,
        content: content.trim(),
      });

      close();
      router.refresh();
    } catch (error) {
      console.error('Failed to capture idea:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Quick Capture
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            ref={textareaRef}
            placeholder="What's on your mind? Just start typing..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[150px] resize-none text-base"
            disabled={saving}
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">⌘</kbd>
              {' + '}
              <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">Enter</kbd>
              {' to save'}
            </p>

            <Button onClick={handleSubmit} disabled={saving || !content.trim()}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Capture
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 1.4 Create Quick Capture Server Action

Add to `src/actions/notes.actions.ts`:

```typescript
interface QuickCaptureInput {
  title: string;
  content: string;
}

export async function quickCaptureNote(input: QuickCaptureInput) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = createAdminClient();

  // Generate embedding from content
  const embedding = await generateEmbedding(input.content);

  // For quick capture, we store plaintext temporarily
  // TODO: Implement proper client-side encryption flow
  // For now, using a simplified approach
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      title: input.title,
      encrypted_content: input.content, // TODO: Encrypt client-side
      iv: 'quick-capture', // Placeholder
      embedding,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath('/dashboard/notes');
  revalidatePath('/dashboard');
  return { success: true, note: data };
}
```

### 1.5 Create Keyboard Shortcut Hint Component

Create `src/components/quick-capture/QuickCaptureHint.tsx`:

```typescript
'use client';

import { useQuickCapture } from './QuickCaptureProvider';

export function QuickCaptureHint() {
  const { open } = useQuickCapture();

  return (
    <button
      onClick={open}
      className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-100"
    >
      <span>Quick capture</span>
      <kbd className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium">⌘K</kbd>
    </button>
  );
}
```

### 1.6 Wire Up Provider in Layout

Update `src/app/(dashboard)/layout.tsx`:

```typescript
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { QuickCaptureProvider } from '@/components/quick-capture/QuickCaptureProvider';
import { QuickCaptureModal } from '@/components/quick-capture/QuickCaptureModal';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <QuickCaptureProvider>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
      <QuickCaptureModal />
    </QuickCaptureProvider>
  );
}
```

### 1.7 Add Hint to Header

Update `src/components/layout/Header.tsx`:

```typescript
import { UserButton } from '@clerk/nextjs';
import { QuickCaptureHint } from '@/components/quick-capture/QuickCaptureHint';

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <QuickCaptureHint />
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}
```

### 1.8 Export Components

Create `src/components/quick-capture/index.ts`:

```typescript
export { QuickCaptureProvider, useQuickCapture } from './QuickCaptureProvider';
export { QuickCaptureModal } from './QuickCaptureModal';
export { QuickCaptureHint } from './QuickCaptureHint';
```

---

## Feature 2: Idea Chat Interface

Conversational UI for capturing ideas. Messages stack upward, each auto-saves as a note.

### 2.1 Create Chat Page

Create `src/app/(dashboard)/dashboard/chat/page.tsx`:

```typescript
import { Suspense } from 'react';
import { getChatNotes } from '@/actions/notes.actions';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ChatSkeleton } from '@/components/chat/ChatSkeleton';

export default async function ChatPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Idea Stream</h1>
        <p className="text-sm text-slate-500">
          Capture thoughts as they come. Each message becomes a note.
        </p>
      </div>

      <Suspense fallback={<ChatSkeleton />}>
        <ChatMessages />
      </Suspense>
    </div>
  );
}

async function ChatMessages() {
  const notes = await getChatNotes(50); // Last 50 notes
  return <ChatInterface initialNotes={notes} />;
}
```

### 2.2 Create Chat Interface Component

Create `src/components/chat/ChatInterface.tsx`:

```typescript
'use client';

import { useState, useRef, useEffect, useOptimistic } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage } from './ChatMessage';
import { quickCaptureNote } from '@/actions/notes.actions';

interface Note {
  id: string;
  title: string | null;
  encrypted_content: string;
  created_at: string;
}

interface ChatInterfaceProps {
  initialNotes: Note[];
}

export function ChatInterface({ initialNotes }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Optimistic updates for instant feedback
  const [optimisticNotes, addOptimisticNote] = useOptimistic(
    initialNotes,
    (state, newNote: Note) => [newNote, ...state]
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [optimisticNotes.length]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const content = input.trim();
    setInput('');
    setSending(true);

    // Create optimistic note
    const optimisticNote: Note = {
      id: `temp-${Date.now()}`,
      title: content.split('\n')[0].substring(0, 50),
      encrypted_content: content,
      created_at: new Date().toISOString(),
    };

    addOptimisticNote(optimisticNote);

    try {
      await quickCaptureNote({
        title: optimisticNote.title || 'Untitled',
        content,
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to send:', error);
      // TODO: Show error toast, revert optimistic update
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col-reverse gap-3 pb-4">
          {optimisticNotes.map((note) => (
            <ChatMessage
              key={note.id}
              note={note}
              isOptimistic={note.id.startsWith('temp-')}
            />
          ))}
        </div>
        <div ref={messagesEndRef} />

        {optimisticNotes.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-medium text-slate-400">No ideas yet</p>
              <p className="text-sm text-slate-400">
                Start typing below to capture your first thought
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t bg-white pt-4">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="What's on your mind?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="max-h-[200px] min-h-[44px] resize-none"
            rows={1}
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            size="icon"
            className="h-11 w-11 shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Press <kbd className="rounded bg-slate-100 px-1">Enter</kbd> to send,{' '}
          <kbd className="rounded bg-slate-100 px-1">Shift + Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
```

### 2.3 Create Chat Message Component

Create `src/components/chat/ChatMessage.tsx`:

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, ExternalLink, Trash2, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  note: {
    id: string;
    title: string | null;
    encrypted_content: string;
    created_at: string;
  };
  isOptimistic?: boolean;
}

export function ChatMessage({ note, isOptimistic }: ChatMessageProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-white p-4 transition-all',
        isOptimistic && 'opacity-60',
        isHovered && 'border-slate-300 shadow-sm'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Content */}
      <p className="whitespace-pre-wrap text-slate-700">
        {note.encrypted_content}
      </p>

      {/* Metadata */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {isOptimistic
            ? 'Saving...'
            : formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
        </span>

        {/* Actions (visible on hover) */}
        <div
          className={cn(
            'flex items-center gap-1 transition-opacity',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/notes/${note.id}`}>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>

          <Button variant="ghost" size="sm">
            <Sparkles className="h-3 w-3" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/notes/${note.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open as note
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
```

### 2.4 Create Chat Skeleton

Create `src/components/chat/ChatSkeleton.tsx`:

```typescript
import { Skeleton } from '@/components/ui/skeleton';

export function ChatSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-white p-4">
            <Skeleton className="mb-2 h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2.5 Add getChatNotes Action

Add to `src/actions/notes.actions.ts`:

```typescript
export async function getChatNotes(limit = 50) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('notes')
    .select('id, title, encrypted_content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
```

### 2.6 Add Chat Link to Sidebar

Update `src/components/layout/Sidebar.tsx`:

```typescript
import Link from 'next/link';
import { FileText, Lightbulb, MessageSquare, Settings } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-slate-50 p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Vault</h1>
        <p className="text-sm text-slate-500">Your private idea lab</p>
      </div>
      
      <nav className="space-y-2">
        <Link
          href="/dashboard/chat"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
        >
          <MessageSquare className="h-4 w-4" />
          Idea Stream
        </Link>
        <Link
          href="/dashboard/notes"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
        >
          <FileText className="h-4 w-4" />
          Notes
        </Link>
        <Link
          href="/dashboard/incubator"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
        >
          <Lightbulb className="h-4 w-4" />
          Incubator
        </Link>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </nav>
    </aside>
  );
}
```

### 2.7 Export Chat Components

Create `src/components/chat/index.ts`:

```typescript
export { ChatInterface } from './ChatInterface';
export { ChatMessage } from './ChatMessage';
export { ChatSkeleton } from './ChatSkeleton';
```

---

## Feature 3: Semantic "More Like This"

Button on each note to find semantically similar ideas.

### 3.1 Create Similar Notes Action

Add to `src/actions/notes.actions.ts`:

```typescript
export async function findSimilarNotes(noteId: string, limit = 5) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = createAdminClient();

  // Get the source note's embedding
  const { data: sourceNote, error: sourceError } = await supabase
    .from('notes')
    .select('embedding')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single();

  if (sourceError) throw sourceError;
  if (!sourceNote?.embedding) {
    return { notes: [], error: 'Note has no embedding' };
  }

  // Find similar notes using the match_notes function
  const { data, error } = await supabase.rpc('match_notes', {
    query_embedding: sourceNote.embedding,
    match_threshold: 0.5, // Lower threshold to get more results
    match_count: limit + 1, // +1 because source note will be included
    filter_user_id: userId,
  });

  if (error) throw error;

  // Filter out the source note itself
  const similarNotes = data.filter((note: { id: string }) => note.id !== noteId);

  return { notes: similarNotes.slice(0, limit), error: null };
}
```

### 3.2 Create Similar Notes Modal Component

Create `src/components/notes/SimilarNotesModal.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Loader2, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { findSimilarNotes } from '@/actions/notes.actions';
import { formatDistanceToNow } from 'date-fns';

interface SimilarNote {
  id: string;
  title: string | null;
  encrypted_content: string;
  similarity: number;
}

interface SimilarNotesModalProps {
  noteId: string;
  trigger?: React.ReactNode;
}

export function SimilarNotesModal({ noteId, trigger }: SimilarNotesModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [similarNotes, setSimilarNotes] = useState<SimilarNote[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSimilarNotes();
    }
  }, [isOpen]);

  const loadSimilarNotes = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await findSimilarNotes(noteId);
      if (result.error) {
        setError(result.error);
      } else {
        setSimilarNotes(result.notes);
      }
    } catch (err) {
      setError('Failed to find similar notes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Sparkles className="mr-2 h-4 w-4" />
      More like this
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Similar Ideas
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-500">Finding similar ideas...</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && similarNotes.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              No similar ideas found. Keep adding more notes!
            </div>
          )}

          {!loading && !error && similarNotes.length > 0 && (
            <div className="space-y-3">
              {similarNotes.map((note) => (
                <SimilarNoteCard
                  key={note.id}
                  note={note}
                  onSelect={() => setIsOpen(false)}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SimilarNoteCardProps {
  note: SimilarNote;
  onSelect: () => void;
}

function SimilarNoteCard({ note, onSelect }: SimilarNoteCardProps) {
  const similarityPercent = Math.round(note.similarity * 100);

  // Truncate content for preview
  const preview =
    note.encrypted_content.length > 150
      ? note.encrypted_content.substring(0, 150) + '...'
      : note.encrypted_content;

  return (
    <div className="group rounded-lg border p-4 transition-all hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-medium text-slate-900">
            {note.title || 'Untitled'}
          </h3>
          <p className="mt-1 text-sm text-slate-600 line-clamp-2">{preview}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {/* Similarity badge */}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              similarityPercent >= 80
                ? 'bg-green-100 text-green-700'
                : similarityPercent >= 60
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {similarityPercent}% match
          </span>

          <Button variant="ghost" size="sm" asChild onClick={onSelect}>
            <Link href={`/dashboard/notes/${note.id}`}>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 3.3 Create Similar Notes Button (Compact)

Create `src/components/notes/SimilarNotesButton.tsx`:

```typescript
'use client';

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimilarNotesModal } from './SimilarNotesModal';

interface SimilarNotesButtonProps {
  noteId: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
}

export function SimilarNotesButton({
  noteId,
  variant = 'ghost',
  size = 'sm',
}: SimilarNotesButtonProps) {
  return (
    <SimilarNotesModal
      noteId={noteId}
      trigger={
        <Button variant={variant} size={size}>
          <Sparkles className="h-4 w-4" />
          {size !== 'icon' && <span className="ml-2">Similar</span>}
        </Button>
      }
    />
  );
}
```

### 3.4 Add to Note Card

Update `src/components/notes/NoteCard.tsx`:

```typescript
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { SimilarNotesButton } from './SimilarNotesButton';

interface NoteCardProps {
  note: {
    id: string;
    title: string | null;
    created_at: string;
  };
}

export function NoteCard({ note }: NoteCardProps) {
  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      <Link href={`/dashboard/notes/${note.id}`}>
        <CardHeader>
          <CardTitle className="line-clamp-1">
            {note.title || 'Untitled'}
          </CardTitle>
          <CardDescription>
            {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
          </CardDescription>
        </CardHeader>
      </Link>

      <CardFooter className="border-t pt-3">
        <SimilarNotesButton noteId={note.id} />
      </CardFooter>
    </Card>
  );
}
```

### 3.5 Add to Note Detail Page

Update `src/app/(dashboard)/dashboard/notes/[id]/page.tsx`:

```typescript
import { notFound } from 'next/navigation';
import { getNote } from '@/actions/notes.actions';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { SimilarNotesButton } from '@/components/notes/SimilarNotesButton';

interface NotePageProps {
  params: Promise<{ id: string }>;
}

export default async function NotePage({ params }: NotePageProps) {
  const { id } = await params;
  const note = await getNote(id);

  if (!note) notFound();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{note.title || 'Untitled'}</h1>
        <SimilarNotesButton noteId={note.id} variant="outline" />
      </div>

      <NoteEditor
        note={note}
        decryptedContent={note.encrypted_content} // TODO: Decrypt client-side
      />
    </div>
  );
}
```

### 3.6 Add to Chat Message

Update `src/components/chat/ChatMessage.tsx` - replace the Sparkles button:

```typescript
import { SimilarNotesModal } from '@/components/notes/SimilarNotesModal';

// Inside the component, replace the Sparkles button with:
<SimilarNotesModal
  noteId={note.id}
  trigger={
    <Button variant="ghost" size="sm">
      <Sparkles className="h-3 w-3" />
    </Button>
  }
/>
```

### 3.7 Export Components

Update `src/components/notes/index.ts`:

```typescript
export { NoteEditor } from './NoteEditor';
export { NoteCard } from './NoteCard';
export { SimilarNotesModal } from './SimilarNotesModal';
export { SimilarNotesButton } from './SimilarNotesButton';
```

---

## Verification Checklist

### Feature 1: Quick Capture
- [ ] Cmd+K opens modal from anywhere in dashboard
- [ ] Textarea auto-focuses when modal opens
- [ ] Cmd+Enter submits the note
- [ ] Note saves and appears in notes list
- [ ] Modal closes and clears after save
- [ ] Hint button in header also opens modal

### Feature 2: Idea Chat Interface
- [ ] Chat page loads at /dashboard/chat
- [ ] Messages display in reverse chronological order
- [ ] Enter sends message, Shift+Enter adds new line
- [ ] Optimistic updates show message immediately
- [ ] Each message has hover actions (open, similar, delete)
- [ ] Empty state shows when no notes exist

### Feature 3: Semantic Similar Notes
- [ ] "More like this" button appears on note cards
- [ ] Button appears on note detail page
- [ ] Button appears on chat messages
- [ ] Modal shows loading state
- [ ] Similar notes display with similarity percentage
- [ ] Clicking a result navigates to that note
- [ ] Empty state shows when no similar notes found

---

## Notes

- Quick Capture currently stores plaintext - implement full encryption flow later
- Chat interface reuses the `quickCaptureNote` action for simplicity
- Similarity threshold is set to 0.5 to show more results - adjust based on user feedback
- All three features share the same underlying notes table and embedding system
