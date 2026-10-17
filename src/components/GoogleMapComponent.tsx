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
import { Coordinates, formatDistance, estimateRemainingTime } from '../utils/geo';
import { routingService, RouteResult } from '../services/RoutingService';
import {
  Navigation,
  Locate,
  Eye,
  Layers,
  Route,
  Compass,
  EyeOff,
  Bus,
  X,
  Loader2,
} from 'lucide-react';
import { Translations } from '../utils/i18n';
import { BusTraceRecord } from '../services/BusTraceService';

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
  activeBusTrace?: BusTraceRecord | null;
  onClearBusTrace?: () => void;
  onRequestLocation?: () => void;
  isGpsLoading?: boolean;
  onEnableDemoLocation?: () => void;
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

// Composant Overlay pour la ligne de trajet dynamique reliant l'utilisateur à la destination
const TrajectoryPolylineOverlay: React.FC<{
  origin: Coordinates;
  destination: Coordinates;
  isInside: boolean;
  isTracking: boolean;
  routeMode: 'road' | 'direct';
  visible: boolean;
}> = ({ origin, destination, isInside, isTracking, routeMode, visible }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const glowPolylineRef = useRef<google.maps.Polyline | null>(null);
  const corePolylineRef = useRef<google.maps.Polyline | null>(null);
  const traveledPolylineRef = useRef<google.maps.Polyline | null>(null);
  const traveledPointsRef = useRef<Coordinates[]>([]);
  const [routeCoords, setRouteCoords] = useState<Coordinates[]>([origin, destination]);

  // Récupérer l'itinéraire calculé
  useEffect(() => {
    let isMounted = true;
    routingService
      .getRoute(origin, destination, routeMode === 'direct')
      .then((res) => {
        if (isMounted) {
          setRouteCoords(res.coordinates);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRouteCoords([origin, destination]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [origin.lat, origin.lng, destination.lat, destination.lng, routeMode]);

  // Historique des positions parcourues
  useEffect(() => {
    if (!isTracking) {
      traveledPointsRef.current = [];
      if (traveledPolylineRef.current) {
        traveledPolylineRef.current.setMap(null);
        traveledPolylineRef.current = null;
      }
    } else {
      const prev = traveledPointsRef.current;
      const last = prev[prev.length - 1];
      if (!last || Math.abs(last.lat - origin.lat) > 0.00008 || Math.abs(last.lng - origin.lng) > 0.00008) {
        traveledPointsRef.current = [...prev, origin];
      }
    }
  }, [isTracking, origin]);

  // Initialisation et mise à jour des polylignes
  useEffect(() => {
    if (!map || !mapsLib || !visible) {
      if (glowPolylineRef.current) {
        glowPolylineRef.current.setMap(null);
        glowPolylineRef.current = null;
      }
      if (corePolylineRef.current) {
        corePolylineRef.current.setMap(null);
        corePolylineRef.current = null;
      }
      return;
    }

    const path = routeCoords.map((c) => ({ lat: c.lat, lng: c.lng }));

    // 1. Halo lumineux
    const glowColor = isInside ? '#ef4444' : '#0284c7';
    if (!glowPolylineRef.current) {
      glowPolylineRef.current = new mapsLib.Polyline({
        map,
        path,
        strokeColor: glowColor,
        strokeOpacity: isTracking ? 0.45 : 0.25,
        strokeWeight: isTracking ? 8 : 5,
        zIndex: 50,
      });
    } else {
      glowPolylineRef.current.setPath(path);
      glowPolylineRef.current.setOptions({
        strokeColor: glowColor,
        strokeOpacity: isTracking ? 0.45 : 0.25,
        strokeWeight: isTracking ? 8 : 5,
      });
    }

    // 2. Ligne centrale active
    const coreColor = isInside ? '#f87171' : '#38bdf8';
    if (!corePolylineRef.current) {
      corePolylineRef.current = new mapsLib.Polyline({
        map,
        path,
        strokeColor: coreColor,
        strokeOpacity: 0.95,
        strokeWeight: isTracking ? 4 : 3,
        zIndex: 60,
      });
    } else {
      corePolylineRef.current.setPath(path);
      corePolylineRef.current.setOptions({
        strokeColor: coreColor,
        strokeWeight: isTracking ? 4 : 3,
      });
    }

    // 3. Ligne de progression parcourue (Breadcrumb)
    if (isTracking && traveledPointsRef.current.length >= 2) {
      const traveledPath = traveledPointsRef.current.map((c) => ({ lat: c.lat, lng: c.lng }));
      if (!traveledPolylineRef.current) {
        traveledPolylineRef.current = new mapsLib.Polyline({
          map,
          path: traveledPath,
          strokeColor: '#10b981',
          strokeOpacity: 0.8,
          strokeWeight: 3.5,
          zIndex: 55,
        });
      } else {
        traveledPolylineRef.current.setPath(traveledPath);
      }
    }

    return () => {
      // Nettoyage géré
    };
  }, [map, mapsLib, visible, routeCoords, isInside, isTracking, origin]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (glowPolylineRef.current) glowPolylineRef.current.setMap(null);
      if (corePolylineRef.current) corePolylineRef.current.setMap(null);
      if (traveledPolylineRef.current) traveledPolylineRef.current.setMap(null);
    };
  }, []);

  return null;
};

// Cadrage automatique de la vue lorsque le suivi démarre
const AutoFrameOnTracking: React.FC<{
  userLocation: Coordinates | null;
  destination: Coordinates | null;
  isTracking: boolean;
}> = ({ userLocation, destination, isTracking }) => {
  const map = useMap();
  const prevTrackingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!map || !userLocation || !destination) return;
    if (isTracking && !prevTrackingRef.current) {
      if (typeof google !== 'undefined' && google.maps) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(userLocation);
        bounds.extend(destination);
        map.fitBounds(bounds, { top: 80, right: 50, bottom: 180, left: 50 });
      }
    }
    prevTrackingRef.current = isTracking;
  }, [map, userLocation, destination, isTracking]);

  return null;
};

