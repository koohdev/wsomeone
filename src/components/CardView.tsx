'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Deck } from '@/types';
import { DeckProgressState } from '@/lib/storage';
import { CardStack } from './CardStack';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useHaptics } from '@/hooks/useHaptics';
import { BottomSheet } from './motion/bottom-sheet';
import { DECKS } from '@/data/decks';
import { RotateCcw, ArrowLeft, RotateCw } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import { ProgressCircle } from './ui/ProgressCircle';

interface CardViewProps {
  deck: Deck;
  onSelectDeck: (deck: Deck) => void;
  onExit: () => void;
  progressMap?: Record<string, number>;
  savedState?: DeckProgressState;
  onUpdateProgress?: (
    deckId: string,
    currentIndex: number,
    totalCards: number,
    cardIds?: string[]
  ) => void;
  onResetProgress?: (deckId: string) => void;
}

/**
 * Re-order cards based on saved ID order
 */
function restoreCardOrder(defaultCards: Card[], savedCardIds?: string[]): Card[] {
  if (!savedCardIds || savedCardIds.length === 0) return [...defaultCards];

  const cardMap = new Map(defaultCards.map((c) => [c.id, c]));
  const orderedCards: Card[] = [];

  // Add saved cards in order
  for (const id of savedCardIds) {
    const found = cardMap.get(id);
    if (found) {
      orderedCards.push(found);
      cardMap.delete(id);
    }
  }

  // Append any cards that weren't in saved list
  for (const remaining of cardMap.values()) {
    orderedCards.push(remaining);
  }

  return orderedCards;
}

