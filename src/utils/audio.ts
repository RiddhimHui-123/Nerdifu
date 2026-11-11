/**
 * Web Audio API synthesizer for Pomodoro notifications and ambient study sounds.
 * Fully self-contained without fragile external audio URLs.
 */

class StudyAudioEngine {
  private ctx: AudioContext | null = null;
  private ambientSourceNode: AudioNode | null = null;
  private ambientGainNode: GainNode | null = null;
  private ambientInterval: any = null;
  private currentAmbient: string = 'none';

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play a gentle, clear meditation / focus chime when a session finishes
  playCompletionChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const freqs = [528, 660, 792, 1056]; // Harmonious Solfeggio / chord tones
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);

        // Soft bell envelope
        gain.gain.setValueAtTime(0, now + index * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, now + index * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 2.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 2.5);
      });
    } catch (e) {
      console.warn('Audio chime could not play:', e);
    }
  }

  // Start ambient focus background sound
  startAmbient(type: 'none' | 'lofi' | 'rain' | 'whitenoise' | 'library', volume: number = 0.5) {
    this.stopAmbient();
    this.currentAmbient = type;

    if (type === 'none') return;

    try {
      const ctx = this.getContext();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
      masterGain.connect(ctx.destination);
      this.ambientGainNode = masterGain;

      if (type === 'rain') {
        // Synthesize soft rain with filtered noise
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.12;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();
        this.ambientSourceNode = whiteNoise;
      } else if (type === 'whitenoise') {
        // Clean constant gentle pink noise
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.08;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.Q.setValueAtTime(0.5, ctx.currentTime);

        noise.connect(filter);
        filter.connect(masterGain);
        noise.start();
        this.ambientSourceNode = noise;
      } else if (type === 'library') {
        // Subtle warm room tone with low resonance
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(85, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(220, ctx.currentTime);

        const subtleGain = ctx.createGain();
        subtleGain.gain.setValueAtTime(0.08, ctx.currentTime);

        osc.connect(filter);
        filter.connect(subtleGain);
        subtleGain.connect(masterGain);
        osc.start();
        this.ambientSourceNode = osc;
      } else if (type === 'lofi') {
        // Lo-Fi study beats sequence: warm rhythmic low chord + soft kick tap
        const beatChords = [
          [220, 261.63, 329.63, 392], // Am7
          [174.61, 220, 261.63, 329.63], // Fmaj7
          [196, 246.94, 293.66, 349.23], // G7
          [164.81, 196, 246.94, 293.66], // Em7
        ];
        let chordIdx = 0;

        const playLoFiStep = () => {
          if (this.currentAmbient !== 'lofi' || !this.ambientGainNode) return;
          const now = ctx.currentTime;
          const chord = beatChords[chordIdx % beatChords.length];
          chordIdx++;

          // Soft electric piano pad
          chord.forEach((freq) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(650, now);

            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.04, now + 0.2);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

            osc.connect(filter);
            filter.connect(g);
            g.connect(masterGain);

            osc.start(now);
            osc.stop(now + 2.9);
          });
        };

        playLoFiStep();
        this.ambientInterval = setInterval(playLoFiStep, 3000);
      }
    } catch (e) {
      console.warn('Could not start ambient audio:', e);
    }
  }

  setAmbientVolume(volume: number) {
    if (this.ambientGainNode && this.ctx) {
      this.ambientGainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume * 0.4)), this.ctx.currentTime);
    }
  }

  stopAmbient() {
    this.currentAmbient = 'none';
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    if (this.ambientSourceNode) {
      try {
        (this.ambientSourceNode as any).stop?.();
        this.ambientSourceNode.disconnect();
      } catch (e) {}
      this.ambientSourceNode = null;
    }
    if (this.ambientGainNode) {
      try {
        this.ambientGainNode.disconnect();
      } catch (e) {}
      this.ambientGainNode = null;
    }
  }
}

export const studyAudio = new StudyAudioEngine();
