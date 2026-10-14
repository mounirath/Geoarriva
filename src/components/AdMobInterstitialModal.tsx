import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Loader2,
  Volume2,
  VolumeX,
  Download,
  Star,
  ShieldCheck,
} from 'lucide-react';
import { Translations, Language } from '../utils/i18n';
import { ADMOB_DEFAULTS } from '../services/AdMobService';
import { AppLogo } from './AppLogo';

interface AdMobInterstitialModalProps {
  isOpen: boolean;
  onClose: () => void;
  adUnitId?: string;
  t: Translations;
  lang: Language;
}

export const AdMobInterstitialModal: React.FC<AdMobInterstitialModalProps> = ({
  isOpen,
  onClose,
  adUnitId = ADMOB_DEFAULTS.INTERSTITIAL_AD_UNIT_ID,
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

    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, 1500);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(skipTimer);
      clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Publicité Google AdMob"
      className="fixed inset-0 z-[2000] flex flex-col justify-between bg-slate-950 text-white select-none animate-in fade-in duration-200"
    >
      {/* Barre supérieure AdMob */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Ad
          </span>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Google AdMob</span>
              <span className="text-[10px] text-slate-400 font-mono">
                Interstitiel
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              ID: {adUnitId}
            </div>
          </div>
        </div>

        {/* Contrôle Passer / Fermer */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            title={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {canSkip ? (
            <button
              onClick={onClose}
              type="button"
              className="py-1 px-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-amber-500/20"
            >
              <span>{t.skipAd}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="py-1 px-3 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
              <span>{secondsRemaining}s</span>
            </div>
          )}
        </div>
      </header>

      {/* Conteneur principal de l'annonce */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center space-y-4">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Sponsorisé par Google
            </span>
            <span className="font-mono text-[10px]">AdMob 6108238532</span>
          </div>

          {/* Visuel publicitaire */}
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 flex flex-col items-center justify-center p-4 shadow-inner">
            <AppLogo className="w-16 h-16 rounded-2xl shadow-xl shadow-amber-500/20 mb-3" />
            <h3 className="text-base font-bold text-white tracking-tight">
              {t.appName} · Alerte d'Arrivée GPS
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-[260px] line-clamp-2">
              Réveil et sonnerie automatique à l'approche de votre station de train, métro ou bus.
            </p>
            <div className="mt-3 flex items-center gap-1 text-amber-400 text-xs">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span className="font-bold text-white">4.9 / 5</span>
              <span className="text-slate-400 text-[10px] ml-1">(+10 000 trajets)</span>
            </div>
          </div>

          {/* Bouton d'action */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                window.open('https://admob.google.com', '_blank');
              }}
              type="button"
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>En savoir plus sur l'annonceur</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-900/70" />
            </button>

            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Réseau publicitaire certifié Google AdMob</span>
            </div>
          </div>
        </div>
      </main>

      {/* Pied de page */}
      <footer className="p-4 border-t border-slate-800/80 bg-slate-900/40 text-center">
        <button
          onClick={onClose}
          type="button"
          className="w-full max-w-sm mx-auto py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.99] border border-slate-700"
        >
          <span>{t.continueToApp}</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
        </button>
      </footer>
    </div>
  );
};
