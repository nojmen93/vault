'use client';

import { useQuickCapture } from './QuickCaptureProvider';

export function QuickCaptureHint(): React.ReactElement {
  const { open } = useQuickCapture();

  return (
    <button
      onClick={open}
      className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
    >
      <span>Quick capture</span>
      <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">⌘K</kbd>
    </button>
  );
}
