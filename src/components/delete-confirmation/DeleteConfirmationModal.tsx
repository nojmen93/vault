'use client';

import { useState } from 'react';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deleteNote } from '@/actions/notes.actions';
import { useDeleteConfirmation } from './DeleteConfirmationProvider';
import { useRouter } from 'next/navigation';

export function DeleteConfirmationModal(): React.ReactElement {
  const { isOpen, noteId, noteTitle, closeModal } = useDeleteConfirmation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (): Promise<void> => {
    if (!noteId) return;

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteNote(noteId);
      if (result.success) {
        closeModal();
        router.refresh();
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean): void => {
    if (!open && !isDeleting) {
      closeModal();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Delete Idea</DialogTitle>
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {noteTitle ? (
            <p className="text-sm">
              Are you sure you want to delete <strong>&quot;{noteTitle}&quot;</strong>?
            </p>
          ) : (
            <p className="text-sm">
              Are you sure you want to delete this idea?
            </p>
          )}

          {error && (
            <p className="mt-3 text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={closeModal}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
