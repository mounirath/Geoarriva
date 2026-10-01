import React, { useEffect, useState } from 'react';
import { BellRing, Volume2, VolumeX, CheckCircle2, Navigation } from 'lucide-react';
import { formatDistance } from '../utils/geo';
import { alertSystem } from '../utils/audioAlert';
import { Translations } from '../utils/i18n';

interface AlertModalProps {
  isOpen: boolean;
  distance: number | null;
  radius: number;
  destinationAddress?: string | null;
  onDismiss: () => void;
  t: Translations;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  distance,
  radius,
  destinationAddress,
  onDismiss,
  t,
}) => {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      alertSystem.startFullAlarm();
    } else {
      alertSystem.stopAlarm();
    }

    return () => {
      alertSystem.stopAlarm();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const distObj = formatDistance(distance);
  const radiusObj = formatDistance(radius);

  const toggleSound = () => {
    const muted = alertSystem.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Carte d'alerte urgente à contraste maximal */}
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border-2 border-rose-500/80 bg-slate-900 text-center">
        {/* En-tête clignotant rouge vif */}
        <div className="emergency-flash py-6 px-4 text-white relative">
          <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/60 mx-auto flex items-center justify-center shadow-lg mb-3 animate-bounce">
            <BellRing className="w-9 h-9 text-white animate-pulse" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
            {t.wakeUpUrgent}
          </h2>
          <p className="text-sm font-semibold text-rose-100 mt-1">
            {t.approachingDest}
          </p>
        </div>

        {/* Corps d'informations de trajet */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              {t.estimatedRemainingDist}
            </div>
            <div className="text-4xl font-extrabold text-rose-400 font-mono tabular-nums tracking-tight mt-1 metric-val">
              {distObj.value}{' '}
              <span className="text-xl font-bold text-slate-300">
                {distObj.unit}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {t.insideConfiguredRadius} {radiusObj.full}
            </div>
          </div>

          {destinationAddress && (
            <div className="text-xs text-slate-300 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center gap-2 text-start">
              <Navigation className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="line-clamp-2">{destinationAddress}</span>
            </div>
          )}

          {/* Contrôle du son silencieux */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={toggleSound}
              type="button"
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 border border-slate-700 active:scale-95 transition-all"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t.soundMuted}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>{t.soundActive}</span>
                </>
              )}
            </button>
          </div>

          {/* Bouton principal pour acquitter et stopper l'alarme */}
          <button
            onClick={onDismiss}
            type="button"
            className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-bold text-base shadow-xl shadow-rose-900/40 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{t.stopAlarmAndTracking}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
