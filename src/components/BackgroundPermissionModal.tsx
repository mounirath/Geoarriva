import React, { useState, useEffect } from 'react';
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
  Battery,
  Bell,
  ArrowRight,
  ExternalLink,
  Flame,
  Volume2,
  Zap,
  Lock,
  Layers,
  Info,
} from 'lucide-react';
import { Translations, Language } from '../utils/i18n';
import { PermissionState, locationManager } from '../services/LocationManager';
import { alertSystem } from '../utils/audioAlert';

interface BackgroundPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissionStatus: PermissionState;
  hasLocation: boolean;
  hasBackgroundPermission: boolean;
  accuracy?: number | null;
  onRequestForegroundLocation: () => void;
  onRequestBackgroundLocation: () => Promise<boolean>;
  onOpenSettings: () => void;
  onOpenBatterySettings?: () => void;
  t: Translations;
  lang: Language;
}

type TabType = 'status' | 'brands' | 'test';
type BrandType = 'samsung' | 'xiaomi' | 'huawei' | 'pixel' | 'oppo' | 'apple';

const BRAND_GUIDES: Record<
  BrandType,
  { name: string; tag: string; steps: string[]; warning: string }
> = {
  samsung: {
    name: 'Samsung (One UI)',
    tag: 'Galaxy S, A, Note, Z',
    steps: [
      'Ouvrez les Paramètres Android de votre téléphone.',
      'Allez dans « Applications » > cherchez et sélectionnez « arreva ».',
      'Appuyez sur « Batterie » > cochez « Non restreinte ».',
      'Dans Paramètres > « Entretien de l’appareil » > « Batterie » > « Limites d’utilisation en arrière-plan » : vérifiez que l’app n’est PAS dans « Applications en veille profonde ».',
      'Dans « Autorisations » > « Localisation », sélectionnez « Toujours autoriser ».',
    ],
    warning:
      'One UI met agressivement en veille les applications après quelques minutes d’écran éteint si elles ne sont pas exemptées.',
  },
  xiaomi: {
    name: 'Xiaomi / Redmi / POCO (MIUI / HyperOS)',
    tag: 'MIUI & HyperOS',
    steps: [
      'Allez dans Paramètres > « Applications » > « Gérer les applications » > « arreva ».',
      'Activez impérativement l’option « Démarrage automatique » (Autostart).',
      'Faites défiler vers le bas jusqu’à « Économiseur de batterie » et choisissez « Pas de restrictions ».',
      'Dans « Autorisations » > « Localisation », cochez « Toujours autoriser ».',
      'Dans le gestionnaire multitâche, vous pouvez également verrouiller arreva avec l’icône de cadenas.',
    ],
    warning:
      'L’économiseur MIUI coupe le GPS en arrière-plan par défaut pour économiser de l’énergie.',
  },
  huawei: {
    name: 'Huawei / Honor (EMUI / MagicOS)',
    tag: 'EMUI & MagicOS',
    steps: [
      'Allez dans Paramètres > « Batterie » > « Lancement d’application ».',
      'Cherchez « arreva » et désactivez « Gestion automatique ».',
      'Dans la fenêtre qui apparaît, activez les 3 options : « Lancement automatique », « Lancement secondaire » et « Exécution en arrière-plan ».',
      'Dans Paramètres > « Applications » > « arreva » > « Autorisations », accordez la localisation permanente.',
    ],
    warning:
      'Huawei ferme systématiquement les applications d’arrière-plan sans ces 3 coches manuelles.',
  },
  pixel: {
    name: 'Google Pixel / Motorola (Android pur)',
    tag: 'Pixel & Android Stock',
    steps: [
      'Allez dans Paramètres > « Applications » > « arreva ».',
      'Appuyez sur « Utilisation de la batterie de l’application ».',
      'Choisissez « Non restreinte » (au lieu de Optimisée).',
      'Dans « Autorisations » > « Localisation », sélectionnez « Toujours autoriser ».',
    ],
    warning:
      'Le mode Doze standard d’Android réduit la fréquence des satellites GPS si la batterie est configurée en mode « Optimisée ».',
  },
  oppo: {
    name: 'Oppo / Realme / OnePlus (ColorOS / OxygenOS)',
    tag: 'ColorOS & OxygenOS',
    steps: [
      'Allez dans Paramètres > « Batterie » > « Paramètres avancés ».',
      'Sélectionnez « Optimisation de la batterie » > arreva > « Ne pas optimiser ».',
      'Allez dans « Gestion de la batterie de l’application » > arreva > activez « Autoriser l’activité en arrière-plan ».',
      'Dans Paramètres > « Applications » > « Démarrage automatique », activez arreva.',
    ],
    warning:
      'ColorOS gèle les tâches de fond si l’activité d’arrière-plan n’est pas expressément autorisée.',
  },
  apple: {
    name: 'iPhone / iOS (Safari PWA)',
    tag: 'iOS 16+',
    steps: [
      'Dans Safari, appuyez sur le bouton Partager > « Sur l’écran d’accueil » pour installer l’application.',
      'Ouvrez Réglages de l’iPhone > « Confidentialité et sécurité » > « Service de localisation » > Safari / arreva.',
      'Choisissez « Toujours » ou « Lorsque l’app est active » avec « Position exacte » activée.',
      'Désactivez le « Mode économie d’énergie » pendant vos trajets en train ou bus.',
      'Vérifiez que le commutateur Sonnerie/Silencieux de l’iPhone n’est pas en mode muet.',
    ],
    warning:
      'iOS suspend l’audio Web si le navigateur passe en arrière-plan complet sauf si l’écran reste allumé ou en mode PWA installée.',
  },
};

