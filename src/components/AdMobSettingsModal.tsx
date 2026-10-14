import React, { useState } from 'react';
import {
  X,
  Megaphone,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Play,
} from 'lucide-react';
import { Translations } from '../utils/i18n';
import { ADMOB_DEFAULTS } from '../services/AdMobService';

interface AdMobSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
  interstitialId: string;
  bannerId: string;
  onSaveConfig: (appId: string, interstitialId: string, bannerId: string) => void;
  onTestInterstitial: () => void;
  t: Translations;
}

export const AdMobSettingsModal: React.FC<AdMobSettingsModalProps> = ({
  isOpen,
  onClose,
  appId: initialAppId,
  interstitialId: initialInterstitialId,
  bannerId: initialBannerId,
  onSaveConfig,
  onTestInterstitial,
  t,
}) => {
  const [appId, setAppId] = useState(initialAppId);
  const [interstitialId, setInterstitialId] = useState(initialInterstitialId);
  const [bannerId, setBannerId] = useState(initialBannerId);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(appId, interstitialId, bannerId);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    setAppId(ADMOB_DEFAULTS.APP_ID);
    setInterstitialId(ADMOB_DEFAULTS.INTERSTITIAL_AD_UNIT_ID);
    setBannerId(ADMOB_DEFAULTS.BANNER_AD_UNIT_ID);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Configuration AdMob"
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {t.admobTitle}
              </h2>
              <p className="text-[11px] text-slate-400">
                Google AdMob SDK & Monétisation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* AdMob App ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              ID d'application AdMob (App ID)
            </label>
            <input
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
              placeholder="ca-app-pub-1050422776945344~6855047295"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Format officiel avec tilde (~)
            </p>
          </div>

          {/* AdMob Banner ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Bloc d'annonce Bannière (Banner Unit ID)
            </label>
            <input
              type="text"
              value={bannerId}
              onChange={(e) => setBannerId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
              placeholder="ca-app-pub-1050422776945344/3286634079"
            />
          </div>

          {/* AdMob Interstitial ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Bloc d'annonce Interstitiel (Interstitial Unit ID)
            </label>
            <input
              type="text"
              value={interstitialId}
              onChange={(e) => setInterstitialId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
              placeholder="ca-app-pub-1050422776945344/6108238532"
            />
          </div>

          {/* Bouton de test direct */}
          <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-white">Tester l'interstitiel</div>
              <div className="text-[10px] text-slate-400">Ouvre l'annonce plein écran AdMob</div>
            </div>
            <button
              type="button"
              onClick={() => {
                onTestInterstitial();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-amber-400" />
              <span>Tester</span>
            </button>
          </div>

          {/* Boutons Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-amber-500/20"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Enregistré !</span>
                </>
              ) : (
                <span>Enregistrer</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
              title="Réinitialiser avec les identifiants fournis"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
