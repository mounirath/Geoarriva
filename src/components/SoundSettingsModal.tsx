import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  Play,
  Check,
  Music,
  Smartphone,
  Zap,
  Activity,
  Heart,
  AlertTriangle,
  VolumeX,
  Radio,
  Sliders,
} from 'lucide-react';
import {
  SoundType,
  VibrationPatternType,
  SOUND_OPTIONS,
  VIBRATION_OPTIONS,
  alertSystem,
} from '../utils/audioAlert';
import { Translations, Language } from '../utils/i18n';

interface SoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSound: SoundType;
  onSelectSound: (sound: SoundType) => void;
  volume: number;
  onChangeVolume: (volume: number) => void;
  selectedVibration?: VibrationPatternType;
  onSelectVibration?: (vibration: VibrationPatternType) => void;
  t: Translations;
  lang: Language;
}

const LOCALIZED_SOUNDS: Record<Language, Record<SoundType, { name: string; desc: string; badge: string }>> = {
  fr: {
    station_chime: {
      name: 'Carillon Ferroviaire',
      desc: 'Jingle mélodique à 4 notes inspiré des annonces de gare',
      badge: '🚆 Gare',
    },
    transit_siren: {
      name: "Sirène d'Urgence",
      desc: 'Double tonalité percutante pour réveil garanti',
      badge: '🚨 Fort',
    },
    digital_alarm: {
      name: 'Bip Digital Rétro',
      desc: 'Séquence rapide de bips cadencés style montre digitale',
      badge: '⏰ Classique',
    },
    radar_sonar: {
      name: "Radar d'Approche",
      desc: 'Pulsations sonar progressives avec sweep de fréquence',
      badge: '📡 Radar',
    },
    zen_bell: {
      name: 'Clochette Douce',
      desc: 'Sons harmoniques zen pour rames silencieuses',
      badge: '🔔 Discret',
    },
  },
  en: {
    station_chime: {
      name: 'Train Station Chime',
      desc: '4-note melodic jingle inspired by station announcements',
      badge: '🚆 Station',
    },
    transit_siren: {
      name: 'Emergency Siren',
      desc: 'Piercing dual-tone siren for heavy sleepers',
      badge: '🚨 Loud',
    },
    digital_alarm: {
      name: 'Retro Digital Beep',
      desc: 'Fast-paced rhythmic digital watch beeps',
      badge: '⏰ Classic',
    },
    radar_sonar: {
      name: 'Approach Radar',
      desc: 'Progressive sonar pulses with frequency sweep',
      badge: '📡 Radar',
    },
    zen_bell: {
      name: 'Zen Bell',
      desc: 'Gentle harmonic bell chime for quiet cabins',
      badge: '🔔 Gentle',
    },
  },
  ar: {
    station_chime: {
      name: 'جرس المحطة الموسيقي',
      desc: 'نغمة لحنية من 4 نغمات مستوحاة من محطات القطار',
      badge: '🚆 محطة',
    },
    transit_siren: {
      name: 'صفارة إنذار قوية',
      desc: 'نغمة مزدوجة عالية النبرة للاستيقاظ المؤكد',
      badge: '🚨 قوي',
    },
    digital_alarm: {
      name: 'منبه رقمي كلاسيكي',
      desc: 'سلسلة نغمات رقمية سريعة كالساعات الرقمية',
      badge: '⏰ كلاسيكي',
    },
    radar_sonar: {
      name: 'رادار الاقتراب',
      desc: 'نبضات سونار متصاعدة مع مسح ترددي',
      badge: '📡 رادار',
    },
    zen_bell: {
      name: 'جرس هادئ لطيف',
      desc: 'نغمات هادئة متناغمة لعربات القطار الصامتة',
      badge: '🔔 هادئ',
    },
  },
};

