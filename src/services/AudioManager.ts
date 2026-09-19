export class AudioManager {
  private static soundEnabled: boolean = true;
  private static musicEnabled: boolean = true;

  public static async init(): Promise<void> {
    try {
      // Safe dynamic audio setup if available
      const expoAudio = require('expo-audio');
      if (expoAudio && expoAudio.setAudioModeAsync) {
        await expoAudio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      }
    } catch (e) {
      try {
        const expoAv = require('expo-av');
        if (expoAv && expoAv.Audio && expoAv.Audio.setAudioModeAsync) {
          await expoAv.Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
          });
        }
      } catch (err) {
        // Audio mode fallback
      }
    }
  }

  public static setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  public static setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
  }

  public static isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public static isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  /**
   * Dynamic Sound FX Triggers
   */
  public static playKick(): void {
    if (!this.soundEnabled) return;
    this.synthesizeSound(180, 0.12, 'sine', 0.8, true); // Deep thump kick
  }

  public static playWallHit(): void {
    if (!this.soundEnabled) return;
    this.synthesizeSound(240, 0.15, 'square', 0.6); // Dull thud
  }

  public static playPostHit(): void {
    if (!this.soundEnabled) return;
    this.synthesizeSound(950, 0.25, 'triangle', 0.9); // Metallic clack
  }

  public static playNetSound(): void {
    if (!this.soundEnabled) return;
    this.synthesizeSound(320, 0.2, 'sawtooth', 0.4); // Net swish
  }

  public static playGoalCheer(): void {
    if (!this.soundEnabled) return;
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      setTimeout(() => {
        this.synthesizeSound(freq, 0.35, 'sine', 0.7);
      }, i * 90);
    });
  }

  public static playWhistle(): void {
    if (!this.soundEnabled) return;
    this.synthesizeSound(2400, 0.4, 'sine', 0.8);
  }

  public static playSave(): void {
    if (!this.soundEnabled) return;
    this.synthesizeSound(200, 0.2, 'sawtooth', 0.5);
  }

  public static playButton(): void {
    if (!this.soundEnabled) return;
    this.synthesizeSound(600, 0.05, 'sine', 0.3);
  }

  public static playCombo(): void {
    if (!this.soundEnabled) return;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      setTimeout(() => {
        this.synthesizeSound(freq, 0.15, 'triangle', 0.5);
      }, i * 60);
    });
  }

  private static synthesizeSound(
    freq: number,
    durationSec: number,
    type: OscillatorType = 'sine',
    volume: number = 0.5,
    pitchDrop: boolean = false
  ): void {
    if (typeof window !== 'undefined' && (window as any).AudioContext) {
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        if (pitchDrop) {
          osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + durationSec);
        }

        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + durationSec);
      } catch (e) {
        // Fallback silently if web audio context restricted
      }
    }
  }
}
