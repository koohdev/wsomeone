'use client';

import React from 'react';
import { Deck } from '@/types';

interface TopicMenuProps {
  decks: Deck[];
  onSelectDeck: (deck: Deck) => void;
}

export function TopicMenu({ decks, onSelectDeck }: TopicMenuProps) {
  return (
    <div className="min-h-screen w-full bg-[#EDEDEF] text-[#C10016] select-none font-sans flex flex-col justify-center items-center px-5 py-12">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Brand Title */}
        <h1 className="text-sm sm:text-base font-bold tracking-[0.25em] uppercase text-center mb-8 text-[#C10016]">
          WSOMEONE
        </h1>

        {/* Clean vertical stack of rounded card sets */}
        <div className="w-full flex flex-col gap-3">
          {decks.map((deck) => (
            <button
              key={deck.id}
              onClick={() => onSelectDeck(deck)}
              className="w-full rounded-2xl bg-white p-5 text-center shadow-sm border border-neutral-200/80 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer group"
            >
              <h2 className="text-[#C10016] text-sm sm:text-base font-bold uppercase tracking-tight">
                {deck.title}
              </h2>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
