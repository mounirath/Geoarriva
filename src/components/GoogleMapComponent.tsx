// Source: Google Maps Platform Code Assist
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary,
  MapMouseEvent,
} from '@vis.gl/react-google-maps';
import { Coordinates } from '../utils/geo';
import { Navigation, Locate, Eye, Layers } from 'lucide-react';
import { Translations } from '../utils/i18n';

interface GoogleMapComponentProps {
  userLocation: Coordinates | null;
  userAccuracy: number | null;
  destination: Coordinates | null;
  destinationAddress?: string | null;
  onSelectDestination: (coords: Coordinates) => void;
  alertRadius: number; // in meters
  isTracking: boolean;
  distanceToDestination: number | null;
  t: Translations;
  onOpenGpsDetails?: () => void;
}

// Composant Overlay pour le cercle de rayon d'alerte (Geofence)
const AlertCircleOverlay: React.FC<{
  center: Coordinates;
  radius: number;
  isInside: boolean;
}> = ({ center, radius, isInside }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map || !mapsLib) return;

    const circle = new mapsLib.Circle({
      map,
      center,
      radius,
      strokeColor: isInside ? '#ef4444' : '#f59e0b',
      strokeOpacity: isInside ? 0.9 : 0.7,
      strokeWeight: isInside ? 3 : 2,
      fillColor: isInside ? '#f87171' : '#fbbf24',
      fillOpacity: isInside ? 0.35 : 0.18,
    });
    circleRef.current = circle;

    return () => {
      circle.setMap(null);
      circleRef.current = null;
    };
  }, [map, mapsLib]);

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setCenter(center);
    circleRef.current.setRadius(radius);
    circleRef.current.setOptions({
      strokeColor: isInside ? '#ef4444' : '#f59e0b',
      strokeOpacity: isInside ? 0.9 : 0.7,
      strokeWeight: isInside ? 3 : 2,
      fillColor: isInside ? '#f87171' : '#fbbf24',
      fillOpacity: isInside ? 0.35 : 0.18,
    });
  }, [center, radius, isInside]);

  return null;
};

// Composant Overlay pour le cercle de précision GPS de l'utilisateur
const AccuracyCircleOverlay: React.FC<{
  center: Coordinates;
  accuracy: number;
}> = ({ center, accuracy }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map || !mapsLib || accuracy <= 0) return;

    const circle = new mapsLib.Circle({
      map,
      center,
      radius: Math.min(accuracy, 400),
      strokeColor: '#3b82f6',
      strokeOpacity: 0.5,
      strokeWeight: 1,
      fillColor: '#60a5fa',
      fillOpacity: 0.1,
    });
    circleRef.current = circle;

    return () => {
      circle.setMap(null);
      circleRef.current = null;
    };
  }, [map, mapsLib]);

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setCenter(center);
    circleRef.current.setRadius(Math.min(accuracy, 400));
  }, [center, accuracy]);

  return null;
};

// Composant Overlay pour la ligne de trajet direct reliant l'utilisateur à la destination
const TrajectoryPolyline: React.FC<{
  origin: Coordinates;
  destination: Coordinates;
  isInside: boolean;
}> = ({ origin, destination, isInside }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !mapsLib) return;

    const polyline = new mapsLib.Polyline({
      map,
      path: [origin, destination],
      strokeColor: isInside ? '#ef4444' : '#38bdf8',
      strokeOpacity: 0.75,
      strokeWeight: 3,
    });
    polylineRef.current = polyline;

    return () => {
      polyline.setMap(null);
      polylineRef.current = null;
    };
  }, [map, mapsLib]);

  useEffect(() => {
    if (!polylineRef.current) return;
    polylineRef.current.setPath([origin, destination]);
    polylineRef.current.setOptions({
      strokeColor: isInside ? '#ef4444' : '#38bdf8',
    });
  }, [origin, destination, isInside]);

  return null;
};

