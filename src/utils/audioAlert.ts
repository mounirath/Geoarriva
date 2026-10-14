/**
 * Gestionnaire du système d'alarme sonore robuste (Web Audio API + fallback HTML5 Audio),
 * motifs de vibration haptique configurables (Pulse, Continu, Double-tap, Staccato)
 * pour alerte en poche ou veste, et Screen Wake Lock.
 */

export type SoundType =
  | 'station_chime'
  | 'transit_siren'
  | 'digital_alarm'
  | 'radar_sonar'
  | 'zen_bell';

export type VibrationPatternType =
  | 'pulse'
  | 'continuous'
  | 'double_tap'
  | 'urgent_staccato'
  | 'off';

export interface SoundOption {
  id: SoundType;
  name: string;
  description: string;
  badge: string;
}

export interface VibrationOption {
  id: VibrationPatternType;
  name: string;
  description: string;
  badge: string;
  pattern: number[];
  repeatIntervalMs: number;
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
    name: "Sirène d'Urgence",
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
    name: "Radar d'Approche",
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

export const VIBRATION_OPTIONS: VibrationOption[] = [
  {
    id: 'pulse',
    name: 'Pulsations Rythmées (Pulse)',
    description: 'Série de pulsations vives et cadencées, idéales pour ressentir le rythme dans la poche de pantalon.',
    badge: '⚡ Pulse',
    pattern: [350, 150, 350, 150, 350, 400],
    repeatIntervalMs: 1550,
  },
  {
    id: 'continuous',
    name: 'Vibration Continue Forte (Continuous)',
    description: 'Secousse soutenue et puissante pour traverser les tissus épais de manteaux, vestes d\'hiver ou sacs.',
    badge: '🌊 Continu',
    pattern: [1200, 200, 1200],
    repeatIntervalMs: 1800,
  },
  {
    id: 'double_tap',
    name: 'Double Battement (Double-tap)',
    description: 'Double impulsion tactile nette rappelant un battement cardiaque, très distincte au contact du corps.',
    badge: '💓 Double-tap',
    pattern: [160, 100, 160, 600],
    repeatIntervalMs: 1350,
  },
  {
    id: 'urgent_staccato',
    name: 'Staccato Urgent',
    description: 'Saccades ultra-rapides et répétées pour un réveil énergique même en cas de sommeil profond.',
    badge: '🚨 Urgent',
    pattern: [100, 80, 100, 80, 100, 80, 100, 80, 400],
    repeatIntervalMs: 1250,
  },
  {
    id: 'off',
    name: 'Désactivé (Sans vibration)',
    description: 'Aucune vibration haptique. Alarme sonore uniquement.',
    badge: '🔕 Désactivé',
    pattern: [],
    repeatIntervalMs: 2000,
  },
];

/**
 * Générateur PCM WAV 16-bit Mono autonome pour servir de fallback HTML5 Audio
 * infaillible si l'AudioContext est suspendu ou restreint.
 */
function generateWavUrl(sampleRate: number, durationSeconds: number, generator: (t: number) => number): string {
  try {
    const totalSamples = Math.floor(sampleRate * durationSeconds);
    const buffer = new ArrayBuffer(44 + totalSamples * 2);
    const view = new DataView(buffer);

    const writeStr = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // Header RIFF/WAVE
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + totalSamples * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM Chunk size
    view.setUint16(20, 1, true); // PCM Format = 1
    view.setUint16(22, 1, true); // Mono = 1
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // 16-bit
    writeStr(36, 'data');
    view.setUint32(40, totalSamples * 2, true);

    let offset = 44;
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      let sample = generator(t);
      // Clamp [-1, 1]
      sample = Math.max(-1, Math.min(1, sample));
      const intVal = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, Math.floor(intVal), true);
      offset += 2;
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('WAV generation failed:', err);
    return '';
  }
}

/**
 * Pré-génération des sons en WAV pour lecture immédiate par élément HTML5 Audio
 */
