import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  X,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Loader2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { Translations, Language } from '../utils/i18n';
import { UNITY_DEFAULTS } from '../services/UnityAdsService';

interface AppOpenAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId?: string;
  placementId?: string;
  t: Translations;
  lang: Language;
}

export const AppOpenAdModal: React.FC<AppOpenAdModalProps> = ({
  isOpen,
  onClose,
  gameId = UNITY_DEFAULTS.GAME_ID,
  placementId = UNITY_DEFAULTS.INTERSTITIAL_PLACEMENT,
  t,
  lang,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(5);
      setCanSkip(false);
      return;
    }

    // Activer le bouton de fermeture/skip après 2 secondes
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, 2000);

    // Fermeture automatique au bout de 5 secondes
    const autoCloseTimer = setTimeout(() => {
      onClose();
    }, 5500);

    // Décompte visuel fluide
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(autoCloseTimer);
      clearInterval(interval);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col justify-between bg-slate-950 text-white select-none animate-in fade-in duration-200">
      {/* Barre supérieure : Marque, Unity Ads info & Compteur / Passer */}
      <header className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <AppLogo className="w-8 h-8 rounded-xl shadow-md shadow-amber-500/20 shrink-0" />
          <div>
            <span className="text-base font-black tracking-tight text-white">
              {t.appName}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-semibold font-mono">
              <Megaphone className="w-3 h-3" />
              <span>Unity Ads · {placementId}</span>
            </div>
          </div>
        </div>

        {/* Bouton Passer / Décompte */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            title={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {canSkip ? (
            <button
              onClick={onClose}
              type="button"
              className="py-1.5 px-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-indigo-600/30"
            >
              <span>{t.skipAd}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="py-1.5 px-3 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
              <span>{secondsRemaining}s</span>
            </div>
          )}
        </div>
      </header>

      {/* Conteneur principal de l'annonce */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full">
        <div className="w-full bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center space-y-4">
          {/* Badge Unity Ads */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Unity Ads Network · Game ID: {gameId}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            arreva · Arrivée en toute sérénité
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
            Alerte sonore et vibration automatique à l'approche de votre destination en train, métro, bus ou voiture.
          </p>

          {/* Carte visuelle de l'annonce Unity */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Interstitiel Vidéo / Playable
              </span>
              <span className="text-indigo-400 font-bold">{placementId}</span>
            </div>

            <div className="h-44 sm:h-52 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-amber-950/20 border border-indigo-500/20 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden group">
              <AppLogo className="w-14 h-14 rounded-2xl shadow-2xl shadow-indigo-500/30 mb-2 group-hover:scale-105 transition-transform" />
              <div className="text-sm font-bold text-white">
                arreva · Alerte Arrivée GPS
              </div>
              <div className="text-[11px] text-slate-300 mt-1 max-w-[240px]">
                Ne ratez plus jamais votre arrêt lors de vos trajets quotidiens
              </div>
              <div className="mt-3 text-[10px] text-indigo-300 font-mono bg-indigo-500/15 px-2.5 py-0.5 rounded-lg border border-indigo-500/30">
                Unity SDK 4.x / Android Native
              </div>
            </div>
          </div>

          {/* Barre de progression fluide */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-1000 ease-linear rounded-full shadow-lg shadow-indigo-500/50"
              style={{ width: `${((5 - secondsRemaining) / 5) * 100}%` }}
            />
          </div>
        </div>
      </main>

      {/* Pied de page */}
      <footer className="p-4 border-t border-slate-800/80 bg-slate-900/40 text-center">
        <button
          onClick={onClose}
          type="button"
          className="w-full max-w-sm mx-auto py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.99] shadow-lg shadow-indigo-600/30"
        >
          <span>{t.continueToApp}</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </button>
      </footer>
    </div>
  );
};
