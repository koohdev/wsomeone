"use client";

import React, { useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  PanInfo,
} from "framer-motion";
import { Card } from "@/types";

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
  triggerHaptic: (pattern?: "light" | "snap" | "slide-reverse" | "shuffle" | "select") => void;
}

interface ReturningCard {
  id: string;
  card: Card;
}

// 350 GSM Heavy Uncoated Cotton Paper Texture (Embedded SVG Noise + Dust & Fiber Flecks)
const PAPER_TEXTURE_DATA_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paperPulp'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.06  0 0 0 0 0.35 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paperPulp)'/%3E%3Ccircle cx='45' cy='78' r='0.75' fill='%23332211' opacity='0.25'/%3E%3Ccircle cx='180' cy='220' r='0.6' fill='%23221100' opacity='0.2'/%3E%3Ccircle cx='240' cy='60' r='0.9' fill='%23443322' opacity='0.2'/%3E%3Ccircle cx='95' cy='190' r='0.7' fill='%23332211' opacity='0.22'/%3E%3Ccircle cx='140' cy='120' r='0.5' fill='%23111111' opacity='0.18'/%3E%3Ccircle cx='270' cy='260' r='0.8' fill='%23221100' opacity='0.2'/%3E%3Ccircle cx='30' cy='250' r='0.65' fill='%23442211' opacity='0.22'/%3E%3C/svg%3E")`;