function createSoundWavUrls(): Record<SoundType, string> {
  const sampleRate = 22050;
  const urls: Partial<Record<SoundType, string>> = {};

  // 1. Station Chime : 4 notes (Do5, Sol5, Lab5, Mib5)
  urls.station_chime = generateWavUrl(sampleRate, 1.3, (t) => {
    let out = 0;
    const notes = [
      { f: 523.25, start: 0.0, dur: 0.3 },
      { f: 783.99, start: 0.28, dur: 0.3 },
      { f: 830.61, start: 0.56, dur: 0.32 },
      { f: 622.25, start: 0.86, dur: 0.44 },
    ];
    for (const note of notes) {
      if (t >= note.start && t < note.start + note.dur) {
        const elapsed = t - note.start;
        const env = Math.exp(-elapsed * 5.0);
        // Harmoniques douces de cloche
        out += Math.sin(2 * Math.PI * note.f * t) * 0.7 * env;
        out += Math.sin(4 * Math.PI * note.f * t) * 0.25 * env;
      }
    }
    return out * 0.85;
  });

  // 2. Transit Siren : 880Hz / 659Hz alterné percutant
  urls.transit_siren = generateWavUrl(sampleRate, 0.7, (t) => {
    const f = Math.floor(t * 7) % 2 === 0 ? 880 : 659;
    // Onde riche type dent de scie / triangle
    const phase = (t * f) % 1;
    const saw = phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase;
    const env = t < 0.04 ? t / 0.04 : Math.exp(-(t - 0.04) * 1.5);
    return saw * 0.85 * env;
  });

  // 3. Digital Alarm : 4 bips rapides cadencés
  urls.digital_alarm = generateWavUrl(sampleRate, 0.55, (t) => {
    const beepPeriod = 0.12;
    const index = Math.floor(t / beepPeriod);
    const subT = t - index * beepPeriod;
    if (index < 4 && subT < 0.075) {
      const f = 1046.5; // C6
      const wave = Math.sin(2 * Math.PI * f * t) > 0 ? 0.75 : -0.75;
      return wave * 0.85;
    }
    return 0;
  });

  // 4. Radar Sonar : sweep de fréquence ascendant
  urls.radar_sonar = generateWavUrl(sampleRate, 0.75, (t) => {
    const f = 440 + Math.pow(t / 0.75, 2) * 1320;
    const env = t < 0.03 ? t / 0.03 : Math.exp(-(t - 0.03) * 3.5);
    return Math.sin(2 * Math.PI * f * t) * 0.9 * env;
  });

  // 5. Zen Bell : accord harmonieux doux
  urls.zen_bell = generateWavUrl(sampleRate, 1.25, (t) => {
    const env = Math.exp(-t * 2.8);
    const out =
      Math.sin(2 * Math.PI * 587.33 * t) * 0.5 +
      Math.sin(2 * Math.PI * 880.0 * t) * 0.35 +
      Math.sin(2 * Math.PI * 1174.66 * t) * 0.2;
    return out * env * 0.85;
  });

  return urls as Record<SoundType, string>;
}

class AlertSystem {
  private audioCtx: AudioContext | null = null;
  private isAlarmRunning = false;
  private intervalId: number | null = null;
  private vibrationIntervalId: number | null = null;
  private wakeLockSentinel: any = null;
  private isMuted = false;
  private currentSound: SoundType = 'station_chime';
  private currentVibration: VibrationPatternType = 'pulse';
  private volume: number = 0.85; // 0.05 à 1.0
  private isAudioUnlocked = false;
  private wavUrls: Record<SoundType, string> | null = null;
  private activeHtmlAudio: HTMLAudioElement | null = null;
  private unlockListenerAttached = false;

