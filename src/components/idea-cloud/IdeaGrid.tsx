'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EncryptedNote } from '@/types';

interface IdeaGridProps {
  notes: EncryptedNote[];
}

export function IdeaGrid({ notes }: IdeaGridProps): React.ReactElement {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
      {notes.map((note) => (
        <Link key={note.id} href={`/dashboard/notes/${note.id}`}>
          <Card className="h-full transition-all hover:shadow-md hover:scale-[1.02] bg-white/50 backdrop-blur-sm border-white/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium line-clamp-1">
                {note.title || 'Untitled'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {note.encryptedContent.substring(0, 80)}
                {note.encryptedContent.length > 80 ? '...' : ''}
              </p>
              <p className="mt-2 text-xs text-muted-foreground/70">
                {new Date(note.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
