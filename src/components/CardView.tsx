'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Deck } from '@/types';
import { CardStack } from './CardStack';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useHaptics } from '@/hooks/useHaptics';
import { X, RotateCcw, LayoutGrid } from 'lucide-react';

interface CardViewProps {
  deck: Deck;
  onExit: () => void;
}

export function CardView({ deck, onExit }: CardViewProps) {
  const [cards, setCards] = useState<Card[]>(() => [...deck.cards]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useWakeLock(true);
  const { triggerHaptic } = useHaptics({ soundEnabled: true, hapticsEnabled: true });

  const handleReshuffle = useCallback(() => {
    const shuffled = [...deck.cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    triggerHaptic('snap');
  }, [deck.cards, triggerHaptic]);

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, cards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      triggerHaptic('light');
    }
  }, [currentIndex, triggerHaptic]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMenuOpen) {
        if (e.key === 'Escape') setIsMenuOpen(false);
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onExit, isMenuOpen]);

  const totalCards = cards.length;
  const displayIndex = Math.min(currentIndex + 1, totalCards);

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#EDEDEF] text-[#C10016] select-none font-sans">
      {/* Top Bar: Back button and Counter */}
      <header className="relative z-30 flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8 w-full max-w-xl mx-auto">
        <button
          onClick={() => {
            triggerHaptic('light');
            onExit();
          }}
          aria-label="Back to topics"
          className="p-1 text-[#C10016] opacity-80 hover:opacity-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-[#C10016] font-mono text-sm sm:text-base font-semibold tracking-wider">
          {currentIndex >= totalCards ? `${totalCards}/${totalCards}` : `${displayIndex}/${totalCards}`}
        </div>

        <div className="w-5" />
      </header>

      {/* Center Card Stage */}
      <main className="relative flex flex-1 items-center justify-center py-6">
        <CardStack
          cards={cards}
          currentIndex={currentIndex}
          onNext={handleNext}
          onPrev={handlePrev}
          onReshuffle={handleReshuffle}
          onExit={onExit}
          editionText={deck.editionText}
          triggerHaptic={triggerHaptic}
        />
      </main>

      {/* Bottom Floating Menu Pill: Matching sketch layout "+ MENU (ROUNDED PILL)" */}
      <footer className="relative z-30 flex flex-col items-center justify-center pb-8 pt-2">
        <button
          onClick={() => {
            triggerHaptic('light');
            setIsMenuOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-6 py-2 rounded-full border border-[#C10016] text-[#C10016] font-mono text-xs font-semibold uppercase tracking-wider bg-transparent hover:bg-[#C10016]/5 active:scale-95 transition-all cursor-pointer shadow-xs"
        >
          <span className="text-sm leading-none">+</span>
          <span>MENU</span>
        </button>
      </footer>

      {/* Minimal Menu Modal */}
      {isMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl border border-neutral-200 text-[#C10016]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <span className="text-xs font-mono font-bold tracking-widest uppercase">
                MENU
              </span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1 cursor-pointer hover:opacity-70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 flex flex-col gap-2 font-mono text-xs font-semibold uppercase">
              <button
                onClick={() => {
                  handleReshuffle();
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2.5 w-full p-3 rounded-xl border border-[#C10016]/20 hover:bg-[#C10016]/5 text-left cursor-pointer active:scale-98 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Reshuffle Deck
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  onExit();
                }}
                className="flex items-center gap-2.5 w-full p-3 rounded-xl border border-[#C10016]/20 hover:bg-[#C10016]/5 text-left cursor-pointer active:scale-98 transition-all"
              >
                <LayoutGrid className="w-4 h-4" />
                Topics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