const LOCALIZED_VIBRATIONS: Record<Language, Record<VibrationPatternType, { name: string; desc: string; badge: string; icon: React.ReactNode }>> = {
  fr: {
    pulse: {
      name: 'Pulsations Rythmées (Pulse)',
      desc: 'Série de vibrations vives et séquencées. Idéal dans la poche de pantalon pour un réveil net sans bruit.',
      badge: '⚡ Poche pantalon',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
    },
    continuous: {
      name: 'Vibration Continue Forte (Continuous)',
      desc: 'Vibration longue et puissante capable de traverser les tissus épais de manteaux, vestes d\'hiver ou sacs.',
      badge: '🌊 Manteau & Sac',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
    },
    double_tap: {
      name: 'Double Battement (Double-tap)',
      desc: 'Deux impulsions saccadées comme un battement de cœur tactile, très distincte au contact du corps.',
      badge: '💓 Double-tap',
      icon: <Heart className="w-4 h-4 text-rose-400" />,
    },
    urgent_staccato: {
      name: 'Staccato Urgent',
      desc: 'Secousses ultra-rapides et répétées pour sortir d\'un sommeil très lourd en transport.',
      badge: '🚨 Réveil urgent',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    },
    off: {
      name: 'Désactivé (Sans vibration)',
      desc: 'Aucune secousse haptique. L\'alerte fonctionne uniquement avec la sonnerie.',
      badge: '🔕 Son seul',
      icon: <VolumeX className="w-4 h-4 text-slate-400" />,
    },
  },
  en: {
    pulse: {
      name: 'Rhythmic Pulse',
      desc: 'Sequence of snappy periodic vibrations. Calibrated for jeans and trouser pockets.',
      badge: '⚡ Pants pocket',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
    },
    continuous: {
      name: 'Heavy Continuous',
      desc: 'Long, forceful vibration engineered to pierce through heavy winter coats or backpacks.',
      badge: '🌊 Coat & Bag',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
    },
    double_tap: {
      name: 'Double-Tap Heartbeat',
      desc: 'Distinct double tactile kick mimicking a heartbeat, immediately recognizable against the body.',
      badge: '💓 Double-tap',
      icon: <Heart className="w-4 h-4 text-rose-400" />,
    },
    urgent_staccato: {
      name: 'Urgent Staccato',
      desc: 'Rapid high-frequency bursts specifically designed to shake deep sleepers awake in transit.',
      badge: '🚨 Heavy sleeper',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    },
    off: {
      name: 'Disabled (No vibration)',
      desc: 'Silent haptics. Alert will only use audio ringtones.',
      badge: '🔕 Audio only',
      icon: <VolumeX className="w-4 h-4 text-slate-400" />,
    },
  },
  ar: {
    pulse: {
      name: 'نبضات إيقاعية (Pulse)',
      desc: 'سلسلة نبضات متتابعة وحيوية، مثالية للإحساس بها بوضوح داخل جيب البنطال أثناء الجلوس أو المشي.',
      badge: '⚡ جيب البنطال',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
    },
    continuous: {
      name: 'اهتزاز متواصل قوي (Continuous)',
      desc: 'اهتزاز قوي وممتد مصمم لاختراق المعاطف الشتوية السميكة والسترات والحقائب.',
      badge: '🌊 معطف وحقيبة',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
    },
    double_tap: {
      name: 'نقرة مزدوجة (Double-tap)',
      desc: 'نبضتان متتاليتان شبيهتان بنبضات القلب، واضحة جداً وسهلة التمييز عند ملامسة الجسم.',
      badge: '💓 نقر مزدوج',
      icon: <Heart className="w-4 h-4 text-rose-400" />,
    },
    urgent_staccato: {
      name: 'اهتزاز سريع طارئ',
      desc: 'اهتزازات سريعة متلاحقة لإيقاظك بشكل فوري حتى في حالات النوم العميق أثناء الرحلة.',
      badge: '🚨 إيقاظ فوري',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    },
    off: {
      name: 'معطّل (بدون اهتزاز)',
      desc: 'بدون اهتزاز لمسي. سيعمل التنبيه بالنغمة الصوتية فقط.',
      badge: '🔕 صوت فقط',
      icon: <VolumeX className="w-4 h-4 text-slate-400" />,
    },
  },
};

