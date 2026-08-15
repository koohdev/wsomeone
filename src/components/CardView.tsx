'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Deck } from '@/types';
import { CardStack } from './CardStack';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useHaptics } from '@/hooks/useHaptics';
import { BottomSheet } from './motion/bottom-sheet';
import { DECKS } from '@/data/decks';
import { RotateCcw } from 'lucide-react';

interface CardViewProps {
  deck: Deck;
  onSelectDeck: (deck: Deck) => void;
  onExit: () => void;
}

export function CardView({ deck, onSelectDeck, onExit }: CardViewProps) {
  const [cards, setCards] = useState<Card[]>(() => [...deck.cards]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Sync cards when deck changes
  useEffect(() => {
    setCards([...deck.cards]);
    setCurrentIndex(0);
  }, [deck]);

  useWakeLock(true);
  const { triggerHaptic } = useHaptics({ soundEnabled: true, hapticsEnabled: true });

  const handleReshuffle = useCallback(() => {
    // Keep cover card at index 0 and shuffle the rest of the question cards
    const coverCard = deck.cards[0];
    const questionCards = deck.cards.slice(1);
    const shuffledQuestions = [...questionCards].sort(() => Math.random() - 0.5);
    setCards([coverCard, ...shuffledQuestions]);
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
      if (isSheetOpen) {
        if (e.key === 'Escape') setIsSheetOpen(false);
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
        setIsSheetOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isSheetOpen]);

  const totalCards = cards.length;
  const displayIndex = Math.min(currentIndex + 1, totalCards);

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#EDEDEF] text-[#C10016] select-none font-sans">
      {/* Top Bar: Centered Counter */}
      <header className="relative z-30 flex items-center justify-center px-6 pt-6 sm:px-10 sm:pt-8 w-full max-w-xl mx-auto">
        <div className="text-[#C10016] font-mono text-sm sm:text-base font-semibold tracking-wider">
          {currentIndex >= totalCards ? `${totalCards}/${totalCards}` : `${displayIndex}/${totalCards}`}
        </div>
      </header>

      {/* Center Card Stage */}
      <main className="relative flex flex-1 items-center justify-center py-6">
        <CardStack
          cards={cards}
          currentIndex={currentIndex}
          onNext={handleNext}
          onPrev={handlePrev}
          onReshuffle={handleReshuffle}
          onOpenMenu={() => setIsSheetOpen(true)}
          onExit={onExit}
          editionText={deck.editionText}
          triggerHaptic={triggerHaptic}
        />
      </main>

      {/* Bottom Floating Menu Pill: Matching sketch layout "+ MENU" */}
      <footer className="relative z-30 flex flex-col items-center justify-center pb-8 pt-2">
        <button
          onClick={() => {
            triggerHaptic('light');
            setIsSheetOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-6 py-2 rounded-full border border-[#C10016] text-[#C10016] font-mono text-xs font-semibold uppercase tracking-wider bg-transparent hover:bg-[#C10016]/5 active:scale-95 transition-all cursor-pointer shadow-xs"
        >
          <span className="text-sm leading-none">+</span>
          <span>MENU</span>
        </button>
      </footer>

      {/* @beui/bottom-sheet for Selecting Topics and Reshuffling */}
      <BottomSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        snapPoints={[0.58, 0.9]}
        title="TOPICS"
      >
        <div className="flex flex-col gap-2.5 mt-2">
          {/* Deck List inside Bottom Sheet */}
          {DECKS.map((d) => {
            const isActive = d.id === deck.id;
            return (
              <button
                key={d.id}
                onClick={() => {
                  triggerHaptic('snap');
                  onSelectDeck(d);
                  setIsSheetOpen(false);
                }}
                className={`w-full rounded-2xl p-4 text-center border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#C10016] text-white border-[#C10016] shadow-sm'
                    : 'bg-white text-[#C10016] border-neutral-200/80 hover:bg-neutral-50 active:scale-[0.98]'
                }`}
              >
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-tight">
                  {d.title}
                </h3>
              </button>
            );
          })}

          {/* Reshuffle Button */}
          <button
            onClick={() => {
              handleReshuffle();
              setIsSheetOpen(false);
            }}
            className="flex items-center justify-center gap-2 w-full mt-2 p-3.5 rounded-2xl border border-dashed border-[#C10016]/40 text-[#C10016] font-mono text-xs font-semibold uppercase hover:bg-[#C10016]/5 active:scale-[0.98] cursor-pointer transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reshuffle Current Deck
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