  constructor() {
    // Restaurer le son et la vibration enregistrés
    try {
      const savedSound = localStorage.getItem('transit_alarm_sound') as SoundType;
      if (savedSound && SOUND_OPTIONS.some((s) => s.id === savedSound)) {
        this.currentSound = savedSound;
      }

      const savedVib = localStorage.getItem('transit_vibration_pattern') as VibrationPatternType;
      if (savedVib && VIBRATION_OPTIONS.some((v) => v.id === savedVib)) {
        this.currentVibration = savedVib;
      }

      const savedVol = localStorage.getItem('transit_alarm_volume');
      if (savedVol) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 1) {
          this.volume = parsed;
        }
      }
    } catch (e) {
      // Ignorer si localStorage restreint
    }

    // Attacher l'écouteur d'activation audio sur premier geste de l'utilisateur
    this.setupGlobalUnlockListener();
  }

  /**
   * Écouteur global pour débloquer l'audio dès la première interaction utilisateur sur la page
   */
  public setupGlobalUnlockListener(): void {
    if (this.unlockListenerAttached || typeof window === 'undefined') return;
    this.unlockListenerAttached = true;

    const unlockHandler = () => {
      this.unlockAudio();
      // On retire les écouteurs une fois débloqué
      const events = ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'];
      events.forEach((evt) => {
        window.removeEventListener(evt, unlockHandler, { capture: true } as any);
      });
    };

    const events = ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'];
    events.forEach((evt) => {
      window.addEventListener(evt, unlockHandler, { capture: true, once: true });
    });
  }

  /**
   * Obtient ou génère les URLs WAV de secours
   */
  private getWavUrls(): Record<SoundType, string> {
    if (!this.wavUrls) {
      this.wavUrls = createSoundWavUrls();
    }
    return this.wavUrls;
  }

  /**
   * Déverrouille de manière proactive le contexte Web Audio et le lecteur HTML5 Audio
   */
  public unlockAudio(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioCtx && AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      // Jouer un minuscule buffer silencieux pour satisfaire la politique Autoplay d'iOS Safari et Chrome
      if (this.audioCtx && this.audioCtx.state === 'running') {
        const buffer = this.audioCtx.createBuffer(1, 1, 22050);
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioCtx.destination);
        source.start(0);
      }

      // Pré-amorcer l'élément HTMLAudio
      if (!this.activeHtmlAudio) {
        this.activeHtmlAudio = new Audio();
        this.activeHtmlAudio.volume = this.volume;
      }

      this.isAudioUnlocked = true;
    } catch (err) {
      console.warn('Unlock audio note:', err);
    }
  }

  /**
   * Initialise ou réactive l'AudioContext sur geste utilisateur
   */
  public ensureAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setSound(sound: SoundType): void {
    this.currentSound = sound;
    try {
      localStorage.setItem('transit_alarm_sound', sound);
    } catch (e) {}
  }

  public getSound(): SoundType {
    return this.currentSound;
  }

  public setVibrationPattern(pattern: VibrationPatternType): void {
    this.currentVibration = pattern;
    try {
      localStorage.setItem('transit_vibration_pattern', pattern);
    } catch (e) {}
  }

  public getVibrationPattern(): VibrationPatternType {
    return this.currentVibration;
  }

  public getVibrationOption(): VibrationOption {
    return (
      VIBRATION_OPTIONS.find((v) => v.id === this.currentVibration) ||
      VIBRATION_OPTIONS[0]
    );
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0.1, Math.min(1.0, vol));
    if (this.activeHtmlAudio) {
      this.activeHtmlAudio.volume = this.volume;
    }
    try {
      localStorage.setItem('transit_alarm_volume', this.volume.toString());
    } catch (e) {}
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Lecture de secours infaillible via élément HTML5 Audio
   */
  public playFallbackHtmlAudio(targetSound?: SoundType): void {
    if (this.isMuted) return;
    try {
      const sound = targetSound || this.currentSound;
      const urls = this.getWavUrls();
      const wavUrl = urls[sound];
      if (!wavUrl) return;

      if (!this.activeHtmlAudio) {
        this.activeHtmlAudio = new Audio();
      }
      this.activeHtmlAudio.src = wavUrl;
      this.activeHtmlAudio.volume = this.volume;
      this.activeHtmlAudio.currentTime = 0;
      const playPromise = this.activeHtmlAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Fallback HTML Audio play interrupted:', err);
        });
      }
    } catch (err) {
      console.warn('HTML5 Audio fallback error:', err);
    }
  }

  /**
   * Joue le son choisi avec Web Audio API et/ou HTML5 Audio de secours
   */
  public playCurrentSound(targetSound?: SoundType): void {
    if (this.isMuted) return;

    const soundToPlay = targetSound || this.currentSound;
    let webAudioSucceeded = false;

    try {
      const ctx = this.ensureAudioContext();

      if (ctx && ctx.state === 'running') {
        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(this.volume, now);
        masterGain.connect(ctx.destination);

        switch (soundToPlay) {
          case 'station_chime': {
            // Jingle de gare à 4 notes (Do5, Sol5, Lab5, Mib5)
            const notes = [
              { freq: 523.25, time: 0.0, dur: 0.32 }, // C5
              { freq: 783.99, time: 0.28, dur: 0.34 }, // G5
              { freq: 830.61, time: 0.58, dur: 0.36 }, // G#5 / Ab5
              { freq: 622.25, time: 0.90, dur: 0.55 }, // Eb5
            ];

            notes.forEach(({ freq, time, dur }) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, now + time);

              // Attaque et déclin sécurisés sans valeur zéro brute
              gain.gain.setValueAtTime(0.001, now + time);
              gain.gain.exponentialRampToValueAtTime(0.7, now + time + 0.03);
              gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

              osc.connect(gain);
              gain.connect(masterGain);
              osc.start(now + time);
              osc.stop(now + time + dur + 0.05);
            });
            webAudioSucceeded = true;
            break;
          }

          case 'transit_siren': {
            // Double tonalité alternée percutante 880Hz / 659Hz
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';

            osc.frequency.setValueAtTime(880, now);
            osc.frequency.setValueAtTime(659, now + 0.16);
            osc.frequency.setValueAtTime(880, now + 0.32);
            osc.frequency.setValueAtTime(659, now + 0.48);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.exponentialRampToValueAtTime(0.75, now + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.70);
            webAudioSucceeded = true;
            break;
          }

          case 'digital_alarm': {
            // Bip digital rétro (4 impulsions rapides)
            [0, 0.12, 0.24, 0.36].forEach((timeOffset) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'square';
              osc.frequency.setValueAtTime(1046.5, now + timeOffset); // C6

              gain.gain.setValueAtTime(0.001, now + timeOffset);
              gain.gain.exponentialRampToValueAtTime(0.65, now + timeOffset + 0.015);
              gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.075);

              osc.connect(gain);
              gain.connect(masterGain);
              osc.start(now + timeOffset);
              osc.stop(now + timeOffset + 0.08);
            });
            webAudioSucceeded = true;
            break;
          }

          case 'radar_sonar': {
            // Radar ascendant avec sweep de fréquence
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';

            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(1760, now + 0.5);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.exponentialRampToValueAtTime(0.8, now + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.76);
            webAudioSucceeded = true;
            break;
          }

          case 'zen_bell': {
            // Cloche douce à 3 harmoniques
            [587.33, 880, 1174.66].forEach((freq, idx) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(freq, now);

              const amp = idx === 0 ? 0.6 : 0.3;
              gain.gain.setValueAtTime(0.001, now);
              gain.gain.exponentialRampToValueAtTime(amp, now + 0.03);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

              osc.connect(gain);
              gain.connect(masterGain);
              osc.start(now);
              osc.stop(now + 1.25);
            });
            webAudioSucceeded = true;
            break;
          }
        }
      }
    } catch (e) {
      console.warn('Web Audio Play error, using HTML5 audio fallback:', e);
    }

    // Si Web Audio n'a pas pu jouer (contexte suspendu, restrictions mobiles, etc.), utiliser HTML5 Audio
    if (!webAudioSucceeded) {
      this.playFallbackHtmlAudio(soundToPlay);
    }
  }

  /**
   * Vérifie si l'API de vibration est disponible sur l'appareil
   */
  public isVibrationSupported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  /**
   * Déclenche une vibration haptique selon le motif choisi (ou motif passé en paramètre)
   */
  public triggerVibration(customPatternId?: VibrationPatternType): void {
    const patternId = customPatternId || this.currentVibration;
    if (patternId === 'off') {
      return;
    }

    const opt =
      VIBRATION_OPTIONS.find((v) => v.id === patternId) ||
      VIBRATION_OPTIONS[0];

    // Émettre un événement pour animation visuelle / tactile de l'interface
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('transit-vibrate-trigger', {
          detail: { patternId, pattern: opt.pattern },
        })
      );
    }

    if (this.isVibrationSupported()) {
      try {
        navigator.vibrate(opt.pattern);
      } catch (e) {
        console.warn('Vibration non autorisée ou non disponible:', e);
      }
    }
  }

  /**
   * Démarre l'alarme en continu (son répété + vibrations cadencées)
   */
  public startFullAlarm(): void {
    if (this.isAlarmRunning) return;
    this.isAlarmRunning = true;

    // Déverrouiller l'audio au maximum
    this.unlockAudio();

    // Déclenchement initial immédiat
    this.playCurrentSound();
    this.triggerVibration();

    // Répétition du son toutes les 1.4s
    this.intervalId = window.setInterval(() => {
      if (this.isAlarmRunning) {
        this.playCurrentSound();
      }
    }, 1400);

    // Répétition de la vibration selon le rythme du motif configuré (pour la poche)
    const vibOption = this.getVibrationOption();
    const intervalMs = vibOption.repeatIntervalMs || 1500;

    if (vibOption.id !== 'off') {
      this.vibrationIntervalId = window.setInterval(() => {
        if (this.isAlarmRunning) {
          this.triggerVibration();
        }
      }, intervalMs);
    }

    // Demander le Screen Wake Lock pour éviter la mise en veille de l'écran
    this.requestWakeLock();
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

    // Arrêter le fallback HTML Audio si en cours
    if (this.activeHtmlAudio) {
      try {
        this.activeHtmlAudio.pause();
        this.activeHtmlAudio.currentTime = 0;
      } catch (e) {}
    }

    if (this.isVibrationSupported()) {
      try {
        navigator.vibrate(0);
      } catch (e) {}
    }
  }

  public isRunning(): boolean {
    return this.isAlarmRunning;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.activeHtmlAudio) {
      this.activeHtmlAudio.pause();
    }
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
      } catch (err) {}
    }
  }
}

export const alertSystem = new AlertSystem();
