'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface QuickCaptureContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const QuickCaptureContext = createContext<QuickCaptureContextType | null>(null);

export function useQuickCapture(): QuickCaptureContextType {
  const context = useContext(QuickCaptureContext);
  if (!context) throw new Error('useQuickCapture must be used within QuickCaptureProvider');
  return context;
}

interface QuickCaptureProviderProps {
  children: React.ReactNode;
}

export function QuickCaptureProvider({ children }: QuickCaptureProviderProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle, close]);

  return (
    <QuickCaptureContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </QuickCaptureContext.Provider>
  );
}
