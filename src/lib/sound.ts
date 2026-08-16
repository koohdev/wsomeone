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

  private createReversedBuffer(originalBuffer: AudioBuffer): AudioBuffer | null {
    if (!this.ctx) return null;
    try {
      const reversed = this.ctx.createBuffer(
        originalBuffer.numberOfChannels,
        originalBuffer.length,
        originalBuffer.sampleRate
      );
      for (let c = 0; c < originalBuffer.numberOfChannels; c++) {
        const srcData = originalBuffer.getChannelData(c);
        const destData = reversed.getChannelData(c);
        for (let i = 0, j = srcData.length - 1; i < srcData.length; i++, j--) {
          destData[i] = srcData[j];
        }
      }
      return reversed;
    } catch {
      return null;
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

            // Automatically generate reversed slide audio buffer
            if (key === 'slide') {
              const reversed = this.createReversedBuffer(decoded);
              if (reversed) {
                this.buffers.set('slide-reverse', reversed);
              }
            }
          }
        })
        .catch(() => {
          // Preload fail fallback (e.g. offline/blocked)
        });
    });
  }

  public play(key: 'slide' | 'slide-reverse' | 'shuffle', volume = 0.8) {
    if (typeof window === 'undefined') return;
    this.init();

    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // Lazy create reversed buffer if slide exists but slide-reverse doesn't
    if (key === 'slide-reverse' && !this.buffers.has('slide-reverse')) {
      const slideBuf = this.buffers.get('slide');
      if (slideBuf) {
        const rev = this.createReversedBuffer(slideBuf);
        if (rev) this.buffers.set('slide-reverse', rev);
      }
    }

    const buffer = this.buffers.get(key);
    if (buffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        // Realistic pitch variation and animation timing match
        if (key === 'slide') {
          source.playbackRate.value = 0.96 + Math.random() * 0.08;
        } else if (key === 'slide-reverse') {
          // Matched to reverse spring animation speed
          source.playbackRate.value = 1.02 + Math.random() * 0.06;
        }

        const gainNode = this.ctx.createGain();
        const now = this.ctx.currentTime;
        const vol = Math.min(1, Math.max(0, volume));
        gainNode.gain.setValueAtTime(vol, now);

        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        source.start(0);
      } catch {
        // Playback catch
      }
    } else {
      // Direct Audio fallback
      try {
        const audio = new Audio(key === 'shuffle' ? '/sounds/card-shuffle.mp3' : '/sounds/card-slide.mp3');
        audio.volume = volume;
        audio.play().catch(() => {});
      } catch {
        // Fallback catch
      }
    }
  }
}

export const soundManager = typeof window !== 'undefined' ? new SoundManager() : (null as unknown as SoundManager);
