'use client';

import React from 'react';

interface ProgressCircleProps {
  progress?: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  isActive?: boolean;
}

export function ProgressCircle({
  progress = 0,
  size = 18,
  strokeWidth = 2,
  isActive = false,
}: ProgressCircleProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const offset = 100 - clamped;

  return (
    <svg
      height={size}
      viewBox="0 0 14 14"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 -rotate-90 origin-center"
      style={{ height: `${size}px`, width: `${size}px`, transformOrigin: '50% 50%' }}
    >
      {/* Background Circle Track */}
      <circle
        cx="7"
        cy="7"
        pathLength="100"
        r="5.5"
        fill="none"
        stroke={isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(193, 0, 22, 0.15)'}
        strokeWidth={strokeWidth}
      />
      {/* Dynamic Animated Progress Circle */}
      {clamped > 0 && (
        <circle
          cx="7"
          cy="7"
          pathLength="100"
          r="5.5"
          fill="none"
          stroke={isActive ? '#FFFFFF' : '#C10016'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="100"
          strokeDashoffset={offset}
          className="transition-all duration-300 ease-out"
        />
      )}
    </svg>
  );
}
