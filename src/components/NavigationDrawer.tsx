import React, { useEffect, useRef } from 'react';
import {
  X,
  Map as MapIcon,
  Music,
  Star,
  Activity,
  Megaphone,
  Type,
  Play,
  Square,
  ShieldCheck,
  Compass,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { Translations, Language, TextSize } from '../utils/i18n';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  t: Translations;
  lang: Language;
  onSelectLang: (lang: Language) => void;
  textSize: TextSize;
  onCycleTextSize: () => void;
  textSizeLabel: string;
  textSizeBadge: string;
  mapEngine: 'google' | 'leaflet';
  onToggleMapEngine: () => void;
  onOpenSoundModal: () => void;
  onOpenFavoritesModal: () => void;
  onOpenGpsDetails: () => void;
  onOpenAdSettings: () => void;
  isRealGps: boolean;
  isGpsLoading: boolean;
  isSimulating: boolean;
  onToggleSimulation: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  triggerRef,
  t,
  lang,
  onSelectLang,
  textSize,
  onCycleTextSize,
  textSizeLabel,
  textSizeBadge,
  mapEngine,
  onToggleMapEngine,
  onOpenSoundModal,
  onOpenFavoritesModal,
  onOpenGpsDetails,
  onOpenAdSettings,
  isRealGps,
  isGpsLoading,
  isSimulating,
  onToggleSimulation,
}) => {
  const drawerRef = useRef<HTMLElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef<boolean>(isOpen);

  // 1. Verrouillage du scroll du body quand le tiroir est ouvert
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Focus initial dans le tiroir pour l'accessibilité
      const timer = setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);

      return () => {
        document.body.style.overflow = originalOverflow;
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  // 2. Restauration du focus sur le bouton déclencheur lors de la fermeture
  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      // Le tiroir vient de se fermer : on renvoie le focus sur le bouton hamburger
      triggerRef.current?.focus();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, triggerRef]);

  // 3. Fermeture à l'appui sur la touche Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleAction = (callback: () => void) => {
    onClose();
    // Laisser le temps à l'animation de fermeture
    setTimeout(() => {
      callback();
    }, 150);
  };

  return (
    <>
      {/* Scrim (arrière-plan sombre flouté cliquable) */}
      <div
        role="presentation"
        aria-hidden="true"
        onClick={onClose}
        data-testid="navigation-drawer-scrim"
        className={`fixed inset-0 z-[990] bg-slate-950/75 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panneau de navigation off-canvas coulissant depuis la gauche */}
      <nav
        ref={drawerRef}
        id="navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t.menu}
        aria-hidden={!isOpen}
        className={`fixed top-0 bottom-0 left-0 z-[1000] w-80 max-w-[85vw] bg-slate-900/95 backdrop-blur-2xl border-r border-slate-800 text-slate-100 shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* En-tête du Drawer */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <AppLogo className="w-10 h-10 rounded-2xl shadow-lg shadow-amber-500/25 shrink-0" />
            <div>
              <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>{t.appName}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md font-mono">
                  GPS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">{t.tagline}</p>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            onClick={onClose}
            type="button"
            aria-label={t.closeMenu}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* État GPS en direct */}
        <div className="px-4 py-2.5 bg-slate-950/30 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio
              className={`w-3.5 h-3.5 ${
                isRealGps || isSimulating ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
              }`}
            />
            <span className="text-xs font-semibold text-slate-300">
              {isRealGps || isSimulating ? 'Signal GPS capté' : isGpsLoading ? 'Recherche signal...' : 'Signal GPS inactif'}
            </span>
          </div>
          <button
            onClick={() => handleAction(onOpenGpsDetails)}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-medium underline"
          >
            Détails
          </button>
        </div>

        {/* Liste des rubriques de navigation (déroulante) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Section Navigation & Trajets */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t.navigation}
            </div>
            <div className="space-y-1">
              {/* Moteur de carte (Voyager CARTO vs Google Maps) */}
              <button
                type="button"
                onClick={() => {
                  onToggleMapEngine();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800/80 active:bg-slate-800 border border-transparent hover:border-slate-700/60 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <MapIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Moteur Cartographique</div>
                    <div className="text-[11px] text-slate-400">
                      {mapEngine === 'google' ? 'Google Maps Platform' : 'CARTO Voyager (OSM)'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {mapEngine === 'google' ? 'Google' : 'CARTO'}
                </span>
              </button>

              {/* Sonneries & Alarmes */}
              <button
                type="button"
                onClick={() => handleAction(onOpenSoundModal)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800/80 active:bg-slate-800 border border-transparent hover:border-slate-700/60 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Music className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{t.ringtones}</div>
                    <div className="text-[11px] text-slate-400">Sons de réveil, volume et vibrations</div>
                  </div>
                </div>
              </button>

              {/* Arrêts favoris */}
              <button
                type="button"
                onClick={() => handleAction(onOpenFavoritesModal)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800/80 active:bg-slate-800 border border-transparent hover:border-slate-700/60 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-400 flex items-center justify-center border border-yellow-500/20">
                    <Star className="w-4 h-4 fill-yellow-400/20" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{t.favorites}</div>
                    <div className="text-[11px] text-slate-400">Gares, métros et arrêts enregistrés</div>
                  </div>
                </div>
              </button>

              {/* Diagnostic GPS */}
              <button
                type="button"
                onClick={() => handleAction(onOpenGpsDetails)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800/80 active:bg-slate-800 border border-transparent hover:border-slate-700/60 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{t.gpsDiagnostic}</div>
                    <div className="text-[11px] text-slate-400">Précision en mètres, vitesse et coordonnées</div>
                  </div>
                </div>
              </button>

              {/* Paramètres Publicités / AdMob & Unity Ads */}
              <button
                type="button"
                onClick={() => handleAction(onOpenAdSettings)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800/80 active:bg-slate-800 border border-transparent hover:border-slate-700/60 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{t.admobTitle}</div>
                    <div className="text-[11px] text-slate-400">Unity Ads & Google AdMob SDK</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Section Préférences & Affichage */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Préférences
            </div>
            <div className="space-y-2">
              {/* Sélecteur de Langue */}
              <div className="px-3 py-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
                <div className="text-xs font-semibold text-slate-300 mb-2">Langue / Language</div>
                <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                  {(['fr', 'en', 'ar'] as Language[]).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => onSelectLang(l)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                        lang === l
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {l === 'fr' ? 'Français' : l === 'en' ? 'English' : 'العربية'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Taille du texte */}
              <button
                type="button"
                onClick={onCycleTextSize}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:bg-slate-800/60 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700">
                    <Type className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{t.textSize}</div>
                    <div className="text-[11px] text-slate-400">{textSizeLabel}</div>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-800 rounded-lg text-amber-300 border border-slate-700">
                  {textSizeBadge}
                </span>
              </button>

              {/* Mode Démo / Simulation de trajet */}
              <button
                type="button"
                onClick={() => {
                  onToggleSimulation();
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-left ${
                  isSimulating
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/60 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      isSimulating
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {isSimulating ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold">
                      {isSimulating ? t.disableSimulation : t.simulateTrip}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {isSimulating ? 'Arrêter la simulation active' : 'Tester l’alerte sans se déplacer'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {isSimulating ? 'Actif' : 'Démo'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pied de page du Drawer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.noAccountRequired}</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">v1.2.0</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Navigation GPS autonome adaptée aux transports en commun, trains, bus et métros.
          </p>
        </div>
      </nav>
    </>
  );
};
