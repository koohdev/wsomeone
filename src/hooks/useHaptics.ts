'use client';

import { useCallback, useRef } from 'react';

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
    (pattern: 'light' | 'medium' | 'snap' | 'success' = 'snap') => {
      if (hapticsEnabled && typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          if (pattern === 'light') {
            navigator.vibrate(8);
          } else if (pattern === 'medium') {
            navigator.vibrate(18);
          } else if (pattern === 'snap') {
            navigator.vibrate([12, 8, 15]);
          } else if (pattern === 'success') {
            navigator.vibrate([20, 30, 40]);
          }
        } catch {
          // Vibration may be restricted by browser policy
        }
      }

      if (soundEnabled) {
        try {
          const ctx = getAudioContext();
          if (!ctx) return;

          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          if (pattern === 'snap') {
            // Analog index card flip / mechanical flick sound
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.045);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.05);
          } else if (pattern === 'light') {
            // Soft paper touch
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.03);

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.035);
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
        } catch {
          // Audio error fallback
        }
      }
    },
    [hapticsEnabled, soundEnabled, getAudioContext]
  );

  return { triggerHaptic };
}
