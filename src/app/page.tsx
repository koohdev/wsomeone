'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DECKS } from '@/data/decks';
import { Deck } from '@/types';
import { TopicMenu } from '@/components/TopicMenu';
import { CardView } from '@/components/CardView';
import { useDeckProgress } from '@/hooks/useDeckProgress';

const SWUP_TRANSITION = {
  duration: 0.45,
  ease: [0.25, 0.46, 0.45, 0.94] as const,
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
    <main className="min-h-screen w-full bg-[#EDEDEF] overflow-x-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {activeDeck ? (
          <motion.div
            key={activeDeck.id}
            id="swup"
            className="transition-fade w-full min-h-screen will-change-transform"
            initial={{ opacity: 0, filter: 'blur(7px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(7px)' }}
            transition={SWUP_TRANSITION}
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
            key="landing"
            id="swup"
            className="transition-fade w-full min-h-screen will-change-transform"
            initial={{ opacity: 0, filter: 'blur(7px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(7px)' }}
            transition={SWUP_TRANSITION}
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
