'use client';

class SoundManager {
  private ctx: AudioContext | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private isLoading = false;
  private isUnlocked = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Auto-unlock audio context on first user interaction
      const unlock = () => {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().then(() => {
            this.isUnlocked = true;
          }).catch(() => {});
        }
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };

      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }
  }

  private init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (!this.isLoading && this.buffers.size === 0) {
      this.preload();
    }
  }

  public preload() {
    if (typeof window === 'undefined' || this.isLoading) return;
    this.isLoading = true;

    const sounds = [
      { key: 'slide', url: '/sounds/card-slide.mp3' },
      { key: 'shuffle', url: '/sounds/card-shuffle.mp3' },
    ];

    sounds.forEach(({ key, url }) => {
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then(async (arrayBuffer) => {
          if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
          }
          if (this.ctx) {
            const decoded = await this.ctx.decodeAudioData(arrayBuffer);
            this.buffers.set(key, decoded);
          }
        })
        .catch(() => {
          // Preload fail fallback (e.g. offline/blocked)
        });
    });
  }

  public play(key: 'slide' | 'shuffle', volume = 0.8) {
    if (typeof window === 'undefined') return;
    this.init();

    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const buffer = this.buffers.get(key);
    if (buffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        // Slight natural pitch variation for tactile realism
        if (key === 'slide') {
          source.playbackRate.value = 0.96 + Math.random() * 0.08;
        }

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), this.ctx.currentTime);

        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        source.start(0);
      } catch {
        // Playback catch
      }
    } else {
      // Direct Audio element fallback if buffer not yet decoded
      try {
        const audio = new Audio(key === 'slide' ? '/sounds/card-slide.mp3' : '/sounds/card-shuffle.mp3');
        audio.volume = volume;
        audio.play().catch(() => {});
      } catch {
        // Fallback catch
      }
    }
  }
}

export const soundManager = typeof window !== 'undefined' ? new SoundManager() : (null as unknown as SoundManager);
