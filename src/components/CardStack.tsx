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
  onOpenMenu?: () => void;
  onExit?: () => void;
  isShuffling?: boolean;
  editionText?: string;
  triggerHaptic: (pattern?: 'light' | 'snap' | 'shuffle') => void;
}

// 350 GSM Heavy Uncoated Cotton Paper Texture (Embedded SVG Noise + Dust & Fiber Flecks)
const PAPER_TEXTURE_DATA_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperPulp'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.06  0 0 0 0.35 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperPulp)'/%3E%3Ccircle cx='45' cy='78' r='0.75' fill='%23332211' opacity='0.25'/%3E%3Ccircle cx='180' cy='220' r='0.6' fill='%23221100' opacity='0.2'/%3E%3Ccircle cx='240' cy='60' r='0.9' fill='%23443322' opacity='0.2'/%3E%3Ccircle cx='95' cy='190' r='0.7' fill='%23332211' opacity='0.22'/%3E%3Ccircle cx='140' cy='120' r='0.5' fill='%23111111' opacity='0.18'/%3E%3Ccircle cx='270' cy='260' r='0.8' fill='%23221100' opacity='0.2'/%3E%3Ccircle cx='30' cy='250' r='0.65' fill='%23442211' opacity='0.22'/%3E%3C/svg%3E")`;

