import React, { useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Check,
  Music,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  SoundType,
  SOUND_OPTIONS,
  alertSystem,
} from '../utils/audioAlert';

interface SoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSound: SoundType;
  onSelectSound: (sound: SoundType) => void;
  volume: number;
  onChangeVolume: (volume: number) => void;
}

export const SoundSettingsModal: React.FC<SoundSettingsModalProps> = ({
  isOpen,
  onClose,
  selectedSound,
  onSelectSound,
  volume,
  onChangeVolume,
}) => {
  const [playingId, setPlayingId] = useState<SoundType | null>(null);

  if (!isOpen) return null;

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
                Sons & Sonneries d'alarme
              </h3>
              <p className="text-xs text-slate-400">
                Personnalisez la sonnerie du réveil d'arrivée
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
              Volume de l'alarme
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
                        {sound.name}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 shrink-0">
                        {sound.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {sound.description}
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
                  title="Écouter un extrait"
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
            Confirmer la sonnerie
          </button>
        </div>
      </div>
    </div>
  );
};
