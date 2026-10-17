import React, { useEffect, useRef, useState } from 'react';
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
  Route,
  Bus,
  Navigation,
  Gauge,
  Clock,
  Volume2,
  Sparkles,
  MapPin,
  Sliders,
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { Translations, Language, TextSize } from '../utils/i18n';
import { RadiusSelector } from './RadiusSelector';
import { alertSystem } from '../utils/audioAlert';
import { formatDistance, formatSpeed, estimateRemainingTime } from '../utils/geo';

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
  onOpenBusTraceHistory?: () => void;
  busTraceCount?: number;
  onOpenGpsDetails: () => void;
  onOpenBackgroundModal: () => void;
  hasBackgroundPermission?: boolean;
  onOpenAdMobSettings?: () => void;
  isRealGps: boolean;
  isGpsLoading: boolean;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  // Contrôles complets du trajet déplacés dans le menu hamburger
  isTracking?: boolean;
  distance?: number | null;
  radius?: number;
  currentSpeed?: number | null;
  destinationSet?: boolean;
  destinationAddress?: string | null;
  onStartTracking?: () => void;
  onStopTracking?: () => void;
  onChangeRadius?: (radius: number) => void;
  onSimulateStep?: () => void;
  selectedSoundName?: string;
  onOpenOnboarding?: () => void;
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
  onOpenBusTraceHistory,
  busTraceCount,
  onOpenGpsDetails,
  onOpenBackgroundModal,
  hasBackgroundPermission,
  onOpenAdMobSettings,
  isRealGps,
  isGpsLoading,
  isSimulating,
  onToggleSimulation,
  isTracking = false,
  distance = null,
  radius = 500,
  currentSpeed = null,
  destinationSet = false,
  destinationAddress = null,
  onStartTracking,
  onStopTracking,
  onChangeRadius,
  onSimulateStep,
  selectedSoundName,
  onOpenOnboarding,
}) => {
  const drawerRef = useRef<HTMLElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef<boolean>(isOpen);
  const [soundTested, setSoundTested] = useState<boolean>(false);

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
    setTimeout(() => {
      callback();
    }, 150);
  };

  const handleTestSound = () => {
    alertSystem.unlockAudio();
    alertSystem.playCurrentSound();
    alertSystem.triggerVibration();
    setSoundTested(true);
    setTimeout(() => setSoundTested(false), 1400);
  };

  const formattedDist = formatDistance(distance);
  const speedText = formatSpeed(currentSpeed);
  const etaText = distance !== null ? estimateRemainingTime(distance, currentSpeed) : '--';

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
        className={`fixed top-0 bottom-0 left-0 z-[1000] w-84 max-w-[88vw] bg-slate-900/95 backdrop-blur-2xl border-r border-slate-800 text-slate-100 shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* En-tête du Drawer */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-950/60 shrink-0">
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
        <div className="px-4 py-2.5 bg-slate-950/35 border-b border-slate-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Radio
              className={`w-3.5 h-3.5 ${
                isRealGps || isSimulating ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
              }`}
            />
            <span className="text-xs font-semibold text-slate-300">
              {isRealGps || isSimulating
                ? 'Signal GPS capté'
                : isGpsLoading
                ? 'Recherche signal...'
                : 'Signal GPS inactif'}
            </span>
          </div>
          <button
            onClick={() => handleAction(onOpenGpsDetails)}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-medium underline"
          >
            Détails
          </button>
        </div>

        {/* Liste déroulante des contrôles & rubriques */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* SECTION 1 : CONTRÔLES DU TRAJET & ALARME (DÉPLACÉ DU BAS VERS LE MENU LATÉRAL) */}
          <div className="bg-slate-950/65 rounded-2xl p-3 border border-slate-800/90 shadow-inner space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {t.tripControls}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isTracking
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 animate-pulse'
                    : destinationSet
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isTracking
                  ? isSimulating
                    ? t.trackingSimActive
                    : t.trackingActive
                  : destinationSet
                  ? 'Prêt à démarrer'
                  : t.waitingForDeparture}
              </span>
            </div>

            {/* Destination & Métriques du trajet */}
            {destinationSet && distance !== null ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2 bg-slate-900/85 p-2.5 rounded-xl border border-slate-800">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-400 font-medium">Destination d'arrivée</div>
                    <div className="text-xs font-semibold text-slate-100 truncate">
                      {destinationAddress || 'Arrêt défini sur la carte'}
                    </div>
                  </div>
                </div>

                {/* Grille des 3 métriques : Distance, Vitesse, ETA */}
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                      <Navigation className="w-2.5 h-2.5 text-rose-400" />
                      <span>{t.distanceLabel}</span>
                    </div>
                    <div className="font-mono font-bold text-sm text-white mt-0.5">
                      {formattedDist.value}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">
                        {formattedDist.unit}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                      <Gauge className="w-2.5 h-2.5 text-blue-400" />
                      <span>{t.speedLabel}</span>
                    </div>
                    <div className="font-mono font-bold text-sm text-slate-200 mt-0.5">
                      {speedText}
                    </div>
                  </div>

                  <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-400" />
                      <span>{t.etaLabel}</span>
                    </div>
                    <div className="font-mono font-bold text-sm text-amber-300 mt-0.5">
                      {etaText}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-2.5 text-center bg-slate-900/60 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400">
                {t.tapMapOrSearchHint}
              </div>
            )}

            {/* Boutons d'action : Démarrer / Arrêter la surveillance */}
            <div className="space-y-1.5 pt-0.5">
              {!isTracking ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onStartTracking) {
                      onStartTracking();
                      onClose();
                    }
                  }}
                  disabled={!destinationSet}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{t.startTracking}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onStopTracking) {
                        onStopTracking();
                      }
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-950/30 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>{t.stopTracking}</span>
                  </button>

                  {isSimulating && onSimulateStep && (
                    <button
                      type="button"
                      onClick={onSimulateStep}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold border border-slate-700 flex items-center gap-1 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t.stepForward}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sélecteur de rayon d'alerte */}
            <div className="pt-1">
              <RadiusSelector
                radius={radius}
                onChangeRadius={onChangeRadius ?? (() => {})}
                disabled={Boolean(isTracking)}
                t={t}
              />
            </div>

            {/* Test rapide son & vibration & bouton raccourci sonneries */}
            <div className="pt-1 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleTestSound}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  soundTested
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 scale-[1.02]'
                    : 'bg-slate-900/85 hover:bg-slate-800 text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{soundTested ? 'Alarme activée !' : t.testAlarm}</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenSoundModal)}
                className="py-2 px-3 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium flex items-center gap-1 transition-all"
                title={t.ringtones}
              >
                <Music className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate max-w-[85px]">{selectedSoundName || t.ringtones}</span>
              </button>
            </div>
          </div>

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

              {/* Tracé de ligne du trajet */}
              <div className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                    <Route className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{t.routeLineTrace}</div>
                    <div className="text-[11px] text-slate-400">Tracé lumineux & direct au lancement du suivi</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800">
                  Actif
                </span>
              </div>

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

              {/* Historique des tracés de lignes de bus */}
              <button
                type="button"
                onClick={() => onOpenBusTraceHistory && handleAction(onOpenBusTraceHistory)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800/80 active:bg-slate-800 border border-transparent hover:border-slate-700/60 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Bus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <span>{t.busTraceHistory}</span>
                      {busTraceCount !== undefined && busTraceCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-400 border border-amber-800/60">
                          {busTraceCount}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">Lignes enregistrées & parcours GPS</div>
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

              {/* Autorisations Localisation & Arrière-plan */}
              <button
                type="button"
                onClick={() => handleAction(onOpenBackgroundModal)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800/80 active:bg-slate-800 border border-transparent hover:border-slate-700/60 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      Autorisations Système GPS & Batterie
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Pour sonner écran éteint & en poche (Anti-veille)
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    hasBackgroundPermission && isRealGps
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {hasBackgroundPermission && isRealGps ? 'Actif' : 'Vérifier'}
                </span>
              </button>

              {/* Publicités Google AdMob */}
              {onOpenAdMobSettings && (
                <button
                  type="button"
                  onClick={() => handleAction(onOpenAdMobSettings)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800/80 active:bg-slate-800 border border-transparent hover:border-slate-700/60 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Google AdMob</div>
                      <div className="text-[11px] text-slate-400">Bannière (#3286634079) & Interstitiel</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Actif
                  </span>
                </button>
              )}
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

              {/* Guide de démarrage & Tutoriel onboarding */}
              {onOpenOnboarding && (
                <button
                  type="button"
                  onClick={() => handleAction(onOpenOnboarding)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:bg-slate-800/60 transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{t.onboardingReplay}</div>
                      <div className="text-[11px] text-slate-400">Revoir les 4 étapes du fonctionnement</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Guide
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pied de page du Drawer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-2 shrink-0">
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
