/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private enabled = true;

  constructor() {
    // Audio Context is initialized lazily on first interaction due to browser strict policies
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public play(type: 'bounce' | 'portal' | 'button' | 'goal' | 'reset' | 'laser') {
    if (!this.enabled) return;

    try {
      this.initCtx();
      if (!this.ctx) return;

      const time = this.ctx.currentTime;

      switch (type) {
        case 'bounce': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(150, time);
          // logarithmic pitch decay
          osc.frequency.exponentialRampToValueAtTime(80, time + 0.12);

          gain.gain.setValueAtTime(0.2, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(time);
          osc.stop(time + 0.13);
          break;
        }

        case 'button': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(450, time);
          osc.frequency.setValueAtTime(900, time + 0.02);

          gain.gain.setValueAtTime(0.12, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(time);
          osc.stop(time + 0.09);
          break;
        }

        case 'portal': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(200, time);
          // Sweeping pitch upwards
          osc.frequency.exponentialRampToValueAtTime(1200, time + 0.28);

          gain.gain.setValueAtTime(0.18, time);
          gain.gain.exponentialRampToValueAtTime(0.005, time + 0.28);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(time);
          osc.stop(time + 0.3);
          break;
        }

        case 'laser': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(800, time);
          osc.frequency.linearRampToValueAtTime(100, time + 0.2);

          gain.gain.setValueAtTime(0.15, time);
          gain.gain.linearRampToValueAtTime(0.01, time + 0.2);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(time);
          osc.stop(time + 0.22);
          break;
        }

        case 'reset': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, time);
          osc.frequency.linearRampToValueAtTime(60, time + 0.35);

          gain.gain.setValueAtTime(0.25, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.35);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(time);
          osc.stop(time + 0.36);
          break;
        }

        case 'goal': {
          // Play a rapid retro major arpeggio chord!
          const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
          notes.forEach((freq, i) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            const noteTime = time + i * 0.08;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteTime);

            gain.gain.setValueAtTime(0.15, noteTime);
            gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(noteTime);
            osc.stop(noteTime + 0.28);
          });
          break;
        }
      }
    } catch (e) {
      console.warn('Audio synthesis warning: Web Audio API restricted by current frame environments.', e);
    }
  }
}

export const sfx = new SoundSynthesizer();
