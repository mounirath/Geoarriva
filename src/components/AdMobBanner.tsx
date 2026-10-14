import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Settings2,
  ExternalLink,
  Play,
  Train,
  Hotel,
  Car,
  Compass,
  Bus,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Translations } from '../utils/i18n';
import { ADMOB_DEFAULTS } from '../services/AdMobService';

interface AdMobBannerProps {
  bannerId?: string;
  interstitialId?: string;
  t: Translations;
  onOpenSettings: () => void;
  onShowInterstitial: () => void;
}

// Campagnes publicitaires réalistes de partenaires mobilité / voyages pour l'affichage AdMob
const SPONSORED_CAMPAIGNS = [
  {
    id: 'trainline',
    name: 'Trainline · SNCF & Bus',
    tagline: 'Billets de train au meilleur prix',
    detail: 'Comparez SNCF, Ouigo, Trenitalia & Flixbus',
    cta: 'Voir les prix',
    url: 'https://www.thetrainline.com',
    icon: Train,
    iconColor: 'text-teal-400',
    iconBg: 'bg-teal-500/20 border-teal-500/30',
    accentColor: 'from-teal-500/20 to-emerald-500/10',
  },
  {
    id: 'booking',
    name: 'Booking.com',
    tagline: 'Hôtels près de votre gare d’arrivée',
    detail: 'Annulation gratuite & tarifs préférentiels',
    cta: 'Réserver',
    url: 'https://www.booking.com',
    icon: Hotel,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/20 border-blue-500/30',
    accentColor: 'from-blue-500/20 to-indigo-500/10',
  },
  {
    id: 'uber',
    name: 'Uber · Course en 3 min',
    tagline: 'Votre chauffeur dès votre descente',
    detail: 'Rejoignez votre destination finale sans attente',
    cta: 'Commander',
    url: 'https://www.uber.com',
    icon: Car,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/20 border-amber-500/30',
    accentColor: 'from-amber-500/20 to-orange-500/10',
  },
  {
    id: 'flixbus',
    name: 'FlixBus Voyages',
    tagline: 'Trajets en bus dès 4,99 €',
    detail: 'Plus de 3000 destinations en Europe avec Wi-Fi',
    cta: 'Découvrir',
    url: 'https://www.flixbus.fr',
    icon: Bus,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20 border-emerald-500/30',
    accentColor: 'from-emerald-500/20 to-teal-500/10',
  },
  {
    id: 'citymapper',
    name: 'Citymapper Transit',
    tagline: 'Tous les métros, trams & bus en direct',
    detail: 'Horaires temps réel & itinéraires combinés',
    cta: 'Installer',
    url: 'https://citymapper.com',
    icon: Compass,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20 border-cyan-500/30',
    accentColor: 'from-cyan-500/20 to-blue-500/10',
  },
];

export const AdMobBanner: React.FC<AdMobBannerProps> = ({
  bannerId = ADMOB_DEFAULTS.BANNER_AD_UNIT_ID,
  interstitialId = ADMOB_DEFAULTS.INTERSTITIAL_AD_UNIT_ID,
  t,
  onOpenSettings,
  onShowInterstitial,
}) => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);

  // Rotation douce des annonces sponsorisées toutes les 15 secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % SPONSORED_CAMPAIGNS.length);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Tentative d'initialisation du tag Google AdSense/AdMob web si disponible
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch {
      // Ignorer silencieusement si bloqué par un bloqueur de pub
    }
  }, [bannerId]);

  const campaign = SPONSORED_CAMPAIGNS[currentAdIndex];
  const IconComponent = campaign.icon;
  const shortSlot = bannerId.split('/').pop() || '3286634079';

  const handleClickAd = () => {
    try {
      window.open(campaign.url, '_blank', 'noopener,noreferrer');
    } catch {
      // ignore
    }
  };

  return (
    <aside
      ref={adRef}
      aria-label="Annonce Google AdMob"
      className="w-full max-w-md mx-auto select-none pointer-events-auto transition-all duration-300"
    >
      {/* Conteneur principal bannière style Google AdMob adaptatif */}
      <div className="relative bg-slate-900/95 hover:bg-slate-900 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden transition-all duration-200">
        {/* Ligne discrète de progression ou dégradé */}
        <div className={`h-0.5 w-full bg-gradient-to-r ${campaign.accentColor} opacity-70`} />

        <div className="p-2 sm:p-2.5 flex items-center justify-between gap-2.5">
          {/* Partie gauche : Badge officiel AdMob + Icône + Textes d'annonce */}
          <div
            onClick={handleClickAd}
            role="button"
            tabIndex={0}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group text-left"
            title={`Ouvrir ${campaign.name} - Annonce Google AdMob`}
          >
            {/* Icône du partenaire */}
            <div
              className={`w-9 h-9 rounded-xl ${campaign.iconBg} border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-sm`}
            >
              <IconComponent className={`w-5 h-5 ${campaign.iconColor}`} />
            </div>

            {/* Titre & Description de l'annonce */}
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Badge officiel AdMob */}
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  Ad
                </span>
                <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                  {campaign.name}
                </span>
              </div>

              <div className="text-[11px] text-slate-300 truncate font-medium">
                {campaign.tagline}
              </div>

              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <span>AdMob #{shortSlot}</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5 inline" /> Active
                </span>
              </div>
            </div>
          </div>

          {/* Partie droite : CTA & Boutons d'action (Tester Interstitiel & Paramètres) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Bouton CTA d'annonce */}
            <button
              onClick={handleClickAd}
              type="button"
              className="hidden xs:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-[11px] font-bold shadow-md shadow-amber-500/10 transition-all"
              title="Ouvrir l'offre de l'annonceur"
            >
              <span>{campaign.cta}</span>
              <ExternalLink className="w-3 h-3 text-slate-900/80" />
            </button>

            {/* Bouton direct pour tester l'interstitiel AdMob (6108238532) */}
            <button
              onClick={onShowInterstitial}
              type="button"
              className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white text-[10px] font-semibold transition-all border border-slate-700/80 flex items-center gap-1 shadow-sm"
              title="Tester immédiatement l'interstitiel AdMob (6108238532)"
            >
              <Play className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              <span className="hidden sm:inline">Interstitiel</span>
            </button>

            {/* Bouton Paramètres AdMob */}
            <button
              onClick={onOpenSettings}
              type="button"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-400 hover:text-amber-300 transition-colors border border-slate-700/80 shadow-sm"
              title="Paramètres et diagnostic AdMob"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>

            {/* Bouton Info AdChoices */}
            <button
              onClick={() => setShowInfoTooltip((prev) => !prev)}
              type="button"
              className="p-1 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
              title="Informations sur l'annonce AdMob"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Info-bulle AdChoices / Diagnostic AdMob */}
        {showInfoTooltip && (
          <div className="p-2.5 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-300 space-y-1 animate-in fade-in">
            <div className="flex items-center justify-between font-semibold text-white">
              <span>Google AdMob · ID #{shortSlot}</span>
              <span className="text-amber-400 text-[10px]">AdChoices ℹ️</span>
            </div>
            <div className="text-slate-400 text-[10px] leading-relaxed">
              Bannière configurée avec le bloc <span className="font-mono text-slate-200">{bannerId}</span>.
              Dans l'APK Android (Cordova / Capacitor), le SDK natif prend automatiquement le relais.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
