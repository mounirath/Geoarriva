// Intercepte toutes les erreurs fatales qui provoquent l'écran noir
window.onerror = function (message, source, lineno, colno, error) {
  const errorBox = document.createElement('div');
  errorBox.style.position = 'fixed';
  errorBox.style.top = '0';
  errorBox.style.left = '0';
  errorBox.style.width = '100vw';
  errorBox.style.height = '100vh';
  errorBox.style.backgroundColor = '#111';
  errorBox.style.color = '#ff4444';
  errorBox.style.padding = '20px';
  errorBox.style.zIndex = '999999';
  errorBox.style.overflow = 'auto';
  errorBox.style.fontFamily = 'monospace';
  errorBox.style.fontSize = '13px';
  
  errorBox.innerHTML = `
    <h2 style="color:white; margin-bottom:10px;">🚨 Erreur de l'application :</h2>
    <p><b>Message :</b> ${message}</p>
    <p><b>Fichier :</b> ${source} (Ligne ${lineno}:${colno})</p>
    <p><b>Détails :</b> ${error && error.stack ? error.stack : 'Aucune trace disponible'}</p>
  `;
  document.body.appendChild(errorBox);
  return true;
};
**
 * arreva - Application d'alerte et réveil GPS pour les transports
 * Support Google Maps Platform & OpenStreetMap
 * Support Multilingue (Français, Anglais, Arabe), Agrandissement de texte & Unity Ads
 * Unity Ads Game ID : 800387003
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
  Loader2,
} from 'lucide-react';

import { unityAdsService } from './services/UnityAdsService';
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
import { useLocationManager } from './hooks/useLocationManager';
import { adMobService, ADMOB_DEFAULTS } from './services/AdMobService';
import { Language, TextSize, TRANSLATIONS } from './utils/i18n';

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyCezWw2xK5...';

const INITIAL_FAVORITES: FavoriteLocation[] = [
  { id: '1', name: 'Gare de Lyon, Paris', lat: 48.8443, lng: 2.3744 },
  { id: '2', name: 'Gare Montparnasse, Paris', lat: 48.8412, lng: 2.3205 },
  { id: '3', name: 'Aéroport CDG Terminal 2', lat: 49.0097, lng: 2.5479 },
  { id: '4', name: 'La Défense - Grande Arche', lat: 48.8924, lng: 2.2361 },
  { id: '5', name: 'Gare Saint-Lazare, Paris', lat: 48.8768, lng: 2.3252 },
];

