"use client";

import React, { useState } from "react";
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
  const [returningCard, setReturningCard] = useState<ReturningCard | null>(null);

  const isEnd = currentIndex >= cards.length;
  const currentCard = !isEnd ? cards[currentIndex] : null;
  const nextCard =
    currentIndex + 1 < cards.length ? cards[currentIndex + 1] : null;
  const thirdCard =
    currentIndex + 2 < cards.length ? cards[currentIndex + 2] : null;

  // Selected sample cards for visual shuffle riffle
  const shuffleCard1 = cards[1] || cards[0];
  const shuffleCard2 = cards[2] || cards[0];
  const shuffleCard3 = cards[3] || cards[1] || cards[0];
  const shuffleCard4 = cards[4] || cards[2] || cards[0];
  const shuffleCover = cards[0];

  // Fixed, consistent double-sided fanned stack rotations
  const stackLeftRotate = -3.2; // Layer 3 peeking left
  const stackRightRotate = 2.8; // Layer 2 peeking right

  // Motion values for the top active card
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-800, 0, 800], [-16, 0, 16]);

  // Dynamic transforms for Layer 2 (middle card) as top card is dragged
  // NO scale transform — all cards are the same fixed size to prevent resize flash
  const nextY = useTransform(x, [-250, 0, 250], [0, 6, 0]);
  const nextOpacity = useTransform(x, [-250, 0, 250], [1, 0.9, 1]);
  const nextRotate = useTransform(x, [-250, 0, 250], [0, stackRightRotate, 0]);

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
      <div className="relative flex w-full max-w-[360px] sm:max-w-[440px] md:max-w-[480px] items-center justify-center px-4">
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
          className="relative flex aspect-[1.38/1] w-full cursor-pointer flex-col items-center justify-center rounded-[32px] p-6 sm:p-8 landscape:p-4 text-center border select-none active:scale-[0.99] transition-transform overflow-hidden"
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

          <div className="relative z-10 px-4">
            <h2
              className="text-[#C10016] text-base sm:text-lg md:text-xl landscape:text-sm font-bold tracking-tight uppercase leading-snug"
              style={{ textShadow: "0 0.4px 0.4px rgba(193, 0, 22, 0.15)" }}
            >
              YOU’VE REACHED THE END.
            </h2>
            <p className="text-[#C10016]/70 text-xs sm:text-sm landscape:text-[11px] font-medium mt-1">
              Tap anywhere to open topics menu or reshuffle.
            </p>
          </div>

          <div
            className="absolute bottom-6 sm:bottom-8 landscape:bottom-4 landscape:sm:bottom-5 z-10 text-[11px] sm:text-xs font-bold uppercase tracking-tight text-[#C10016]"
            style={{ textShadow: "0 0.4px 0.4px rgba(193, 0, 22, 0.15)" }}
          >
            {editionText}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex w-full max-w-[360px] sm:max-w-[440px] md:max-w-[480px] items-center justify-center px-4 select-none touch-none">
      {/* SHUFFLE CHOREOGRAPHY: 3.0s Riffle + Center Hover Lift + Physical Center Tabletop Drop */}
      {isShuffling ? (
        <div className="relative w-full aspect-[1.38/1] pointer-events-none">
          {/* 1. Left Deck Base Card */}
          {shuffleCard1 && (
            <motion.div
              animate={{
                x: [0, -48, -48, -24, 0, 0, 0],
                y: [0, 6, 6, 2, 0, 0, 0],
                rotate: [0, -7, -7, -3, 0, 0, 0],
                scale: [1, 0.98, 0.98, 1, 1, 1, 1],
              }}
              transition={{
                duration: 3.0,
                times: [0, 0.2, 0.55, 0.75, 0.88, 0.95, 1],
                ease: "easeInOut",
              }}
              style={{ ...getCardStyle(false), zIndex: 1 }}
              className="absolute inset-0 aspect-[1.38/1] rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 flex flex-col items-center justify-center text-center border overflow-hidden opacity-85 shadow-lg"
            >
              <div
                className="absolute inset-0 opacity-40 mix-blend-multiply rounded-[32px]"
                style={{
                  backgroundImage: PAPER_TEXTURE_DATA_URI,
                  backgroundSize: "220px 220px",
                }}
              />
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-gradient-to-br from-white/70 via-white/55 to-white/40 backdrop-blur-[3px] border border-black/5 rounded-xs shadow-xs -rotate-1 pointer-events-none" />
              <p className="relative z-10 text-[#C10016] text-base sm:text-lg md:text-xl landscape:text-sm landscape:sm:text-base font-bold tracking-tight uppercase leading-snug line-clamp-3 px-2">
                {shuffleCard1.text}
              </p>
              <div className="absolute bottom-6 sm:bottom-8 landscape:bottom-4 landscape:sm:bottom-5 z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight text-[#C10016]">
                {shuffleCard1.edition || editionText}
              </div>
            </motion.div>
          )}

          {/* 2. Right Deck Base Card */}
          {shuffleCard2 && (
            <motion.div
              animate={{
                x: [0, 48, 48, 24, 0, 0, 0],
                y: [0, 6, 6, 2, 0, 0, 0],
                rotate: [0, 7, 7, 3, 0, 0, 0],
                scale: [1, 0.98, 0.98, 1, 1, 1, 1],
              }}
              transition={{
                duration: 3.0,
                times: [0, 0.2, 0.55, 0.75, 0.88, 0.95, 1],
                ease: "easeInOut",
              }}
              style={{ ...getCardStyle(false), zIndex: 2 }}
              className="absolute inset-0 aspect-[1.38/1] rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 flex flex-col items-center justify-center text-center border overflow-hidden opacity-85 shadow-lg"
            >
              <div
                className="absolute inset-0 opacity-40 mix-blend-multiply rounded-[32px]"
                style={{
                  backgroundImage: PAPER_TEXTURE_DATA_URI,
                  backgroundSize: "220px 220px",
                }}
              />
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-gradient-to-br from-white/70 via-white/55 to-white/40 backdrop-blur-[3px] border border-black/5 rounded-xs shadow-xs -rotate-1 pointer-events-none" />
              <p className="relative z-10 text-[#C10016] text-base sm:text-lg md:text-xl landscape:text-sm landscape:sm:text-base font-bold tracking-tight uppercase leading-snug line-clamp-3 px-2">
                {shuffleCard2.text}
              </p>
              <div className="absolute bottom-6 sm:bottom-8 landscape:bottom-4 landscape:sm:bottom-5 z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight text-[#C10016]">
                {shuffleCard2.edition || editionText}
              </div>
            </motion.div>
          )}

          {/* 3. Fluttering Card 1 (Left to Center Riffle) */}
          {shuffleCard3 && (
            <motion.div
              animate={{
                x: [0, -42, -18, 8, 0, 0, 0],
                y: [0, -6, 6, -2, 0, 0, 0],
                rotate: [0, -6, 5, -2, 0, 0, 0],
                scale: [0.96, 1.01, 0.99, 1, 1, 1, 1],
              }}
              transition={{
                duration: 3.0,
                times: [0, 0.25, 0.6, 0.78, 0.88, 0.95, 1],
                ease: "easeInOut",
              }}
              style={{ ...getCardStyle(false), zIndex: 3 }}
              className="absolute inset-0 aspect-[1.38/1] rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 flex flex-col items-center justify-center text-center border overflow-hidden shadow-md"
            >
              <div
                className="absolute inset-0 opacity-40 mix-blend-multiply rounded-[32px]"
                style={{
                  backgroundImage: PAPER_TEXTURE_DATA_URI,
                  backgroundSize: "220px 220px",
                }}
              />
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-gradient-to-br from-white/70 via-white/55 to-white/40 backdrop-blur-[3px] border border-black/5 rounded-xs shadow-xs -rotate-1 pointer-events-none" />
              <p className="relative z-10 text-[#C10016] text-base sm:text-lg md:text-xl landscape:text-sm landscape:sm:text-base font-bold tracking-tight uppercase leading-snug line-clamp-3 px-2">
                {shuffleCard3.text}
              </p>
              <div className="absolute bottom-6 sm:bottom-8 landscape:bottom-4 landscape:sm:bottom-5 z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight text-[#C10016]">
                {shuffleCard3.edition || editionText}
              </div>
            </motion.div>
          )}

          {/* 4. Fluttering Card 2 (Right to Center Riffle) */}
          {shuffleCard4 && (
            <motion.div
              animate={{
                x: [0, 42, 18, -8, 0, 0, 0],
                y: [0, -6, 6, -2, 0, 0, 0],
                rotate: [0, 6, -5, 2, 0, 0, 0],
                scale: [0.96, 1.01, 0.99, 1, 1, 1, 1],
              }}
              transition={{
                duration: 3.0,
                times: [0, 0.28, 0.65, 0.8, 0.88, 0.95, 1],
                ease: "easeInOut",
              }}
              style={{ ...getCardStyle(false), zIndex: 4 }}
              className="absolute inset-0 aspect-[1.38/1] rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 flex flex-col items-center justify-center text-center border overflow-hidden shadow-md"
            >
              <div
                className="absolute inset-0 opacity-40 mix-blend-multiply rounded-[32px]"
                style={{
                  backgroundImage: PAPER_TEXTURE_DATA_URI,
                  backgroundSize: "220px 220px",
                }}
              />
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-gradient-to-br from-white/70 via-white/55 to-white/40 backdrop-blur-[3px] border border-black/5 rounded-xs shadow-xs -rotate-1 pointer-events-none" />
              <p className="relative z-10 text-[#C10016] text-base sm:text-lg md:text-xl landscape:text-sm landscape:sm:text-base font-bold tracking-tight uppercase leading-snug line-clamp-3 px-2">
                {shuffleCard4.text}
              </p>
              <div className="absolute bottom-6 sm:bottom-8 landscape:bottom-4 landscape:sm:bottom-5 z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight text-[#C10016]">
                {shuffleCard4.edition || editionText}
              </div>
            </motion.div>
          )}

          {/* 5. Top Cover Arch, Hover Lift & Dead-Center Tabletop Drop */}
          {shuffleCover && (
            <motion.div
              animate={{
                x: [0, -6, 6, 0, 0, 0, 0, 0],
                y: [0, -10, -18, -48, -52, 0, -2, 0],
                rotate: [0, -2, 2, 0, 0, 0, 0, 0],
                scale: [1, 1.02, 1.03, 1.06, 1.07, 0.98, 1.01, 1],
              }}
              transition={{
                duration: 3.0,
                times: [0, 0.2, 0.45, 0.7, 0.82, 0.93, 0.97, 1],
                ease: "easeInOut",
              }}
              style={{ ...getCardStyle(true), zIndex: 10 }}
              className="absolute inset-0 aspect-[1.38/1] rounded-[32px] border p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 flex flex-col items-center justify-center text-center overflow-hidden shadow-2xl"
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
                className="absolute bottom-6 sm:bottom-8 landscape:bottom-4 landscape:sm:bottom-5 z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight whitespace-pre-line leading-tight text-white/80"
                style={{ textShadow: "0 0.5px 1px rgba(0, 0, 0, 0.2)" }}
              >
                {shuffleCover.coverPrompt || "READY TO START? SWIPE RIGHT →"}
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="relative w-full aspect-[1.38/1]">
          {/* Layer 3: Bottom card consistently peeking to the LEFT */}
          {thirdCard && (
            <div
              aria-hidden="true"
              className="absolute inset-0 aspect-[1.38/1] rounded-[32px] border pointer-events-none opacity-50 overflow-hidden"
              style={{
                ...getCardStyle(thirdCard.isCover),
                transform: `translateY(10px) rotate(${stackLeftRotate}deg)`,
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
                y: nextY,
                rotate: nextRotate,
                opacity: nextOpacity,
                zIndex: 2,
              }}
              className="absolute inset-0 aspect-[1.38/1] flex flex-col items-center justify-center rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 text-center border pointer-events-none overflow-hidden"
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
                className={`absolute bottom-6 sm:bottom-8 landscape:bottom-4 landscape:sm:bottom-5 z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight whitespace-pre-line leading-tight ${
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
              drag={isShuffling || returningCard ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.85}
              onDragEnd={handleDragEnd}
              style={{
                ...getCardStyle(currentCard.isCover),
                x,
                rotate,
                zIndex: 10,
              }}
              className="relative aspect-[1.38/1] w-full cursor-grab active:cursor-grabbing flex flex-col items-center justify-center rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 text-center border overflow-hidden"
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
                className={`absolute bottom-6 sm:bottom-8 landscape:bottom-4 landscape:sm:bottom-5 z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight whitespace-pre-line leading-tight ${
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
              className="absolute inset-0 aspect-[1.38/1] flex flex-col items-center justify-center rounded-[32px] p-6 sm:p-8 landscape:p-4 landscape:sm:p-5 text-center border overflow-hidden shadow-2xl"
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
                className={`absolute bottom-6 sm:bottom-8 landscape:bottom-4 landscape:sm:bottom-5 z-10 text-[11px] sm:text-xs landscape:text-[10px] font-bold uppercase tracking-tight whitespace-pre-line leading-tight ${
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
