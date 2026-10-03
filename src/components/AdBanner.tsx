import React, { useEffect, useState } from 'react';
import { Megaphone, X, Settings2, Sparkles, ExternalLink } from 'lucide-react';
import { Translations } from '../utils/i18n';
import { unityAdsService, UNITY_DEFAULTS } from '../services/UnityAdsService';

interface AdBannerProps {
  gameId?: string;
  placementId?: string;
  t: Translations;
  onOpenSettings: () => void;
  onShowInterstitial?: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  gameId = UNITY_DEFAULTS.GAME_ID,
  placementId = UNITY_DEFAULTS.BANNER_PLACEMENT,
  t,
  onOpenSettings,
  onShowInterstitial,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!isDismissed) {
      unityAdsService.showBanner('BOTTOM');
    }
    return () => {
      unityAdsService.hideBanner();
    };
  }, [isDismissed, placementId]);

  if (isDismissed) return null;

  return (
    <div className="w-full max-w-sm mx-auto my-1.5 px-3 pointer-events-auto select-none">
      <div className="relative rounded-2xl bg-slate-900/95 backdrop-blur-md border border-indigo-500/30 shadow-xl overflow-hidden py-2 px-3 flex items-center justify-between gap-2.5 transition-all">
        {/* Badge & Contenu de la bannière Unity Ads */}
        <div
          onClick={onShowInterstitial}
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
          title="Cliquez pour tester l'annonce Unity Ads"
        >
          <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Megaphone className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                Unity Ads
              </span>
              <span className="text-[9px] text-slate-400 font-mono truncate max-w-[120px]">
                {placementId}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </div>

            <div className="text-[11px] font-medium text-slate-200 truncate flex items-center gap-1">
              <span>arreva · Alerte et Réveil GPS Transport</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 shrink-0 opacity-70" />
            </div>
          </div>
        </div>

        {/* Boutons d'actions (Paramètres Unity Ads & Fermer) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenSettings}
            type="button"
            className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="Paramètres Unity Ads"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            type="button"
            className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title={t.closeAd}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
