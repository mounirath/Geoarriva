import React, { useState, useEffect } from 'react';
import {
  Compass,
  Megaphone,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Translations, Language } from '../utils/i18n';
import { ADMOB_DEFAULTS, adMobService } from '../services/AdMobService';

interface AppOpenAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translations;
  lang: Language;
}

export const AppOpenAdModal: React.FC<AppOpenAdModalProps> = ({
  isOpen,
  onClose,
  t,
  lang,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(5);
      setCanSkip(false);
      return;
    }

    adMobService.recordAppOpenAdShown();

    // Tenter d'afficher via Cordova si sur application native
    adMobService.showCordovaAppOpen();

    // Activer le bouton de fermeture/skip après 2 secondes
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, 2000);

    // Fermeture automatique propre au bout de 5 secondes
    const autoCloseTimer = setTimeout(() => {
      onClose();
    }, 5000);

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
      {/* Barre supérieure : Marque & Compteur / Passer */}
      <header className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
            <Compass className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-white">
              {t.appName}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold">
              <Megaphone className="w-3 h-3" />
              <span>{t.adMobAppOpenBadge}</span>
            </div>
          </div>
        </div>

        {/* Bouton Passer / Décompte */}
        <div>
          {canSkip ? (
            <button
              onClick={onClose}
              type="button"
              className="py-1.5 px-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-amber-500/10"
            >
              <span>{t.skipAd}</span>
              <X className="w-3.5 h-3.5 text-amber-400" />
            </button>
          ) : (
            <div className="py-1.5 px-3 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
              <span>{secondsRemaining}s</span>
            </div>
          )}
        </div>
      </header>

      {/* Conteneur principal de l'annonce */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full">
        {/* Écran de chargement sous-jacent avec annonce superposée */}
        <div className="w-full bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center space-y-4">
          {/* Badge AdMob */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Google AdMob · App Open Ad</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {t.appOpenAdTitle}
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
            {t.appOpenAdDesc}
          </p>

          {/* Carte visuelle de l'annonce */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Format : Annonce à l'ouverture</span>
              <span className="text-amber-400">ca-app-pub-105042...</span>
            </div>

            <div className="h-44 sm:h-52 rounded-xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-amber-950/20 border border-slate-800 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-2">
                <Compass className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-sm font-bold text-white">
                arreva · Alerte Arrivée GPS
              </div>
              <div className="text-[11px] text-slate-300 mt-1 max-w-[240px]">
                Voyagez l'esprit tranquille en bus, métro, train et TGV
              </div>
              <div className="mt-3 text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                Bloc : {ADMOB_DEFAULTS.APP_OPEN_AD_UNIT_ID.split('/')[1]}
              </div>
            </div>
          </div>

          {/* Barre de progression fluide */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full transition-all duration-1000 ease-linear rounded-full"
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
          className="w-full max-w-sm mx-auto py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.99] shadow-lg shadow-amber-500/20"
        >
          <span>{t.continueToApp}</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>
      </footer>
    </div>
  );
};
