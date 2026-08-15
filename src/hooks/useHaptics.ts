'use client';

import { useCallback } from 'react';
import { soundManager } from '@/lib/sound';

export type HapticType = 'light' | 'medium' | 'snap' | 'shuffle' | 'success';

export function useHaptics(options: { soundEnabled?: boolean; hapticsEnabled?: boolean } = {}) {
  const { soundEnabled = true, hapticsEnabled = true } = options;

  const triggerHaptic = useCallback(
    (pattern: HapticType = 'snap') => {
      // 1. Mobile Physical Vibration
      if (hapticsEnabled && typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          if (pattern === 'light') {
            navigator.vibrate(6);
          } else if (pattern === 'medium') {
            navigator.vibrate(14);
          } else if (pattern === 'snap') {
            navigator.vibrate([10, 8, 12]);
          } else if (pattern === 'shuffle') {
            navigator.vibrate([12, 10, 15, 10, 20]);
          } else if (pattern === 'success') {
            navigator.vibrate([15, 25, 35]);
          }
        } catch {
          // Vibration restricted by browser policy
        }
      }

      // 2. High Quality Realistic Card Sound Effects
      if (soundEnabled && soundManager) {
        try {
          if (pattern === 'shuffle') {
            soundManager.play('shuffle', 0.85);
          } else if (pattern === 'snap' || pattern === 'light' || pattern === 'medium') {
            soundManager.play('slide', pattern === 'light' ? 0.6 : 0.85);
          }
        } catch {
          // Audio policy catch
        }
      }
    },
    [hapticsEnabled, soundEnabled]
  );

  return { triggerHaptic };
}