export const SoundSettingsModal: React.FC<SoundSettingsModalProps> = ({
  isOpen,
  onClose,
  selectedSound,
  onSelectSound,
  volume,
  onChangeVolume,
  selectedVibration,
  onSelectVibration,
  t,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'sound' | 'vibration'>('sound');
  const [playingId, setPlayingId] = useState<SoundType | null>(null);
  const [testingVibId, setTestingVibId] = useState<VibrationPatternType | null>(null);
  const [currentVib, setCurrentVib] = useState<VibrationPatternType>(() => {
    return selectedVibration || alertSystem.getVibrationPattern();
  });

  const isVibSupported = alertSystem.isVibrationSupported();

  useEffect(() => {
    if (selectedVibration) {
      setCurrentVib(selectedVibration);
    }
  }, [selectedVibration]);

  if (!isOpen) return null;

  const localizedSoundMap = LOCALIZED_SOUNDS[lang] || LOCALIZED_SOUNDS.fr;
  const localizedVibMap = LOCALIZED_VIBRATIONS[lang] || LOCALIZED_VIBRATIONS.fr;

  const handlePreviewSound = (soundId: SoundType) => {
    alertSystem.unlockAudio();
    setPlayingId(soundId);
    alertSystem.playCurrentSound(soundId);
    alertSystem.triggerVibration();

    setTimeout(() => {
      setPlayingId(null);
    }, 1300);
  };

  const handleSelectSound = (soundId: SoundType) => {
    onSelectSound(soundId);
    alertSystem.setSound(soundId);
    handlePreviewSound(soundId);
  };

  const handleVolumeChange = (newVol: number) => {
    onChangeVolume(newVol);
    alertSystem.setVolume(newVol);
  };

  const handleSelectVibration = (patternId: VibrationPatternType) => {
    setCurrentVib(patternId);
    alertSystem.setVibrationPattern(patternId);
    if (onSelectVibration) {
      onSelectVibration(patternId);
    }
    handleTestVibration(patternId);
  };

  const handleTestVibration = (patternId: VibrationPatternType) => {
    setTestingVibId(patternId);
    alertSystem.triggerVibration(patternId);

    const opt = VIBRATION_OPTIONS.find((v) => v.id === patternId);
    const duration = opt && opt.pattern.length > 0
      ? opt.pattern.reduce((a, b) => a + b, 0) + 150
      : 800;

    setTimeout(() => {
      setTestingVibId(null);
    }, Math.min(duration, 2000));
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-inner">
              {activeTab === 'sound' ? (
                <Music className="w-5 h-5 animate-pulse" />
              ) : (
                <Smartphone className="w-5 h-5 animate-bounce" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{t.soundsModalTitle}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {activeTab === 'sound' ? t.soundsModalSubtitle : t.vibrationPatternsSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sélecteur d'onglets (Sonnerie vs Vibration en poche) */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 shrink-0">
          <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('sound')}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'sound'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{t.soundTab}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 text-slate-300">
                5
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vibration')}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'vibration'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>{t.vibrationTab}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 text-slate-300">
                ⚡ Poche
              </span>
            </button>
          </div>
        </div>

        {/* Corps déroulant */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* ONGLET 1 : SONNERIES ET VOLUME */}
          {activeTab === 'sound' && (
            <div className="space-y-4">
              {/* Carte de réglage du volume & test immédiat */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    {t.alarmVolume}
                  </span>
                  <span className="font-mono font-extrabold text-amber-400 text-sm">
                    {Math.round(volume * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <VolumeX className="w-4 h-4 text-slate-500 shrink-0" />
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
                </div>

                {/* Bouton pour tester le son directement */}
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>Double moteur audio (Web Audio + WAV)</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handlePreviewSound(selectedSound)}
                    className="py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{t.soundTestBtn}</span>
                  </button>
                </div>
              </div>

              {/* Liste des sonneries */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Sonneries d'alarme d'arrivée ({SOUND_OPTIONS.length})
                </div>

                {SOUND_OPTIONS.map((sound) => {
                  const isSelected = selectedSound === sound.id;
                  const isPlaying = playingId === sound.id;
                  const info = localizedSoundMap[sound.id] || {
                    name: sound.name,
                    desc: sound.description,
                    badge: sound.badge,
                  };

                  return (
                    <div
                      key={sound.id}
                      onClick={() => handleSelectSound(sound.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/70 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-5 h-5 stroke-[3]" />
                          ) : (
                            <Music className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                              {info.name}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700/60 shrink-0">
                              {info.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {info.desc}
                          </p>
                        </div>
                      </div>

                      {/* Bouton d'écoute d'extrait */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewSound(sound.id);
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                          isPlaying
                            ? 'bg-amber-500 text-slate-950 border-amber-400 scale-105 shadow-md shadow-amber-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                        title={t.listenPreview}
                      >
                        <Play
                          className={`w-4 h-4 fill-current ${
                            isPlaying ? 'animate-pulse' : ''
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ONGLET 2 : MOTIFS DE VIBRATION EN POCHE */}
          {activeTab === 'vibration' && (
            <div className="space-y-4">
              {/* Carte explicative pour téléphone dans la poche */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-amber-300">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>{t.vibrationPatternsTitle}</span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  {t.vibrationPatternsSubtitle}
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-amber-300/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>
                    {isVibSupported
                      ? 'Capteur haptique détecté et actif sur cet appareil'
                      : 'Navigateur sans API haptique : cadence simulée à l\'écran'}
                  </span>
                </div>
              </div>

              {/* Liste des motifs de vibration */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Motifs haptiques disponibles ({VIBRATION_OPTIONS.length})
                </div>

                {VIBRATION_OPTIONS.map((vib) => {
                  const isSelected = currentVib === vib.id;
                  const isTesting = testingVibId === vib.id;
                  const info = localizedVibMap[vib.id] || {
                    name: vib.name,
                    desc: vib.description,
                    badge: vib.badge,
                    icon: <Zap className="w-4 h-4" />,
                  };

                  return (
                    <div
                      key={vib.id}
                      onClick={() => handleSelectVibration(vib.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/70 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-5 h-5 stroke-[3]" />
                          ) : (
                            info.icon
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                              {info.name}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700/60 shrink-0">
                              {info.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                            {info.desc}
                          </p>

                          {/* Visualiseur de motif de vibration */}
                          {vib.pattern.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              {vib.pattern.map((val, idx) => {
                                const isVibe = idx % 2 === 0;
                                return (
                                  <div
                                    key={idx}
                                    style={{ width: `${Math.min(val / 15, 35)}px` }}
                                    className={`h-1.5 rounded-full ${
                                      isVibe
                                        ? isTesting
                                          ? 'bg-amber-400 animate-pulse'
                                          : isSelected
                                          ? 'bg-amber-400'
                                          : 'bg-slate-500'
                                        : 'bg-slate-800'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bouton de test de vibration */}
                      {vib.id !== 'off' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestVibration(vib.id);
                          }}
                          className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shrink-0 border text-xs font-bold transition-all ${
                            isTesting
                              ? 'bg-amber-500 text-slate-950 border-amber-400 scale-105 shadow-md shadow-amber-500/30 animate-pulse'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          }`}
                          title={t.testVibration}
                        >
                          <Smartphone
                            className={`w-3.5 h-3.5 ${
                              isTesting ? 'animate-bounce' : ''
                            }`}
                          />
                          <span className="hidden sm:inline">
                            {isTesting ? t.vibrationTesting : t.testVibration}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Pied de page et confirmation */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 shrink-0 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] text-center"
          >
            {t.confirmSound}
          </button>
        </div>
      </div>
    </div>
  );
};
