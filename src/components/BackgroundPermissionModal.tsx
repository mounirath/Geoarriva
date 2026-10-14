import React, { useState } from 'react';
import {
  X,
  Compass,
  Radio,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Settings,
  BatteryCharging,
  Bell,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Translations, Language } from '../utils/i18n';
import { PermissionState } from '../services/LocationManager';

interface BackgroundPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissionStatus: PermissionState;
  hasLocation: boolean;
  hasBackgroundPermission: boolean;
  onRequestForegroundLocation: () => void;
  onRequestBackgroundLocation: () => Promise<boolean>;
  onOpenSettings: () => void;
  t: Translations;
  lang: Language;
}

export const BackgroundPermissionModal: React.FC<BackgroundPermissionModalProps> = ({
  isOpen,
  onClose,
  permissionStatus,
  hasLocation,
  hasBackgroundPermission,
  onRequestForegroundLocation,
  onRequestBackgroundLocation,
  onOpenSettings,
  t,
  lang,
}) => {
  const [isActivatingBg, setIsActivatingBg] = useState(false);
  const [bgSuccess, setBgSuccess] = useState(hasBackgroundPermission);

  if (!isOpen) return null;

  const handleActivateBackground = async () => {
    setIsActivatingBg(true);
    try {
      const granted = await onRequestBackgroundLocation();
      setBgSuccess(granted);
    } catch {
      // ignore
    } finally {
      setIsActivatingBg(false);
    }
  };

  const isGpsActive = hasLocation && permissionStatus === 'granted';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Autorisations de localisation et d'arrière-plan"
      className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Autorisations GPS & Arrière-plan
              </h2>
              <p className="text-[11px] text-slate-400">
                Garantit que l'alarme sonne écran éteint
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Bloc 1 : Localisation Premier Plan */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-bold text-slate-100">
                  1. Localisation précise (GPS)
                </span>
              </div>
              {isGpsActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Accordée
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <AlertTriangle className="w-3 h-3" />
                  Requise
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Permet de calculer en temps réel la distance exacte qui vous sépare de votre arrêt ou gare d'arrivée.
            </p>

            {!isGpsActive && (
              <button
                onClick={onRequestForegroundLocation}
                type="button"
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Autoriser le GPS maintenant</span>
              </button>
            )}
          </div>

          {/* Bloc 2 : Localisation Arrière-Plan ("Toujours autoriser") */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <span className="text-xs font-bold text-slate-100">
                  2. Localisation en arrière-plan
                </span>
              </div>
              {bgSuccess ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Toujours actif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  À configurer
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-white font-semibold">Indispensable dans les transports :</strong> pour que l'alarme sonore et les vibrations sonnent <span className="text-amber-300">même si votre écran est verrouillé</span> ou que le téléphone est dans votre poche.
            </p>

            {/* Guide Android */}
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Configuration sur Android :</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[10px] text-slate-400 pl-1">
                <li>Ouvrez les réglages de l'application</li>
                <li>Appuyez sur <span className="text-slate-200 font-medium">« Autorisations »</span> puis <span className="text-slate-200 font-medium">« Localisation »</span></li>
                <li>Sélectionnez <span className="text-amber-300 font-bold">« Toujours autoriser »</span></li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={handleActivateBackground}
                disabled={isActivatingBg}
                type="button"
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-amber-500/20"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{bgSuccess ? 'Réactiver l’arrière-plan' : 'Activer l’arrière-plan'}</span>
              </button>

              <button
                onClick={onOpenSettings}
                type="button"
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                title="Ouvrir les paramètres système de l'application"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Paramètres Android</span>
              </button>
            </div>
          </div>

          {/* Bloc 3 : Exemption de batterie */}
          <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800 flex items-start gap-2.5">
            <BatteryCharging className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-200">Anti-mise en veille :</span> arreva utilise le maintien en éveil (<span className="text-slate-300">WakeLock</span>) pour empêcher Android d'endormir le signal satellite pendant vos trajets quotidiens.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-center">
          <button
            onClick={onClose}
            type="button"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
          >
            <span>Fermer et continuer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
