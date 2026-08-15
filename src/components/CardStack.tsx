'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { Card } from '@/types';

interface CardStackProps {
  cards: Card[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onReshuffle: () => void;
  onExit?: () => void;
  editionText?: string;
  triggerHaptic: (pattern?: 'light' | 'snap') => void;
}

export function CardStack({
  cards,
  currentIndex,
  onNext,
  onPrev,
  onReshuffle,
  onExit,
  editionText = 'WSOMEONE',
  triggerHaptic,
}: CardStackProps) {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const isEnd = currentIndex >= cards.length;
  const currentCard = !isEnd ? cards[currentIndex] : null;
  const nextCard = currentIndex + 1 < cards.length ? cards[currentIndex + 1] : null;
  const thirdCard = currentIndex + 2 < cards.length ? cards[currentIndex + 2] : null;

  // Motion values for the top active card
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-14, 0, 14]);

  // Dynamic transforms for the 2nd card underneath while top card is dragged
  const nextScale = useTransform(x, [-250, 0, 250], [1, 0.95, 1]);
  const nextY = useTransform(x, [-250, 0, 250], [0, 8, 0]);
  const nextOpacity = useTransform(x, [-250, 0, 250], [1, 0.85, 1]);

  const handleDragEnd = async (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isAnimatingOut) return;

    const threshold = 70;
    const velocityThreshold = 250;

    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      // Swiped Right -> Animate off-screen to the right then advance
      setIsAnimatingOut(true);
      triggerHaptic('snap');
      await animate(x, 600, {
        duration: 0.18,
        ease: 'easeOut',
      });
      x.set(0);
      setIsAnimatingOut(false);
      onNext();
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      if (currentIndex > 0) {
        // Swiped Left -> Animate off-screen to the left then go back
        setIsAnimatingOut(true);
        triggerHaptic('light');
        await animate(x, -600, {
          duration: 0.18,
          ease: 'easeOut',
        });
        x.set(0);
        setIsAnimatingOut(false);
        onPrev();
      } else {
        // Spring back if at first card
        triggerHaptic('light');
        animate(x, 0, { type: 'spring', damping: 20, stiffness: 300 });
      }
    } else {
      // Released without passing threshold -> snap back to center
      animate(x, 0, { type: 'spring', damping: 20, stiffness: 300 });
    }
  };

  if (isEnd) {
    return (
      <div className="relative flex w-full max-w-[360px] sm:max-w-[440px] md:max-w-[500px] items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 250 }}
          onClick={() => {
            triggerHaptic('snap');
            if (onExit) onExit();
            else onReshuffle();
          }}
          className="relative flex aspect-[1.38/1] w-full cursor-pointer flex-col items-center justify-between rounded-[32px] bg-white p-6 sm:p-8 text-center shadow-lg border border-neutral-200/80 select-none active:scale-[0.99] transition-transform"
        >
          {/* Scotch Tape */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-white/70 backdrop-blur-[2px] border border-black/5 rounded-sm shadow-xs -rotate-1 pointer-events-none" />

          <div />

          <div className="px-4">
            <h2 className="text-[#C10016] text-base sm:text-lg md:text-xl font-bold tracking-tight uppercase leading-snug">
              YOU’VE REACHED THE END.
            </h2>
            <p className="text-[#C10016]/70 text-xs sm:text-sm font-medium mt-2">
              Tap anywhere to exit to topics or reshuffle.
            </p>
          </div>

          <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-[#C10016]">
            {editionText}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex w-full max-w-[360px] sm:max-w-[440px] md:max-w-[500px] items-center justify-center px-4 select-none touch-none">
      {/* 3rd Card in Stack */}
      {thirdCard && (
        <div
          aria-hidden="true"
          className="absolute inset-x-8 top-4 aspect-[1.38/1] rounded-[32px] bg-white border border-neutral-200/60 shadow-xs pointer-events-none opacity-30"
          style={{
            transform: 'translateY(14px) scale(0.91)',
            zIndex: 1,
          }}
        />
      )}

      {/* 2nd Card (Directly underneath with separate key and actual next question) */}
      {nextCard && (
        <motion.div
          key={`next-${nextCard.id}`}
          aria-hidden="true"
          style={{
            scale: nextScale,
            y: nextY,
            opacity: nextOpacity,
            zIndex: 2,
          }}
          className="absolute inset-x-4 top-0 aspect-[1.38/1] flex flex-col items-center justify-between rounded-[32px] bg-white p-6 sm:p-8 text-center shadow-md border border-neutral-200/80 pointer-events-none will-change-transform"
        >
          {/* Scotch Tape */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-white/70 backdrop-blur-[2px] border border-black/5 rounded-sm shadow-xs -rotate-1 pointer-events-none" />

          <div />

          {/* Next Card Question */}
          <div className="my-auto px-2 sm:px-6 flex items-center justify-center">
            <p className="text-[#C10016] text-base sm:text-lg md:text-xl font-bold tracking-tight uppercase leading-snug text-balance">
              {nextCard.text}
            </p>
          </div>

          {/* Card Footer */}
          <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-[#C10016] whitespace-pre-line leading-tight">
            {nextCard.edition || editionText}
          </div>
        </motion.div>
      )}

      {/* Active Top Draggable Card */}
      {currentCard && (
        <motion.div
          key={`current-${currentCard.id}`}
          drag={isAnimatingOut ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.85}
          onDragEnd={handleDragEnd}
          style={{
            x,
            rotate,
            zIndex: 10,
          }}
          className="relative flex aspect-[1.38/1] w-full cursor-grab active:cursor-grabbing flex-col items-center justify-between rounded-[32px] bg-white p-6 sm:p-8 text-center shadow-lg border border-neutral-200/80 will-change-transform"
        >
          {/* Scotch Tape */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-white/70 backdrop-blur-[2px] border border-black/5 rounded-sm shadow-xs -rotate-1 pointer-events-none" />

          <div />

          {/* Question centered */}
          <div className="my-auto px-2 sm:px-6 flex items-center justify-center">
            <p className="text-[#C10016] text-base sm:text-lg md:text-xl font-bold tracking-tight uppercase leading-snug text-balance">
              {currentCard.text}
            </p>
          </div>

          {/* Card Footer */}
          <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-[#C10016] whitespace-pre-line leading-tight">
            {currentCard.edition || editionText}
          </div>
        </motion.div>
      )}
    </div>
  );
}
