'use client';

import React, { useState } from 'react';
import { DECKS } from '@/data/decks';
import { Deck } from '@/types';
import { TopicMenu } from '@/components/TopicMenu';
import { CardView } from '@/components/CardView';

export default function Home() {
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  const activeDeck = DECKS.find((d) => d.id === selectedDeckId) || null;

  return (
    <main className="min-h-screen w-full bg-[#EDEDEF]">
      {activeDeck ? (
        <CardView deck={activeDeck} onExit={() => setSelectedDeckId(null)} />
      ) : (
        <TopicMenu
          decks={DECKS}
          onSelectDeck={(deck: Deck) => setSelectedDeckId(deck.id)}
        />
      )}
    </main>
  );
}
