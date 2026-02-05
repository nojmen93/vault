'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface DeleteConfirmationContextValue {
  isOpen: boolean;
  noteId: string | null;
  noteTitle: string | null;
  openModal: (noteId: string, noteTitle?: string | null) => void;
  closeModal: () => void;
  confirmDelete: () => void;
  onConfirmCallback: (() => Promise<void>) | null;
  setOnConfirmCallback: (callback: () => Promise<void>) => void;
}

const DeleteConfirmationContext = createContext<DeleteConfirmationContextValue | null>(null);

interface DeleteConfirmationProviderProps {
  children: React.ReactNode;
}

export function DeleteConfirmationProvider({
  children,
}: DeleteConfirmationProviderProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState<string | null>(null);
  const [onConfirmCallback, setOnConfirmCallbackState] = useState<(() => Promise<void>) | null>(null);

  const openModal = useCallback((id: string, title?: string | null) => {
    setNoteId(id);
    setNoteTitle(title || null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setNoteId(null);
    setNoteTitle(null);
    setOnConfirmCallbackState(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (onConfirmCallback) {
      await onConfirmCallback();
    }
    closeModal();
  }, [onConfirmCallback, closeModal]);

  const setOnConfirmCallback = useCallback((callback: () => Promise<void>) => {
    setOnConfirmCallbackState(() => callback);
  }, []);

  return (
    <DeleteConfirmationContext.Provider
      value={{
        isOpen,
        noteId,
        noteTitle,
        openModal,
        closeModal,
        confirmDelete,
        onConfirmCallback,
        setOnConfirmCallback,
      }}
    >
      {children}
    </DeleteConfirmationContext.Provider>
  );
}

export function useDeleteConfirmation(): DeleteConfirmationContextValue {
  const context = useContext(DeleteConfirmationContext);
  if (!context) {
    throw new Error('useDeleteConfirmation must be used within DeleteConfirmationProvider');
  }
  return context;
}