export const BackgroundPermissionModal: React.FC<BackgroundPermissionModalProps> = ({
  isOpen,
  onClose,
  permissionStatus,
  hasLocation,
  hasBackgroundPermission,
  accuracy,
  onRequestForegroundLocation,
  onRequestBackgroundLocation,
  onOpenSettings,
  onOpenBatterySettings,
  t,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('status');
  const [selectedBrand, setSelectedBrand] = useState<BrandType>('samsung');
  const [isActivatingBg, setIsActivatingBg] = useState(false);
  const [bgSuccess, setBgSuccess] = useState(hasBackgroundPermission);

  // Maintien en éveil (Wake Lock)
  const [isWakeLockOn, setIsWakeLockOn] = useState<boolean>(() =>
    locationManager.isKeepAwakeActive()
  );

  // Niveau et statut de la batterie réelle
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | null>(null);
  const [hasBatteryApi, setHasBatteryApi] = useState<boolean>(false);

  // Test alarme écran verrouillé
  const [testCountdown, setTestCountdown] = useState<number | null>(null);
  const [isTestAlarmFiring, setIsTestAlarmFiring] = useState<boolean>(false);

  // Récupération de l'état de la batterie à l'ouverture
  useEffect(() => {
    if (isOpen) {
      locationManager.getBatteryStatus().then((b) => {
        setBatteryLevel(b.level);
        setIsCharging(b.charging);
        setHasBatteryApi(b.supported);
      });
      setIsWakeLockOn(locationManager.isKeepAwakeActive());
      setBgSuccess(locationManager.getHasBackgroundPermission());
    }
  }, [isOpen]);

  // Gestion du compte à rebours pour le test écran verrouillé
  useEffect(() => {
    let timer: any = null;
    if (testCountdown !== null && testCountdown > 0) {
      timer = setTimeout(() => {
        setTestCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (testCountdown === 0) {
      // Déclenchement de l'alarme de test (son en boucle + vibrations cadencées)
      setIsTestAlarmFiring(true);
      alertSystem.startFullAlarm();
      setTestCountdown(null);
    }
    return () => clearTimeout(timer);
  }, [testCountdown]);

  if (!isOpen) return null;

  const handleToggleWakeLock = async () => {
    if (isWakeLockOn) {
      locationManager.releaseKeepAwake();
      setIsWakeLockOn(false);
    } else {
      await locationManager.enableKeepAwake();
      setIsWakeLockOn(locationManager.isKeepAwakeActive());
    }
  };

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

  const startLockTest = () => {
    // Débloque l'audio maintenant pendant le geste tactile de l'utilisateur
    alertSystem.unlockAudio();
    setIsTestAlarmFiring(false);
    setTestCountdown(5);
  };

  const stopLockTest = () => {
    setIsTestAlarmFiring(false);
    setTestCountdown(null);
    alertSystem.stopAlarm();
  };

  const isGpsActive = hasLocation && permissionStatus === 'granted';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Autorisation système GPS et arrière-plan batterie"
      className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center justify-center shadow-inner shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>GPS & Arrière-plan Batterie</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Système
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 leading-tight">
                Pour que l'alarme sonne et vibre écran éteint dans votre poche
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopLockTest();
              onClose();
            }}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barre d'onglets ergonomique */}
        <div className="grid grid-cols-3 bg-slate-950/70 p-1.5 border-b border-slate-800/80 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'status'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Statuts & GPS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('brands')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'brands'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Guides Marque</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('test')}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'test'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Test Poche (5s)</span>
          </button>
        </div>

        {/* Corps déroulant */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* ================= ONGLET 1 : STATUTS ET AUTORISATIONS ================= */}
          {activeTab === 'status' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Carte 1 : Localisation Précise Système (GPS) */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-100">
                        1. Localisation Satellite Précise
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isGpsActive && accuracy
                          ? `Précision actuelle : ± ${Math.round(accuracy)} m`
                          : 'Positionnement haute précision requise'}
                      </div>
                    </div>
                  </div>
                  {isGpsActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <AlertTriangle className="w-3 h-3" />
                      Requise
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Permet de calculer les mètres restants avant votre gare ou arrêt de bus avec le GPS natif haute précision.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-0.5">
                  {!isGpsActive ? (
                    <button
                      onClick={onRequestForegroundLocation}
                      type="button"
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Autoriser le GPS maintenant</span>
                    </button>
                  ) : (
                    <div className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span>Signal GPS actif et capté par le récepteur</span>
                    </div>
                  )}

                  <button
                    onClick={onOpenSettings}
                    type="button"
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                    title="Ouvrir les paramètres système de localisation"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Paramètres GPS Système</span>
                  </button>
                </div>
              </div>

              {/* Carte 2 : Localisation Arrière-Plan ("Toujours autoriser") */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                    <div>
                      <div className="text-xs font-bold text-slate-100">
                        2. Autorisation d'Arrière-Plan
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {bgSuccess ? 'Autorisée (ou gérée en veille)' : 'Nécessite « Toujours autoriser »'}
                      </div>
                    </div>
                  </div>
                  {bgSuccess ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      Toujours actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      À configurer
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong className="text-white">Crucial pour les trajets :</strong> sans autorisation d'arrière-plan, Android suspend la surveillance dès que vous éteignez l'écran ou mettez le téléphone dans votre poche.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-0.5">
                  <button
                    onClick={handleActivateBackground}
                    disabled={isActivatingBg}
                    type="button"
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md shadow-amber-500/20"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>{bgSuccess ? 'Réactiver le service arrière-plan' : 'Activer l’arrière-plan'}</span>
                  </button>

                  <button
                    onClick={onOpenSettings}
                    type="button"
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Réglages App Android</span>
                  </button>
                </div>
              </div>

              {/* Carte 3 : Batterie & Maintien en Éveil (Wake Lock) */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BatteryCharging className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-100">
                        3. Gestion de la Batterie & Veille
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Anti-mise en veille & exemption économiseur
                      </div>
                    </div>
                  </div>

                  {/* État réel de la batterie si disponible */}
                  {hasBatteryApi && batteryLevel !== null && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        batteryLevel < 20
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      {batteryLevel}% {isCharging ? '(En charge)' : ''}
                    </span>
                  )}
                </div>

                {/* Explication et toggle Wake Lock */}
                <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <span>Maintien en éveil (Screen Wake Lock)</span>
                      {isWakeLockOn && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Empêche l'extinction du CPU pendant le trajet en cours
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleWakeLock}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      isWakeLockOn
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {isWakeLockOn ? 'Actif' : 'Activer'}
                  </button>
                </div>

                {/* Bouton pour ouvrir les paramètres de batterie système */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (onOpenBatterySettings) {
                        onOpenBatterySettings();
                      } else {
                        onOpenSettings();
                      }
                    }}
                    type="button"
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ouvrir les Paramètres Batterie / Optimisation</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= ONGLET 2 : GUIDES PAR MARQUE ================= */}
          {activeTab === 'brands' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="text-xs text-slate-300">
                Certains fabricants Android (Samsung, Xiaomi, Huawei...) coupent agressivement les applications d'arrière-plan. Choisissez votre marque :
              </div>

              {/* Sélecteur de marque horizontal */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
                {(
                  [
                    'samsung',
                    'xiaomi',
                    'huawei',
                    'pixel',
                    'oppo',
                    'apple',
                  ] as BrandType[]
                ).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBrand(b)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all text-center ${
                      selectedBrand === b
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {b === 'samsung'
                      ? 'Samsung'
                      : b === 'xiaomi'
                      ? 'Xiaomi'
                      : b === 'huawei'
                      ? 'Huawei'
                      : b === 'pixel'
                      ? 'Google Pixel'
                      : b === 'oppo'
                      ? 'Oppo / 1+'
                      : 'iPhone'}
                  </button>
                ))}
              </div>

              {/* Fiche détaillée de la marque choisie */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      {BRAND_GUIDES[selectedBrand].name}
                    </h3>
                    <span className="text-[10px] text-amber-400 font-medium">
                      {BRAND_GUIDES[selectedBrand].tag}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Étapes recommandées
                  </span>
                </div>

                {/* Étapes numérotées */}
                <ol className="space-y-2 text-xs text-slate-300 pl-1">
                  {BRAND_GUIDES[selectedBrand].steps.map((st, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center shrink-0 font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5">{st}</span>
                    </li>
                  ))}
                </ol>

                {/* Avertissement constructeur */}
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    {BRAND_GUIDES[selectedBrand].warning}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenSettings}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
                <span>Ouvrir les Paramètres de l'Application sur ce téléphone</span>
              </button>
            </div>
          )}

          {/* ================= ONGLET 3 : TEST ALARME ÉCRAN ÉTEINT ================= */}
          {activeTab === 'test' && (
            <div className="space-y-4 animate-in fade-in duration-150 text-center">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                  <Lock className="w-6 h-6" />
                </div>

                <h3 className="text-sm font-bold text-white">
                  Test en Conditions Réelles (Écran Verrouillé & Poche)
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  Pour vérifier que votre téléphone ne bloque pas le son lorsque l'écran est éteint :
                </p>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-left text-[11px] text-slate-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <span>1.</span>
                    <span>Touchez « Lancer le test (5s) »</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <span>2.</span>
                    <span>Verrouillez immédiatement votre écran (bouton Power)</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <span>3.</span>
                    <span>Placez le téléphone dans votre poche</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <span>4.</span>
                    <span>L'alarme sonnera et vibrera au bout de 5 secondes !</span>
                  </div>
                </div>

                {/* Zone active du test */}
                {testCountdown !== null && (
                  <div className="py-4 space-y-2 animate-pulse">
                    <div className="text-4xl font-extrabold font-mono text-amber-400">
                      {testCountdown}s
                    </div>
                    <p className="text-xs font-bold text-white">
                      👉 VERROUILLEZ VOTRE ÉCRAN MAINTENANT !
                    </p>
                  </div>
                )}

                {isTestAlarmFiring && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 space-y-2 animate-bounce">
                    <div className="text-xs font-bold flex items-center justify-center gap-2">
                      <Volume2 className="w-4 h-4 text-rose-400" />
                      <span>L'alarme et les vibrations sont actives !</span>
                    </div>
                    <button
                      type="button"
                      onClick={stopLockTest}
                      className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-all"
                    >
                      Arrêter l'alarme de test
                    </button>
                  </div>
                )}

                {!isTestAlarmFiring && testCountdown === null && (
                  <button
                    type="button"
                    onClick={startLockTest}
                    className="w-full py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 fill-slate-950" />
                    <span>Lancer le test de réveil (5s)</span>
                  </button>
                )}

                {testCountdown !== null && (
                  <button
                    type="button"
                    onClick={stopLockTest}
                    className="w-full py-2 px-4 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700"
                  >
                    Annuler le compte à rebours
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pied de page */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Conforme Android 10, 11, 12, 13, 14 & 15</span>
          </div>

          <button
            onClick={() => {
              stopLockTest();
              onClose();
            }}
            type="button"
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer shrink-0"
          >
            <span>Fermer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
