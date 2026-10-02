import React, { useState } from 'react';
import {
  Compass,
  AlertTriangle,
  Smartphone,
  RefreshCw,
  Loader2,
  X,
  MapPin,
  ArrowRight,
  Settings,
} from 'lucide-react';
import { PermissionState, LocationError } from '../services/LocationManager';
import { Translations, Language } from '../utils/i18n';

interface LocationPermissionModalProps {
  permissionStatus: PermissionState;
  isLoading: boolean;
  error: LocationError | null;
  hasLocation: boolean;
  onRequestLocation: () => void;
  t: Translations;
  lang: Language;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  permissionStatus,
  isLoading,
  error,
  hasLocation,
  onRequestLocation,
  t,
  lang,
}) => {
  const [isDismissedByUser, setIsDismissedByUser] = useState(false);

  // Si l'accès n'est pas explicitement refusé et qu'on est en cours d'acquisition ou qu'on a déjà une position, ne pas bloquer
  const isDenied = permissionStatus === 'denied' || (error && error.code === 1);
  const isUnavailable = error && error.code === 2;

  // Si la permission est accordée et qu'on a la position réelle, ou si on est en attente/acquisition sans refus, laisser la carte visible
  if (!isDenied && (hasLocation || isLoading || permissionStatus === 'prompt' || permissionStatus === 'granted')) {
    return null;
  }

  // Si l'utilisateur a fermé temporairement la modal, afficher un bandeau discret en haut
  if (isDismissedByUser) {
    return (
      <div className="fixed top-14 left-3 right-3 z-[2500] max-w-md mx-auto pointer-events-auto">
        <div className="bg-amber-950/90 backdrop-blur-md border border-amber-500/60 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-2xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px] font-medium text-amber-200 truncate">
              {error ? error.message : t.locPermissionRequiredTitle}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onRequestLocation()}
              className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px]"
            >
              {t.locAuthorizeBtn}
            </button>
            <button
              onClick={() => setIsDismissedByUser(false)}
              className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
              title="Agrandir"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ne pas afficher si tout va bien
  if (hasLocation && !error) {
    return null;
  }

  // Ouvrir les réglages Android si Cordova Diagnostic est présent
  const handleOpenSettings = () => {
    const cordova = (window as any).cordova;
    if (cordova?.plugins?.diagnostic?.switchToSettings) {
      cordova.plugins.diagnostic.switchToSettings();
    } else {
      onRequestLocation();
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/60 rounded-3xl shadow-2xl p-5 sm:p-6 overflow-hidden text-center">
        {/* Bouton Fermer / Ignorer en haut à droite pour ne jamais bloquer l'utilisateur */}
        <button
          onClick={() => setIsDismissedByUser(true)}
          type="button"
          aria-label="Fermer"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Halo décoratif */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Icône animée */}
        <div className="relative mx-auto mb-4 w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          ) : isDenied ? (
            <AlertTriangle className="w-8 h-8 text-rose-400 animate-pulse" />
          ) : (
            <Compass className="w-8 h-8 text-amber-400 animate-pulse" />
          )}
        </div>

        {/* Titre & Description */}
        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
          {isLoading
            ? t.locAcquiringPosition
            : isDenied
            ? t.locPermissionDeniedTitle
            : t.locPermissionRequiredTitle}
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
          {isLoading
            ? t.locAcquiringPosition
            : isDenied
            ? t.locPermissionDeniedDesc
            : t.locPermissionRequiredDesc}
        </p>

        {/* Message d'erreur spécifique éventuel avec aide Android */}
        {error && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-start space-y-1.5">
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {error.code === 3
                  ? t.locErrorTimeout
                  : error.code === 2
                  ? t.locErrorUnavailable
                  : error.message}
              </span>
            </div>

            {/* Conseils spécifiques pour Android */}
            {isUnavailable && (
              <div className="text-[11px] text-slate-300 space-y-1 pt-1 border-t border-amber-500/20 leading-relaxed">
                <p className="font-semibold text-amber-300">
                  Sur votre smartphone Android :
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                  <li>
                    Déroulez le volet du haut et vérifiez que l'icône <strong>Position / Localisation (GPS)</strong> est allumée.
                  </li>
                  <li>
                    Si l'application APK vient d'être installée, la nouvelle version compile les autorisations GPS requises.
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Instructions détaillées si refusé dans le navigateur */}
        {isDenied && (
          <div className="mt-3.5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-start space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Smartphone className="w-4 h-4" />
              <span>Instructions pour autoriser le GPS :</span>
            </div>

            <div className="text-[11px] text-slate-300 space-y-1 leading-normal">
              <p>
                1. Dans <strong>Paramètres de votre téléphone &gt; Applications &gt; arreva (ou Geoarriva)</strong>.
              </p>
              <p>
                2. Touchez <strong>Autorisations &gt; Localisation</strong> et cochez <strong>Toujours autoriser</strong> ou <strong>Lorsque l'appli est en cours d'utilisation</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Actions principales */}
        <div className="mt-5 space-y-2.5">
          <button
            onClick={() => onRequestLocation()}
            type="button"
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Détection de votre position...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-slate-950" />
                <span>{isDenied ? t.locRetryBtn : t.locAuthorizeBtn}</span>
              </>
            )}
          </button>

          {/* Bouton pour continuer vers la carte sans être bloqué */}
          <button
            onClick={() => setIsDismissedByUser(true)}
            type="button"
            className="w-full py-2.5 px-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700"
          >
            <span>Accéder à la carte &amp; Trajets</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