export function CardStack({
  cards,
  currentIndex,
  onNext,
  onPrev,
  onReshuffle,
  onOpenMenu,
  onExit,
  isShuffling = false,
  editionText = 'WSOMEONE',
  triggerHaptic,
}: CardStackProps) {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const isEnd = currentIndex >= cards.length;
  const currentCard = !isEnd ? cards[currentIndex] : null;
  const nextCard = currentIndex + 1 < cards.length ? cards[currentIndex + 1] : null;
  const thirdCard = currentIndex + 2 < cards.length ? cards[currentIndex + 2] : null;

  // Fixed, consistent double-sided fanned stack rotations
  const stackLeftRotate = -3.2; // Layer 3 peeking left
  const stackRightRotate = 2.8; // Layer 2 peeking right

  // Motion values for the top active card
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-600, 0, 600], [-18, 0, 18]);

  // Dynamic transforms for Layer 2 (middle card) as top card is dragged
  const nextScale = useTransform(x, [-250, 0, 250], [1, 0.96, 1]);
  const nextY = useTransform(x, [-250, 0, 250], [0, 6, 0]);
  const nextOpacity = useTransform(x, [-250, 0, 250], [1, 0.9, 1]);
  const nextRotate = useTransform(x, [-250, 0, 250], [0, stackRightRotate, 0]);

  const getExitDistance = () => {
    if (typeof window !== 'undefined') {
      return Math.max(window.innerWidth * 1.15, 1400);
    }
    return 1400;
  };

  const handleDragEnd = async (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isAnimatingOut || isShuffling) return;

    const threshold = 70;
    const velocityThreshold = 250;

    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      // Forward / Swipe Right -> Gracefully glide all the way off-screen with natural momentum
      setIsAnimatingOut(true);
      triggerHaptic('snap');
      const exitDistance = getExitDistance();
      await animate(x, exitDistance, {
        duration: 0.58,
        ease: [0.22, 1, 0.36, 1],
      });
      x.set(0);
      setIsAnimatingOut(false);
      onNext();
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      if (currentIndex > 0) {
        // Reverse / Swipe Left -> Previous card smoothly glides back IN from the right edge
        setIsAnimatingOut(true);
        triggerHaptic('light');
        onPrev();
        const exitDistance = getExitDistance();
        x.set(exitDistance);
        setIsAnimatingOut(false);
        animate(x, 0, {
          type: 'spring',
          damping: 26,
          stiffness: 180,
          mass: 0.9,
        });
      } else {
        triggerHaptic('light');
        animate(x, 0, { type: 'spring', damping: 20, stiffness: 300 });
      }
    } else {
      animate(x, 0, { type: 'spring', damping: 20, stiffness: 300 });
    }
  };

  // Realistic physical card styling for 350 GSM uncoated paper
  const getCardStyle = (isCover?: boolean) => {
    if (isCover) {
      return {
        backgroundColor: '#C10016',
        borderColor: '#A00012',
        boxShadow: `
          inset 0 1.5px 1px rgba(255, 255, 255, 0.28),
          inset 0 -2px 3px rgba(0, 0, 0, 0.25),
          0 2px 4px rgba(0, 0, 0, 0.08),
          0 14px 32px -4px rgba(193, 0, 22, 0.25),
          0 1px 2px rgba(0, 0, 0, 0.12)
        `,
      };
    }
    return {
      backgroundColor: '#FAF8F5',
      borderColor: 'rgba(0, 0, 0, 0.08)',
      boxShadow: `
        inset 0 1.5px 1.5px rgba(255, 255, 255, 0.9),
        inset 0 -1.5px 2px rgba(0, 0, 0, 0.04),
        0 2px 4px rgba(0, 0, 0, 0.03),
        0 14px 30px -6px rgba(0, 0, 0, 0.1),
        0 1px 3px rgba(0, 0, 0, 0.04)
      `,
    };
  };

  if (isEnd && !isShuffling) {
    return (
      <div className="relative flex w-full max-w-[360px] sm:max-w-[440px] md:max-w-[480px] landscape:max-w-[320px] landscape:sm:max-w-[350px] items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 250 }}
          onClick={() => {
            triggerHaptic('snap');
            if (onOpenMenu) {
              onOpenMenu();
            } else if (onExit) {
              onExit();
            } else {
              onReshuffle();
            }
          }}
          style={getCardStyle(false)}
          className="relative flex aspect-[1.38/1] w-full cursor-pointer flex-col items-center justify-between rounded-[32px] p-6 sm:p-8 landscape:p-4 text-center border select-none active:scale-[0.99] transition-transform overflow-hidden"
        >
          {/* Paper Fiber Grain & Dust Fleck Layer */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none opacity-45 mix-blend-multiply rounded-[32px]"
            style={{
              backgroundImage: PAPER_TEXTURE_DATA_URI,
              backgroundSize: '220px 220px',
            }}
          />

          {/* Top Edge Wear & Bevel */}
          <div
            aria-hidden="true"
            className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none"
          />

          {/* Frosted Matte Scotch Tape */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-gradient-to-br from-white/70 via-white/55 to-white/40 backdrop-blur-[3px] border border-black/5 rounded-xs shadow-xs -rotate-1 pointer-events-none" />

          <div />

          <div className="relative z-10 px-4">
            <h2
              className="text-[#C10016] text-base sm:text-lg md:text-xl landscape:text-sm font-bold tracking-tight uppercase leading-snug"
              style={{ textShadow: '0 0.4px 0.4px rgba(193, 0, 22, 0.15)' }}
            >
              YOU’VE REACHED THE END.
            </h2>
            <p className="text-[#C10016]/70 text-xs sm:text-sm landscape:text-[11px] font-medium mt-1">
              Tap anywhere to open topics menu or reshuffle.
            </p>
          </div>

          <div
            className="relative z-10 text-[11px] sm:text-xs font-bold uppercase tracking-tight text-[#C10016]"
            style={{ textShadow: '0 0.4px 0.4px rgba(193, 0, 22, 0.15)' }}
          >
            {editionText}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex w-full max-w-[360px] sm:max-w-[440px] md:max-w-[480px] landscape:max-w-[320px] landscape:sm:max-w-[350px] items-center justify-center px-4 select-none touch-none">
      {/* SHUFFLE CHOREOGRAPHY: 1.6s Full Riffle & Interweave Sequence */}
      {isShuffling ? (
        <div className="relative flex aspect-[1.38/1] w-full items-center justify-center pointer-events-none">
          {/* 1. Left Deck Packet */}
          <motion.div
            animate={{
              x: [0, -115, -115, -70, -35, 0],
              y: [0, 6, 6, -6, 2, 0],
              rotate: [0, -16, -16, -9, -3, 0],
              scale: [1, 0.98, 0.98, 0.99, 1, 1],
            }}
            transition={{ duration: 1.6, times: [0, 0.22, 0.55, 0.78, 0.92, 1], ease: 'easeInOut' }}
            style={{ ...getCardStyle(false), zIndex: 1 }}
            className="absolute inset-0 aspect-[1.38/1] rounded-[32px] border overflow-hidden opacity-75"
          >
            <div
              className="absolute inset-0 opacity-40 mix-blend-multiply rounded-[32px]"
              style={{ backgroundImage: PAPER_TEXTURE_DATA_URI, backgroundSize: '220px 220px' }}
            />
          </motion.div>

          {/* 2. Right Deck Packet */}
          <motion.div
            animate={{
              x: [0, 115, 115, 70, 35, 0],
              y: [0, 6, 6, -6, 2, 0],
              rotate: [0, 16, 16, 9, 3, 0],
              scale: [1, 0.98, 0.98, 0.99, 1, 1],
            }}
            transition={{ duration: 1.6, times: [0, 0.22, 0.55, 0.78, 0.92, 1], ease: 'easeInOut' }}
            style={{ ...getCardStyle(false), zIndex: 2 }}
            className="absolute inset-0 aspect-[1.38/1] rounded-[32px] border overflow-hidden opacity-75"
          >
            <div
              className="absolute inset-0 opacity-40 mix-blend-multiply rounded-[32px]"
              style={{ backgroundImage: PAPER_TEXTURE_DATA_URI, backgroundSize: '220px 220px' }}
            />
          </motion.div>

          {/* 3. Fluttering Card 1 (Left to Center Riffle) */}
          <motion.div
            animate={{
              x: [0, -100, -45, 15, -4, 0],
              y: [0, -12, 14, -8, 2, 0],
              rotate: [0, -14, 10, -4, 2, 0],
              scale: [0.96, 1.01, 0.98, 1, 1, 1],
            }}
            transition={{ duration: 1.6, times: [0, 0.25, 0.58, 0.8, 0.93, 1], ease: 'easeInOut' }}
            style={{ ...getCardStyle(false), zIndex: 3 }}
            className="absolute inset-0 aspect-[1.38/1] rounded-[32px] border overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-40 mix-blend-multiply rounded-[32px]"
              style={{ backgroundImage: PAPER_TEXTURE_DATA_URI, backgroundSize: '220px 220px' }}
            />
          </motion.div>

          {/* 4. Fluttering Card 2 (Right to Center Riffle) */}
          <motion.div
            animate={{
              x: [0, 100, 45, -15, 4, 0],
              y: [0, -14, 10, -6, 2, 0],
              rotate: [0, 14, -10, 4, -2, 0],
              scale: [0.96, 1.01, 0.98, 1, 1, 1],
            }}
            transition={{ duration: 1.6, times: [0, 0.28, 0.62, 0.82, 0.94, 1], ease: 'easeInOut' }}
            style={{ ...getCardStyle(false), zIndex: 4 }}
            className="absolute inset-0 aspect-[1.38/1] rounded-[32px] border overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-40 mix-blend-multiply rounded-[32px]"
              style={{ backgroundImage: PAPER_TEXTURE_DATA_URI, backgroundSize: '220px 220px' }}
            />
          </motion.div>

          {/* 5. Top Cover Arch & Bridge Snap */}
          <motion.div
            animate={{
              x: [0, -20, 20, -10, 0],
              y: [0, -24, -18, 6, 0],
              rotate: [0, -3, 3, -1, 0],
              scale: [1, 1.04, 1.03, 0.99, 1],
            }}
            transition={{ duration: 1.6, times: [0, 0.35, 0.7, 0.88, 1], ease: 'easeInOut' }}
            style={{ ...getCardStyle(true), zIndex: 5 }}
            className="absolute inset-0 aspect-[1.38/1] rounded-[32px] border p-6 flex flex-col items-center justify-center text-center overflow-hidden shadow-xl"
          >
            <div
              className="absolute inset-0 opacity-30 mix-blend-overlay rounded-[32px]"
              style={{ backgroundImage: PAPER_TEXTURE_DATA_URI, backgroundSize: '220px 220px' }}
            />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
              SHUFFLING DECK...
            </h2>
          </motion.div>
        </div>
      ) : (
        <>
          {/* Layer 3: Bottom card consistently peeking to the LEFT */}
          {thirdCard && (
            <div
              aria-hidden="true"
              className="absolute inset-x-5 top-2 aspect-[1.38/1] rounded-[32px] border pointer-events-none opacity-50 will-change-transform overflow-hidden"
              style={{
                ...getCardStyle(thirdCard.isCover),
                transform: `translateY(12px) scale(0.93) rotate(${stackLeftRotate}deg)`,
                zIndex: 1,
              }}
            />
          )}

          {/* Layer 2: Middle card consistently peeking to the RIGHT */}
          {nextCard && (
            <motion.div
              key={`next-${nextCard.id}`}
              aria-hidden="true"
              style={{
                ...getCardStyle(nextCard.isCover),
                scale: nextScale,
                y: nextY,
                rotate: nextRotate,
                opacity: nextOpacity,
                zIndex: 2,
              }}
              className="absolute inset-x-4 top-0 aspect-[1.38/1] flex flex-col items-center justify-between rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 text-center border pointer-events-none will-change-transform overflow-hidden"
            >
              {/* Paper Fiber Grain & Dust Fleck Layer */}
              <div
                aria-hidden="true"
                className={`absolute inset-0 pointer-events-none rounded-[32px] ${
                  nextCard.isCover ? 'opacity-30 mix-blend-overlay' : 'opacity-45 mix-blend-multiply'
                }`}
                style={{
                  backgroundImage: PAPER_TEXTURE_DATA_URI,
                  backgroundSize: '220px 220px',
                }}
              />

              {/* Top Edge Wear Highlight */}
              <div
                aria-hidden="true"
                className={`absolute top-0 inset-x-8 h-[2px] pointer-events-none ${
                  nextCard.isCover
                    ? 'bg-gradient-to-r from-transparent via-white/35 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-white/80 to-transparent'
                }`}
              />

              {/* Frosted Scotch Tape */}
              <div
                className={`absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 backdrop-blur-[3px] rounded-xs shadow-xs -rotate-1 pointer-events-none ${
                  nextCard.isCover
                    ? 'bg-gradient-to-br from-white/40 via-white/25 to-white/15 border border-white/20'
                    : 'bg-gradient-to-br from-white/70 via-white/55 to-white/40 border border-black/5'
                }`}
              />

              <div />

              {/* Next Card Content */}
              {nextCard.isCover ? (
                <div className="relative z-10 my-auto px-4 sm:px-8 landscape:px-2 flex flex-col items-center justify-center text-center">
                  <h2
                    className="text-xl sm:text-2xl landscape:text-base landscape:sm:text-lg font-black uppercase tracking-tight text-white leading-tight"
                    style={{ textShadow: '0 0.5px 1px rgba(0, 0, 0, 0.25)' }}
                  >
                    {nextCard.coverTitle || nextCard.text}
                  </h2>
                  {nextCard.coverTagline && (
                    <p
                      className="mt-2 landscape:mt-1 text-xs sm:text-sm landscape:text-[11px] font-semibold uppercase tracking-wide text-white/85 max-w-xs leading-snug"
                      style={{ textShadow: '0 0.5px 1px rgba(0, 0, 0, 0.2)' }}
                    >
                      {nextCard.coverTagline}
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative z-10 my-auto px-2 sm:px-6 landscape:px-2 flex items-center justify-center">
                  <p
                    className="text-[#C10016] text-base sm:text-lg md:text-xl landscape:text-sm landscape:sm:text-base font-bold tracking-tight uppercase leading-snug text-balance"
                    style={{ textShadow: '0 0.4px 0.4px rgba(193, 0, 22, 0.15)' }}
                  >
                    {nextCard.text}
                  </p>
                </div>
              )}

              {/* Card Footer */}
              <div
                className={`relative z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight whitespace-pre-line leading-tight ${
                  nextCard.isCover ? 'text-white/80' : 'text-[#C10016]'
                }`}
                style={{
                  textShadow: nextCard.isCover
                    ? '0 0.5px 1px rgba(0, 0, 0, 0.2)'
                    : '0 0.4px 0.4px rgba(193, 0, 22, 0.15)',
                }}
              >
                {nextCard.isCover
                  ? (nextCard.coverPrompt || 'READY TO START? SWIPE RIGHT →')
                  : (nextCard.edition || editionText)}
              </div>
            </motion.div>
          )}

          {/* Layer 1: Active Top Draggable Card */}
          {currentCard && (
            <motion.div
              key={`current-${currentCard.id}`}
              drag={isAnimatingOut ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.85}
              onDragEnd={handleDragEnd}
              style={{
                ...getCardStyle(currentCard.isCover),
                x,
                rotate,
                zIndex: 10,
              }}
              className="relative flex aspect-[1.38/1] w-full cursor-grab active:cursor-grabbing flex-col items-center justify-between rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 text-center border will-change-transform overflow-hidden"
            >
              {/* Paper Fiber Grain & Dust Fleck Layer */}
              <div
                aria-hidden="true"
                className={`absolute inset-0 pointer-events-none rounded-[32px] ${
                  currentCard.isCover ? 'opacity-30 mix-blend-overlay' : 'opacity-45 mix-blend-multiply'
                }`}
                style={{
                  backgroundImage: PAPER_TEXTURE_DATA_URI,
                  backgroundSize: '220px 220px',
                }}
              />

              {/* Top Edge Wear & Subtle Highlight */}
              <div
                aria-hidden="true"
                className={`absolute top-0 inset-x-8 h-[2px] pointer-events-none ${
                  currentCard.isCover
                    ? 'bg-gradient-to-r from-transparent via-white/35 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-white/80 to-transparent'
                }`}
              />

              {/* Frosted Scotch Tape */}
              <div
                className={`absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 backdrop-blur-[3px] rounded-xs shadow-xs -rotate-1 pointer-events-none ${
                  currentCard.isCover
                    ? 'bg-gradient-to-br from-white/40 via-white/25 to-white/15 border border-white/20'
                    : 'bg-gradient-to-br from-white/70 via-white/55 to-white/40 border border-black/5'
                }`}
              />

              <div />

              {/* Question / Cover Content */}
              {currentCard.isCover ? (
                <div className="relative z-10 my-auto px-4 sm:px-8 landscape:px-2 flex flex-col items-center justify-center text-center">
                  <h2
                    className="text-xl sm:text-2xl landscape:text-base landscape:sm:text-lg font-black uppercase tracking-tight text-white leading-tight"
                    style={{ textShadow: '0 0.5px 1px rgba(0, 0, 0, 0.25)' }}
                  >
                    {currentCard.coverTitle || currentCard.text}
                  </h2>
                  {currentCard.coverTagline && (
                    <p
                      className="mt-2 landscape:mt-1 text-xs sm:text-sm landscape:text-[11px] font-semibold uppercase tracking-wide text-white/85 max-w-xs leading-snug"
                      style={{ textShadow: '0 0.5px 1px rgba(0, 0, 0, 0.2)' }}
                    >
                      {currentCard.coverTagline}
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative z-10 my-auto px-2 sm:px-6 landscape:px-2 flex items-center justify-center">
                  <p
                    className="text-[#C10016] text-base sm:text-lg md:text-xl landscape:text-sm landscape:sm:text-base font-bold tracking-tight uppercase leading-snug text-balance"
                    style={{ textShadow: '0 0.4px 0.4px rgba(193, 0, 22, 0.15)' }}
                  >
                    {currentCard.text}
                  </p>
                </div>
              )}

              {/* Card Footer: wsomeone without wide spaces */}
              <div
                className={`relative z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight whitespace-pre-line leading-tight ${
                  currentCard.isCover ? 'text-white/80' : 'text-[#C10016]'
                }`}
                style={{
                  textShadow: currentCard.isCover
                    ? '0 0.5px 1px rgba(0, 0, 0, 0.2)'
                    : '0 0.4px 0.4px rgba(193, 0, 22, 0.15)',
                }}
              >
                {currentCard.isCover
                  ? (currentCard.coverPrompt || 'READY TO START? SWIPE RIGHT →')
                  : (currentCard.edition || editionText)}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
