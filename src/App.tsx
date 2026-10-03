/**
 * arreva - Application d'alerte et réveil GPS pour les transports
 * Support Google Maps Platform & OpenStreetMap
 * Support Multilingue (Français, Anglais, Arabe), Agrandissement de texte & AdMob
 * AdMob Annonce à l'ouverture (App Open Ad) : ca-app-pub-1050422776945344/8752251197
 * Service LocationManager : Forçage de la demande de localisation GPS native au démarrage
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Compass,
  AlertTriangle,
  Music,
  Star,
  Map as MapIcon,
  Type,
  Megaphone,
  Locate,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Coordinates, calculateHaversineDistance } from './utils/geo';
import { alertSystem, SoundType, SOUND_OPTIONS } from './utils/audioAlert';
import { GoogleMapComponent } from './components/GoogleMapComponent';
import { MapComponent as LeafletMapComponent } from './components/MapComponent';
import { SearchBar } from './components/SearchBar';
import { TrackingHUD } from './components/TrackingHUD';
import { AlertModal } from './components/AlertModal';
import { SoundSettingsModal } from './components/SoundSettingsModal';
import { FavoritesModal, FavoriteLocation } from './components/FavoritesModal';
import { AdBanner } from './components/AdBanner';
import { AdSettingsModal } from './components/AdSettingsModal';
import { AppOpenAdModal } from './components/AppOpenAdModal';
import { LocationPermissionModal } from './components/LocationPermissionModal';
import { GpsDetailsModal } from './components/GpsDetailsModal';
import { AppLogo } from './components/AppLogo';
import { NavigationDrawer } from './components/NavigationDrawer';
import { useLocationManager } from './hooks/useLocationManager';
import { unityAdsService, UNITY_DEFAULTS } from './services/UnityAdsService';
import { Language, TextSize, TRANSLATIONS } from './utils/i18n';

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyCq2wtmRNcXOYuV0sFCtn0SavzvLi4nlAU';

const INITIAL_FAVORITES: FavoriteLocation[] = [
  { id: '1', name: 'Gare de Lyon, Paris', lat: 48.8443, lng: 2.3744 },
  { id: '2', name: 'Gare Montparnasse, Paris', lat: 48.8412, lng: 2.3205 },
  { id: '3', name: 'Aéroport CDG Terminal 2', lat: 49.0097, lng: 2.5479 },
  { id: '4', name: 'La Défense - Grande Arche', lat: 48.8924, lng: 2.2361 },
  { id: '5', name: 'Gare Saint-Lazare, Paris', lat: 48.8768, lng: 2.3252 },
];

export default function App() {
  // Service et Hook centralisé de localisation GPS native
  const {
    location: userLocation,
    accuracy: userAccuracy,
    speed: currentSpeed,
    permissionStatus,
    isLoading: isGpsLoading,
    error: gpsError,
    isRealGps,
    requestLocation,
    startWatch,
    stopWatch,
  } = useLocationManager();

  // Langue et Direction
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('transit_lang');
      return (saved as Language) || 'fr';
    } catch {
      return 'fr';
    }
  });

  // Agrandissement de caractère (Accessibilité)
  const [textSize, setTextSize] = useState<TextSize>(() => {
    try {
      const saved = localStorage.getItem('transit_text_size');
      return (saved as TextSize) || 'normal';
    } catch {
      return 'normal';
    }
  });

  // Traduction courante
  const t = TRANSLATIONS[lang];

  // Moteur de carte : 'google' par défaut
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet'>('google');
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);

  // Configuration Unity Ads / Monétisation
  const [unityGameId, setUnityGameId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('unity_ads_config');
      if (saved) return JSON.parse(saved).gameId || UNITY_DEFAULTS.GAME_ID;
      return (import.meta.env.VITE_UNITY_GAME_ID as string) || UNITY_DEFAULTS.GAME_ID;
    } catch {
      return UNITY_DEFAULTS.GAME_ID;
    }
  });
  const [unityBannerPlacement, setUnityBannerPlacement] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('unity_ads_config');
      if (saved) return JSON.parse(saved).banner || UNITY_DEFAULTS.BANNER_PLACEMENT;
      return (import.meta.env.VITE_UNITY_BANNER_PLACEMENT as string) || UNITY_DEFAULTS.BANNER_PLACEMENT;
    } catch {
      return UNITY_DEFAULTS.BANNER_PLACEMENT;
    }
  });
  const [unityInterstitialPlacement, setUnityInterstitialPlacement] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('unity_ads_config');
      if (saved) return JSON.parse(saved).interstitial || UNITY_DEFAULTS.INTERSTITIAL_PLACEMENT;
      return (import.meta.env.VITE_UNITY_INTERSTITIAL_PLACEMENT as string) || UNITY_DEFAULTS.INTERSTITIAL_PLACEMENT;
    } catch {
      return UNITY_DEFAULTS.INTERSTITIAL_PLACEMENT;
    }
  });
  const [isAdSettingsOpen, setIsAdSettingsOpen] = useState<boolean>(false);

  // Annonce Interstitielle Unity Ads : déclenchée lors de la reprise, test ou notification
  const [isAppOpenAdVisible, setIsAppOpenAdVisible] = useState<boolean>(false);

  // Écoute des déclenchements d'interstitiels Unity Ads
  useEffect(() => {
    const unsub = unityAdsService.onTriggerInterstitial(() => {
      setIsAppOpenAdVisible(true);
    });
    return unsub;
  }, []);

  // États de destination et alerte
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [destinationAddress, setDestinationAddress] = useState<string | null>(null);
  const [alertRadius, setAlertRadius] = useState<number>(500); // 500m par défaut
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [isAlarmActive, setIsAlarmActive] = useState<boolean>(false);

  // Personnalisation des sons / sonneries d'alarme
  const [selectedSound, setSelectedSound] = useState<SoundType>('station_chime');
  const [volume, setVolume] = useState<number>(0.8);
  const [isSoundModalOpen, setIsSoundModalOpen] = useState<boolean>(false);

  // Favoris / Arrêts enregistrés
  const [favorites, setFavorites] = useState<FavoriteLocation[]>(() => {
    try {
      const saved = localStorage.getItem('transit_favorites');
      return saved ? JSON.parse(saved) : INITIAL_FAVORITES;
    } catch {
      return INITIAL_FAVORITES;
    }
  });
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState<boolean>(false);
  const [isGpsDetailsOpen, setIsGpsDetailsOpen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);
  const [gpsNotification, setGpsNotification] = useState<{ message: string; type: 'loading' | 'success' } | null>(null);

  // Mode simulation pour démonstration et tests
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulatedLocation, setSimulatedLocation] = useState<Coordinates | null>(null);
  const [simulatedSpeed, setSimulatedSpeed] = useState<number | null>(null);
  const simulationIntervalRef = useRef<number | null>(null);

  // Forcer la demande et le centrage GPS dès le démarrage de l'application
  useEffect(() => {
    requestLocation().catch(() => {});
  }, [requestLocation]);

  // Toast de confirmation dès la détection de la position
  useEffect(() => {
    if (userLocation && !isSimulating) {
      const precision = userAccuracy ? ` (±${Math.round(userAccuracy)}m)` : '';
      const msg =
        lang === 'ar'
          ? `تم تحديد موقعك بدقة${precision}`
          : lang === 'en'
          ? `GPS Position Acquired${precision}`
          : `Position GPS détectée${precision}`;

      setGpsNotification({ message: msg, type: 'success' });
      const timer = setTimeout(() => setGpsNotification(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [userLocation, userAccuracy, lang, isSimulating]);

  // Détection du retour en premier plan pour déclencher l'interstitiel Unity Ads si cooldown dépassé
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (unityAdsService.canShowInterstitial()) {
          unityAdsService.showInterstitial();
        }
      }
    };

    const handleCordovaResume = () => {
      if (unityAdsService.canShowInterstitial()) {
        unityAdsService.showInterstitial();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('resume', handleCordovaResume);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('resume', handleCordovaResume);
    };
  }, []);

  // Position effective utilisée pour le calcul de distance (réelle ou simulée)
  const effectiveLocation = isSimulating ? simulatedLocation : userLocation;
  const effectiveSpeed = isSimulating ? simulatedSpeed : currentSpeed;

  // Sauvegarde des préférences
  useEffect(() => {
    try {
      localStorage.setItem('transit_lang', lang);
    } catch (e) {
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem('transit_text_size', textSize);
    } catch (e) {
      // ignore
    }
  }, [textSize]);

  // Synchronisation document HTML pour direction RTL en Arabe
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Détection du quota Google Maps Platform
  useEffect(() => {
    const handleQuotaExceeded = () => {
      setQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // Sauvegarde des favoris
  useEffect(() => {
    try {
      localStorage.setItem('transit_favorites', JSON.stringify(favorites));
    } catch (e) {
      // ignore
    }
  }, [favorites]);

  // Calcul en direct de la distance entre l'utilisateur et la destination
  const distanceToDestination =
    effectiveLocation && destination
      ? calculateHaversineDistance(
          effectiveLocation.lat,
          effectiveLocation.lng,
          destination.lat,
          destination.lng
        )
      : null;

  // Surveillance du franchissement du rayon d'alerte
  useEffect(() => {
    if (!isTracking || !destination || distanceToDestination === null) {
      return;
    }

    if (distanceToDestination <= alertRadius) {
      if (!isAlarmActive) {
        setIsAlarmActive(true);
      }
    }
  }, [isTracking, distanceToDestination, alertRadius, isAlarmActive, destination]);

  // Démarrer le suivi réel du trajet
  const handleStartTracking = useCallback(async () => {
    if (!destination) return;

    alertSystem.ensureAudioContext();
    await alertSystem.requestWakeLock();

    setIsTracking(true);

    if (isSimulating) {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = window.setInterval(() => {
        setSimulatedLocation((current) => {
          if (!current || !destination) return current;
          const newLat = current.lat + (destination.lat - current.lat) * 0.12;
          const newLng = current.lng + (destination.lng - current.lng) * 0.12;
          return { lat: newLat, lng: newLng };
        });
        setSimulatedSpeed(12.5); // ~45 km/h
      }, 1500);
      return;
    }

    // Suivi GPS natif en continu via LocationManager
    startWatch(() => {
      // Le state est mis à jour automatiquement par useLocationManager
    });
  }, [destination, isSimulating, startWatch]);

  // Arrêter le suivi et l'alarme
  const handleStopTracking = useCallback(() => {
    const wasAlarming = isAlarmActive;
    setIsTracking(false);
    setIsAlarmActive(false);
    alertSystem.stopAlarm();
    alertSystem.releaseWakeLock();

    stopWatch();

    if (simulationIntervalRef.current !== null) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }

    setSimulatedSpeed(null);

    // Déclencher l'interstitiel Unity Ads de fin de trajet à l'arrivée
    if (wasAlarming) {
      setTimeout(() => {
        unityAdsService.showInterstitial();
      }, 600);
    }
  }, [stopWatch, isAlarmActive]);

  // Définir la destination depuis la carte
  const handleSelectDestinationFromMap = (coords: Coordinates) => {
    if (isTracking) return;
    setDestination(coords);
    setDestinationAddress(`${t.arrivalPoint} (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
  };

  // Définir la destination depuis la recherche ou un favori
  const handleSelectLocation = (coords: Coordinates, label: string) => {
    if (isTracking) return;
    setDestination(coords);
    setDestinationAddress(label);
  };

  // Effacer la destination
  const handleClearDestination = () => {
    if (isTracking) handleStopTracking();
    setDestination(null);
    setDestinationAddress(null);
  };

  // Gestion des favoris
  const handleAddFavorite = (name: string, coords: Coordinates) => {
    const exists = favorites.some(
      (f) =>
        Math.abs(f.lat - coords.lat) < 0.0005 && Math.abs(f.lng - coords.lng) < 0.0005
    );
    if (exists) return;

    const newFav: FavoriteLocation = {
      id: Date.now().toString(),
      name,
      lat: coords.lat,
      lng: coords.lng,
    };
    setFavorites((prev) => [newFav, ...prev]);
  };

  const handleDeleteFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  // Vérifier si la destination actuelle est déjà en favori
  const isDestinationFavorite = destination
    ? favorites.some(
        (f) =>
          Math.abs(f.lat - destination.lat) < 0.0005 &&
          Math.abs(f.lng - destination.lng) < 0.0005
      )
    : false;

  // Sauvegarde config Unity Ads
  const handleSaveUnityConfig = (
    gameId: string,
    banner: string,
    interstitial: string,
    testMode: boolean = true
  ) => {
    setUnityGameId(gameId);
    setUnityBannerPlacement(banner);
    setUnityInterstitialPlacement(interstitial);
    unityAdsService.updateConfig(gameId, banner, interstitial, testMode);
  };

  // Basculer le mode simulation
  const handleToggleSimulation = () => {
    if (isTracking) {
      handleStopTracking();
    }
    const nextState = !isSimulating;
    setIsSimulating(nextState);

    if (nextState) {
      const start: Coordinates = { lat: 48.8566, lng: 2.3522 };
      const dest: Coordinates = { lat: 48.8738, lng: 2.2950 };
      setSimulatedLocation(start);
      setDestination(dest);
      setDestinationAddress(
        lang === 'ar'
          ? 'قوس النصر (تجربة محاكاة)'
          : lang === 'en'
          ? 'Arc de Triomphe (Demo Simulation)'
          : 'Arc de Triomphe (Démo Simulation)'
      );
      setAlertRadius(800);
    } else {
      setSimulatedLocation(null);
    }
  };

  // Avancer manuellement d'un pas vers l'arrivée (Test)
  const handleSimulateStep = () => {
    if (!simulatedLocation || !destination) return;
    const newLat = simulatedLocation.lat + (destination.lat - simulatedLocation.lat) * 0.35;
    const newLng = simulatedLocation.lng + (destination.lng - simulatedLocation.lng) * 0.35;
    setSimulatedLocation({ lat: newLat, lng: newLng });
    setSimulatedSpeed(13.8); // 50 km/h
  };

  // Bascule cyclique de la taille du texte (Normal -> Grand -> Très Grand)
  const cycleTextSize = () => {
    setTextSize((prev) => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'xlarge';
      return 'normal';
    });
  };

  const textSizeBadge = textSize === 'normal' ? 'A' : textSize === 'large' ? 'A+' : 'A++';
  const textSizeLabel =
    textSize === 'normal' ? t.normalText : textSize === 'large' ? t.largeText : t.xlargeText;

  const currentSoundName =
    SOUND_OPTIONS.find((s) => s.id === selectedSound)?.name || 'Carillon';

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      stopWatch();
      if (simulationIntervalRef.current !== null) {
        clearInterval(simulationIntervalRef.current);
      }
      alertSystem.stopAlarm();
      alertSystem.releaseWakeLock();
    };
  }, [stopWatch]);

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language={lang}>
      <div
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        className={`relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col font-sans select-none text-scale-${textSize}`}
      >
        {/* Annonce Interstitielle Unity Ads */}
        <AppOpenAdModal
          isOpen={isAppOpenAdVisible}
          onClose={() => setIsAppOpenAdVisible(false)}
          gameId={unityGameId}
          placementId={unityInterstitialPlacement}
          t={t}
          lang={lang}
        />

        {/* Bannière de quota Google Maps Platform si dépassé */}
        {quotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}

        {/* Top Bar épurée (1 row, 3 zones) */}
        <header className="absolute top-0 left-0 right-0 z-[500] h-14 px-3 sm:px-4 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between pointer-events-auto">
          {/* Zone 1: Hamburger Menu, Marque & Indicateur d'état GPS réel */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Bouton Hamburger accessible avec 3 lignes empilées */}
            <button
              ref={hamburgerButtonRef}
              type="button"
              aria-expanded={isDrawerOpen}
              aria-controls="navigation-drawer"
              aria-label={isDrawerOpen ? t.closeMenu : t.openMenu}
              onClick={() => setIsDrawerOpen((prev) => !prev)}
              className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-800 border border-slate-700/70 text-slate-200 hover:text-white flex items-center justify-center transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {/* Trois lignes empilées (hamburger) animées */}
              <div className="w-5 h-3.5 flex flex-col justify-between" aria-hidden="true">
                <span
                  className={`h-0.5 w-full bg-current rounded-full transition-all duration-300 origin-left ${
                    isDrawerOpen ? 'rotate-45 translate-x-0.5 -translate-y-0.5' : ''
                  }`}
                />
                <span
                  className={`h-0.5 w-full bg-current rounded-full transition-opacity duration-200 ${
                    isDrawerOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`h-0.5 w-full bg-current rounded-full transition-all duration-300 origin-left ${
                    isDrawerOpen ? '-rotate-45 translate-x-0.5 translate-y-0.5' : ''
                  }`}
                />
              </div>
            </button>

            <AppLogo className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl shadow-lg shadow-amber-500/25 shrink-0 hover:scale-105 transition-transform" />
            <span className="text-base font-bold tracking-tight text-white hidden xs:inline sm:inline">
              {t.appName}
            </span>

            {/* Pastille d'état GPS natif cliquable pour voir les détails */}
            <button
              onClick={() => {
                if (userLocation || isSimulating) {
                  setIsGpsDetailsOpen(true);
                } else {
                  requestLocation().then(() => setIsGpsDetailsOpen(true)).catch(() => {});
                }
              }}
              type="button"
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                isRealGps || isSimulating
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : isGpsLoading
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
              }`}
              title="Afficher les détails de ma position GPS"
            >
              {isGpsLoading ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : isRealGps || isSimulating ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              ) : (
                <AlertTriangle className="w-2.5 h-2.5" />
              )}
              <span>
                {isRealGps || isSimulating ? 'GPS Actif' : isGpsLoading ? '...' : '! GPS'}
              </span>
            </button>
          </div>

          {/* Zone 2: Contrôles rapides */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Sélecteur de Langue (FR / EN / AR) */}
            <div className="flex items-center bg-slate-800/80 rounded-xl p-0.5 border border-slate-700/60">
              {(['fr', 'en', 'ar'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all ${
                    lang === l
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={l.toUpperCase()}
                >
                  {l === 'fr' ? 'FR' : l === 'en' ? 'EN' : 'عر'}
                </button>
              ))}
            </div>

            {/* Bouton Agrandissement de texte */}
            <button
              onClick={cycleTextSize}
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-200 text-xs font-semibold transition-all active:scale-95"
              title={`${t.textSize}: ${textSizeLabel}`}
            >
              <Type className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-[11px] font-bold">{textSizeBadge}</span>
            </button>

            {/* Bascule moteur Google Maps / OSM */}
            <button
              onClick={() =>
                setMapEngine((prev) => (prev === 'google' ? 'leaflet' : 'google'))
              }
              type="button"
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium border transition-colors ${
                mapEngine === 'google'
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                  : 'bg-slate-800/70 text-slate-300 border-slate-700/60'
              }`}
              title={mapEngine === 'google' ? t.googleMaps : t.osm}
            >
              <MapIcon className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">{mapEngine === 'google' ? 'Google' : 'OSM'}</span>
            </button>

            {/* Bouton Sonneries */}
            <button
              onClick={() => setIsSoundModalOpen(true)}
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-xs text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              title={t.ringtones}
            >
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">{t.ringtones}</span>
            </button>

            {/* Bouton Favoris */}
            <button
              onClick={() => setIsFavoritesModalOpen(true)}
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-xs text-amber-400 hover:text-amber-300 border border-slate-700/60 transition-colors"
              title={t.favorites}
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
              <span className="hidden lg:inline">{t.favorites}</span>
            </button>

            {/* Bouton Paramètres AdMob */}
            <button
              onClick={() => setIsAdSettingsOpen(true)}
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-xs text-amber-400 hover:text-amber-300 border border-slate-700/60 transition-colors"
              title={t.admobTitle}
            >
              <Megaphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zone 3: Action rapide / réinitialisation */}
          <div className="flex items-center gap-1.5">
            {destination && !isTracking && (
              <button
                onClick={handleClearDestination}
                type="button"
                className="text-xs font-medium text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                {t.clear}
              </button>
            )}

            {isSimulating && (
              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                {t.demoBadge}
              </span>
            )}
          </div>
        </header>

        {/* Barre de recherche d'adresse / arrêts & Ajout rapide en favoris */}
        <div className="absolute top-14 left-0 right-0 z-[500] pointer-events-auto">
          <SearchBar
            onSelectLocation={handleSelectLocation}
            destinationAddress={destinationAddress}
            destinationCoords={destination}
            onClearDestination={handleClearDestination}
            onAddFavorite={handleAddFavorite}
            isDestinationFavorite={isDestinationFavorite}
            t={t}
            lang={lang}
          />

          {/* Bannière Mobile Unity Ads */}
          <AdBanner
            gameId={unityGameId}
            placementId={unityBannerPlacement}
            t={t}
            onOpenSettings={() => setIsAdSettingsOpen(true)}
            onShowInterstitial={() => unityAdsService.showInterstitial(true)}
          />
        </div>

        {/* Toast de confirmation de position GPS au démarrage */}
        {gpsNotification && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[550] pointer-events-none animate-in fade-in slide-in-from-top-3 duration-300">
            <div className={`px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-semibold backdrop-blur-md border ${
              gpsNotification.type === 'success'
                ? 'bg-emerald-950/95 text-emerald-200 border-emerald-500/50'
                : 'bg-slate-900/95 text-amber-300 border-amber-500/40'
            }`}>
              {gpsNotification.type === 'success' ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              ) : (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              )}
              <span>{gpsNotification.message}</span>
            </div>
          </div>
        )}

        {/* Notification discrète d'erreur GPS uniquement si aucune position n'est disponible */}
        {gpsError && !userLocation && permissionStatus !== 'denied' && (
          <div className="absolute top-28 left-3 right-3 sm:left-4 sm:right-4 z-[450] max-w-md mx-auto pointer-events-none">
            <div className="bg-slate-900/95 border border-amber-500/50 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-amber-200 shadow-2xl pointer-events-auto animate-in slide-in-from-top-2">
              <div className="flex items-start gap-2.5 min-w-0">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-white leading-tight">
                    Connexion GPS
                  </span>
                  <span className="text-[11px] text-amber-200/90 leading-normal mt-0.5">
                    {gpsError.message}
                  </span>
                </div>
              </div>
              <button
                onClick={() => requestLocation()}
                disabled={isGpsLoading}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-transform"
              >
                {isGpsLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>{t.locRetryBtn}</span>
              </button>
            </div>
          </div>
        )}

        {/* Carte interactive pleine page (Google Maps ou Leaflet) */}
        <main className="flex-1 w-full h-full relative">
          {mapEngine === 'google' ? (
            <GoogleMapComponent
              userLocation={effectiveLocation}
              userAccuracy={isSimulating ? 10 : userAccuracy}
              destination={destination}
              destinationAddress={destinationAddress}
              onSelectDestination={handleSelectDestinationFromMap}
              alertRadius={alertRadius}
              isTracking={isTracking}
              distanceToDestination={distanceToDestination}
              t={t}
              onOpenGpsDetails={() => setIsGpsDetailsOpen(true)}
            />
          ) : (
            <LeafletMapComponent
              userLocation={effectiveLocation}
              userAccuracy={isSimulating ? 10 : userAccuracy}
              destination={destination}
              destinationAddress={destinationAddress}
              onSelectDestination={handleSelectDestinationFromMap}
              alertRadius={alertRadius}
              isTracking={isTracking}
              distanceToDestination={distanceToDestination}
              t={t}
              onOpenGpsDetails={() => setIsGpsDetailsOpen(true)}
            />
          )}
        </main>

        {/* Panneau de contrôle bas (HUD Ergonomique pouce mobile) */}
        <TrackingHUD
          isTracking={isTracking}
          distance={distanceToDestination}
          radius={alertRadius}
          currentSpeed={effectiveSpeed}
          destinationSet={destination !== null}
          destinationAddress={destinationAddress}
          onStartTracking={handleStartTracking}
          onStopTracking={handleStopTracking}
          onChangeRadius={setAlertRadius}
          isSimulating={isSimulating}
          onToggleSimulation={handleToggleSimulation}
          onSimulateStep={handleSimulateStep}
          onOpenSoundSettings={() => setIsSoundModalOpen(true)}
          selectedSoundName={currentSoundName}
          onOpenFavorites={() => setIsFavoritesModalOpen(true)}
          t={t}
        />

        {/* Modal / Bannière d'alerte urgente au franchissement du rayon */}
        <AlertModal
          isOpen={isAlarmActive}
          distance={distanceToDestination}
          radius={alertRadius}
          destinationAddress={destinationAddress}
          onDismiss={handleStopTracking}
          t={t}
        />

        {/* Modal des réglages de sonneries */}
        <SoundSettingsModal
          isOpen={isSoundModalOpen}
          onClose={() => setIsSoundModalOpen(false)}
          selectedSound={selectedSound}
          onSelectSound={setSelectedSound}
          volume={volume}
          onChangeVolume={setVolume}
          t={t}
          lang={lang}
        />

        {/* Modal des arrêts et trajets favoris avec recherche et ajout directs */}
        <FavoritesModal
          isOpen={isFavoritesModalOpen}
          onClose={() => setIsFavoritesModalOpen(false)}
          favorites={favorites}
          onSelectFavorite={handleSelectLocation}
          onAddFavorite={handleAddFavorite}
          onDeleteFavorite={handleDeleteFavorite}
          currentDestination={destination}
          currentDestinationName={destinationAddress}
          t={t}
        />

        {/* Modal de configuration Unity Ads */}
        <AdSettingsModal
          isOpen={isAdSettingsOpen}
          onClose={() => setIsAdSettingsOpen(false)}
          gameId={unityGameId}
          bannerPlacement={unityBannerPlacement}
          interstitialPlacement={unityInterstitialPlacement}
          onSaveConfig={handleSaveUnityConfig}
          onTestInterstitial={() => unityAdsService.showInterstitial(true)}
          t={t}
        />

        {/* Modal / Interface obligatoire de demande et déblocage de géolocalisation native */}
        <LocationPermissionModal
          permissionStatus={permissionStatus}
          isLoading={isGpsLoading}
          error={gpsError}
          hasLocation={userLocation !== null}
          onRequestLocation={() => requestLocation()}
          t={t}
          lang={lang}
        />

        {/* Modal détaillée d'affichage et partage de la position GPS */}
        <GpsDetailsModal
          isOpen={isGpsDetailsOpen}
          onClose={() => setIsGpsDetailsOpen(false)}
          location={effectiveLocation}
          accuracy={isSimulating ? 10 : userAccuracy}
          speed={effectiveSpeed}
          timestamp={Date.now()}
          isRealGps={isRealGps || isSimulating}
          isLoading={isGpsLoading}
          onRequestLocation={() => requestLocation()}
          onCenterMap={() => {
            // Déclenché depuis la modal
          }}
          t={t}
          lang={lang}
        />

        {/* Navigation Drawer (tiroir off-canvas coulissant depuis la gauche avec scrim) */}
        <NavigationDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          triggerRef={hamburgerButtonRef}
          t={t}
          lang={lang}
          onSelectLang={setLang}
          textSize={textSize}
          onCycleTextSize={cycleTextSize}
          textSizeLabel={textSizeLabel}
          textSizeBadge={textSizeBadge}
          mapEngine={mapEngine}
          onToggleMapEngine={() =>
            setMapEngine((prev) => (prev === 'google' ? 'leaflet' : 'google'))
          }
          onOpenSoundModal={() => setIsSoundModalOpen(true)}
          onOpenFavoritesModal={() => setIsFavoritesModalOpen(true)}
          onOpenGpsDetails={() => setIsGpsDetailsOpen(true)}
          onOpenAdSettings={() => setIsAdSettingsOpen(true)}
          isRealGps={isRealGps}
          isGpsLoading={isGpsLoading}
          isSimulating={isSimulating}
          onToggleSimulation={() => setIsSimulating((prev) => !prev)}
        />
      </div>
    </APIProvider>
  );
}
