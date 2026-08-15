'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from 'framer-motion';
import { Card } from '@/types';

interface CardStackProps {
  cards: Card[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onReshuffle: () => void;
  onExit: () => void;
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
  const [exitDirection, setExitDirection] = useState<'right' | 'left' | null>(null);
  const isEnd = currentIndex >= cards.length;
  const currentCard = !isEnd ? cards[currentIndex] : null;
  const nextCard = currentIndex + 1 < cards.length ? cards[currentIndex + 1] : null;

  // Motion values for swipe & tilt
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-10, 0, 10]);
  const opacity = useTransform(x, [-200, 0, 200], [0.4, 1, 0.4]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 90;
    const velocityThreshold = 350;

    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      setExitDirection('right');
      triggerHaptic('snap');
      onNext();
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      if (currentIndex > 0) {
        setExitDirection('left');
        triggerHaptic('light');
        onPrev();
      } else {
        triggerHaptic('light');
      }
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
            onReshuffle();
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
              Tap anywhere to reshuffle or exit to topics.
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
      {/* 2nd Card in Stack (peeking underneath) */}
      {nextCard && (
        <div
          aria-hidden="true"
          className="absolute inset-x-7 top-3 aspect-[1.38/1] rounded-[32px] bg-white border border-neutral-200/80 shadow-md pointer-events-none opacity-80"
          style={{
            transform: 'translateY(6px) scale(0.97)',
            zIndex: 1,
          }}
        />
      )}

      {/* Active Top Card */}
      <AnimatePresence mode="popLayout" custom={exitDirection}>
        {currentCard && (
          <motion.div
            key={currentCard.id}
            drag="x"
            dragConstraints={{ left: -140, right: 280 }}
            dragElastic={0.65}
            onDragEnd={handleDragEnd}
            style={{
              x,
              rotate,
              opacity,
              zIndex: 10,
            }}
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{
              x: exitDirection === 'left' ? -420 : 420,
              rotate: exitDirection === 'left' ? -18 : 18,
              opacity: 0,
              transition: { duration: 0.22, ease: 'easeOut' },
            }}
            transition={{
              type: 'spring',
              damping: 24,
              stiffness: 280,
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

            {/* Card Footer Branding */}
            <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-[#C10016] whitespace-pre-line leading-tight">
              {currentCard.edition || editionText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
