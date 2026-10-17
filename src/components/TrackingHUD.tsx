import React from 'react';
import {
  Play,
  Square,
  Navigation,
  Clock,
  Sparkles,
  Menu,
  ChevronRight,
  Route,
  MapPin,
} from 'lucide-react';
import { formatDistance, formatSpeed, estimateRemainingTime } from '../utils/geo';
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
  onOpenMenu?: () => void;
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
  isSimulating,
  onSimulateStep,
  onOpenMenu,
  t,
}) => {
  const formattedDist = formatDistance(distance);
  const etaText = distance !== null ? estimateRemainingTime(distance, currentSpeed) : '--';

  return (
    <div
      id="floating-trip-bar"
      className="fixed bottom-[70px] sm:bottom-[74px] left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[480px] z-[450] pointer-events-auto"
    >
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5">
        {/* Info trajet & métriques (Cliquable pour ouvrir le menu latéral complet) */}
        <button
          type="button"
          onClick={onOpenMenu}
          title={t.openSideMenu}
          className="flex-1 flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer group"
        >
          {/* Indicateur d'état */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              isTracking
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : destinationSet
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isTracking ? (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            ) : destinationSet ? (
              <MapPin className="w-4 h-4 text-amber-400" />
            ) : (
              <Navigation className="w-4 h-4 text-slate-400" />
            )}
          </div>

          {/* Textes et métriques compactes */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate max-w-[170px] sm:max-w-[210px]">
                {isTracking
                  ? isSimulating
                    ? t.trackingSimActive
                    : t.trackingActive
                  : destinationSet
                  ? destinationAddress || 'Destination définie'
                  : t.waitingForDeparture}
              </span>
              {isTracking && (
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-semibold text-sky-400 bg-sky-950/60 px-1.5 py-0.2 rounded-full border border-sky-800/60">
                  <Route className="w-2.5 h-2.5" />
                  {radius}m
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              {destinationSet && distance !== null ? (
                <>
                  <span className="font-mono font-semibold text-amber-300">
                    {formattedDist.value} {formattedDist.unit}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5 text-slate-300">
                    <Clock className="w-2.5 h-2.5 text-amber-400" />
                    <span>{etaText}</span>
                  </span>
                </>
              ) : (
                <span className="text-[11px] text-slate-400 truncate">
                  {t.tapMapToSetDest}
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Boutons d'action rapides */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Si tracking avec simulation : bouton pas à pas */}
          {isTracking && isSimulating && onSimulateStep && (
            <button
              type="button"
              onClick={onSimulateStep}
              title={t.stepForward}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 border border-slate-700 flex items-center justify-center transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Bouton Démarrer / Arrêter la surveillance */}
          {!isTracking ? (
            <button
              type="button"
              onClick={onStartTracking}
              disabled={!destinationSet}
              title={t.startTracking}
              className="py-2 px-3 sm:px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/10 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Démarrer</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStopTracking}
              title={t.stopTracking}
              className="py-2 px-3 sm:px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/30 transition-all cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Arrêter</span>
            </button>
          )}

          {/* Bouton Menu Hamburger Latéral */}
          <button
            type="button"
            onClick={onOpenMenu}
            title={t.openSideMenu}
            className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 border border-slate-700 text-amber-400 hover:text-amber-300 font-semibold text-xs flex items-center gap-1 transition-all shadow-sm cursor-pointer"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden sm:inline">Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