// Composant d'auto-centrage sur la position utilisateur dès la première acquisition
const AutoCenterOnUser: React.FC<{ userLocation: Coordinates | null }> = ({ userLocation }) => {
  const map = useMap();
  const lastLocationRef = useRef<Coordinates | null>(null);

  useEffect(() => {
    if (!map || !userLocation) return;
    if (
      !lastLocationRef.current ||
      Math.abs(lastLocationRef.current.lat - userLocation.lat) > 0.005 ||
      Math.abs(lastLocationRef.current.lng - userLocation.lng) > 0.005
    ) {
      map.panTo(userLocation);
      map.setZoom(16);
      lastLocationRef.current = userLocation;
    }
  }, [map, userLocation]);

  return null;
};

// Contrôles de caméra personnalisés
const MapCameraControls: React.FC<{
  userLocation: Coordinates | null;
  destination: Coordinates | null;
  showRouteLine: boolean;
  onToggleRouteLine: () => void;
  mapTypeId: string;
  onToggleMapType: () => void;
  t: Translations;
  onOpenGpsDetails?: () => void;
  onRequestLocation?: () => void;
  isGpsLoading?: boolean;
}> = ({
  userLocation,
  destination,
  showRouteLine,
  onToggleRouteLine,
  mapTypeId,
  onToggleMapType,
  t,
  onOpenGpsDetails,
  onRequestLocation,
  isGpsLoading,
}) => {
  const map = useMap();

  const handleRecenterUser = () => {
    if (!map || !userLocation) {
      if (onRequestLocation) {
        onRequestLocation();
      } else {
        onOpenGpsDetails?.();
      }
      return;
    }
    map.panTo(userLocation);
    map.setZoom(16);
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
      map.fitBounds(bounds, { top: 80, right: 60, bottom: 180, left: 60 });
    } else if (count === 1 && userLocation) {
      map.panTo(userLocation);
      map.setZoom(16);
    }
  };

  return (
    <>
      {/* Badge indicateur & d'action GPS en haut de la carte */}
      <div className="absolute top-3 left-3.5 z-[400] flex items-center gap-2 pointer-events-auto">
        <button
          onClick={handleRecenterUser}
          type="button"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg text-xs font-semibold active:scale-95 transition-all ${
            userLocation
              ? 'bg-slate-900/90 hover:bg-slate-800 text-white border border-blue-500/50'
              : 'bg-blue-600/95 hover:bg-blue-500 text-white shadow-blue-500/40 animate-pulse font-bold'
          }`}
          title={userLocation ? t.locateMe : t.showGpsOnMap}
        >
          {isGpsLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
          ) : (
            <Locate className={`w-3.5 h-3.5 ${userLocation ? 'text-blue-400' : 'text-white'}`} />
          )}
          {userLocation ? (
            <span className="flex items-center gap-1.5">
              <span className="text-blue-300 font-bold">GPS</span>
              <span className="font-mono text-slate-300 text-[11px]">
                {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </span>
            </span>
          ) : (
            <span>{t.showGpsOnMap}</span>
          )}
        </button>
      </div>

      {/* Boutons d'actions rapides de carte (ergonomie pouce mobile, au-dessus du bandeau bas) */}
      <div className="absolute right-3.5 bottom-36 sm:bottom-36 z-[400] flex flex-col gap-2 pointer-events-auto">
        {/* Recentrer sur ma position */}
        <button
          onClick={handleRecenterUser}
          type="button"
          title={userLocation ? t.locateMe : 'Activer et afficher ma position GPS'}
          className={`w-11 h-11 rounded-2xl backdrop-blur-md border shadow-xl flex items-center justify-center active:scale-95 transition-all ${
            userLocation
              ? 'bg-slate-900/90 text-amber-400 border-slate-700/80 hover:bg-slate-800'
              : 'bg-blue-600/95 hover:bg-blue-500 text-white border-blue-400 shadow-blue-500/40 animate-pulse'
          }`}
        >
          {isGpsLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
          ) : (
            <Locate className="w-5 h-5" />
          )}
        </button>

        {/* Recentrer sur destination (si définie) */}
        {destination && (
          <button
            onClick={handleRecenterDestination}
            type="button"
            title={t.goToDest}
            className="w-11 h-11 rounded-2xl bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 shadow-xl flex items-center justify-center active:scale-95 transition-all hover:bg-slate-800"
          >
            <Navigation className="w-5 h-5 text-rose-400" />
          </button>
        )}

        {/* Bouton bascule du tracé de ligne */}
        {destination && userLocation && (
          <button
            onClick={onToggleRouteLine}
            type="button"
            title={showRouteLine ? t.hideRouteLine : t.showRouteLine}
            className={`w-11 h-11 rounded-2xl backdrop-blur-md border shadow-xl flex items-center justify-center active:scale-95 transition-all ${
              showRouteLine
                ? 'bg-sky-950/90 text-sky-400 border-sky-600/60 shadow-sky-950/50'
                : 'bg-slate-900/90 text-slate-400 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            {showRouteLine ? (
              <Route className="w-5 h-5" />
            ) : (
              <EyeOff className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Vue globale (utilisateur + destination) */}
        {userLocation && destination && (
          <button
            onClick={handleFitBounds}
            type="button"
            title={t.fitView}
            className="w-11 h-11 rounded-2xl bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 shadow-xl flex items-center justify-center active:scale-95 transition-all hover:bg-slate-800"
          >
            <Eye className="w-5 h-5 text-amber-400" />
          </button>
        )}

        {/* Bascule style de carte (Plan / Satellite) */}
        <button
          onClick={onToggleMapType}
          type="button"
          title={t.changeMapStyle}
          className="w-11 h-11 rounded-2xl bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 shadow-xl flex items-center justify-center active:scale-95 transition-all hover:bg-slate-800 text-xs"
        >
          <Layers className="w-5 h-5 text-slate-300" />
        </button>
      </div>
    </>
  );
};

