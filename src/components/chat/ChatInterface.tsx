'use client';

import { useState, useRef, useEffect, useOptimistic, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage } from './ChatMessage';
import { quickCaptureNote } from '@/actions/notes.actions';
import { useSimilarNotes } from '@/components/similar-notes';
import type { EncryptedNote } from '@/types';

interface ChatInterfaceProps {
  initialNotes: EncryptedNote[];
}

interface OptimisticNote extends EncryptedNote {
  isOptimistic?: boolean;
}

export function ChatInterface({ initialNotes }: ChatInterfaceProps): React.ReactElement {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const { openModal: openSimilarNotes } = useSimilarNotes();

  // Optimistic updates for instant feedback
  const [optimisticNotes, addOptimisticNote] = useOptimistic<OptimisticNote[], OptimisticNote>(
    initialNotes,
    (state, newNote) => [newNote, ...state]
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [optimisticNotes.length]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSend = async (): Promise<void> => {
    if (!input.trim() || sending) return;

    const content = input.trim();
    const title = content.split('\n')[0].substring(0, 50);
    setInput('');
    setSending(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Create optimistic note
    const optimisticNote: OptimisticNote = {
      id: `temp-${Date.now()}`,
      userId: '',
      title,
      encryptedContent: content,
      iv: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOptimistic: true,
    };

    startTransition(() => {
      addOptimisticNote(optimisticNote);
    });

    try {
      const result = await quickCaptureNote({ title, content });
      if (result.success) {
        router.refresh();
      } else {
        console.error('Failed to send:', result.error);
      }
    } catch (error) {
      console.error('Failed to send:', error);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    // TODO: Implement delete with confirmation
    console.log('Delete:', id);
  };

  const handleFindSimilar = (id: string): void => {
    openSimilarNotes(id);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto px-4">
        {optimisticNotes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-medium">Start your idea stream</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Type below to capture your first thought
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-4 py-4">
            <div ref={messagesEndRef} />
            {optimisticNotes.map((note) => (
              <ChatMessage
                key={note.id}
                note={note}
                isOptimistic={'isOptimistic' in note && note.isOptimistic}
                onDelete={handleDelete}
                onFindSimilar={handleFindSimilar}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t bg-background p-4">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="What's on your mind?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-[150px] resize-none"
            rows={1}
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Press <kbd className="rounded bg-muted px-1 py-0.5 text-[10px]">Enter</kbd> to send,{' '}
          <kbd className="rounded bg-muted px-1 py-0.5 text-[10px]">Shift + Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
