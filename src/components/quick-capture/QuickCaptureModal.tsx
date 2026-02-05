'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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

export function QuickCaptureModal(): React.ReactElement {
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

  const handleSubmit = async (): Promise<void> => {
    if (!content.trim()) return;

    setSaving(true);
    try {
      // Extract title from first line or first 50 chars
      const firstLine = content.split('\n')[0];
      const title = firstLine.length > 50
        ? firstLine.substring(0, 50) + '...'
        : firstLine;

      const result = await quickCaptureNote({
        title,
        content: content.trim(),
      });

      if (result.success) {
        close();
        toast.success('Idea captured!');
        router.refresh();
      } else {
        toast.error(result.error.message || 'Failed to capture idea');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to capture idea');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
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
            <p className="text-xs text-muted-foreground">
              <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">⌘</kbd>
              {' + '}
              <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs">Enter</kbd>
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
