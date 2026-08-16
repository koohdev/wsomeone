'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DECKS } from '@/data/decks';
import { Deck } from '@/types';
import { TopicMenu } from '@/components/TopicMenu';
import { CardView } from '@/components/CardView';
import { useDeckProgress } from '@/hooks/useDeckProgress';

const VIEW_TRANSITION = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const,
};

export default function Home() {
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const {
    progressMap,
    deckStates,
    updateProgress,
    resetProgress,
  } = useDeckProgress();

  const activeDeck = DECKS.find((d) => d.id === selectedDeckId) || null;

  return (
    <main className="min-h-[100dvh] w-full bg-[#EDEDEF] overflow-x-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {activeDeck ? (
          <motion.div
            key="card-view"
            className="w-full h-[100dvh] max-h-[100dvh] overflow-hidden will-change-transform"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={VIEW_TRANSITION}
          >
            <CardView
              deck={activeDeck}
              onSelectDeck={(deck: Deck) => setSelectedDeckId(deck.id)}
              onExit={() => setSelectedDeckId(null)}
              progressMap={progressMap}
              savedState={deckStates[activeDeck.id]}
              onUpdateProgress={updateProgress}
              onResetProgress={resetProgress}
            />
          </motion.div>
        ) : (
          <motion.div
            key="topic-menu"
            className="w-full min-h-[100dvh] will-change-transform"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={VIEW_TRANSITION}
          >
            <TopicMenu
              decks={DECKS}
              onSelectDeck={(deck: Deck) => setSelectedDeckId(deck.id)}
              progressMap={progressMap}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
