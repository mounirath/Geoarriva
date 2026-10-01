import React, { useState } from 'react';
import {
  X,
  Megaphone,
  Check,
  ShieldCheck,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { Translations } from '../utils/i18n';

interface AdSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  slotId: string;
  onSaveConfig: (clientId: string, slotId: string) => void;
  t: Translations;
}

export const AdSettingsModal: React.FC<AdSettingsModalProps> = ({
  isOpen,
  onClose,
  clientId,
  slotId,
  onSaveConfig,
  t,
}) => {
  const [inputClient, setInputClient] = useState(clientId);
  const [inputSlot, setInputSlot] = useState(slotId);
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
              {t.adClientId}
            </label>
            <input
              type="text"
              value={inputClient}
              onChange={(e) => setInputClient(e.target.value)}
              placeholder="ca-pub-1234567890123456"
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.adSlotId}
            </label>
            <input
              type="text"
              value={inputSlot}
              onChange={(e) => setInputSlot(e.target.value)}
              placeholder="1234567890"
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Intégration Google AdMob / AdSense</span>
            </div>
            <p>
              Pour les applications web, la régie publicitaire Google utilise les balises standards d'annonces mobiles (format bannière 320x50).
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
