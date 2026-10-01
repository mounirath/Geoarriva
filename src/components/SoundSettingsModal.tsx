import React, { useState } from 'react';
import {
  X,
  Volume2,
  Play,
  Check,
  Music,
} from 'lucide-react';
import {
  SoundType,
  SOUND_OPTIONS,
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

export const SoundSettingsModal: React.FC<SoundSettingsModalProps> = ({
  isOpen,
  onClose,
  selectedSound,
  onSelectSound,
  volume,
  onChangeVolume,
  t,
  lang,
}) => {
  const [playingId, setPlayingId] = useState<SoundType | null>(null);

  if (!isOpen) return null;

  const localizedSoundMap = LOCALIZED_SOUNDS[lang] || LOCALIZED_SOUNDS.fr;

  const handlePreview = (soundId: SoundType) => {
    alertSystem.ensureAudioContext();
    setPlayingId(soundId);
    alertSystem.playCurrentSound(soundId);
    alertSystem.triggerVibration();

    setTimeout(() => {
      setPlayingId(null);
    }, 1100);
  };

  const handleSelect = (soundId: SoundType) => {
    onSelectSound(soundId);
    alertSystem.setSound(soundId);
    handlePreview(soundId);
  };

  const handleVolumeChange = (newVol: number) => {
    onChangeVolume(newVol);
    alertSystem.setVolume(newVol);
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        {/* En-tête */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {t.soundsModalTitle}
              </h3>
              <p className="text-xs text-slate-400">
                {t.soundsModalSubtitle}
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

        {/* Réglage du volume */}
        <div className="py-4 space-y-2 border-b border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              {t.alarmVolume}
            </span>
            <span className="font-mono font-bold text-amber-400">
              {Math.round(volume * 100)}%
            </span>
          </div>

          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Liste des sonneries disponibles */}
        <div className="py-3 space-y-2 max-h-72 overflow-y-auto pr-1">
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
                onClick={() => handleSelect(sound.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <Music className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                        {info.name}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 shrink-0">
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
                    handlePreview(sound.id);
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                    isPlaying
                      ? 'bg-amber-500 text-slate-950 border-amber-400 scale-105'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title={t.listenPreview}
                >
                  <Play
                    className={`w-3.5 h-3.5 fill-current ${
                      isPlaying ? 'animate-pulse' : ''
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bouton de confirmation */}
        <div className="pt-3">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors"
          >
            {t.confirmSound}
          </button>
        </div>
      </div>
    </div>
  );
};