// Calque d'affichage du tracé de ligne de bus sélectionné sur Google Maps
const BusTraceOverlay: React.FC<{
  trace: BusTraceRecord;
}> = ({ trace }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const glowLineRef = useRef<google.maps.Polyline | null>(null);
  const coreLineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !mapsLib) return;

    const coords =
      trace.coordinates && trace.coordinates.length >= 2
        ? trace.coordinates
        : [trace.startPoint, trace.destinationPoint];

    const path = coords.map((c) => ({ lat: c.lat, lng: c.lng }));
    const busColor = trace.color || '#2563eb';

    // 1. Halo lumineux
    glowLineRef.current = new mapsLib.Polyline({
      map,
      path,
      strokeColor: busColor,
      strokeOpacity: 0.35,
      strokeWeight: 12,
    });

    // 2. Ligne centrale haute visibilité
    coreLineRef.current = new mapsLib.Polyline({
      map,
      path,
      strokeColor: busColor,
      strokeOpacity: 0.95,
      strokeWeight: 5.5,
    });

    // Cadrage automatique de la vue sur l'ensemble du tracé
    if (path.length >= 2) {
      const bounds = new google.maps.LatLngBounds();
      path.forEach((pt) => bounds.extend(pt));
      map.fitBounds(bounds, { top: 80, right: 50, bottom: 160, left: 50 });
    }

    return () => {
      glowLineRef.current?.setMap(null);
      coreLineRef.current?.setMap(null);
    };
  }, [map, mapsLib, trace]);

  return (
    <>
      {/* Marqueur arrêt de départ */}
      <AdvancedMarker
        position={trace.startPoint}
        title={`${trace.startPoint.name} (Départ)`}
      >
        <div
          className="px-2.5 py-1 rounded-full text-white font-extrabold text-[11px] shadow-xl flex items-center gap-1.5 border-2 border-white select-none"
          style={{ backgroundColor: trace.color || '#2563eb' }}
        >
          <span className="bg-white text-slate-900 rounded px-1 text-[10px] font-bold">
            {trace.busLine}
          </span>
          <span>Départ</span>
        </div>
      </AdvancedMarker>

      {/* Marqueur terminus */}
      <AdvancedMarker
        position={trace.destinationPoint}
        title={`${trace.destinationPoint.name} (Terminus)`}
      >
        <div className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-extrabold text-[11px] shadow-xl flex items-center gap-1 border-2 border-white select-none">
          <span>🏁 Terminus</span>
        </div>
      </AdvancedMarker>
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
  activeBusTrace,
  onClearBusTrace,
  onRequestLocation,
  isGpsLoading,
  onEnableDemoLocation,
}) => {
  const [mapTypeId, setMapTypeId] = useState<string>('roadmap');
  const [showRouteLine, setShowRouteLine] = useState<boolean>(true);
  const [routeMode, setRouteMode] = useState<'road' | 'direct'>('road');

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

  const formattedDist = formatDistance(distanceToDestination);
  const etaText =
    distanceToDestination !== null
      ? estimateRemainingTime(distanceToDestination)
      : null;

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
        {/* Marqueur de position actuelle utilisateur (Pulsation lumineuse & balise) */}
        {userLocation && (
          <AdvancedMarker
            position={userLocation}
            title={t.locateMe}
            onClick={() => onOpenGpsDetails?.()}
          >
            <div className="relative flex flex-col items-center select-none cursor-pointer">
              <div className="bg-blue-600/95 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-lg border border-white/90 whitespace-nowrap mb-1 tracking-wide backdrop-blur-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                <span>Position GPS</span>
              </div>
              <div className="relative flex items-center justify-center w-8 h-8">
                <div className="absolute w-8 h-8 rounded-full bg-blue-500/30 user-pulse-marker" />
                <div className="absolute w-7 h-7 rounded-full bg-sky-400/50 gps-beacon-ring" />
                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-xl shadow-blue-500/80" />
              </div>
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

        {/* Ligne de tracé de trajet dynamique reliant l'utilisateur à la destination */}
        {userLocation && destination && (
          <TrajectoryPolylineOverlay
            origin={userLocation}
            destination={destination}
            isInside={isInsideRadius}
            isTracking={isTracking}
            routeMode={routeMode}
            visible={showRouteLine}
          />
        )}

        {/* Cadrage automatique lors du lancement du suivi */}
        <AutoFrameOnTracking
          userLocation={userLocation}
          destination={destination}
          isTracking={isTracking}
        />

        {/* Auto centrage dès la première réception du signal GPS */}
        <AutoCenterOnUser userLocation={userLocation} />

        {/* Tracé de ligne de bus historique sélectionné */}
        {activeBusTrace && <BusTraceOverlay trace={activeBusTrace} />}

        {/* Boutons de contrôle de la caméra et vue */}
        <MapCameraControls
          userLocation={userLocation}
          destination={destination}
          showRouteLine={showRouteLine}
          onToggleRouteLine={() => setShowRouteLine((prev) => !prev)}
          mapTypeId={mapTypeId}
          onToggleMapType={() =>
            setMapTypeId((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))
          }
          t={t}
          onOpenGpsDetails={onOpenGpsDetails}
          onRequestLocation={onRequestLocation}
          isGpsLoading={isGpsLoading}
        />
      </Map>

      {/* Pastille flottante de position GPS sur Google Maps */}
      <div className="absolute top-20 left-3 z-[400] max-w-[85%] sm:max-w-sm pointer-events-auto animate-fade-in">
        {userLocation ? (
          <button
            type="button"
            onClick={onOpenGpsDetails}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white backdrop-blur-md border border-blue-500/50 shadow-xl text-xs transition-all active:scale-95 group"
            title="Position GPS active · Cliquer pour détails et recentrage"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
            <span className="font-semibold text-slate-200 truncate font-mono text-[11px]">
              📍 {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
            </span>
            {userAccuracy && (
              <span className="text-[10px] text-blue-300 font-mono bg-blue-500/20 px-1.5 py-0.5 rounded-md shrink-0 border border-blue-500/30">
                ±{Math.round(userAccuracy)}m
              </span>
            )}
            <Locate className="w-3.5 h-3.5 text-blue-400 group-hover:rotate-45 transition-transform shrink-0" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => (onRequestLocation ? onRequestLocation() : onOpenGpsDetails?.())}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-950/90 hover:bg-amber-900 text-amber-200 backdrop-blur-md border border-amber-500/50 shadow-xl text-xs transition-all active:scale-95"
            title="Activer et afficher ma position GPS sur la carte"
          >
            {isGpsLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                <span className="font-semibold text-[11px]">Recherche du signal GPS...</span>
              </>
            ) : (
              <>
                <Locate className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                <span className="font-bold text-[11px]">Afficher ma position GPS</span>
                {onEnableDemoLocation && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onEnableDemoLocation();
                    }}
                    className="ml-1 text-[10px] bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.5 rounded-md hover:bg-amber-400 cursor-pointer"
                    title="Activer la position de test"
                  >
                    Démo
                  </span>
                )}
              </>
            )}
          </button>
        )}
      </div>

      {/* Bandeau d'information du tracé de ligne de bus sélectionné */}
      {activeBusTrace && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-md pointer-events-auto animate-fade-in">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-amber-500/60 p-3 rounded-2xl shadow-2xl flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="px-2.5 py-1 rounded-lg text-white font-extrabold text-xs shadow flex items-center justify-center shrink-0 border border-white/20"
                style={{ backgroundColor: activeBusTrace.color || '#2563eb' }}
              >
                {activeBusTrace.busLine}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="font-bold truncate text-white flex items-center gap-1.5">
                  <span className="truncate">{activeBusTrace.name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
                    Tracé
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 truncate">
                  {activeBusTrace.startPoint.name} ➔ {activeBusTrace.destinationPoint.name} · {formatDistance(activeBusTrace.distanceMeters).full}
                </div>
              </div>
            </div>
            {onClearBusTrace && (
              <button
                type="button"
                onClick={onClearBusTrace}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-2 shrink-0 border border-slate-700/80"
                title={t.clearBusTraceFromMap}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Guide visuel d'aide si aucune destination choisie */}
      {!destination && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none transition-all">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs font-medium text-slate-200">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>{t.tapMapToSetDest}</span>
          </div>
        </div>
      )}

      {/* Bandeau d'information du tracé actif (Visible quand le suivi est lancé) */}
      {isTracking && destination && userLocation && showRouteLine && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 w-[92%] max-w-sm pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-sky-500/40 px-3.5 py-2.5 rounded-2xl shadow-2xl flex items-center justify-between text-xs text-slate-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
                <Route className="w-4 h-4 animate-pulse" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-sky-300">
                  <span className="truncate">{t.routeLineTrace}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 font-mono">
                    {routeMode === 'road' ? 'Route' : 'Direct'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 truncate">
                  {formattedDist.full} · {etaText || t.immediateArrival}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => setRouteMode((prev) => (prev === 'road' ? 'direct' : 'road'))}
                title={routeMode === 'road' ? t.directRoute : t.roadRoute}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 active:scale-95 transition-all text-[10px] font-medium flex items-center gap-1 border border-slate-700/60"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