export function CardStack({
  cards,
  currentIndex,
  onNext,
  onPrev,
  onReshuffle,
  onOpenMenu,
  onExit,
  isShuffling = false,
  editionText = "WSOMEONE",
  triggerHaptic,
}: CardStackProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "reverse">("forward");
  const [returningCard, setReturningCard] = useState<ReturningCard | null>(null);

  const isEnd = currentIndex >= cards.length;
  const currentCard = !isEnd ? cards[currentIndex] : null;
  const nextCard =
    currentIndex + 1 < cards.length ? cards[currentIndex + 1] : null;
  const thirdCard =
    currentIndex + 2 < cards.length ? cards[currentIndex + 2] : null;

  // Selected sample cards for rapid multi-card visual shuffle riffle
  const shuffleCard1 = cards[1] || cards[0];
  const shuffleCard2 = cards[2] || cards[0];
  const shuffleCard3 = cards[3] || cards[1] || cards[0];
  const shuffleCard4 = cards[4] || cards[2] || cards[0];
  const shuffleCard5 = cards[5] || cards[3] || cards[1] || cards[0];
  const shuffleCard6 = cards[6] || cards[4] || cards[2] || cards[0];
  const shuffleCard7 = cards[7] || cards[5] || cards[3] || cards[0];
  const shuffleCover = cards[0];

  // Fixed, consistent double-sided fanned stack rotations
  const stackLeftRotate = -3.2; // Layer 3 peeking left
  const stackRightRotate = 2.8; // Layer 2 peeking right

  // Motion values for the top active card
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-800, 0, 800], [-16, 0, 16]);

  const getExitDistance = () => {
    if (typeof window !== "undefined") {
      return window.innerWidth / 2 + 320;
    }
    return 800;
  };

  const handleDragEnd = async (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (isShuffling || isAnimating || returningCard) return;

    const rightThreshold = 65;
    const rightVelocityThreshold = 220;
    const leftThreshold =
      typeof window !== "undefined"
        ? Math.min(120, Math.max(65, window.innerWidth * 0.2))
        : 100;

    if (
      info.offset.x > rightThreshold ||
      info.velocity.x > rightVelocityThreshold
    ) {
      // Forward / Swipe Right -> Fly currentCard off-screen FIRST, then advance so next/third cards NEVER change text while visible!
      setDirection("forward");
      setIsAnimating(true);
      triggerHaptic("snap");

      await animate(x, getExitDistance(), {
        duration: 0.22,
        ease: [0.32, 0.72, 0, 1],
      });

      onNext();
      x.set(0);
      setIsAnimating(false);
    } else if (info.offset.x < -leftThreshold) {
      // Reverse / Swipe Left -> Return previous card over top without changing currentCard's text!
      if (currentIndex > 0 && !returningCard) {
        setDirection("reverse");
        const prevCard = cards[currentIndex - 1];
        triggerHaptic("slide-reverse");

        // 1. Current card snaps cleanly back to center without changing text
        animate(x, 0, {
          type: "spring",
          damping: 24,
          stiffness: 240,
        });

        // 2. Previous card swooshes in from the right onto top of the stack
        setReturningCard({
          id: `${prevCard.id}-${Date.now()}`,
          card: prevCard,
        });
      } else {
        triggerHaptic("light");
        animate(x, 0, { type: "spring", damping: 24, stiffness: 220 });
      }
    } else {
      animate(x, 0, { type: "spring", damping: 24, stiffness: 240 });
    }
  };

  // Realistic physical card styling for 350 GSM uncoated paper
  const getCardStyle = (isCover?: boolean) => {
    if (isCover) {
      return {
        backgroundColor: "#C10016",
        borderColor: "#A00012",
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
      backgroundColor: "#FAF8F5",
      borderColor: "rgba(0, 0, 0, 0.08)",
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
      <div className="relative flex w-full max-w-[360px] sm:max-w-[440px] md:max-w-[480px] landscape:max-w-[280px] landscape:sm:max-w-[300px] landscape:md:max-w-[320px] landscape:lg:max-w-[480px] items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 250 }}
          onClick={() => {
            triggerHaptic("snap");
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
              backgroundSize: "220px 220px",
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
              style={{ textShadow: "0 0.4px 0.4px rgba(193, 0, 22, 0.15)" }}
            >
              YOU'VE REACHED THE END.
            </h2>
            <p className="text-[#C10016]/70 text-xs sm:text-sm landscape:text-[11px] font-medium mt-1">
              Tap anywhere to open topics menu or reshuffle.
            </p>
          </div>

          <div
            className="relative z-10 text-[11px] sm:text-xs font-bold uppercase tracking-tight text-[#C10016]"
            style={{ textShadow: "0 0.4px 0.4px rgba(193, 0, 22, 0.15)" }}
          >
            {editionText}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex w-full max-w-[360px] sm:max-w-[440px] md:max-w-[480px] landscape:max-w-[280px] landscape:sm:max-w-[300px] landscape:md:max-w-[320px] landscape:lg:max-w-[480px] items-center justify-center px-4 select-none touch-none">
      {/* FAST MULTI-CARD SHUFFLE CHOREOGRAPHY: 3.0s High-Speed Rapid Multi-Wave Card Riffle */}
      {isShuffling ? (
        <div className="relative w-full aspect-[1.38/1] pointer-events-none">
          {/* 1. Left Deck Base Pack */}
          {shuffleCard1 && (
            <motion.div
              animate={{
                x: [0, -56, -58, -52, -56, -50, -35, -15, 0, 0],
                y: [0, 6, 8, 5, 8, 6, 4, 2, 0, 0],
                rotate: [0, -8, -9, -7, -8, -6, -4, -2, 0, 0],
                opacity: [0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.9, 1, 1],
              }}
              transition={{
                duration: 3.0,
                times: [0, 0.1, 0.22, 0.35, 0.48, 0.62, 0.75, 0.85, 0.94, 1],
                ease: "easeInOut",
              }}
              style={{ ...getCardStyle(false), zIndex: 1 }}
              className="absolute inset-0 rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 flex flex-col items-center justify-between text-center border overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-40 mix-blend-multiply rounded-[32px]"
                style={{
                  backgroundImage: PAPER_TEXTURE_DATA_URI,
                  backgroundSize: "220px 220px",
                }}
              />
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-gradient-to-br from-white/70 via-white/55 to-white/40 backdrop-blur-[3px] border border-black/5 rounded-xs shadow-xs -rotate-1 pointer-events-none" />
              <div />
              <p className="relative z-10 text-[#C10016] text-base sm:text-lg md:text-xl landscape:text-sm landscape:sm:text-base font-bold tracking-tight uppercase leading-snug line-clamp-3 px-2">
                {shuffleCard1.text}
              </p>
              <div className="relative z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight text-[#C10016]">
                {shuffleCard1.edition || editionText}
              </div>
            </motion.div>
          )}

          {/* 2. Right Deck Base Pack */}
          {shuffleCard2 && (
            <motion.div
              animate={{
                x: [0, 56, 58, 52, 56, 50, 35, 15, 0, 0],
                y: [0, 6, 8, 5, 8, 6, 4, 2, 0, 0],
                rotate: [0, 8, 9, 7, 8, 6, 4, 2, 0, 0],
                opacity: [0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.85, 0.6, 0, 0],
              }}
              transition={{
                duration: 3.0,
                times: [0, 0.1, 0.22, 0.35, 0.48, 0.62, 0.75, 0.85, 0.94, 1],
                ease: "easeInOut",
              }}
              style={{ ...getCardStyle(false), zIndex: 2 }}
              className="absolute inset-0 rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 flex flex-col items-center justify-between text-center border overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-40 mix-blend-multiply rounded-[32px]"
                style={{
                  backgroundImage: PAPER_TEXTURE_DATA_URI,
                  backgroundSize: "220px 220px",
                }}
              />
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-gradient-to-br from-white/70 via-white/55 to-white/40 backdrop-blur-[3px] border border-black/5 rounded-xs shadow-xs -rotate-1 pointer-events-none" />
              <div />
              <p className="relative z-10 text-[#C10016] text-base sm:text-lg md:text-xl landscape:text-sm landscape:sm:text-base font-bold tracking-tight uppercase leading-snug line-clamp-3 px-2">
                {shuffleCard2.text}
              </p>
              <div className="relative z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight text-[#C10016]">
                {shuffleCard2.edition || editionText}
              </div>
            </motion.div>
          )}

          {/* 3. Rapid Left Leaf 1 */}
          {shuffleCard3 && (
            <motion.div
              animate={{
                x: [0, -48, -25, 20, -32, 25, -18, 10, 0, 0],
                y: [0, -8, 6, -6, 8, -4, 4, -2, 0, 0],
                rotate: [0, -7, 5, -6, 5, -4, 3, -1, 0, 0],
                opacity: [0, 0.85, 0.85, 0.85, 0.85, 0.85, 0.6, 0.2, 0, 0],
              }}
              transition={{
                duration: 3.0,
                times: [0, 0.1, 0.22, 0.35, 0.48, 0.62, 0.75, 0.85, 0.94, 1],
                ease: "easeInOut",
              }}
              style={{ ...getCardStyle(false), zIndex: 3 }}
              className="absolute inset-0 rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 flex flex-col items-center justify-between text-center border overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-40 mix-blend-multiply rounded-[32px]"
                style={{
                  backgroundImage: PAPER_TEXTURE_DATA_URI,
                  backgroundSize: "220px 220px",
                }}
              />
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-gradient-to-br from-white/70 via-white/55 to-white/40 backdrop-blur-[3px] border border-black/5 rounded-xs shadow-xs -rotate-1 pointer-events-none" />
              <div />
              <p className="relative z-10 text-[#C10016] text-base sm:text-lg md:text-xl landscape:text-sm landscape:sm:text-base font-bold tracking-tight uppercase leading-snug line-clamp-3 px-2">
                {shuffleCard3.text}
              </p>
              <div className="relative z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight text-[#C10016]">
                {shuffleCard3.edition || editionText}
              </div>
            </motion.div>
          )}

          {/* 4. Rapid Right Leaf 1 */}
          {shuffleCard4 && (
            <motion.div
              animate={{
                x: [0, 48, 25, -20, 32, -25, 18, -10, 0, 0],
                y: [0, -8, 6, -6, 8, -4, 4, -2, 0, 0],
                rotate: [0, 7, -5, 6, -5, 4, -3, 1, 0, 0],
                opacity: [0, 0.85, 0.85, 0.85, 0.85, 0.85, 0.6, 0.2, 0, 0],
              }}
              transition={{
                duration: 3.0,
                times: [0, 0.1, 0.22, 0.35, 0.48, 0.62, 0.75, 0.85, 0.94, 1],
                ease: "easeInOut",
              }}
              style={{ ...getCardStyle(false), zIndex: 4 }}
              className="absolute inset-0 rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 flex flex-col items-center justify-between text-center border overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-40 mix-blend-multiply rounded-[32px]"
                style={{
                  backgroundImage: PAPER_TEXTURE_DATA_URI,
                  backgroundSize: "220px 220px",
                }}
              />
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-gradient-to-br from-white/70 via-white/55 to-white/40 backdrop-blur-[3px] border border-black/5 rounded-xs shadow-xs -rotate-1 pointer-events-none" />
              <div />
              <p className="relative z-10 text-[#C10016] text-base sm:text-lg md:text-xl landscape:text-sm landscape:sm:text-base font-bold tracking-tight uppercase leading-snug line-clamp-3 px-2">
                {shuffleCard4.text}
              </p>
              <div className="relative z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight text-[#C10016]">
                {shuffleCard4.edition || editionText}
              </div>
            </motion.div>
          )}

          {/* 5. Rapid Left Leaf 2 */}
          {shuffleCard5 && (
            <motion.div
              animate={{
                x: [0, -40, 22, -28, 18, -22, 14, -6, 0, 0],
                y: [0, -10, 8, -8, 6, -6, 4, 0, 0, 0],
                rotate: [0, -5, 4, -4, 4, -3, 2, 0, 0, 0],
                opacity: [0, 0.85, 0.85, 0.85, 0.85, 0.7, 0.5, 0, 0, 0],
              }}
              transition={{
                duration: 3.0,
                times: [0, 0.1, 0.22, 0.35, 0.48, 0.62, 0.75, 0.85, 0.94, 1],
                ease: "easeInOut",
              }}
              style={{ ...getCardStyle(false), zIndex: 5 }}
              className="absolute inset-0 rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 flex flex-col items-center justify-between text-center border overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-40 mix-blend-multiply rounded-[32px]"
                style={{
                  backgroundImage: PAPER_TEXTURE_DATA_URI,
                  backgroundSize: "220px 220px",
                }}
              />
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-gradient-to-br from-white/70 via-white/55 to-white/40 backdrop-blur-[3px] border border-black/5 rounded-xs shadow-xs -rotate-1 pointer-events-none" />
              <div />
              <p className="relative z-10 text-[#C10016] text-base sm:text-lg md:text-xl landscape:text-sm landscape:sm:text-base font-bold tracking-tight uppercase leading-snug line-clamp-3 px-2">
                {shuffleCard5.text}
              </p>
              <div className="relative z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight text-[#C10016]">
                {shuffleCard5.edition || editionText}
              </div>
            </motion.div>
          )}

          {/* 6. Rapid Right Leaf 2 */}
          {shuffleCard6 && (
            <motion.div
              animate={{
                x: [0, 40, -22, 28, -18, 22, -14, 6, 0, 0],
                y: [0, -10, 8, -8, 6, -6, 4, 0, 0, 0],
                rotate: [0, 5, -4, 4, -4, 3, -2, 0, 0, 0],
                opacity: [0, 0.85, 0.85, 0.85, 0.85, 0.7, 0.5, 0, 0, 0],
              }}
              transition={{
                duration: 3.0,
                times: [0, 0.1, 0.22, 0.35, 0.48, 0.62, 0.75, 0.85, 0.94, 1],
                ease: "easeInOut",
              }}
              style={{ ...getCardStyle(false), zIndex: 6 }}
              className="absolute inset-0 rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 flex flex-col items-center justify-between text-center border overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-40 mix-blend-multiply rounded-[32px]"
                style={{
                  backgroundImage: PAPER_TEXTURE_DATA_URI,
                  backgroundSize: "220px 220px",
                }}
              />
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-gradient-to-br from-white/70 via-white/55 to-white/40 backdrop-blur-[3px] border border-black/5 rounded-xs shadow-xs -rotate-1 pointer-events-none" />
              <div />
              <p className="relative z-10 text-[#C10016] text-base sm:text-lg md:text-xl landscape:text-sm landscape:sm:text-base font-bold tracking-tight uppercase leading-snug line-clamp-3 px-2">
                {shuffleCard6.text}
              </p>
              <div className="relative z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight text-[#C10016]">
                {shuffleCard6.edition || editionText}
              </div>
            </motion.div>
          )}

          {/* 7. Rapid Center Bridge Leaf */}
          {shuffleCard7 && (
            <motion.div
              animate={{
                x: [0, -16, 20, -18, 16, -14, 10, -4, 0, 0],
                y: [0, -12, 10, -10, 8, -8, 4, 0, 0, 0],
                rotate: [0, -4, 4, -3, 3, -2, 1, 0, 0, 0],
                opacity: [0, 0.85, 0.85, 0.85, 0.85, 0.6, 0.4, 0, 0, 0],
              }}
              transition={{
                duration: 3.0,
                times: [0, 0.1, 0.22, 0.35, 0.48, 0.62, 0.75, 0.85, 0.94, 1],
                ease: "easeInOut",
              }}
              style={{ ...getCardStyle(false), zIndex: 7 }}
              className="absolute inset-0 rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 flex flex-col items-center justify-between text-center border overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-40 mix-blend-multiply rounded-[32px]"
                style={{
                  backgroundImage: PAPER_TEXTURE_DATA_URI,
                  backgroundSize: "220px 220px",
                }}
              />
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-gradient-to-br from-white/70 via-white/55 to-white/40 backdrop-blur-[3px] border border-black/5 rounded-xs shadow-xs -rotate-1 pointer-events-none" />
              <div />
              <p className="relative z-10 text-[#C10016] text-base sm:text-lg md:text-xl landscape:text-sm landscape:sm:text-base font-bold tracking-tight uppercase leading-snug line-clamp-3 px-2">
                {shuffleCard7.text}
              </p>
              <div className="relative z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight text-[#C10016]">
                {shuffleCard7.edition || editionText}
              </div>
            </motion.div>
          )}

          {/* 8. Top Cover Arch & Smooth Bouncing Physical Drop Down */}
          {shuffleCover && (
            <motion.div
              animate={{
                x: [0, -6, 6, -4, 3, -2, 1, 0, 0, 0, 0],
                y: [0, -18, -46, -58, -60, -56, 0, -6, 0, -1.5, 0],
                rotate: [0, -3, 3, -2, 2, -1, 0.5, -0.5, 0, 0, 0],
                scale: [1, 1.02, 1.04, 1.05, 1.05, 1.03, 0.99, 1.008, 0.998, 1, 1],
              }}
              transition={{
                duration: 3.0,
                times: [0, 0.12, 0.28, 0.45, 0.62, 0.74, 0.88, 0.92, 0.95, 0.98, 1],
                ease: "easeOut",
              }}
              style={{ ...getCardStyle(true), zIndex: 10 }}
              className="absolute inset-0 rounded-[32px] border p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 flex flex-col items-center justify-between text-center overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-30 mix-blend-overlay rounded-[32px]"
                style={{
                  backgroundImage: PAPER_TEXTURE_DATA_URI,
                  backgroundSize: "220px 220px",
                }}
              />
              <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-gradient-to-br from-white/40 via-white/25 to-white/15 backdrop-blur-[3px] border border-white/20 rounded-xs shadow-xs -rotate-1 pointer-events-none" />
              <div />
              <div className="relative z-10 my-auto px-4 sm:px-8 landscape:px-2 flex flex-col items-center justify-center text-center">
                <h2
                  className="text-xl sm:text-2xl landscape:text-base landscape:sm:text-lg font-black uppercase tracking-tight text-white leading-tight"
                  style={{ textShadow: "0 0.5px 1px rgba(0, 0, 0, 0.25)" }}
                >
                  {shuffleCover.coverTitle || shuffleCover.text}
                </h2>
                {shuffleCover.coverTagline && (
                  <p
                    className="mt-2 landscape:mt-1 text-xs sm:text-sm landscape:text-[11px] font-semibold uppercase tracking-wide text-white/85 max-w-xs leading-snug"
                    style={{ textShadow: "0 0.5px 1px rgba(0, 0, 0, 0.2)" }}
                  >
                    {shuffleCover.coverTagline}
                  </p>
                )}
              </div>
              <div
                className="relative z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight whitespace-pre-line leading-tight text-white/80"
                style={{ textShadow: "0 0.5px 1px rgba(0, 0, 0, 0.2)" }}
              >
                {shuffleCover.coverPrompt || "READY TO START? SWIPE RIGHT →"}
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="relative w-full aspect-[1.38/1]">
          {/* Layer 3: Bottom card peeking left */}
          {thirdCard && (
            <motion.div
              key={`third-${thirdCard.id}`}
              initial={
                currentIndex === 0
                  ? { rotate: stackLeftRotate, y: 10, opacity: 0.5 }
                  : direction === "forward"
                  ? { rotate: stackLeftRotate, y: 14, opacity: 0 }
                  : { rotate: stackRightRotate, y: 6, opacity: 0.9 }
              }
              animate={{ rotate: stackLeftRotate, y: 10, opacity: 0.5 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              aria-hidden="true"
              className="absolute inset-0 rounded-[32px] border pointer-events-none overflow-hidden"
              style={{
                ...getCardStyle(thirdCard.isCover),
                zIndex: 1,
              }}
            />
          )}

          {/* Layer 2: Middle card peeking right */}
          {nextCard && (
            <motion.div
              key={`next-${nextCard.id}`}
              initial={
                currentIndex === 0
                  ? { rotate: stackRightRotate, y: 6, opacity: 0.9 }
                  : direction === "forward"
                  ? { rotate: stackLeftRotate, y: 10, opacity: 0.5 }
                  : { rotate: 0, y: 0, opacity: 1 }
              }
              animate={{ rotate: stackRightRotate, y: 6, opacity: 0.9 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              aria-hidden="true"
              style={{
                ...getCardStyle(nextCard.isCover),
                zIndex: 2,
              }}
              className="absolute inset-0 flex flex-col items-center justify-between rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 text-center border pointer-events-none overflow-hidden"
            >
              {/* Paper Fiber Grain & Dust Fleck Layer */}
              <div
                aria-hidden="true"
                className={`absolute inset-0 pointer-events-none rounded-[32px] ${
                  nextCard.isCover
                    ? "opacity-30 mix-blend-overlay"
                    : "opacity-45 mix-blend-multiply"
                }`}
                style={{
                  backgroundImage: PAPER_TEXTURE_DATA_URI,
                  backgroundSize: "220px 220px",
                }}
              />

              {/* Top Edge Wear Highlight */}
              <div
                aria-hidden="true"
                className={`absolute top-0 inset-x-8 h-[2px] pointer-events-none ${
                  nextCard.isCover
                    ? "bg-gradient-to-r from-transparent via-white/35 to-transparent"
                    : "bg-gradient-to-r from-transparent via-white/80 to-transparent"
                }`}
              />

              {/* Frosted Scotch Tape */}
              <div
                className={`absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 backdrop-blur-[3px] rounded-xs shadow-xs -rotate-1 pointer-events-none ${
                  nextCard.isCover
                    ? "bg-gradient-to-br from-white/40 via-white/25 to-white/15 border border-white/20"
                    : "bg-gradient-to-br from-white/70 via-white/55 to-white/40 border border-black/5"
                }`}
              />

              <div />

              {/* Next Card Content */}
              {nextCard.isCover ? (
                <div className="relative z-10 my-auto px-4 sm:px-8 landscape:px-2 flex flex-col items-center justify-center text-center">
                  <h2
                    className="text-xl sm:text-2xl landscape:text-base landscape:sm:text-lg font-black uppercase tracking-tight text-white leading-tight"
                    style={{ textShadow: "0 0.5px 1px rgba(0, 0, 0, 0.25)" }}
                  >
                    {nextCard.coverTitle || nextCard.text}
                  </h2>
                  {nextCard.coverTagline && (
                    <p
                      className="mt-2 landscape:mt-1 text-xs sm:text-sm landscape:text-[11px] font-semibold uppercase tracking-wide text-white/85 max-w-xs leading-snug"
                      style={{ textShadow: "0 0.5px 1px rgba(0, 0, 0, 0.2)" }}
                    >
                      {nextCard.coverTagline}
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative z-10 my-auto px-2 sm:px-6 landscape:px-2 flex items-center justify-center">
                  <p
                    className="text-[#C10016] text-base sm:text-lg md:text-xl landscape:text-sm landscape:sm:text-base font-bold tracking-tight uppercase leading-snug text-balance"
                    style={{
                      textShadow: "0 0.4px 0.4px rgba(193, 0, 22, 0.15)",
                    }}
                  >
                    {nextCard.text}
                  </p>
                </div>
              )}

              {/* Card Footer */}
              <div
                className={`relative z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight whitespace-pre-line leading-tight ${
                  nextCard.isCover ? "text-white/80" : "text-[#C10016]"
                }`}
                style={{
                  textShadow: nextCard.isCover
                    ? "0 0.5px 1px rgba(0, 0, 0, 0.2)"
                    : "0 0.4px 0.4px rgba(193, 0, 22, 0.15)",
                }}
              >
                {nextCard.isCover
                  ? nextCard.coverPrompt || "READY TO START? SWIPE RIGHT →"
                  : nextCard.edition || editionText}
              </div>
            </motion.div>
          )}

          {/* Layer 1: Active Top Draggable Card */}
          {currentCard && (
            <motion.div
              key={`current-${currentCard.id}`}
              initial={
                currentIndex === 0
                  ? { rotate: 0, y: 0 }
                  : direction === "forward"
                  ? { rotate: stackRightRotate, y: 6 }
                  : { rotate: 0, y: 0 }
              }
              animate={{ rotate: 0, y: 0 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              drag={isShuffling ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.85}
              onDragEnd={handleDragEnd}
              style={{
                ...getCardStyle(currentCard.isCover),
                x,
                zIndex: 10,
              }}
              className="relative aspect-[1.38/1] w-full cursor-grab active:cursor-grabbing flex flex-col items-center justify-between rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 text-center border overflow-hidden"
            >
              {/* Paper Fiber Grain & Dust Fleck Layer */}
              <div
                aria-hidden="true"
                className={`absolute inset-0 pointer-events-none rounded-[32px] ${
                  currentCard.isCover
                    ? "opacity-30 mix-blend-overlay"
                    : "opacity-45 mix-blend-multiply"
                }`}
                style={{
                  backgroundImage: PAPER_TEXTURE_DATA_URI,
                  backgroundSize: "220px 220px",
                }}
              />

              {/* Top Edge Wear & Subtle Highlight */}
              <div
                aria-hidden="true"
                className={`absolute top-0 inset-x-8 h-[2px] pointer-events-none ${
                  currentCard.isCover
                    ? "bg-gradient-to-r from-transparent via-white/35 to-transparent"
                    : "bg-gradient-to-r from-transparent via-white/80 to-transparent"
                }`}
              />

              {/* Frosted Scotch Tape */}
              <div
                className={`absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 backdrop-blur-[3px] rounded-xs shadow-xs -rotate-1 pointer-events-none ${
                  currentCard.isCover
                    ? "bg-gradient-to-br from-white/40 via-white/25 to-white/15 border border-white/20"
                    : "bg-gradient-to-br from-white/70 via-white/55 to-white/40 border border-black/5"
                }`}
              />

              <div />

              {/* Question / Cover Content */}
              {currentCard.isCover ? (
                <div className="relative z-10 my-auto px-4 sm:px-8 landscape:px-2 flex flex-col items-center justify-center text-center">
                  <h2
                    className="text-xl sm:text-2xl landscape:text-base landscape:sm:text-lg font-black uppercase tracking-tight text-white leading-tight"
                    style={{ textShadow: "0 0.5px 1px rgba(0, 0, 0, 0.25)" }}
                  >
                    {currentCard.coverTitle || currentCard.text}
                  </h2>
                  {currentCard.coverTagline && (
                    <p
                      className="mt-2 landscape:mt-1 text-xs sm:text-sm landscape:text-[11px] font-semibold uppercase tracking-wide text-white/85 max-w-xs leading-snug"
                      style={{ textShadow: "0 0.5px 1px rgba(0, 0, 0, 0.2)" }}
                    >
                      {currentCard.coverTagline}
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative z-10 my-auto px-2 sm:px-6 landscape:px-2 flex items-center justify-center">
                  <p
                    className="text-[#C10016] text-base sm:text-lg md:text-xl landscape:text-sm landscape:sm:text-base font-bold tracking-tight uppercase leading-snug text-balance"
                    style={{
                      textShadow: "0 0.4px 0.4px rgba(193, 0, 22, 0.15)",
                    }}
                  >
                    {currentCard.text}
                  </p>
                </div>
              )}

              {/* Card Footer */}
              <div
                className={`relative z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight whitespace-pre-line leading-tight ${
                  currentCard.isCover ? "text-white/80" : "text-[#C10016]"
                }`}
                style={{
                  textShadow: currentCard.isCover
                    ? "0 0.5px 1px rgba(0, 0, 0, 0.2)"
                    : "0 0.4px 0.4px rgba(193, 0, 22, 0.15)",
                }}
              >
                {currentCard.isCover
                  ? currentCard.coverPrompt || "READY TO START? SWIPE RIGHT →"
                  : currentCard.edition || editionText}
              </div>
            </motion.div>
          )}

          {/* Returning Card flying back in from the right onto the stack */}
          {returningCard && (
            <motion.div
              key={returningCard.id}
              initial={{ x: getExitDistance(), rotate: 16, opacity: 0.95 }}
              animate={{ x: 0, rotate: 0, opacity: 1 }}
              transition={{
                type: "spring",
                damping: 24,
                stiffness: 220,
              }}
              onAnimationComplete={() => {
                onPrev();
                setReturningCard(null);
              }}
              style={{
                ...getCardStyle(returningCard.card.isCover),
                zIndex: 30,
                pointerEvents: "none",
              }}
              className="absolute inset-0 flex flex-col items-center justify-between rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 text-center border overflow-hidden shadow-2xl"
            >
              <div
                aria-hidden="true"
                className={`absolute inset-0 pointer-events-none rounded-[32px] ${
                  returningCard.card.isCover
                    ? "opacity-30 mix-blend-overlay"
                    : "opacity-45 mix-blend-multiply"
                }`}
                style={{
                  backgroundImage: PAPER_TEXTURE_DATA_URI,
                  backgroundSize: "220px 220px",
                }}
              />
              <div
                aria-hidden="true"
                className={`absolute top-0 inset-x-8 h-[2px] pointer-events-none ${
                  returningCard.card.isCover
                    ? "bg-gradient-to-r from-transparent via-white/35 to-transparent"
                    : "bg-gradient-to-r from-transparent via-white/80 to-transparent"
                }`}
              />
              <div
                className={`absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 backdrop-blur-[3px] rounded-xs shadow-xs -rotate-1 pointer-events-none ${
                  returningCard.card.isCover
                    ? "bg-gradient-to-br from-white/40 via-white/25 to-white/15 border border-white/20"
                    : "bg-gradient-to-br from-white/70 via-white/55 to-white/40 border border-black/5"
                }`}
              />
              <div />
              {returningCard.card.isCover ? (
                <div className="relative z-10 my-auto px-4 sm:px-8 landscape:px-2 flex flex-col items-center justify-center text-center">
                  <h2 className="text-xl sm:text-2xl landscape:text-base landscape:sm:text-lg font-black uppercase tracking-tight text-white leading-tight">
                    {returningCard.card.coverTitle || returningCard.card.text}
                  </h2>
                  {returningCard.card.coverTagline && (
                    <p className="mt-2 landscape:mt-1 text-xs sm:text-sm landscape:text-[11px] font-semibold uppercase tracking-wide text-white/85 max-w-xs leading-snug">
                      {returningCard.card.coverTagline}
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative z-10 my-auto px-2 sm:px-6 landscape:px-2 flex items-center justify-center">
                  <p className="text-[#C10016] text-base sm:text-lg md:text-xl landscape:text-sm landscape:sm:text-base font-bold tracking-tight uppercase leading-snug text-balance">
                    {returningCard.card.text}
                  </p>
                </div>
              )}
              <div
                className={`relative z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight whitespace-pre-line leading-tight ${
                  returningCard.card.isCover ? "text-white/80" : "text-[#C10016]"
                }`}
              >
                {returningCard.card.isCover
                  ? returningCard.card.coverPrompt || "READY TO START? SWIPE RIGHT →"
                  : returningCard.card.edition || editionText}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
