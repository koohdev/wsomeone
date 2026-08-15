'use client';

import React from 'react';
import { Deck } from '@/types';
import { ProgressCircle } from '@/components/ui/ProgressCircle';
import { useHaptics } from '@/hooks/useHaptics';

interface TopicMenuProps {
  decks: Deck[];
  onSelectDeck: (deck: Deck) => void;
  progressMap?: Record<string, number>;
}

const PAPER_TEXTURE_DATA_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperPulp'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.06  0 0 0 0.35 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperPulp)'/%3E%3Ccircle cx='45' cy='78' r='0.75' fill='%23332211' opacity='0.25'/%3E%3Ccircle cx='180' cy='220' r='0.6' fill='%23221100' opacity='0.2'/%3E%3Ccircle cx='240' cy='60' r='0.9' fill='%23443322' opacity='0.2'/%3E%3Ccircle cx='95' cy='190' r='0.7' fill='%23332211' opacity='0.22'/%3E%3Ccircle cx='140' cy='120' r='0.5' fill='%23111111' opacity='0.18'/%3E%3Ccircle cx='270' cy='260' r='0.8' fill='%23221100' opacity='0.2'/%3E%3Ccircle cx='30' cy='250' r='0.65' fill='%23442211' opacity='0.22'/%3E%3C/svg%3E")`;

export function TopicMenu({ decks, onSelectDeck, progressMap = {} }: TopicMenuProps) {
  const { triggerHaptic } = useHaptics({ soundEnabled: true, hapticsEnabled: true });

  return (
    <div className="min-h-screen w-full bg-[#EDEDEF] text-[#C10016] select-none font-sans flex flex-col items-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Brand Header: WSOMEONE + Subtitle */}
        <div className="flex flex-col items-center mb-10 text-center px-2">
          <h1
            className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#C10016]"
            style={{ textShadow: '0 0.5px 1px rgba(193, 0, 22, 0.2)' }}
          >
            WSOMEONE
          </h1>
          <p
            className="mt-2 text-xs sm:text-sm font-bold uppercase tracking-tight text-[#C10016]/75 max-w-xs leading-snug"
            style={{ textShadow: '0 0.3px 0.3px rgba(193, 0, 22, 0.1)' }}
          >
            A purposeful card game designed to deepen meaningful human connection.
          </p>
        </div>

        {/* Stack of Full Physical Landscape Topic Cards */}
        <div className="w-full flex flex-col gap-6">
          {decks.map((deck) => {
            const progress = progressMap[deck.id] || 0;
            return (
              <button
                key={deck.id}
                onClick={() => {
                  triggerHaptic('snap');
                  onSelectDeck(deck);
                }}
                className="relative w-full aspect-[1.38/1] rounded-[32px] p-6 sm:p-8 flex flex-col justify-between text-left border active:scale-[0.98] transition-transform overflow-hidden group cursor-pointer shadow-md"
                style={{
                  backgroundColor: '#FAF8F5',
                  borderColor: 'rgba(0, 0, 0, 0.08)',
                  boxShadow: `
                    inset 0 1.5px 1.5px rgba(255, 255, 255, 0.9),
                    inset 0 -1.5px 2px rgba(0, 0, 0, 0.04),
                    0 2px 4px rgba(0, 0, 0, 0.03),
                    0 14px 30px -6px rgba(0, 0, 0, 0.09)
                  `,
                }}
              >
                {/* 350 GSM Cotton Paper Fiber Grain */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none opacity-45 mix-blend-multiply rounded-[32px]"
                  style={{
                    backgroundImage: PAPER_TEXTURE_DATA_URI,
                    backgroundSize: '220px 220px',
                  }}
                />

                {/* Top Edge Die-Cut Highlight */}
                <div
                  aria-hidden="true"
                  className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none"
                />

                {/* Frosted Scotch Tape at Top Center */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-gradient-to-br from-white/70 via-white/55 to-white/40 backdrop-blur-[3px] border border-black/5 rounded-xs shadow-xs -rotate-1 pointer-events-none" />

                <div />

                {/* Left-Aligned Card Text (Title & Subtitle) */}
                <div className="relative z-10 flex flex-col pr-4">
                  <h2
                    className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-tight text-[#C10016] leading-tight"
                    style={{ textShadow: '0 0.4px 0.4px rgba(193, 0, 22, 0.15)' }}
                  >
                    {deck.title}
                  </h2>
                  {deck.description && (
                    <p
                      className="mt-2 text-xs sm:text-sm font-semibold uppercase tracking-tight text-[#C10016]/75 leading-snug"
                      style={{ textShadow: '0 0.3px 0.3px rgba(193, 0, 22, 0.1)' }}
                    >
                      {deck.description}
                    </p>
                  )}
                </div>

                {/* Card Footer: Brand Left + Progress Circle Right */}
                <div className="relative z-10 flex items-center justify-between w-full pt-2">
                  <span
                    className="text-[11px] sm:text-xs font-bold uppercase tracking-tight text-[#C10016]"
                    style={{ textShadow: '0 0.4px 0.4px rgba(193, 0, 22, 0.15)' }}
                  >
                    WSOMEONE
                  </span>
                  <ProgressCircle progress={progress} size={20} strokeWidth={2.2} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
