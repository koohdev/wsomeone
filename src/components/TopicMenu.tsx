'use client';

import React from 'react';
import { Deck } from '@/types';
import { ProgressCircle } from '@/components/ui/ProgressCircle';

interface TopicMenuProps {
  decks: Deck[];
  onSelectDeck: (deck: Deck) => void;
  progressMap?: Record<string, number>;
}

const PAPER_TEXTURE_DATA_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperPulp'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.06  0 0 0 0.35 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperPulp)'/%3E%3Ccircle cx='45' cy='78' r='0.75' fill='%23332211' opacity='0.25'/%3E%3Ccircle cx='180' cy='220' r='0.6' fill='%23221100' opacity='0.2'/%3E%3Ccircle cx='240' cy='60' r='0.9' fill='%23443322' opacity='0.2'/%3E%3Ccircle cx='95' cy='190' r='0.7' fill='%23332211' opacity='0.22'/%3E%3Ccircle cx='140' cy='120' r='0.5' fill='%23111111' opacity='0.18'/%3E%3Ccircle cx='270' cy='260' r='0.8' fill='%23221100' opacity='0.2'/%3E%3Ccircle cx='30' cy='250' r='0.65' fill='%23442211' opacity='0.22'/%3E%3C/svg%3E")`;

export function TopicMenu({ decks, onSelectDeck, progressMap = {} }: TopicMenuProps) {
  return (
    <div className="min-h-screen w-full bg-[#EDEDEF] text-[#C10016] select-none font-sans flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Brand Title: Bold, big, and no space between letters */}
        <h1
          className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-center mb-8 text-[#C10016]"
          style={{ textShadow: '0 0.5px 1px rgba(193, 0, 22, 0.2)' }}
        >
          WSOMEONE
        </h1>

        {/* Stack of Topic Cards with Left-Aligned Text & Right-Aligned Progress Circle */}
        <div className="w-full flex flex-col gap-3">
          {decks.map((deck) => {
            const progress = progressMap[deck.id] || 0;
            return (
              <button
                key={deck.id}
                onClick={() => onSelectDeck(deck)}
                className="relative w-full rounded-2xl px-5 py-4 flex items-center justify-between text-left border active:scale-[0.98] transition-transform overflow-hidden group cursor-pointer"
                style={{
                  backgroundColor: '#FAF8F5',
                  borderColor: 'rgba(0, 0, 0, 0.08)',
                  boxShadow: `
                    inset 0 1.5px 1.5px rgba(255, 255, 255, 0.9),
                    inset 0 -1.5px 2px rgba(0, 0, 0, 0.04),
                    0 2px 4px rgba(0, 0, 0, 0.03),
                    0 8px 20px -4px rgba(0, 0, 0, 0.07)
                  `,
                }}
              >
                {/* Paper Fiber Grain */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply rounded-2xl"
                  style={{
                    backgroundImage: PAPER_TEXTURE_DATA_URI,
                    backgroundSize: '200px 200px',
                  }}
                />

                {/* Top Edge Highlight */}
                <div
                  aria-hidden="true"
                  className="absolute top-0 inset-x-6 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none"
                />

                {/* Left Side: Topic Title & Subtitle */}
                <div className="relative z-10 flex flex-col pr-3">
                  <h2
                    className="text-[#C10016] text-xs sm:text-sm font-bold uppercase tracking-tight"
                    style={{ textShadow: '0 0.4px 0.4px rgba(193, 0, 22, 0.15)' }}
                  >
                    {deck.title}
                  </h2>
                  {deck.description && (
                    <p
                      className="mt-0.5 text-[11px] font-semibold uppercase tracking-tight text-[#C10016]/75 leading-tight"
                      style={{ textShadow: '0 0.3px 0.3px rgba(193, 0, 22, 0.1)' }}
                    >
                      {deck.description}
                    </p>
                  )}
                </div>

                {/* Right Side: Animated SVG Progress Circle */}
                <div className="relative z-10 flex items-center justify-center pl-2">
                  <ProgressCircle progress={progress} size={18} strokeWidth={2} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
