"use client";

import Link from "next/link";
import type { Note } from "@/types";

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps): React.ReactElement {
  return (
    <Link href={`/notes/${note.id}`}>
      <div className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent">
        <h3 className="font-semibold">{note.title || "Untitled"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date(note.createdAt).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
