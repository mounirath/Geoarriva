import React, { useEffect, useState } from 'react';
import { Megaphone, X, Settings2, Sparkles, ExternalLink, Play } from 'lucide-react';
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
  const isNative = unityAdsService.isNativeAvailable();

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
    <div className="w-full max-w-sm mx-auto my-1 px-3 pointer-events-auto select-none">
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900/95 via-indigo-950/80 to-slate-900/95 backdrop-blur-md border border-indigo-500/40 shadow-xl overflow-hidden py-2 px-3 flex items-center justify-between gap-2 transition-all">
        {/* Badge & Contenu de la bannière Unity Ads */}
        <div
          onClick={onShowInterstitial}
          className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
          title="Touchez pour afficher l'annonce vidéo / interstitielle Unity Ads"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-indigo-400">
            <Megaphone className="w-4 h-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                Unity Ads
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                {isNative ? 'SDK Natif' : 'Mode Test'}
              </span>
            </div>

            <div className="text-[11px] font-semibold text-slate-100 truncate flex items-center gap-1 mt-0.5">
              <span>arreva · Alerte Réveil GPS</span>
            </div>
          </div>
        </div>

        {/* Bouton pour lancer la publicité interstitielle */}
        <button
          onClick={onShowInterstitial}
          type="button"
          className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95 shrink-0"
          title="Afficher l'annonce publicitaire Unity Ads"
        >
          <Play className="w-3 h-3 fill-white" />
          <span>Voir pub</span>
        </button>

        {/* Boutons d'actions secondaires */}
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
