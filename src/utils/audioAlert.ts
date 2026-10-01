/**
 * Gestionnaire du système d'alarme sonore (Web Audio API),
 * choix des sons/sonneries d'alerte, vibrations haptiques et Wake Lock.
 */

export type SoundType =
  | 'station_chime'
  | 'transit_siren'
  | 'digital_alarm'
  | 'radar_sonar'
  | 'zen_bell';

export interface SoundOption {
  id: SoundType;
  name: string;
  description: string;
  badge: string;
}

export const SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'station_chime',
    name: 'Carillon Ferroviaire',
    description: 'Jingle mélodique à 4 notes inspiré des annonces de gare',
    badge: '🚆 Gare',
  },
  {
    id: 'transit_siren',
    name: 'Sirène d\'Urgence',
    description: 'Double tonalité percutante pour réveil garanti',
    badge: '🚨 Fort',
  },
  {
    id: 'digital_alarm',
    name: 'Bip Digital Rétro',
    description: 'Séquence rapide de bips cadencés style montre digitale',
    badge: '⏰ Classique',
  },
  {
    id: 'radar_sonar',
    name: 'Radar d\'Approche',
    description: 'Pulsations sonar progressives avec sweep de fréquence',
    badge: '📡 Radar',
  },
  {
    id: 'zen_bell',
    name: 'Clochette Douce',
    description: 'Sons harmoniques zen pour rames silencieuses',
    badge: '🔔 Discret',
  },
];

class AlertSystem {
  private audioCtx: AudioContext | null = null;
  private isAlarmRunning = false;
  private intervalId: number | null = null;
  private vibrationIntervalId: number | null = null;
  private wakeLockSentinel: any = null;
  private isMuted = false;
  private currentSound: SoundType = 'station_chime';
  private volume: number = 0.8; // 0 à 1

  /**
   * Initialise ou réactive l'AudioContext sur geste utilisateur
   */
  public ensureAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setSound(sound: SoundType): void {
    this.currentSound = sound;
  }

  public getSound(): SoundType {
    return this.currentSound;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0.05, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Joue le son choisi avec Web Audio API
   */
  public playCurrentSound(targetSound?: SoundType): void {
    if (this.isMuted) return;

    const soundToPlay = targetSound || this.currentSound;

    try {
      const ctx = this.ensureAudioContext();
      const now = ctx.currentTime;
      const baseGain = this.volume;

      switch (soundToPlay) {
        case 'station_chime': {
          // Jingle de gare à 4 notes (Do5, Sol5, Lab5, Mib5)
          const notes = [
            { freq: 523.25, time: 0.0, dur: 0.28 }, // C5
            { freq: 783.99, time: 0.26, dur: 0.3 }, // G5
            { freq: 830.61, time: 0.54, dur: 0.32 }, // G#5 / Ab5
            { freq: 622.25, time: 0.84, dur: 0.55 }, // Eb5
          ];

          notes.forEach(({ freq, time, dur }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + time);

            gain.gain.setValueAtTime(0, now + time);
            gain.gain.linearRampToValueAtTime(0.35 * baseGain, now + time + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + time);
            osc.stop(now + time + dur + 0.05);
          });
          break;
        }

        case 'transit_siren': {
          // Double tonalité percutante alternée 880Hz / 659Hz
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';

          osc.frequency.setValueAtTime(880, now);
          osc.frequency.setValueAtTime(659, now + 0.14);
          osc.frequency.setValueAtTime(880, now + 0.28);
          osc.frequency.setValueAtTime(659, now + 0.42);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.4 * baseGain, now + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.65);
          break;
        }

        case 'digital_alarm': {
          // Bip bip digital rapide (4 impulsions à 1046Hz)
          [0, 0.12, 0.24, 0.36].forEach((timeOffset) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(1046.5, now + timeOffset); // C6

            gain.gain.setValueAtTime(0, now + timeOffset);
            gain.gain.linearRampToValueAtTime(0.25 * baseGain, now + timeOffset + 0.01);
            gain.gain.linearRampToValueAtTime(0, now + timeOffset + 0.07);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + timeOffset);
            osc.stop(now + timeOffset + 0.08);
          });
          break;
        }

        case 'radar_sonar': {
          // Balayage fréquentiel montant de sonar
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';

          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(1760, now + 0.45);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.45 * baseGain, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.7);
          break;
        }

        case 'zen_bell': {
          // Accord de cloche zen harmonieux
          [587.33, 880, 1174.66].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            const mult = idx === 0 ? 0.35 : 0.15;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(mult * baseGain, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 1.2);
          });
          break;
        }
      }
    } catch (e) {
      console.warn('Impossible de jouer le son via Web Audio:', e);
    }
  }

  /**
   * Déclenche une vibration haptique si supportée par l'appareil
   */
  public triggerVibration(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([500, 200, 500, 200]);
      } catch (e) {
        console.warn('Vibration non autorisée ou non disponible:', e);
      }
    }
  }

  /**
   * Démarre l'alarme en continu (son répété + vibrations continues)
   */
  public startFullAlarm(): void {
    if (this.isAlarmRunning) return;
    this.isAlarmRunning = true;

    // Déclenchement initial immédiat
    this.playCurrentSound();
    this.triggerVibration();

    // Répétition toutes les 1.4s
    this.intervalId = window.setInterval(() => {
      if (this.isAlarmRunning) {
        this.playCurrentSound();
      }
    }, 1400);

    // Vibration répétée toutes les 1.8s
    this.vibrationIntervalId = window.setInterval(() => {
      if (this.isAlarmRunning) {
        this.triggerVibration();
      }
    }, 1800);
  }

  /**
   * Arrête immédiatement l'alarme et les vibrations
   */
  public stopAlarm(): void {
    this.isAlarmRunning = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.vibrationIntervalId !== null) {
      clearInterval(this.vibrationIntervalId);
      this.vibrationIntervalId = null;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch (e) {
        // ignore
      }
    }
  }

  public isRunning(): boolean {
    return this.isAlarmRunning;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public async requestWakeLock(): Promise<boolean> {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        return true;
      } catch (err) {
        console.warn('Screen Wake Lock non activé:', err);
        return false;
      }
    }
    return false;
  }

  public releaseWakeLock(): void {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
        this.wakeLockSentinel = null;
      } catch (err) {
        // ignore
      }
    }
  }
}

export const alertSystem = new AlertSystem();