// Composant d'auto-centrage sur la position utilisateur dès la première acquisition
const AutoCenterOnUser: React.FC<{ userLocation: Coordinates | null }> = ({ userLocation }) => {
  const map = useMap();
  const hasAutoCenteredRef = useRef<boolean>(false);

  useEffect(() => {
    if (!map || !userLocation) return;
    if (!hasAutoCenteredRef.current) {
      map.panTo(userLocation);
      map.setZoom(16);
      hasAutoCenteredRef.current = true;
    }
  }, [map, userLocation]);

  return null;
};

// Contrôles de caméra personnalisés
const MapCameraControls: React.FC<{
  userLocation: Coordinates | null;
  destination: Coordinates | null;
  mapTypeId: string;
  onToggleMapType: () => void;
  t: Translations;
  onOpenGpsDetails?: () => void;
}> = ({ userLocation, destination, mapTypeId, onToggleMapType, t, onOpenGpsDetails }) => {
  const map = useMap();

  const handleRecenterUser = () => {
    if (!map || !userLocation) {
      onOpenGpsDetails?.();
      return;
    }
    map.panTo(userLocation);
    map.setZoom(16);
    onOpenGpsDetails?.();
  };

  const handleRecenterDestination = () => {
    if (!map || !destination) return;
    map.panTo(destination);
    map.setZoom(16);
  };

  const handleFitBounds = () => {
    if (!map) return;
    if (typeof google === 'undefined' || !google.maps) return;

    const bounds = new google.maps.LatLngBounds();
    let count = 0;
    if (userLocation) {
      bounds.extend(userLocation);
      count++;
    }
    if (destination) {
      bounds.extend(destination);
      count++;
    }

    if (count >= 2) {
      map.fitBounds(bounds, { top: 70, right: 60, bottom: 180, left: 60 });
    } else if (count === 1 && userLocation) {
      map.panTo(userLocation);
      map.setZoom(16);
    }
  };

  return (
    <>
      {/* Bouton visible d'accès direct à ma position GPS */}
      <div className="absolute left-3.5 top-20 z-10">
        <button
          onClick={handleRecenterUser}
          type="button"
          className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/90 text-white backdrop-blur-md border border-blue-500/40 shadow-xl active:scale-95 transition-all hover:bg-slate-800"
        >
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </div>
          <span className="text-xs font-bold text-slate-100">
            {userLocation ? 'Ma position GPS' : 'Activer mon GPS'}
          </span>
        </button>
      </div>

      <div className="absolute right-3.5 top-20 z-10 flex flex-col gap-2.5">
        {/* Recentrer sur ma position */}
        <button
          onClick={handleRecenterUser}
          disabled={!userLocation}
          type="button"
          title={t.locateMe}
          className="w-11 h-11 rounded-xl bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 shadow-lg flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
        >
          <Locate className="w-5 h-5 text-blue-400" />
        </button>

      {/* Recentrer sur destination (si définie) */}
      {destination && (
        <button
          onClick={handleRecenterDestination}
          type="button"
          title={t.goToDest}
          className="w-11 h-11 rounded-xl bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 shadow-lg flex items-center justify-center active:scale-95 transition-all hover:bg-slate-800"
        >
          <Navigation className="w-5 h-5 text-rose-400" />
        </button>
      )}

      {/* Vue globale (utilisateur + destination) */}
      {userLocation && destination && (
        <button
          onClick={handleFitBounds}
          type="button"
          title={t.fitView}
          className="w-11 h-11 rounded-xl bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 shadow-lg flex items-center justify-center active:scale-95 transition-all hover:bg-slate-800"
        >
          <Eye className="w-5 h-5 text-amber-400" />
        </button>
      )}

      {/* Bascule style de carte (Plan / Satellite) */}
      <button
        onClick={onToggleMapType}
        type="button"
        title={t.changeMapStyle}
        className="w-11 h-11 rounded-xl bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 shadow-lg flex items-center justify-center active:scale-95 transition-all hover:bg-slate-800 text-xs"
      >
        <Layers className="w-5 h-5 text-slate-300" />
      </button>
    </div>
  </>
  );
};

