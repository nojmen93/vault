'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface SimilarNotesContextValue {
  isOpen: boolean;
  noteId: string | null;
  openModal: (noteId: string) => void;
  closeModal: () => void;
}

const SimilarNotesContext = createContext<SimilarNotesContextValue | null>(null);

interface SimilarNotesProviderProps {
  children: React.ReactNode;
}

export function SimilarNotesProvider({
  children,
}: SimilarNotesProviderProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);

  const openModal = useCallback((id: string) => {
    setNoteId(id);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setNoteId(null);
  }, []);

  return (
    <SimilarNotesContext.Provider
      value={{ isOpen, noteId, openModal, closeModal }}
    >
      {children}
    </SimilarNotesContext.Provider>
  );
}

export function useSimilarNotes(): SimilarNotesContextValue {
  const context = useContext(SimilarNotesContext);
  if (!context) {
    throw new Error('useSimilarNotes must be used within SimilarNotesProvider');
  }
  return context;
}
