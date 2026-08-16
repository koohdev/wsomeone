'use client';

import { useCallback, useRef } from 'react';
import { soundManager } from '@/lib/sound';

export type HapticType = 'light' | 'medium' | 'snap' | 'slide-reverse' | 'select' | 'shuffle' | 'success';

export function useHaptics(options: { soundEnabled?: boolean; hapticsEnabled?: boolean } = {}) {
  const { soundEnabled = true, hapticsEnabled = true } = options;
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  const triggerHaptic = useCallback(
    (pattern: HapticType = 'snap') => {
      // 1. Mobile Physical Vibration
      if (hapticsEnabled && typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          if (pattern === 'light' || pattern === 'select') {
            navigator.vibrate(8);
          } else if (pattern === 'slide-reverse') {
            navigator.vibrate([10, 8]);
          } else if (pattern === 'medium') {
            navigator.vibrate(16);
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

      // 2. Sound Effects
      if (soundEnabled) {
        try {
          if (pattern === 'shuffle') {
            // Book page shuffle audio effect
            if (soundManager) soundManager.play('shuffle', 0.85);
          } else if (pattern === 'snap') {
            // Card swipe slide audio effect
            if (soundManager) soundManager.play('slide', 0.85);
          } else if (pattern === 'slide-reverse') {
            // Reversed card swipe slide audio effect
            if (soundManager) soundManager.play('slide-reverse', 0.85);
          } else {
            // Original tactile audio tone for card clicks & selection buttons
            const ctx = getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            if (pattern === 'select' || pattern === 'light') {
              // Original soft paper touch & click tone
              osc.type = 'sine';
              osc.frequency.setValueAtTime(220, now);
              osc.frequency.exponentialRampToValueAtTime(80, now + 0.035);

              gain.gain.setValueAtTime(0.1, now);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

              osc.connect(gain);
              gain.connect(ctx.destination);

              osc.start(now);
              osc.stop(now + 0.04);
            } else if (pattern === 'medium') {
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(160, now);
              osc.frequency.exponentialRampToValueAtTime(50, now + 0.045);

              gain.gain.setValueAtTime(0.12, now);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

              osc.connect(gain);
              gain.connect(ctx.destination);

              osc.start(now);
              osc.stop(now + 0.05);
            } else if (pattern === 'success') {
              // Warm double tone
              osc.type = 'sine';
              osc.frequency.setValueAtTime(280, now);
              osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);

              gain.gain.setValueAtTime(0.1, now);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

              osc.connect(gain);
              gain.connect(ctx.destination);

              osc.start(now);
              osc.stop(now + 0.16);
            }
          }
        } catch {
          // Audio policy catch
        }
      }
    },
    [hapticsEnabled, soundEnabled, getAudioContext]
  );

  return { triggerHaptic };
}
