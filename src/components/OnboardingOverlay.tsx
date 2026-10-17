import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Search,
  Sliders,
  Play,
  Bell,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Navigation,
  Compass,
  Lightbulb,
  Radio,
  Clock,
  Gauge,
  Lock,
} from 'lucide-react';
import { Translations, Language } from '../utils/i18n';
import { AppLogo } from './AppLogo';

interface OnboardingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translations;
  lang: Language;
}

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({
  isOpen,
  onClose,
  t,
  lang,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 4;

  // Démo interactive du rayon à l'étape 2
  const [demoRadius, setDemoRadius] = useState(500);

  // Gestion des touches Clavier (Échap, Flèches)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinish();
      } else if (e.key === 'ArrowRight') {
        if (currentStep < totalSteps - 1) {
          setCurrentStep((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 0) {
          setCurrentStep((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const handleFinish = () => {
    try {
      localStorage.setItem('arreva_onboarding_completed', 'true');
    } catch {}
    onClose();
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const stepOfText = t.onboardingStepOf
    .replace('{current}', String(currentStep + 1))
    .replace('{total}', String(totalSteps));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.onboardingTitle}
      className="fixed inset-0 z-[3000] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Barre de progression supérieure */}
        <div className="h-1.5 w-full bg-slate-800 shrink-0">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* En-tête de l'onboarding */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <AppLogo className="w-9 h-9 rounded-2xl shadow-lg shadow-amber-500/20 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                <span>arreva</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Guide
                </span>
              </div>
              <div className="text-[11px] font-medium text-amber-400">
                {stepOfText}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
            title={t.onboardingSkip}
          >
            <span>{t.onboardingSkip}</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Contenu de l'étape active */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* ÉTAPE 1 : Définir sa destination */}
          {currentStep === 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-250">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
                  <MapPin className="w-6 h-6 text-amber-400 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {t.onboardingStep1Title}
                  </h3>
                  <p className="text-xs text-amber-400/90 font-medium">
                    {t.onboardingStep1Subtitle}
                  </p>
                </div>
              </div>

              {/* Aperçu visuel immersif étape 1 */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-700/70 text-xs text-slate-300">
                  <Search className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold text-white">Gare de Lyon, Paris</span>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    Plus proche · 350 m
                  </span>
                </div>

                <div className="relative h-28 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
                  {/* Trame de carte stylisée */}
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div className="relative flex items-center justify-center">
                      <span className="animate-ping absolute h-8 w-8 rounded-full bg-rose-500 opacity-60" />
                      <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-950/50 border-2 border-white">
                        <MapPin className="w-4 h-4 fill-white" />
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-200 bg-slate-900/90 px-2 py-0.5 rounded-full border border-slate-700">
                      Arrêt d'arrivée défini
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {t.onboardingStep1Desc}
              </p>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200 leading-relaxed">
                  {t.onboardingStep1Tip}
                </p>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : Choisir le rayon d'alerte */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-250">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10 shrink-0">
                  <Sliders className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {t.onboardingStep2Title}
                  </h3>
                  <p className="text-xs text-blue-400 font-medium">
                    {t.onboardingStep2Subtitle}
                  </p>
                </div>
              </div>

              {/* Sélecteur interactif de test de rayon */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold">Essayez un rayon d'alarme :</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {demoRadius} mètres
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[100, 200, 500, 1000].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setDemoRadius(r)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer ${
                        demoRadius === r
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 scale-[1.02]'
                          : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                      }`}
                    >
                      {r >= 1000 ? `${r / 1000} km` : `${r} m`}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span>Recommandé :</span>
                  <span className="text-slate-200 font-medium">
                    {demoRadius <= 200
                      ? 'Bus urbain & tramway'
                      : demoRadius <= 500
                      ? 'Métro & arrêts réguliers'
                      : 'Train régional & RER'}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {t.onboardingStep2Desc}
              </p>

              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-200 leading-relaxed">
                  {t.onboardingStep2Tip}
                </p>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : Démarrer la surveillance GPS */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-250">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10 shrink-0">
                  <Play className="w-6 h-6 fill-emerald-400 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {t.onboardingStep3Title}
                  </h3>
                  <p className="text-xs text-emerald-400 font-medium">
                    {t.onboardingStep3Subtitle}
                  </p>
                </div>
              </div>

              {/* Aperçu visuel de la barre de trajet active */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">Suivi GPS actif</div>
                      <div className="text-[10px] text-emerald-400 font-mono">1.2 km restants · ETA 3 min</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-rose-600/90 text-white font-bold text-[11px] shadow-sm">
                    Arrêter
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <Navigation className="w-2.5 h-2.5 text-rose-400" />
                      <span>Distance</span>
                    </div>
                    <div className="font-mono font-bold text-sm text-white">1.2 km</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <Gauge className="w-2.5 h-2.5 text-blue-400" />
                      <span>Vitesse</span>
                    </div>
                    <div className="font-mono font-bold text-sm text-slate-200">42 km/h</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-400" />
                      <span>ETA</span>
                    </div>
                    <div className="font-mono font-bold text-sm text-amber-300">3 min</div>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {t.onboardingStep3Desc}
              </p>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-200 leading-relaxed">
                  {t.onboardingStep3Tip}
                </p>
              </div>
            </div>
          )}

          {/* ÉTAPE 4 : Sommeil & Poche en toute sérénité */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-250">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
                  <Bell className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {t.onboardingStep4Title}
                  </h3>
                  <p className="text-xs text-amber-400 font-medium">
                    {t.onboardingStep4Subtitle}
                  </p>
                </div>
              </div>

              {/* Visuel sommeil & poche */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700/80 text-amber-400 flex flex-col items-center justify-center shadow-inner shrink-0">
                  <Lock className="w-5 h-5 text-amber-400 mb-0.5" />
                  <span className="text-[9px] font-bold text-slate-300">Écran OFF</span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Alarme sonore & vibration actives</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Vous pouvez vous assoupir : l'alarme vous avertira automatiquement avant l'arrêt sans avoir à regarder votre écran.
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {t.onboardingStep4Desc}
              </p>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200 leading-relaxed">
                  {t.onboardingStep4Tip}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pied de page avec pagination et boutons d'action */}
        <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-950/70 flex items-center justify-between gap-3 shrink-0">
          {/* Bouton Précédent ou vide */}
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.onboardingPrev}</span>
            </button>
          ) : (
            <div className="w-16" />
          )}

          {/* Points indicateurs d'étape */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                aria-label={`Aller à l'étape ${idx + 1}`}
                className={`transition-all cursor-pointer rounded-full ${
                  currentStep === idx
                    ? 'w-6 h-2 bg-amber-400'
                    : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          {/* Bouton Suivant ou Terminer */}
          {currentStep < totalSteps - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <span>{t.onboardingNext}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>{t.onboardingFinish}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
