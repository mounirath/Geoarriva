import React, { useState, useEffect } from 'react';
import {
  X,
  Megaphone,
  Check,
  Sparkles,
  HelpCircle,
  Play,
  ShieldCheck,
  Smartphone,
  Globe,
} from 'lucide-react';
import { Translations } from '../utils/i18n';
import { unityAdsService, UNITY_DEFAULTS } from '../services/UnityAdsService';

interface UnitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  bannerPlacement: string;
  interstitialPlacement: string;
  onSaveConfig: (gameId: string, bannerPlacement: string, interstitialPlacement: string, testMode?: boolean) => void;
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
  const [testMode, setTestMode] = useState<boolean>(() => unityAdsService.isTestMode());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const isNative = unityAdsService.isNativeAvailable();

  useEffect(() => {
    if (isOpen) {
      setInputGameId(gameId || UNITY_DEFAULTS.GAME_ID);
      setInputBanner(bannerPlacement || UNITY_DEFAULTS.BANNER_PLACEMENT);
      setInputInterstitial(interstitialPlacement || UNITY_DEFAULTS.INTERSTITIAL_PLACEMENT);
      setTestMode(unityAdsService.isTestMode());
    }
  }, [isOpen, gameId, bannerPlacement, interstitialPlacement]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(inputGameId.trim(), inputBanner.trim(), inputInterstitial.trim(), testMode);
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
                Paramètres de diffusion et monétisation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badge Environnement (Web vs APK Android) */}
        <div className="my-3 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isNative ? (
              <Smartphone className="w-4 h-4 text-emerald-400" />
            ) : (
              <Globe className="w-4 h-4 text-indigo-400" />
            )}
            <span className="text-xs font-semibold text-slate-200">
              {isNative ? 'Environnement APK Android (Natif)' : 'Environnement Web / Navigateur'}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {isNative ? 'Cordova Active' : 'Lecteur In-App'}
          </span>
        </div>

        {/* Formulaire des identifiants */}
        <form onSubmit={handleSubmit} className="space-y-3.5 mt-2">
          {/* Game ID */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Unity Game ID (Projet)
            </label>
            <input
              type="text"
              value={inputGameId}
              onChange={(e) => setInputGameId(e.target.value)}
              placeholder="800387003"
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              required
            />
          </div>

          {/* Placement Bannière */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              ID Placement Bannière
            </label>
            <input
              type="text"
              value={inputBanner}
              onChange={(e) => setInputBanner(e.target.value)}
              placeholder="BP_Banner_Android"
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Placement Interstitiel */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
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

          {/* Mode Test (Obligatoire pour afficher les annonces hors Google Play) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-200">Mode Test Unity Ads</div>
              <div className="text-[10px] text-slate-400">
                Obligatoire pour afficher les pubs en développement / avant publication Play Store
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTestMode(!testMode)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                testMode ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  testMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Bouton de test direct */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onTestInterstitial();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
              <span>Tester et afficher une publicité Unity maintenant</span>
            </button>
          </div>

          {/* Note explicative Unity */}
          <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pourquoi les publicités peuvent ne pas s'afficher ?</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[10px] text-slate-400">
              <li>
                <strong>Sur le Web (navigateur)</strong> : Unity Ads ne propose pas de SDK Web natif. L'application utilise donc un lecteur d'aperçu in-app pour tester les annonces.
              </li>
              <li>
                <strong>Dans l'APK Android</strong> : Si le mode test est désactivé et que l'app n'est pas encore sur le Google Play Store, Unity renvoie une erreur <em>NO_FILL</em> (aucune annonce disponible). Le Mode Test doit rester actif.
              </li>
            </ul>
          </div>

          {/* Bouton de confirmation */}
          <div className="pt-1">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 active:scale-95"
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
