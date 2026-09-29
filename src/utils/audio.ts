// Audio synthesizer using Web Audio API (No external assets required)

class EmergencyAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private cprInterval: number | null = null;

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.cprInterval) {
      this.stopCPRMetronome();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Plays a dual-tone European/US emergency medical siren pulse
  public playSirenPulse() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      
      // Siren pitch modulation (Hi-Lo pulse)
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.25);
      osc.frequency.linearRampToValueAtTime(660, now + 0.5);
      osc.frequency.linearRampToValueAtTime(880, now + 0.75);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.9);
    } catch {
      // Ignore audio failure
    }
  }

  // Crisp dispatch chirp
  public playDispatchChime() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(800, now);
      osc1.frequency.setValueAtTime(1200, now + 0.1);

      osc2.frequency.setValueAtTime(1000, now);
      osc2.frequency.setValueAtTime(1600, now + 0.1);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch {
      // Ignore
    }
  }

  // CPR compression metronome click (100 - 120 bpm, standard 110 bpm)
  public startCPRMetronome(bpm: number = 110, onTick?: (beat: number) => void) {
    this.stopCPRMetronome();
    const intervalMs = (60 / bpm) * 1000;
    let beatCount = 0;

    const tick = () => {
      beatCount++;
      if (onTick) onTick(beatCount);

      const ctx = this.getContext();
      if (ctx) {
        try {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(beatCount % 30 === 1 ? 1200 : 800, now);

          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.06);
        } catch {
          // ignore
        }
      }
    };

    tick();
    this.cprInterval = window.setInterval(tick, intervalMs);
  }

  public stopCPRMetronome() {
    if (this.cprInterval !== null) {
      clearInterval(this.cprInterval);
      this.cprInterval = null;
    }
  }

  public isCPRRunning(): boolean {
    return this.cprInterval !== null;
  }

  public speakEmergencyAlert(text: string) {
    if (this.isMuted) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Speech synthesis fallback
      }
    }
  }
}

export const emergencyAudio = new EmergencyAudioEngine();
