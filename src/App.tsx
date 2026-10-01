/**
 * TransitAlarm - Application d'alerte et réveil GPS pour les transports
 * 100% Front-end (React, Vite, Leaflet, Tailwind CSS)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  Compass,
  AlertTriangle,
  Music,
  Star,
  Sparkles,
} from 'lucide-react';
import { Coordinates, calculateHaversineDistance, formatDistance } from './utils/geo';
import { alertSystem, SoundType, SOUND_OPTIONS } from './utils/audioAlert';
import { MapComponent } from './components/MapComponent';
import { SearchBar } from './components/SearchBar';
import { TrackingHUD } from './components/TrackingHUD';
import { AlertModal } from './components/AlertModal';
import { SoundSettingsModal } from './components/SoundSettingsModal';
import { FavoritesModal, FavoriteLocation } from './components/FavoritesModal';

const INITIAL_FAVORITES: FavoriteLocation[] = [
  { id: '1', name: 'Gare de Lyon, Paris', lat: 48.8443, lng: 2.3744 },
  { id: '2', name: 'Gare Montparnasse, Paris', lat: 48.8412, lng: 2.3205 },
  { id: '3', name: 'Aéroport CDG Terminal 2', lat: 49.0097, lng: 2.5479 },
  { id: '4', name: 'La Défense - Grande Arche', lat: 48.8924, lng: 2.2361 },
  { id: '5', name: 'Gare Saint-Lazare, Paris', lat: 48.8768, lng: 2.3252 },
];

export default function App() {
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

  // Sauvegarde des favoris dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem('transit_favorites', JSON.stringify(favorites));
    } catch (e) {
      // ignore
    }
  }, [favorites]);

  // Initialisation : Obtenir la position actuelle au montage
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
          // Position de repli par défaut (Paris - Châtelet les Halles)
          const fallbackCoords: Coordinates = { lat: 48.8606, lng: 2.3472 };
          setUserLocation(fallbackCoords);
          setUserAccuracy(25);
          setGeoError('Position GPS non accessible ou bloquée. Utilisation de la position de test.');
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
      );
    } else {
      setUserLocation({ lat: 48.8606, lng: 2.3472 });
      setGeoError('La géolocalisation n\'est pas supportée par ce navigateur.');
    }
  }, []);

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

    // Si on entre dans le rayon d'alerte configuré
    if (distanceToDestination <= alertRadius) {
      if (!isAlarmActive) {
        setIsAlarmActive(true);
      }
    }
  }, [isTracking, distanceToDestination, alertRadius, isAlarmActive, destination]);

  // Démarrer le suivi réel du trajet
  const handleStartTracking = useCallback(async () => {
    if (!destination) return;

    // Déverrouiller le contexte audio sur interaction utilisateur
    alertSystem.ensureAudioContext();
    // Demander le maintien d'écran éveillé
    await alertSystem.requestWakeLock();

    setIsTracking(true);

    if (isSimulating) {
      // Démarrage de la simulation automatique progressive
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = window.setInterval(() => {
        setUserLocation((current) => {
          if (!current || !destination) return current;
          // Avancer de 15% vers la destination
          const newLat = current.lat + (destination.lat - current.lat) * 0.12;
          const newLng = current.lng + (destination.lng - current.lng) * 0.12;
          return { lat: newLat, lng: newLng };
        });
        setCurrentSpeed(12.5); // ~45 km/h
      }, 1500);
      return;
    }

    // Suivi GPS natif continu
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

  // Définir la destination depuis un clic carte
  const handleSelectDestinationFromMap = (coords: Coordinates) => {
    if (isTracking) return;
    setDestination(coords);
    setDestinationAddress(`Point d'arrivée (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
  };

  // Définir la destination depuis la barre de recherche ou un favori
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

  // Basculer le mode simulation
  const handleToggleSimulation = () => {
    if (isTracking) {
      handleStopTracking();
    }
    const nextState = !isSimulating;
    setIsSimulating(nextState);

    if (nextState) {
      const start: Coordinates = { lat: 48.8566, lng: 2.3522 }; // Paris Hôtel de Ville
      const dest: Coordinates = { lat: 48.8738, lng: 2.2950 }; // Arc de Triomphe (~4.2 km)
      setUserLocation(start);
      setDestination(dest);
      setDestinationAddress('Arc de Triomphe (Démo Simulation)');
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

  // Nom du son sélectionné pour l'affichage
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
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col font-sans select-none">
      {/* Top Bar contractuelle épurée (1 row, 3 zones) */}
      <header className="absolute top-0 left-0 right-0 z-[500] h-14 px-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between pointer-events-auto">
        {/* Zone 1: Marque */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 font-black">
            <Compass className="w-5 h-5 text-slate-950" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            TransitAlarm
          </span>
        </div>

        {/* Zone 2: Navigation rapide vers Sons & Favoris */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsSoundModalOpen(true)}
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-xs text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
          >
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Sonneries</span>
          </button>

          <button
            onClick={() => setIsFavoritesModalOpen(true)}
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-xs text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span className="hidden sm:inline">Favoris</span>
          </button>
        </div>

        {/* Zone 3: Action rapide / réinitialisation */}
        <div className="flex items-center gap-2">
          {destination && !isTracking && (
            <button
              onClick={handleClearDestination}
              type="button"
              className="text-xs font-medium text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Effacer
            </button>
          )}

          {isSimulating && (
            <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
              Démo
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
        />
      </div>

      {/* Notification discrète d'erreur GPS s'il y a lieu */}
      {geoError && (
        <div className="absolute top-28 left-4 right-4 z-[450] max-w-md mx-auto pointer-events-none">
          <div className="bg-amber-500/10 border border-amber-500/30 backdrop-blur-md rounded-2xl p-2.5 flex items-center gap-2.5 text-xs text-amber-200 shadow-lg pointer-events-auto">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="flex-1 text-[11px] leading-tight">{geoError}</span>
          </div>
        </div>
      )}

      {/* Carte interactive Leaflet pleine page */}
      <main className="flex-1 w-full h-full relative">
        <MapComponent
          userLocation={userLocation}
          userAccuracy={userAccuracy}
          destination={destination}
          destinationAddress={destinationAddress}
          onSelectDestination={handleSelectDestinationFromMap}
          alertRadius={alertRadius}
          isTracking={isTracking}
          distanceToDestination={distanceToDestination}
        />
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
      />

      {/* Modal / Bannière d'alerte urgente au franchissement du rayon */}
      <AlertModal
        isOpen={isAlarmActive}
        distance={distanceToDestination}
        radius={alertRadius}
        destinationAddress={destinationAddress}
        onDismiss={handleStopTracking}
      />

      {/* Modal des réglages de sonneries */}
      <SoundSettingsModal
        isOpen={isSoundModalOpen}
        onClose={() => setIsSoundModalOpen(false)}
        selectedSound={selectedSound}
        onSelectSound={setSelectedSound}
        volume={volume}
        onChangeVolume={setVolume}
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
      />
    </div>
  );
}
