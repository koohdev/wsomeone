'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import {
  loadAppStorage,
  saveDeckProgress,
  resetDeckProgress,
  DeckProgressState,
  AppStorageData,
} from '@/lib/storage';

export function useDeckProgress() {
  const [deckStates, setDeckStates] = useState<Record<string, DeckProgressState>>({});
  const [lastActiveDeckId, setLastActiveDeckId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [, startTransition] = useTransition();

  // Load from persistent storage (IndexedDB + localStorage fallback + cookies)
  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      try {
        const stored: AppStorageData = await loadAppStorage();
        if (isMounted) {
          startTransition(() => {
            setDeckStates(stored.deckStates || {});
            setLastActiveDeckId(stored.lastActiveDeckId || null);
            setIsLoaded(true);
          });
        }
      } catch (err) {
        console.error('Failed to load deck progress:', err);
        if (isMounted) setIsLoaded(true);
      }
    }

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update progress for a deck
  const updateProgress = useCallback(
    (deckId: string, currentIndex: number, totalCards: number, cardIds?: string[]) => {
      if (totalCards <= 0) return;

      const percent = Math.min(100, Math.round((currentIndex / totalCards) * 100));
      const newState: DeckProgressState = {
        deckId,
        currentIndex,
        totalCards,
        percent,
        completed: percent >= 100,
        cardIds,
        lastVisitedAt: Date.now(),
      };

      // Optimistic local state update
      setDeckStates((prev) => ({
        ...prev,
        [deckId]: newState,
      }));
      setLastActiveDeckId(deckId);

      // Async write to IndexedDB & sync tiers
      saveDeckProgress(deckId, currentIndex, totalCards, cardIds).catch((err) => {
        console.warn('Failed to persist deck progress:', err);
      });
    },
    []
  );

  // Reset progress for a deck
  const resetProgress = useCallback((deckId: string) => {
    setDeckStates((prev) => {
      const next = { ...prev };
      delete next[deckId];
      return next;
    });

    resetDeckProgress(deckId).catch((err) => {
      console.warn('Failed to reset deck progress:', err);
    });
  }, []);

  // Get percentage progress for a deck (0 - 100)
  const getDeckProgress = useCallback(
    (deckId: string) => {
      return deckStates[deckId]?.percent || 0;
    },
    [deckStates]
  );

  // Get full saved state for a deck
  const getDeckState = useCallback(
    (deckId: string) => {
      return deckStates[deckId];
    },
    [deckStates]
  );

  // Derive simple progressMap for compatibility
  const progressMap: Record<string, number> = Object.entries(deckStates).reduce<
    Record<string, number>
  >((acc, [id, state]) => {
    acc[id] = state.percent;
    return acc;
  }, {});

  return {
    isLoaded,
    deckStates,
    progressMap,
    lastActiveDeckId,
    updateProgress,
    resetProgress,
    getDeckProgress,
    getDeckState,
  };
}
