'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'wsomeone_deck_progress_v1';

export function useDeckProgress() {
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProgressMap(JSON.parse(stored));
      }
    } catch {
      // Ignore JSON/Storage errors
    }
  }, []);

  const updateProgress = useCallback((deckId: string, currentIndex: number, totalCards: number) => {
    if (totalCards <= 0) return;
    // We count progress percentage based on currentIndex / totalCards
    const percent = Math.min(100, Math.round((currentIndex / totalCards) * 100));
    setProgressMap((prev) => {
      const newMap = { ...prev, [deckId]: percent };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newMap));
      } catch {
        // Ignore Storage errors
      }
      return newMap;
    });
  }, []);

  const getDeckProgress = useCallback(
    (deckId: string) => {
      return progressMap[deckId] || 0;
    },
    [progressMap]
  );

  return {
    progressMap,
    updateProgress,
    getDeckProgress,
  };
}
