import React from 'react';
import { Megaphone, ExternalLink, Sparkles, Settings2, Info } from 'lucide-react';
import { Translations } from '../utils/i18n';
import { ADMOB_DEFAULTS } from '../services/AdMobService';

interface AdMobBannerProps {
  bannerId?: string;
  interstitialId?: string;
  t: Translations;
  onOpenSettings: () => void;
  onShowInterstitial: () => void;
}

export const AdMobBanner: React.FC<AdMobBannerProps> = ({
  bannerId = ADMOB_DEFAULTS.BANNER_AD_UNIT_ID,
  interstitialId = ADMOB_DEFAULTS.INTERSTITIAL_AD_UNIT_ID,
  t,
  onOpenSettings,
  onShowInterstitial,
}) => {
  return (
    <aside
      aria-label="Annonce Google AdMob"
      className="w-full max-w-md mx-auto select-none pointer-events-auto transition-all duration-200"
    >
      <div className="bg-slate-900/90 hover:bg-slate-900 backdrop-blur-md border border-slate-800 rounded-2xl p-2 sm:p-2.5 shadow-lg flex items-center justify-between gap-2.5 transition-all">
        {/* Partie gauche : Badge officiel AdMob et message publicitaire */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Badge officiel Annonce Google */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Ad
            </span>
          </div>

          {/* Contenu textuel de l'annonce */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-100 truncate">
              <span>Google AdMob · Voyage & Transports</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
              <span>ID: {bannerId.split('/').pop() || '3286634079'}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-medium">Bannière active</span>
            </div>
          </div>
        </div>

        {/* Partie droite : Actions rapides (Test Interstitiel & Paramètres) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onShowInterstitial}
            type="button"
            className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white text-[10px] font-semibold transition-all border border-slate-700/70"
            title="Tester l'interstitiel AdMob (6108238532)"
          >
            Interstitiel
          </button>

          <button
            onClick={onOpenSettings}
            type="button"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 transition-colors border border-slate-700/70"
            title="Paramètres des annonces AdMob"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
