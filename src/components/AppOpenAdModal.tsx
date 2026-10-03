import React, { useState, useEffect, useRef } from 'react';
import {
  Megaphone,
  X,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Loader2,
  Volume2,
  VolumeX,
  Play,
  Download,
  Star,
  Gamepad2,
} from 'lucide-react';
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
  const [animationStep, setAnimationStep] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(5);
      setCanSkip(false);
      return;
    }

    // Activer le bouton de fermeture/skip après 1.5 secondes
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, 1500);

    // Décompte visuel fluide
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Animation dynamique simulant une publicité vidéo interactive
    const animInterval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 4);
    }, 1200);

    return () => {
      clearTimeout(skipTimer);
      clearInterval(interval);
      clearInterval(animInterval);
    };
  }, [isOpen]);

  // Petit effet sonore synthétisé si l'utilisateur active le son
  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (!nextMuted) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        }
      } catch (e) {
        // ignore audio errors
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex flex-col justify-between bg-slate-950 text-white select-none animate-in fade-in duration-200">
      {/* Barre supérieure : Marque, Unity Ads info & Compteur / Passer */}
      <header className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              <span>Unity Ads</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Interstitiel Vidéo
              </span>
            </span>
            <div className="text-[10px] text-slate-400 font-mono">
              Placement : {placementId}
            </div>
          </div>
        </div>

        {/* Contrôles : Son et Bouton Passer */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            type="button"
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            title={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {canSkip ? (
            <button
              onClick={onClose}
              type="button"
              className="py-1.5 px-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-indigo-600/40"
            >
              <span>{t.skipAd}</span>
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="py-1.5 px-3 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>{secondsRemaining}s</span>
            </div>
          )}
        </div>
      </header>

      {/* Zone centrale : Vidéo publicitaire interactive mobile */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
        <div className="w-full bg-slate-900 border border-indigo-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden text-center space-y-4">
          {/* Badge Sponsor / Réseau */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Sponsorisé · Unity Ads Network</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">ID: {gameId}</span>
          </div>

          {/* Écran d'animation vidéo publicitaire interactif */}
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 flex flex-col items-center justify-center p-4 shadow-inner group">
            {/* Arrière-plan animé simulant une vidéo de jeu Unity 3D */}
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-purple-900 to-slate-950 animate-pulse" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 animate-bounce">
                <Gamepad2 className="w-8 h-8" />
              </div>

              <div>
                <div className="text-base font-black text-white tracking-wide flex items-center justify-center gap-1.5">
                  <span>Transit Runner 3D</span>
                  <div className="flex items-center text-amber-400 text-xs">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span className="text-[10px] ml-0.5 font-bold text-white">4.8</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 max-w-[240px] mt-0.5">
                  Le jeu de transport urbain en temps réel le plus populaire sur Android !
                </p>
              </div>

              {/* État de lecture simulé */}
              <div className="flex items-center gap-2 pt-1 text-[10px] text-indigo-300 font-mono bg-slate-950/70 px-3 py-1 rounded-full border border-indigo-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Vidéo publicitaire en cours de lecture...</span>
              </div>
            </div>

            {/* Barre de progression vidéo en bas du lecteur */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
              <div
                className="h-full bg-indigo-500 transition-all duration-1000 ease-linear shadow-sm shadow-indigo-500"
                style={{ width: `${((5 - secondsRemaining) / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Appel à l'action Sponsorisé */}
          <div className="space-y-2">
            <button
              onClick={() => {
                window.open('https://unity.com/solutions/unity-ads', '_blank');
              }}
              type="button"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Installer maintenant gratuitement</span>
              <ExternalLink className="w-3 h-3 text-white/70" />
            </button>

            <p className="text-[10px] text-slate-400">
              Annonce fournie par le réseau Unity Ads · Conforme RGPD et COPPA
            </p>
          </div>
        </div>
      </main>

      {/* Pied de page : Bouton retour vers l'application */}
      <footer className="p-4 border-t border-slate-800/80 bg-slate-900/40 text-center">
        <button
          onClick={onClose}
          type="button"
          className="w-full max-w-sm mx-auto py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.99] border border-slate-700"
        >
          <span>{t.continueToApp}</span>
          <ArrowRight className="w-4 h-4 text-slate-300" />
        </button>
      </footer>
    </div>
  );
};