export default function App() {
  // Initialisation de Unity Ads au chargement de l'application (Game ID : 800387003)
  useEffect(() => {
    unityAdsService.initialize('800387003', true); // true = mode test, false = production
  }, []);

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

  // Configuration AdMob / Monétisation
  const [adClientId, setAdClientId] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('transit_ad_client') ||
        (import.meta.env.VITE_ADMOB_CLIENT_ID as string) ||
        ADMOB_DEFAULTS.APP_ID
      );
    } catch {
      return ADMOB_DEFAULTS.APP_ID;
    }
  });
  const [adSlotId, setAdSlotId] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('transit_ad_slot') ||
        (import.meta.env.VITE_ADMOB_SLOT_ID as string) ||
        ADMOB_DEFAULTS.APP_OPEN_AD_UNIT_ID
      );
    } catch {
      return ADMOB_DEFAULTS.APP_OPEN_AD_UNIT_ID;
    }
  });
  const [isAdSettingsOpen, setIsAdSettingsOpen] = useState<boolean>(false);

  // Annonce à l'ouverture (App Open Ad)
  const [isAppOpenAdVisible, setIsAppOpenAdVisible] = useState<boolean>(false);

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

  // Détection du retour en premier plan pour déclencher l'annonce à l'ouverture
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (adMobService.canShowAppOpenAd()) {
          setIsAppOpenAdVisible(true);
        }
      }
    };

    const handleCordovaResume = () => {
      if (adMobService.canShowAppOpenAd()) {
        setIsAppOpenAdVisible(true);
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

  // Sauvegarde des préférences persistantes
  useEffect(() => {
    try {
      localStorage.setItem('transit_lang', lang);
    } catch {}
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem('transit_text_size', textSize);
    } catch {}
  }, [textSize]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('transit_favorites', JSON.stringify(favorites));
    } catch {}
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
    if (!isTracking || !destination || distanceToDestination === null) return;

    if (distanceToDestination <= alertRadius && !isAlarmActive) {
      setIsAlarmActive(true);
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
        setSimulatedSpeed(12.5);
      }, 1500);
      return;
    }

    startWatch(() => {});
  }, [destination, isSimulating, startWatch]);

  // Arrêter le suivi et l'alarme
  const handleStopTracking = useCallback(() => {
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
  }, [stopWatch]);

  const handleSelectDestinationFromMap = (coords: Coordinates) => {
    if (isTracking) return;
    setDestination(coords);
    setDestinationAddress(`${t.arrivalPoint} (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
  };

  const handleSelectLocation = (coords: Coordinates, label: string) => {
    if (isTracking) return;
    setDestination(coords);
    setDestinationAddress(label);
  };

  const handleClearDestination = () => {
    if (isTracking) handleStopTracking();
    setDestination(null);
    setDestinationAddress(null);
  };

  const handleAddFavorite = (name: string, coords: Coordinates) => {
    const exists = favorites.some(
      (f) => Math.abs(f.lat - coords.lat) < 0.0005 && Math.abs(f.lng - coords.lng) < 0.0005
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

  const isDestinationFavorite = destination
    ? favorites.some(
        (f) =>
          Math.abs(f.lat - destination.lat) < 0.0005 &&
          Math.abs(f.lng - destination.lng) < 0.0005
      )
    : false;

  const handleSaveAdConfig = (client: string, slot: string) => {
    setAdClientId(client);
    setAdSlotId(slot);
    try {
      localStorage.setItem('transit_ad_client', client);
      localStorage.setItem('transit_ad_slot', slot);
    } catch {}
  };

  const handleToggleSimulation = () => {
    if (isTracking) handleStopTracking();
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

  const handleSimulateStep = () => {
    if (!simulatedLocation || !destination) return;
    const newLat = simulatedLocation.lat + (destination.lat - simulatedLocation.lat) * 0.35;
    const newLng = simulatedLocation.lng + (destination.lng - simulatedLocation.lng) * 0.35;
    setSimulatedLocation({ lat: newLat, lng: newLng });
    setSimulatedSpeed(13.8);
  };

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
        <AppOpenAdModal
          isOpen={isAppOpenAdVisible}
          onClose={() => setIsAppOpenAdVisible(false)}
          t={t}
          lang={lang}
        />

        {quotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. Visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for details.
            </span>
          </div>
        )}

        <header className="absolute top-0 left-0 right-0 z-[500] h-14 px-3 sm:px-4 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 font-black">
              <Compass className="w-5 h-5 text-slate-950" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              {t.appName}
            </span>

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
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/35 hover:bg-emerald-500/20'
                  : isGpsLoading
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
              }`}
            >
              {isGpsLoading ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : isRealGps || isSimulating ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              ) : (
                <AlertTriangle className="w-2.5 h-2.5" />
              )}
              <span>{isRealGps || isSimulating ? 'GPS Actif' : isGpsLoading ? '...' : '! GPS'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="flex items-center bg-slate-800/80 rounded-xl p-0.5 border border-slate-700/60">
              {(['fr', 'en', 'ar'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all ${
                    lang === l ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {l === 'fr' ? 'FR' : l === 'en' ? 'EN' : 'عر'}
                </button>
              ))}
            </div>

            <button
              onClick={cycleTextSize}
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-200 text-xs font-semibold transition-all active:scale-95"
            >
              <Type className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-[11px] font-bold">{textSizeBadge}</span>
            </button>

            <button
              onClick={() => setMapEngine((prev) => (prev === 'google' ? 'leaflet' : 'google'))}
              type="button"
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium border transition-colors ${
                mapEngine === 'google'
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                  : 'bg-slate-800/70 text-slate-300 border-slate-700/60'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">{mapEngine === 'google' ? 'Google' : 'OSM'}</span>
            </button>

            <button
              onClick={() => setIsSoundModalOpen(true)}
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700/60 transition-colors"
            >
              <Music className="w-3.5 h-3.5 text-amber-400" />
            </button>

            <button
              onClick={() => setIsFavoritesModalOpen(true)}
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-xs text-amber-400 border border-slate-700/60 transition-colors"
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            </button>

            <button
              onClick={() => setIsAdSettingsOpen(true)}
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-xs text-amber-400 border border-slate-700/60 transition-colors"
            >
              <Megaphone className="w-3.5 h-3.5" />
            </button>
          </div>

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
          <AdBanner clientId={adClientId} slotId={adSlotId} t={t} onOpenSettings={() => setIsAdSettingsOpen(true)} />
        </div>

        {gpsNotification && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[550] pointer-events-none animate-in fade-in duration-300">
            <div className={`px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-semibold backdrop-blur-md border ${
              gpsNotification.type === 'success'
                ? 'bg-emerald-950/95 text-emerald-200 border-emerald-500/50'
                : 'bg-slate-900/95 text-amber-300 border-amber-500/40'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{gpsNotification.message}</span>
            </div>
          </div>
        )}

        {gpsError && permissionStatus !== 'denied' && (
          <div className="absolute top-36 left-4 right-4 z-[450] max-w-md mx-auto pointer-events-none">
            <div className="bg-amber-500/10 border border-amber-500/30 backdrop-blur-md rounded-2xl p-2.5 flex items-center justify-between gap-2.5 text-xs text-amber-200 shadow-lg pointer-events-auto">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] leading-tight truncate">{gpsError.message}</span>
              </div>
              <button
                onClick={() => requestLocation()}
                className="px-2 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px] shrink-0"
              >
                {t.locRetryBtn}
              </button>
            </div>
          </div>
        )}

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

        <AlertModal
          isOpen={isAlarmActive}
          distance={distanceToDestination}
          radius={alertRadius}
          destinationAddress={destinationAddress}
          onDismiss={handleStopTracking}
          t={t}
        />

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

        <AdSettingsModal
          isOpen={isAdSettingsOpen}
          onClose={() => setIsAdSettingsOpen(false)}
          clientId={adClientId}
          slotId={adSlotId}
          onSaveConfig={handleSaveAdConfig}
          onTestAppOpenAd={() => setIsAppOpenAdVisible(true)}
          t={t}
        />

        <LocationPermissionModal
          permissionStatus={permissionStatus}
          isLoading={isGpsLoading}
          error={gpsError}
          hasLocation={userLocation !== null}
          onRequestLocation={() => requestLocation()}
          t={t}
          lang={lang}
        />

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
          onCenterMap={() => {}}
          t={t}
          lang={lang}
        />
      </div>
    </APIProvider>
  );
}
