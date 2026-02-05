"use client";

import { useState, useCallback, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

interface NoteEditorProps {
  noteId?: string;
}

export function NoteEditor({ noteId }: NoteEditorProps): React.ReactElement {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const saveNote = useDebouncedCallback(
    async (newTitle: string, newContent: string) => {
      setIsSaving(true);
      try {
        // TODO: Implement encryption and save logic
        console.log("Saving note:", { noteId, title: newTitle, content: newContent });
      } finally {
        setIsSaving(false);
      }
    },
    500
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);
      saveNote(newTitle, content);
    },
    [content, saveNote]
  );

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setContent(newContent);
      saveNote(title, newContent);
    },
    [title, saveNote]
  );

  useEffect(() => {
    if (noteId) {
      // TODO: Load existing note
    }
  }, [noteId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder="Untitled"
          value={title}
          onChange={handleTitleChange}
          className="w-full bg-transparent text-2xl font-bold outline-none placeholder:text-muted-foreground"
        />
        {isSaving && (
          <span className="text-sm text-muted-foreground">Saving...</span>
        )}
      </div>
      <textarea
        placeholder="Start writing..."
        value={content}
        onChange={handleContentChange}
        className="min-h-[400px] w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
