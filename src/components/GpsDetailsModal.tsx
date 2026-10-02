import React, { useState } from 'react';
import {
  MapPin,
  Locate,
  Compass,
  Crosshair,
  Copy,
  Share2,
  Check,
  Activity,
  Gauge,
  Radio,
  X,
  RefreshCw,
  Navigation,
} from 'lucide-react';
import { Coordinates, formatSpeed } from '../utils/geo';
import { Translations, Language } from '../utils/i18n';

interface GpsDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: Coordinates | null;
  accuracy: number | null;
  speed: number | null;
  timestamp: number | null;
  isRealGps: boolean;
  isLoading: boolean;
  onRequestLocation: () => void;
  onCenterMap: () => void;
  t: Translations;
  lang: Language;
}

export const GpsDetailsModal: React.FC<GpsDetailsModalProps> = ({
  isOpen,
  onClose,
  location,
  accuracy,
  speed,
  timestamp,
  isRealGps,
  isLoading,
  onRequestLocation,
  onCenterMap,
  t,
  lang,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const latFormatted = location ? location.lat.toFixed(6) : '--';
  const lngFormatted = location ? location.lng.toFixed(6) : '--';
  const coordsString = location ? `${latFormatted}, ${lngFormatted}` : '';

  const accuracyFormatted = accuracy ? `± ${Math.round(accuracy)} m` : '--';
  const speedFormatted = speed !== null && speed !== undefined ? formatSpeed(speed) : '0 km/h';

  const timeString = timestamp
    ? new Date(timestamp).toLocaleTimeString(lang === 'ar' ? 'ar-DZ' : lang === 'en' ? 'en-US' : 'fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--';

  // Qualité du signal basée sur la précision en mètres
  const getSignalQuality = (acc: number | null) => {
    if (!acc) return { text: 'Inconnu', color: 'text-slate-400', bg: 'bg-slate-800' };
    if (acc <= 15) return { text: 'Excellente (Satellite GPS)', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (acc <= 35) return { text: 'Bonne (Haute précision)', color: 'text-emerald-300', bg: 'bg-emerald-500/10' };
    if (acc <= 80) return { text: 'Moyenne (Réseau / Wi-Fi)', color: 'text-amber-400', bg: 'bg-amber-500/10' };
    return { text: 'Approximative (Antenne cellulaire)', color: 'text-rose-400', bg: 'bg-rose-500/10' };
  };

  const signalQuality = getSignalQuality(accuracy);

  const handleCopyCoords = async () => {
    if (!coordsString) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(coordsString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // fallback
    }
  };

  const handleShare = async () => {
    if (!location) return;
    const url = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ma position GPS - arreva',
          text: `Position GPS : ${coordsString} (Précision : ${accuracyFormatted})`,
          url,
        });
      } catch {
        // Annulé par l'utilisateur
      }
    } else {
      handleCopyCoords();
    }
  };

  return (
    <div className="fixed inset-0 z-[2600] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-5 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Lueur d'ambiance */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header avec bouton fermer */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Crosshair className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>Ma Position GPS</span>
                {isRealGps && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isRealGps ? 'Signal GPS matériel connecté' : 'Acquisition en cours...'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenu principal */}
        <div className="mt-4 space-y-3.5">
          {location ? (
            <>
              {/* Carte des coordonnées */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>Coordonnées exactes :</span>
                  </span>
                  <button
                    onClick={handleCopyCoords}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Latitude</span>
                    <span className="text-sm font-bold text-white tracking-wide">{latFormatted}°</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">Longitude</span>
                    <span className="text-sm font-bold text-white tracking-wide">{lngFormatted}°</span>
                  </div>
                </div>
              </div>

              {/* Indicateurs de précision et vitesse */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {/* Précision */}
                <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center">
                  <Radio className="w-4 h-4 text-emerald-400 mb-1" />
                  <span className="text-[10px] text-slate-400">Précision</span>
                  <span className="text-xs font-bold text-white mt-0.5">{accuracyFormatted}</span>
                </div>

                {/* Vitesse */}
                <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center">
                  <Gauge className="w-4 h-4 text-amber-400 mb-1" />
                  <span className="text-[10px] text-slate-400">Vitesse</span>
                  <span className="text-xs font-bold text-white mt-0.5">{speedFormatted}</span>
                </div>

                {/* Actualisé à */}
                <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-400 mb-1" />
                  <span className="text-[10px] text-slate-400">Actualisé à</span>
                  <span className="text-xs font-bold text-white mt-0.5">{timeString}</span>
                </div>
              </div>

              {/* Qualité du signal */}
              <div className={`p-2.5 rounded-2xl border border-slate-800 flex items-center justify-between text-xs ${signalQuality.bg}`}>
                <span className="text-slate-400">Qualité du signal :</span>
                <span className={`font-bold ${signalQuality.color}`}>{signalQuality.text}</span>
              </div>
            </>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-2">
              <Radio className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
              <p className="text-sm font-bold text-white">Recherche de votre position GPS...</p>
              <p className="text-xs text-slate-400">
                Assurez-vous que le GPS est activé sur votre smartphone.
              </p>
            </div>
          )}

          {/* Boutons d'actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                onCenterMap();
                onClose();
              }}
              disabled={!location}
              type="button"
              className="py-3 px-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
            >
              <Locate className="w-4 h-4" />
              <span>Centrer sur la carte</span>
            </button>

            <button
              onClick={() => {
                onRequestLocation();
              }}
              type="button"
              disabled={isLoading}
              className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 hover:text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Actualisation...' : 'Rafraîchir GPS'}</span>
            </button>
          </div>

          {/* Bouton Partager */}
          {location && (
            <button
              onClick={handleShare}
              type="button"
              className="w-full py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700/60 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Partager ma position GPS</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
