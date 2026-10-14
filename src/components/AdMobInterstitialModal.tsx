import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Loader2,
  Volume2,
  VolumeX,
  Star,
  ShieldCheck,
  Train,
  Hotel,
  Car,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { Translations, Language } from '../utils/i18n';
import { ADMOB_DEFAULTS } from '../services/AdMobService';

interface AdMobInterstitialModalProps {
  isOpen: boolean;
  onClose: () => void;
  adUnitId?: string;
  t: Translations;
  lang: Language;
}

// Campagnes publicitaires plein écran sponsorisées pour l'interstitiel AdMob
const INTERSTITIAL_CAMPAIGNS = [
  {
    id: 'trainline_interstitial',
    advertiser: 'Trainline',
    category: 'Voyages & Billetterie train',
    title: 'Voyagez malin en Europe avec Trainline',
    headline: "Jusqu'à -60% sur vos billets de train & bus",
    description:
      'Comparez les tarifs SNCF, Ouigo, Eurostar, Trenitalia et FlixBus en direct. Réservez au meilleur prix et recevez les alertes de perturbations sur votre mobile.',
    badge: 'Application n°1 Transport',
    rating: '4.9',
    ratingCount: '150 000+ avis',
    cta: 'Installer gratuitement',
    url: 'https://www.thetrainline.com',
    icon: Train,
    themeGradient: 'from-teal-600 via-emerald-800 to-slate-950',
    accentColor: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
    tags: ['SNCF Connect', 'TGV INOUI', 'Ouigo', 'Eurostar'],
  },
  {
    id: 'booking_interstitial',
    advertiser: 'Booking.com',
    category: 'Hôtels & Hébergements',
    title: 'Réservez votre hôtel idéal dès votre arrivée',
    headline: 'Des millions d’hôtels proches des gares et aéroports',
    description:
      'Ne cherchez plus où dormir après un long voyage. Bénéficiez de réductions Genius jusqu’à -20% et de l’annulation gratuite sur la plupart des chambres.',
    badge: 'Choix des voyageurs',
    rating: '4.8',
    ratingCount: '800 000+ avis',
    cta: 'Découvrir les offres',
    url: 'https://www.booking.com',
    icon: Hotel,
    themeGradient: 'from-blue-700 via-indigo-900 to-slate-950',
    accentColor: 'bg-blue-500 hover:bg-blue-400 text-white',
    tags: ['Gares', 'Annulation gratuite', 'Programme Genius'],
  },
  {
    id: 'uber_interstitial',
    advertiser: 'Uber Rides',
    category: 'VTC & Mobilité Urbaine',
    title: 'Votre chauffeur vous attend à la sortie de la gare',
    headline: 'Commandez en 2 clics et partez sans attente',
    description:
      'Retrouvez facilement votre point de prise en charge dédié à la sortie de votre train ou bus. Estimation tarifaire garantie et suivi du chauffeur en temps réel.',
    badge: 'Service 24/7',
    rating: '4.8',
    ratingCount: '1 200 000+ avis',
    cta: 'Commander une course',
    url: 'https://www.uber.com',
    icon: Car,
    themeGradient: 'from-amber-600 via-stone-900 to-slate-950',
    accentColor: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    tags: ['Prise en charge gare', 'Trajet sécurisé', 'Paiement sans contact'],
  },
];

export const AdMobInterstitialModal: React.FC<AdMobInterstitialModalProps> = ({
  isOpen,
  onClose,
  adUnitId = ADMOB_DEFAULTS.INTERSTITIAL_AD_UNIT_ID,
  t,
  lang,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [campaignIndex, setCampaignIndex] = useState(0);

  // À chaque ouverture de l'interstitiel, sélectionner une campagne et démarrer le compte à rebours
  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(5);
      setCanSkip(false);
      return;
    }

    // Choisir une annonce au hasard
    const randomIndex = Math.floor(Math.random() * INTERSTITIAL_CAMPAIGNS.length);
    setCampaignIndex(randomIndex);

    // Permettre de passer après 3 secondes ou à la fin
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, 2500);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(skipTimer);
      clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const campaign = INTERSTITIAL_CAMPAIGNS[campaignIndex];
  const IconComponent = campaign.icon;
  const shortId = adUnitId.split('/').pop() || '6108238532';

  const handleClickAd = () => {
    try {
      window.open(campaign.url, '_blank', 'noopener,noreferrer');
    } catch {
      // ignore
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Publicité Google AdMob"
      className="fixed inset-0 z-[2000] flex flex-col justify-between bg-slate-950 text-white select-none animate-in fade-in duration-200"
    >
      {/* Barre supérieure officielle Google AdMob */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Ad
          </span>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Google AdMob</span>
              <span className="text-[10px] text-slate-400 font-mono">
                Interstitiel #{shortId}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span>{campaign.advertiser}</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-400">AdChoices ℹ️</span>
            </div>
          </div>
        </div>

        {/* Contrôles Son & Passer / Fermer */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors border border-slate-700"
            title={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {canSkip ? (
            <button
              onClick={onClose}
              type="button"
              className="py-1.5 px-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-amber-500/20"
              title="Passer cette annonce"
            >
              <span>{t.skipAd || 'Passer l’annonce'}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="py-1.5 px-3 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
              <span>{secondsRemaining}s</span>
            </div>
          )}
        </div>
      </header>

      {/* Conteneur principal de l'annonce plein écran */}
      <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full">
        <div
          onClick={handleClickAd}
          role="button"
          tabIndex={0}
          className="w-full bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden text-left space-y-4 cursor-pointer group"
        >
          {/* Tag supérieur sponsorisé */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Annonce sponsorisée
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium">
              {campaign.badge}
            </span>
          </div>

          {/* Visuel publicitaire interactif */}
          <div
            className={`relative rounded-2xl overflow-hidden aspect-video bg-gradient-to-br ${campaign.themeGradient} border border-slate-700/80 flex flex-col justify-between p-5 shadow-inner transition-transform group-hover:scale-[1.01]`}
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                <IconComponent className="w-7 h-7 text-white" />
              </div>
              <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-white flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{campaign.rating}</span>
                <span className="text-slate-300 text-[10px]">({campaign.ratingCount})</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/70">
                {campaign.category}
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-white leading-tight drop-shadow-sm">
                {campaign.title}
              </h3>
            </div>
          </div>

          {/* Description & tags */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
              {campaign.headline}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {campaign.description}
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {campaign.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 text-[10px] font-medium border border-slate-700/60"
                >
                  ✓ {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Bouton d'action principal CTA */}
          <div className="space-y-2 pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClickAd();
              }}
              type="button"
              className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all active:scale-[0.98] ${campaign.accentColor}`}
            >
              <Download className="w-4 h-4" />
              <span>{campaign.cta}</span>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Réseau publicitaire certifié Google AdMob · Bloc {shortId}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Pied de page : Continuer vers l'application */}
      <footer className="p-4 border-t border-slate-800/80 bg-slate-900/90 backdrop-blur-md text-center shrink-0">
        <button
          onClick={onClose}
          type="button"
          className="w-full max-w-sm mx-auto py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.99] border border-slate-700"
        >
          <span>{t.continueToApp || 'Continuer vers arreva'}</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
        </button>
      </footer>
    </div>
  );
};