export function CardView({
  deck,
  onSelectDeck,
  onExit,
  progressMap = {},
  savedState,
  onUpdateProgress,
  onResetProgress,
}: CardViewProps) {
  const [cards, setCards] = useState<Card[]>(() =>
    restoreCardOrder(deck.cards, savedState?.cardIds)
  );
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (savedState && typeof savedState.currentIndex === 'number') {
      return Math.min(savedState.currentIndex, deck.cards.length);
    }
    return 0;
  });
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const prevDeckIdRef = useRef(deck.id);

  // Sync cards and resume position when deck changes or on initial mount
  useEffect(() => {
    if (prevDeckIdRef.current !== deck.id) {
      prevDeckIdRef.current = deck.id;
      const initialCards = restoreCardOrder(deck.cards, savedState?.cardIds);
      setCards(initialCards);
      const initialIndex =
        savedState && typeof savedState.currentIndex === 'number'
          ? Math.min(savedState.currentIndex, initialCards.length)
          : 0;
      setCurrentIndex(initialIndex);
    }
  }, [deck, savedState]);

  // Sync progress to persistent storage whenever index or cards change
  useEffect(() => {
    if (onUpdateProgress) {
      const cardIds = cards.map((c) => c.id);
      onUpdateProgress(deck.id, currentIndex, cards.length, cardIds);
    }
  }, [deck.id, currentIndex, cards, onUpdateProgress]);

  useWakeLock(true);
  const { triggerHaptic } = useHaptics({ soundEnabled: true, hapticsEnabled: true });

  // Play card deal-in / shuffle sound on topic mount
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerHaptic('shuffle');
    }, 60);
    return () => clearTimeout(timer);
  }, [deck.id, triggerHaptic]);

  const handleReshuffle = useCallback(() => {
    const coverCard = deck.cards[0];
    const questionCards = deck.cards.slice(1);
    const shuffledQuestions = [...questionCards].sort(() => Math.random() - 0.5);
    const newCards = [coverCard, ...shuffledQuestions];
    setCards(newCards);
    setCurrentIndex(0);
    triggerHaptic('shuffle');
  }, [deck.cards, triggerHaptic]);

  const handleRestartDeck = useCallback(() => {
    setCurrentIndex(0);
    triggerHaptic('light');
    if (onResetProgress) {
      onResetProgress(deck.id);
    }
  }, [deck.id, onResetProgress, triggerHaptic]);

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
      {/* Top Bar: Centered Counter with NumberFlow Animation */}
      <header className="relative z-30 flex items-center justify-center px-6 pt-6 sm:px-10 sm:pt-8 w-full max-w-xl mx-auto">
        <div className="flex items-center text-[#C10016] font-mono text-sm sm:text-base font-semibold tracking-wider">
          <NumberFlow
            value={displayIndex}
            transformTiming={{ duration: 350, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
            spinTiming={{ duration: 350, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
            opacityTiming={{ duration: 200, easing: 'ease-out' }}
          />
          <span className="ml-0.5">/{totalCards}</span>
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

      {/* @beui/bottom-sheet for Selecting Topics, Reshuffling, and Returning to Landing Page */}
      <BottomSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        snapPoints={[0.68, 0.94]}
        title="TOPICS"
      >
        <div className="flex flex-col gap-2.5 mt-2">
          {/* Deck List inside Bottom Sheet with left-aligned text & right-aligned progress circle */}
          {DECKS.map((d) => {
            const isActive = d.id === deck.id;
            const progress = progressMap[d.id] || 0;
            return (
              <button
                key={d.id}
                onClick={() => {
                  triggerHaptic('snap');
                  onSelectDeck(d);
                  setIsSheetOpen(false);
                }}
                className={`relative w-full rounded-2xl px-5 py-4 flex items-center justify-between text-left border transition-all cursor-pointer overflow-hidden ${
                  isActive
                    ? 'bg-[#C10016] text-white border-[#A00012] shadow-sm'
                    : 'bg-[#FAF8F5] text-[#C10016] border-black/10 hover:bg-neutral-50 active:scale-[0.98]'
                }`}
                style={{
                  boxShadow: isActive
                    ? 'inset 0 1px 1px rgba(255,255,255,0.3), 0 4px 12px rgba(193,0,22,0.2)'
                    : 'inset 0 1px 1px rgba(255,255,255,0.8), 0 2px 6px rgba(0,0,0,0.04)',
                }}
              >
                {/* Left Text */}
                <div className="flex flex-col pr-3">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-tight">
                    {d.title}
                  </h3>
                  {d.description && (
                    <p
                      className={`mt-0.5 text-[11px] font-medium uppercase tracking-tight leading-tight ${
                        isActive ? 'text-white/80' : 'text-[#C10016]/70'
                      }`}
                    >
                      {d.description}
                    </p>
                  )}
                </div>

                {/* Right Progress Circle */}
                <div className="flex items-center justify-center pl-2">
                  <ProgressCircle
                    progress={progress}
                    size={18}
                    strokeWidth={2}
                    isActive={isActive}
                  />
                </div>
              </button>
            );
          })}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-black/5">
            {/* Start from beginning button if user is already midway through deck */}
            {currentIndex > 0 && (
              <button
                onClick={() => {
                  handleRestartDeck();
                  setIsSheetOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full p-3.5 rounded-2xl border border-[#C10016]/25 text-[#C10016] font-mono text-xs font-semibold uppercase hover:bg-[#C10016]/5 active:scale-[0.98] cursor-pointer transition-all"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Start Deck From Beginning
              </button>
            )}

            {/* Reshuffle Button */}
            <button
              onClick={() => {
                handleReshuffle();
                setIsSheetOpen(false);
              }}
              className="flex items-center justify-center gap-2 w-full p-3.5 rounded-2xl border border-dashed border-[#C10016]/40 text-[#C10016] font-mono text-xs font-semibold uppercase hover:bg-[#C10016]/5 active:scale-[0.98] cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reshuffle Current Deck
            </button>

            {/* GO BACK Button */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsSheetOpen(false);
                onExit();
              }}
              className="flex items-center justify-center gap-2 w-full p-3.5 rounded-2xl bg-[#C10016]/10 text-[#C10016] font-mono text-xs font-semibold uppercase hover:bg-[#C10016]/15 active:scale-[0.98] cursor-pointer transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              GO BACK
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
