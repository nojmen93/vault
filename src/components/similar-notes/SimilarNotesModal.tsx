'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { findSimilarNotes, type SimilarNote } from '@/actions/notes.actions';
import { useSimilarNotes } from './SimilarNotesProvider';

export function SimilarNotesModal(): React.ReactElement | null {
  const { isOpen, noteId, closeModal } = useSimilarNotes();
  const [loading, setLoading] = useState(false);
  const [similarNotes, setSimilarNotes] = useState<SimilarNote[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && noteId) {
      setLoading(true);
      setError(null);
      setSimilarNotes([]);

      findSimilarNotes(noteId)
        .then((result) => {
          if (result.success) {
            setSimilarNotes(result.data);
          } else {
            setError(result.error.message);
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to find similar notes');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, noteId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={closeModal}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-xl border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <h2 className="font-semibold">Similar Ideas</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={closeModal}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Finding similar ideas...
              </p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : similarNotes.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No similar ideas found yet. Keep adding more ideas!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {similarNotes.map((note) => (
                <SimilarNoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SimilarNoteCardProps {
  note: SimilarNote;
}

function SimilarNoteCard({ note }: SimilarNoteCardProps): React.ReactElement {
  const similarityPercent = Math.round(note.similarity * 100);

  return (
    <div className="rounded-lg border bg-muted/50 p-3 transition-colors hover:bg-muted">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {note.title && (
            <h3 className="font-medium text-sm truncate">{note.title}</h3>
          )}
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {note.encryptedContent}
          </p>
        </div>
        <div className="shrink-0">
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              similarityPercent >= 80
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : similarityPercent >= 60
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {similarityPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}