export const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  userLocation,
  userAccuracy,
  destination,
  destinationAddress,
  onSelectDestination,
  alertRadius,
  isTracking,
  distanceToDestination,
  t,
  onOpenGpsDetails,
}) => {
  const [mapTypeId, setMapTypeId] = useState<string>('roadmap');

  const defaultCenter = userLocation || { lat: 48.8566, lng: 2.3522 };

  const isInsideRadius =
    distanceToDestination !== null && distanceToDestination <= alertRadius;

  // Clic sur la carte pour définir la destination
  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (e.detail?.latLng) {
        onSelectDestination({
          lat: e.detail.latLng.lat,
          lng: e.detail.latLng.lng,
        });
      }
    },
    [onSelectDestination]
  );

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      <Map
        mapId="DEMO_MAP_ID"
        defaultCenter={defaultCenter}
        defaultZoom={15}
        mapTypeId={mapTypeId}
        disableDefaultUI={true}
        gestureHandling="greedy"
        onClick={handleMapClick}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        className="w-full h-full"
      >
        {/* Marqueur de position actuelle utilisateur (Pulsation lumineuse) */}
        {userLocation && (
          <AdvancedMarker position={userLocation} title={t.locateMe}>
            <div className="relative flex items-center justify-center w-7 h-7">
              <div className="absolute w-7 h-7 rounded-full bg-blue-500/30 user-pulse-marker" />
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md shadow-blue-500/50" />
            </div>
          </AdvancedMarker>
        )}

        {/* Cercle de précision GPS utilisateur */}
        {userLocation && userAccuracy && userAccuracy > 0 && (
          <AccuracyCircleOverlay center={userLocation} accuracy={userAccuracy} />
        )}

        {/* Marqueur de destination (Pin rouge personnalisable & déplaçable) */}
        {destination && (
          <AdvancedMarker
            position={destination}
            draggable={!isTracking}
            onDragEnd={(e) => {
              if (e.latLng) {
                const lat = typeof e.latLng.lat === 'function' ? e.latLng.lat() : Number(e.latLng.lat);
                const lng = typeof e.latLng.lng === 'function' ? e.latLng.lng() : Number(e.latLng.lng);
                onSelectDestination({ lat, lng });
              }
            }}
            title={t.arrivalPoint}
          >
            <Pin
              background="#e11d48"
              borderColor="#ffffff"
              glyphColor="#ffffff"
              scale={1.15}
            />
          </AdvancedMarker>
        )}

        {/* Cercle de rayon d'alerte autour de la destination */}
        {destination && (
          <AlertCircleOverlay
            center={destination}
            radius={alertRadius}
            isInside={isInsideRadius}
          />
        )}

        {/* Ligne directe reliant l'utilisateur à la destination */}
        {userLocation && destination && (
          <TrajectoryPolyline
            origin={userLocation}
            destination={destination}
            isInside={isInsideRadius}
          />
        )}

        {/* Auto centrage dès la première réception du signal GPS */}
        <AutoCenterOnUser userLocation={userLocation} />

        {/* Boutons de contrôle de la caméra et vue */}
        <MapCameraControls
          userLocation={userLocation}
          destination={destination}
          mapTypeId={mapTypeId}
          onToggleMapType={() =>
            setMapTypeId((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))
          }
          t={t}
          onOpenGpsDetails={onOpenGpsDetails}
        />
      </Map>

      {/* Guide visuel d'aide si aucune destination choisie */}
      {!destination && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none transition-all">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs font-medium text-slate-200">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>{t.tapMapToSetDest}</span>
          </div>
        </div>
      )}
    </div>
  );
};
