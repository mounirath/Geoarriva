import React, { useState } from 'react';
import {
  Play,
  Square,
  Navigation,
  Gauge,
  Clock,
  Volume2,
  Sliders,
  Sparkles,
  Smartphone,
  Music,
  Star,
  ChevronUp,
  ChevronDown,
  Route,
  Bus,
} from 'lucide-react';
import { formatDistance, formatSpeed, estimateRemainingTime } from '../utils/geo';
import { RadiusSelector } from './RadiusSelector';
import { alertSystem } from '../utils/audioAlert';
import { Translations } from '../utils/i18n';

interface TrackingHUDProps {
  isTracking: boolean;
  distance: number | null;
  radius: number;
  currentSpeed: number | null;
  destinationSet: boolean;
  destinationAddress?: string | null;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onChangeRadius: (radius: number) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onSimulateStep?: () => void;
  onOpenSoundSettings: () => void;
  selectedSoundName: string;
  onOpenFavorites: () => void;
  onOpenBusTraceHistory?: () => void;
  onOpenBackgroundModal?: () => void;
  t: Translations;
}

export const TrackingHUD: React.FC<TrackingHUDProps> = ({
  isTracking,
  distance,
  radius,
  currentSpeed,
  destinationSet,
  destinationAddress,
  onStartTracking,
  onStopTracking,
  onChangeRadius,
  isSimulating,
  onToggleSimulation,
  onSimulateStep,
  onOpenSoundSettings,
  selectedSoundName,
  onOpenFavorites,
  onOpenBusTraceHistory,
  onOpenBackgroundModal,
  t,
}) => {
  // Le menu est fermé par défaut
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [soundTested, setSoundTested] = useState<boolean>(false);

  const formattedDist = formatDistance(distance);
  const speedText = formatSpeed(currentSpeed);
  const etaText = distance !== null ? estimateRemainingTime(distance, currentSpeed) : '--';

  // Fonction interrupteur toggle
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  // Test du son de l'alarme et de la vibration configurée
  const handleTestSound = () => {
    alertSystem.unlockAudio();
    alertSystem.playCurrentSound();
    alertSystem.triggerVibration();
    setSoundTested(true);
    setTimeout(() => setSoundTested(false), 1300);
  };

  return (
    <div
      id="bottom-sliding-menu"
      className={`fixed bottom-0 left-0 right-0 z-[500] max-w-lg mx-auto pointer-events-auto bg-slate-900/95 backdrop-blur-2xl border-t border-x border-slate-700/80 rounded-t-3xl sm:rounded-t-[32px] shadow-2xl transition-transform ease-out transform ${
        isMenuOpen ? 'translate-y-0' : 'translate-y-[calc(100%-54px)]'
      }`}
      style={{
        transitionProperty: 'transform',
        transitionDuration: '350ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Languette / Poignée tactile interactive (Interrupteur Ouvrir / Fermer) */}
      <button
        type="button"
        onClick={toggleMenu}
        aria-expanded={isMenuOpen}
        aria-controls="bottom-sliding-menu"
        aria-label={isMenuOpen ? 'Fermer le menu de trajet' : 'Ouvrir le menu de trajet'}
        className="w-full h-[54px] px-4 pt-2 pb-1.5 flex flex-col items-center justify-between cursor-pointer select-none group focus:outline-none active:scale-[0.98] transition-all bg-slate-900/80 hover:bg-slate-800/60 rounded-t-3xl sm:rounded-t-[32px] border-b border-slate-800/80"
      >
        {/* Poignée horizontale bien visible et tactile */}
        <div className="w-14 h-1.5 rounded-full bg-slate-500/80 group-hover:bg-amber-400 group-active:bg-amber-300 transition-colors shadow-sm" />

        {/* Aperçu compact selon l'état ouvert / fermé */}
        <div className="w-full flex items-center justify-between text-xs text-slate-300 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`relative flex h-2.5 w-2.5 shrink-0 ${
                isTracking ? 'text-emerald-500' : 'text-slate-500'
              }`}
            >
              {isTracking && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isTracking ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              />
            </span>
            <span className="text-[11px] font-semibold text-slate-200 truncate">
              {isTracking
                ? `${isSimulating ? t.trackingSimActive : t.trackingActive} · ${formattedDist.value} ${formattedDist.unit}`
                : destinationSet && distance !== null
                ? `${destinationAddress || 'Destination'} · ${formattedDist.value} ${formattedDist.unit}`
                : t.waitingForDeparture}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 group-hover:text-amber-300 transition-colors shrink-0">
            <span>{isMenuOpen ? 'Fermer' : 'Ouvrir'}</span>
            {isMenuOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 animate-bounce" />
            )}
          </div>
        </div>
      </button>

      {/* Contenu complet du menu (Visible quand remonté) */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* Barre d'état interne avec raccourcis */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">
              {isTracking
                ? isSimulating
                  ? t.trackingSimActive
                  : t.trackingActive
                : t.waitingForDeparture}
            </span>
            {isTracking && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded-full border border-sky-500/30">
                <Route className="w-2.5 h-2.5 text-sky-400 animate-pulse" />
                <span>{t.routeLineTrace}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Bouton Choix des Sons */}
            <button
              onClick={onOpenSoundSettings}
              title={t.ringtones}
              type="button"
              className="py-1 px-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white text-[11px] flex items-center gap-1.5 transition-all"
            >
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline max-w-[85px] truncate font-medium">
                {selectedSoundName}
              </span>
            </button>

            {/* Bouton Favoris */}
            <button
              onClick={onOpenFavorites}
              title={t.favorites}
              type="button"
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-amber-400 hover:text-amber-300 transition-colors"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400/30" />
            </button>

            {/* Bouton Historique des tracés de bus */}
            {onOpenBusTraceHistory && (
              <button
                onClick={onOpenBusTraceHistory}
                title={t.busTraceHistory}
                type="button"
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Bus className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Test rapide du son */}
            <button
              onClick={handleTestSound}
              title={t.testAlarm}
              type="button"
              className={`p-1.5 rounded-xl border text-xs flex items-center gap-1 transition-all ${
                soundTested
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 scale-105'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>

            {/* Toggle réglages rayon */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              type="button"
              className={`p-1.5 rounded-xl border transition-colors ${
                showSettings
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/60 text-slate-300 hover:text-white'
              }`}
              title={t.adjustRadius}
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Panneau dépliable de réglage du rayon */}
        {showSettings && (
          <div className="pt-2 pb-2 animate-in slide-in-from-top-2 duration-150">
            <RadiusSelector
              radius={radius}
              onChangeRadius={onChangeRadius}
              disabled={isTracking}
              t={t}
            />
          </div>
        )}

        {/* Affichage des métriques principales (Distance, Vitesse, ETA) */}
        <div>
          {destinationSet && distance !== null ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Distance restante */}
              <div className="bg-slate-950/50 rounded-2xl p-2.5 border border-slate-800/80">
                <div className="text-[10px] font-medium text-slate-400 flex items-center justify-center gap-1">
                  <Navigation className="w-3 h-3 text-rose-400" />
                  <span>{t.distanceLabel}</span>
                </div>
                <div className="mt-1 font-mono font-extrabold text-xl sm:text-2xl text-white tabular-nums metric-val">
                  {formattedDist.value}
                  <span className="text-xs font-semibold text-slate-400 ml-1">
                    {formattedDist.unit}
                  </span>
                </div>
              </div>

              {/* Vitesse actuelle */}
              <div className="bg-slate-950/50 rounded-2xl p-2.5 border border-slate-800/80">
                <div className="text-[10px] font-medium text-slate-400 flex items-center justify-center gap-1">
                  <Gauge className="w-3 h-3 text-blue-400" />
                  <span>{t.speedLabel}</span>
                </div>
                <div className="mt-1 font-mono font-bold text-base sm:text-lg text-slate-200 tabular-nums metric-val">
                  {speedText}
                </div>
              </div>

              {/* Estimation temps restant */}
              <div className="bg-slate-950/50 rounded-2xl p-2.5 border border-slate-800/80">
                <div className="text-[10px] font-medium text-slate-400 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{t.etaLabel}</span>
                </div>
                <div className="mt-1 font-mono font-bold text-base sm:text-lg text-amber-300 tabular-nums metric-val">
                  {etaText}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-3 px-4 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-xs text-slate-400">
              {t.tapMapOrSearchHint}
            </div>
          )}
        </div>

        {/* Boutons d'actions principaux */}
        <div className="space-y-2 pt-1">
          {!isTracking ? (
            <button
              onClick={onStartTracking}
              disabled={!destinationSet}
              type="button"
              className="w-full py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold text-sm sm:text-base shadow-xl shadow-amber-500/10 flex items-center justify-center gap-2 transition-all"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{t.startTracking}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onStopTracking}
                type="button"
                className="flex-1 py-3 px-4 rounded-2xl bg-rose-600/90 hover:bg-rose-500 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-lg shadow-rose-950/30 flex items-center justify-center gap-2 transition-all"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>{t.stopTracking}</span>
              </button>

              {/* Si en mode simulation, bouton pour avancer d'un pas vers l'arrivée */}
              {isSimulating && onSimulateStep && (
                <button
                  onClick={onSimulateStep}
                  type="button"
                  title={t.stepForward}
                  className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.stepForward}</span>
                </button>
              )}
            </div>
          )}

          {/* Mode simulation & option maintien d'écran */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
            <button
              type="button"
              onClick={onToggleSimulation}
              className="hover:text-slate-200 transition-colors flex items-center gap-1 underline underline-offset-2 decoration-slate-700"
            >
              {isSimulating ? t.disableSimulation : t.simulateTrip}
            </button>

            {onOpenBackgroundModal ? (
              <button
                type="button"
                onClick={onOpenBackgroundModal}
                className="flex items-center gap-1 text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer bg-slate-800/60 hover:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700/50"
                title="Gérer l'autorisation d'arrière-plan et maintien en éveil"
              >
                <Smartphone className="w-3 h-3 text-emerald-400" />
                <span>{t.screenKeptAwake}</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 text-slate-400">
                <Smartphone className="w-3 h-3 text-emerald-400" />
                <span>{t.screenKeptAwake}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
