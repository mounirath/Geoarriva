import React, { useState } from 'react';
import {
  X,
  Megaphone,
  Check,
  ShieldCheck,
  ExternalLink,
  HelpCircle,
  Play,
  Sparkles,
} from 'lucide-react';
import { Translations } from '../utils/i18n';
import { ADMOB_DEFAULTS } from '../services/AdMobService';

interface AdSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  slotId: string;
  onSaveConfig: (clientId: string, slotId: string) => void;
  onTestAppOpenAd: () => void;
  t: Translations;
}

export const AdSettingsModal: React.FC<AdSettingsModalProps> = ({
  isOpen,
  onClose,
  clientId,
  slotId,
  onSaveConfig,
  onTestAppOpenAd,
  t,
}) => {
  const [inputClient, setInputClient] = useState(
    clientId || ADMOB_DEFAULTS.APP_ID
  );
  const [inputSlot, setInputSlot] = useState(
    slotId || ADMOB_DEFAULTS.APP_OPEN_AD_UNIT_ID
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(inputClient.trim(), inputSlot.trim());
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
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {t.admobTitle}
              </h3>
              <p className="text-xs text-slate-400">
                {t.admobSubtitle}
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
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ID d'application AdMob (App ID)
            </label>
            <input
              type="text"
              value={inputClient}
              onChange={(e) => setInputClient(e.target.value)}
              placeholder="ca-app-pub-1050422776945344~6855047295"
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ID Bloc Annonce à l'ouverture (App Open Ad Unit)
            </label>
            <input
              type="text"
              value={inputSlot}
              onChange={(e) => setInputSlot(e.target.value)}
              placeholder="ca-app-pub-1050422776945344/8752251197"
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          {/* Bouton de test direct de l'Annonce à l'ouverture */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onTestAppOpenAd();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.testAppOpenAd}</span>
            </button>
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Format Annonce à l'ouverture (App Open Ad)</span>
            </div>
            <p>
              L'annonce se superpose à l'écran de chargement lorsque l'utilisateur lance ou revient sur l'application mobile / PWA.
            </p>
          </div>

          {/* Bouton de confirmation */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t.adConfigSaved}</span>
                </>
              ) : (
                <span>{t.saveAdConfig}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
