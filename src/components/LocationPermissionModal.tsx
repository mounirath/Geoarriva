import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  AlertTriangle,
  Lock,
  Smartphone,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Info,
  ExternalLink,
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

  // Si la permission est accordée et qu'on a la position réelle, ne pas afficher
  if (permissionStatus === 'granted' && hasLocation) {
    return null;
  }

  // Si l'utilisateur a fermé temporairement la modal, afficher une bannière compacte d'alerte en haut
  if (isDismissedByUser && permissionStatus === 'denied') {
    return (
      <div className="fixed top-14 left-3 right-3 z-[600] max-w-md mx-auto pointer-events-auto">
        <div className="bg-rose-950/90 backdrop-blur-md border border-rose-500/60 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-2xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-[11px] font-medium text-rose-200 truncate">
              {t.locPermissionDeniedTitle}
            </span>
          </div>
          <button
            onClick={() => setIsDismissedByUser(false)}
            className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shrink-0"
          >
            {t.locAuthorizeBtn}
          </button>
        </div>
      </div>
    );
  }

  // Ne pas afficher si tout va bien
  if (hasLocation && !error) {
    return null;
  }

  const isDenied = permissionStatus === 'denied' || (error && error.code === 1);

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/60 rounded-3xl shadow-2xl p-5 sm:p-6 overflow-hidden text-center">
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

        {/* Instructions détaillées si refusé / bloqué */}
        {isDenied && (
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-start space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Smartphone className="w-4 h-4" />
              <span>Instructions de déblocage rapide :</span>
            </div>

            <div className="text-[11px] text-slate-300 space-y-1.5 leading-normal">
              <p className="flex items-start gap-1.5">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Touchez l'icône de <strong>cadenas</strong> ou <strong>paramètres du site</strong> située à gauche dans la barre d'adresse du navigateur.
                </span>
              </p>

              <p className="flex items-start gap-1.5">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Appuyez sur <strong>Autorisations</strong> puis activez <strong>Localisation</strong> (Autoriser).
                </span>
              </p>

              <p className="flex items-start gap-1.5">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Revenez ici et appuyez sur le bouton <strong>"{t.locRetryBtn}"</strong> ci-dessous.
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Message d'erreur spécifique éventuel */}
        {error && error.code !== 1 && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
            {error.code === 3
              ? t.locErrorTimeout
              : error.code === 2
              ? t.locErrorUnavailable
              : error.message}
          </div>
        )}

        {/* Bouton d'action principal */}
        <div className="mt-5 space-y-2">
          <button
            onClick={onRequestLocation}
            disabled={isLoading}
            type="button"
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>{t.locAcquiringPosition}</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-slate-950" />
                <span>{isDenied ? t.locRetryBtn : t.locAuthorizeBtn}</span>
              </>
            )}
          </button>

          {/* Option pour explorer la carte tout de même */}
          {isDenied && (
            <button
              onClick={() => setIsDismissedByUser(true)}
              type="button"
              className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2 py-1 transition-colors"
            >
              Continuer sans GPS automatique (mode consultation)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
