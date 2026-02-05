'use client';

import { useState, useEffect, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface BubblePositions {
  [id: string]: Position;
}

const STORAGE_KEY = 'vault-bubble-positions';

export function useBubblePositions(): {
  positions: BubblePositions;
  setPosition: (id: string, position: Position) => void;
  getPosition: (id: string, defaultPosition: Position) => Position;
  clearPositions: () => void;
} {
  const [positions, setPositions] = useState<BubblePositions>({});

  // Load positions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPositions(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load bubble positions:', err);
    }
  }, []);

  // Save positions to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(positions).length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
      } catch (err) {
        console.error('Failed to save bubble positions:', err);
      }
    }
  }, [positions]);

  const setPosition = useCallback((id: string, position: Position): void => {
    setPositions(prev => ({
      ...prev,
      [id]: position,
    }));
  }, []);

  const getPosition = useCallback((id: string, defaultPosition: Position): Position => {
    return positions[id] || defaultPosition;
  }, [positions]);

  const clearPositions = useCallback((): void => {
    setPositions({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { positions, setPosition, getPosition, clearPositions };
}
