import React, { useState, useEffect } from 'react';
import {
  X,
  Megaphone,
  Check,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Translations } from '../utils/i18n';
import { UNITY_DEFAULTS } from '../services/UnityAdsService'; // Adaptez selon votre chemin

interface UnitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  bannerPlacement: string;
  interstitialPlacement: string;
  onSaveConfig: (gameId: string, bannerPlacement: string, interstitialPlacement: string) => void;
  onTestInterstitial: () => void;
  t: Translations;
}

export const AdSettingsModal: React.FC<UnitySettingsModalProps> = ({
  isOpen,
  onClose,
  gameId,
  bannerPlacement,
  interstitialPlacement,
  onSaveConfig,
  onTestInterstitial,
  t,
}) => {
  const [inputGameId, setInputGameId] = useState(
    gameId || UNITY_DEFAULTS.GAME_ID
  );
  const [inputBanner, setInputBanner] = useState(
    bannerPlacement || UNITY_DEFAULTS.BANNER_PLACEMENT
  );
  const [inputInterstitial, setInputInterstitial] = useState(
    interstitialPlacement || UNITY_DEFAULTS.INTERSTITIAL_PLACEMENT
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputGameId(gameId || UNITY_DEFAULTS.GAME_ID);
      setInputBanner(bannerPlacement || UNITY_DEFAULTS.BANNER_PLACEMENT);
      setInputInterstitial(interstitialPlacement || UNITY_DEFAULTS.INTERSTITIAL_PLACEMENT);
    }
  }, [isOpen, gameId, bannerPlacement, interstitialPlacement]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(inputGameId.trim(), inputBanner.trim(), inputInterstitial.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        {/* En-tête */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Configuration Unity Ads
              </h3>
              <p className="text-xs text-slate-400">
                Paramétrez vos identifiants Unity
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

        {/* Formulaire de configuration */}
        <form onSubmit={handleSubmit} className="py-4 space-y-3.5">
          {/* Badge officiel de synchronisation Unity Cloud */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-emerald-300">Arreva · Unity Ads</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">Org: 11270132357134</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Unity Game ID
            </label>
            <input
              type="text"
              value={inputGameId}
              onChange={(e) => setInputGameId(e.target.value)}
              placeholder="800387003"
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ID Placement Bannière (Banner)
            </label>
            <input
              type="text"
              value={inputBanner}
              onChange={(e) => setInputBanner(e.target.value)}
              placeholder="BP_Banner_Android"
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ID Placement Interstitiel
            </label>
            <input
              type="text"
              value={inputInterstitial}
              onChange={(e) => setInputInterstitial(e.target.value)}
              placeholder="BP_Interstitial_Android"
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Bouton de test direct */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onTestInterstitial();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tester une publicité Unity</span>
            </button>
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Informations Unity Ads</span>
            </div>
            <p>
              Assurez-vous que vos identifiants correspondent exactement à ceux créés sur votre tableau de bord Unity Dashboard.
            </p>
          </div>

          {/* Bouton de confirmation */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Configuration enregistrée</span>
                </>
              ) : (
                <span>Enregistrer la configuration</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
