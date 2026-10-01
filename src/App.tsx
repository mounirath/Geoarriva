/**
 * arreva - Application d'alerte et réveil GPS pour les transports
 * Support Google Maps Platform & OpenStreetMap
 * Support Multilingue (Français, Anglais, Arabe), Agrandissement de texte & AdMob
 */

// Coordonnées fixes de secours (Douéra, Alger)
const fixedPosition = {
  coords: {
    latitude: 36.6833, // Latitude de Douéra
    longitude: 2.9833, // Longitude de Douéra
    accuracy: 10
  },
  timestamp: Date.now()
};

// Forcer la géolocalisation de manière globale dans l'application
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition = function(successCallback) {
    successCallback(fixedPosition as GeolocationPosition);
  };
  
  navigator.geolocation.watchPosition = function(successCallback) {
    successCallback(fixedPosition as GeolocationPosition);
    return 1; 
  };
  
  console.log("Position forcée activée sur Douéra :", fixedPosition);
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Compass,
  AlertTriangle,
  Music,
  Star,
  Map as MapIcon,
  Type,
  Megaphone,
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
        ''
      );
    } catch {
      return '';
    }
  });
  const [adSlotId, setAdSlotId] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('transit_ad_slot') ||
        (import.meta.env.VITE_ADMOB_SLOT_ID as string) ||
        ''
      );
    } catch {
      return '';
    }
  });
  const [isAdSettingsOpen, setIsAdSettingsOpen] = useState<boolean>(false);

  // États de localisation
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

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

  // Mode simulation pour démonstration et tests
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const simulationIntervalRef = useRef<number | null>(null);

  // Références d'observation de géolocalisation
  const watchIdRef = useRef<number | null>(null);

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

  // Position actuelle au montage
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: Coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(coords);
          setUserAccuracy(position.coords.accuracy);
          if (position.coords.speed !== null) {
            setCurrentSpeed(position.coords.speed);
          }
          setGeoError(null);
        },
        (error) => {
          console.warn('Erreur géolocalisation initiale:', error.message);
          const fallbackCoords: Coordinates = { lat: 48.8606, lng: 2.3472 };
          setUserLocation(fallbackCoords);
          setUserAccuracy(25);
          setGeoError(t.gpsBlockedFallback);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
      );
    } else {
      setUserLocation({ lat: 48.8606, lng: 2.3472 });
      setGeoError(t.gpsNotSupported);
    }
  }, [t]);

  // Calcul en direct de la distance entre l'utilisateur et la destination
  const distanceToDestination =
    userLocation && destination
      ? calculateHaversineDistance(
          userLocation.lat,
          userLocation.lng,
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
        setUserLocation((current) => {
          if (!current || !destination) return current;
          const newLat = current.lat + (destination.lat - current.lat) * 0.12;
          const newLng = current.lng + (destination.lng - current.lng) * 0.12;
          return { lat: newLat, lng: newLng };
        });
        setCurrentSpeed(12.5); // ~45 km/h
      }, 1500);
      return;
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setUserAccuracy(position.coords.accuracy);
          if (position.coords.speed !== null) {
            setCurrentSpeed(position.coords.speed);
          }
        },
        (error) => {
          console.warn('Erreur watchPosition:', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000,
        }
      );
      watchIdRef.current = id;
    }
  }, [destination, isSimulating]);

  // Arrêter le suivi et l'alarme
  const handleStopTracking = useCallback(() => {
    setIsTracking(false);
    setIsAlarmActive(false);
    alertSystem.stopAlarm();
    alertSystem.releaseWakeLock();

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (simulationIntervalRef.current !== null) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }

    setCurrentSpeed(null);
  }, []);

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

  // Sauvegarde config AdMob
  const handleSaveAdConfig = (client: string, slot: string) => {
    setAdClientId(client);
    setAdSlotId(slot);
    try {
      localStorage.setItem('transit_ad_client', client);
      localStorage.setItem('transit_ad_slot', slot);
    } catch {
      // ignore
    }
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
      setUserLocation(start);
      setDestination(dest);
      setDestinationAddress(
        lang === 'ar'
          ? 'قوس النصر (تجربة محاكاة)'
          : lang === 'en'
          ? 'Arc de Triomphe (Demo Simulation)'
          : 'Arc de Triomphe (Démo Simulation)'
      );
      setAlertRadius(800);
    }
  };

  // Avancer manuellement d'un pas vers l'arrivée (Test)
  const handleSimulateStep = () => {
    if (!userLocation || !destination) return;
    const newLat = userLocation.lat + (destination.lat - userLocation.lat) * 0.35;
    const newLng = userLocation.lng + (destination.lng - userLocation.lng) * 0.35;
    setUserLocation({ lat: newLat, lng: newLng });
    setCurrentSpeed(13.8); // 50 km/h
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
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (simulationIntervalRef.current !== null) {
        clearInterval(simulationIntervalRef.current);
      }
      alertSystem.stopAlarm();
      alertSystem.releaseWakeLock();
    };
  }, []);

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language={lang}>
      <div
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        className={`relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col font-sans select-none text-scale-${textSize}`}
      >
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
          {/* Zone 1: Marque */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 font-black">
              <Compass className="w-5 h-5 text-slate-950" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              {t.appName}
            </span>
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
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-xs text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
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

        {/* Barre de recherche d'adresse / arrêts */}
        <div className="absolute top-14 left-0 right-0 z-[500] pointer-events-auto">
          <SearchBar
            onSelectLocation={handleSelectLocation}
            destinationAddress={destinationAddress}
            onClearDestination={handleClearDestination}
            t={t}
            lang={lang}
          />

          {/* Bannière Mobile AdMob (Non-intrusive) */}
          <AdBanner
            clientId={adClientId}
            slotId={adSlotId}
            t={t}
            onOpenSettings={() => setIsAdSettingsOpen(true)}
          />
        </div>

        {/* Notification discrète d'erreur GPS s'il y a lieu */}
        {geoError && (
          <div className="absolute top-36 left-4 right-4 z-[450] max-w-md mx-auto pointer-events-none">
            <div className="bg-amber-500/10 border border-amber-500/30 backdrop-blur-md rounded-2xl p-2.5 flex items-center gap-2.5 text-xs text-amber-200 shadow-lg pointer-events-auto">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="flex-1 text-[11px] leading-tight">{geoError}</span>
            </div>
          </div>
        )}

        {/* Carte interactive pleine page (Google Maps ou Leaflet) */}
        <main className="flex-1 w-full h-full relative">
          {mapEngine === 'google' ? (
            <GoogleMapComponent
              userLocation={userLocation}
              userAccuracy={userAccuracy}
              destination={destination}
              destinationAddress={destinationAddress}
              onSelectDestination={handleSelectDestinationFromMap}
              alertRadius={alertRadius}
              isTracking={isTracking}
              distanceToDestination={distanceToDestination}
              t={t}
            />
          ) : (
            <LeafletMapComponent
              userLocation={userLocation}
              userAccuracy={userAccuracy}
              destination={destination}
              destinationAddress={destinationAddress}
              onSelectDestination={handleSelectDestinationFromMap}
              alertRadius={alertRadius}
              isTracking={isTracking}
              distanceToDestination={distanceToDestination}
              t={t}
            />
          )}
        </main>

        {/* Panneau de contrôle bas (HUD Ergonomique pouce mobile) */}
        <TrackingHUD
          isTracking={isTracking}
          distance={distanceToDestination}
          radius={alertRadius}
          currentSpeed={currentSpeed}
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

        {/* Modal des arrêts et trajets favoris */}
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

        {/* Modal de configuration AdMob */}
        <AdSettingsModal
          isOpen={isAdSettingsOpen}
          onClose={() => setIsAdSettingsOpen(false)}
          clientId={adClientId}
          slotId={adSlotId}
          onSaveConfig={handleSaveAdConfig}
          t={t}
        />
      </div>
    </APIProvider>
  );
}
