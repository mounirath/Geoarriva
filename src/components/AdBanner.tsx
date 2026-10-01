import React, { useEffect, useRef, useState } from 'react';
import { Megaphone, X, Settings2, Sparkles, ExternalLink } from 'lucide-react';
import { Translations } from '../utils/i18n';

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

interface AdBannerProps {
  clientId?: string;
  slotId?: string;
  t: Translations;
  onOpenSettings: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  clientId,
  slotId,
  t,
  onOpenSettings,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const adRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (clientId && slotId && !isDismissed) {
      try {
        if (typeof window !== 'undefined') {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setAdLoaded(true);
        }
      } catch (err) {
        console.warn('AdMob/AdSense script error:', err);
      }
    }
  }, [clientId, slotId, isDismissed]);

  if (isDismissed) return null;

  return (
    <div className="w-full max-w-sm mx-auto my-1.5 px-3 pointer-events-auto">
      <div className="relative rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800/90 shadow-lg overflow-hidden py-1.5 px-3 flex items-center justify-between gap-2.5">
        {/* Badge Publicité */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                {t.advertisement}
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                AdMob 320x50
              </span>
            </div>

            {/* Contenu de la bannière ou annonce réelle */}
            {clientId && slotId ? (
              <div className="overflow-hidden max-h-[50px] max-w-[320px] flex items-center justify-center">
                <ins
                  ref={adRef}
                  className="adsbygoogle"
                  style={{ display: 'inline-block', width: '320px', height: '50px' }}
                  data-ad-client={clientId}
                  data-ad-slot={slotId}
                  data-ad-format="horizontal"
                />
              </div>
            ) : (
              <div className="text-[11px] text-slate-300 truncate">
                <span>Voyagez sereinement avec arreva · GPS Transport</span>
              </div>
            )}
          </div>
        </div>

        {/* Boutons d'actions (Paramètres & Fermer) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenSettings}
            type="button"
            className="w-6 h-6 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title={t.admobTitle}
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            type="button"
            className="w-6 h-6 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title={t.closeAd}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
