import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Coordinates } from '../utils/geo';
import { Navigation, Locate, Eye, Map as MapIcon, Layers } from 'lucide-react';

interface MapComponentProps {
  userLocation: Coordinates | null;
  userAccuracy: number | null;
  destination: Coordinates | null;
  destinationAddress?: string | null;
  onSelectDestination: (coords: Coordinates) => void;
  alertRadius: number; // in meters
  isTracking: boolean;
  distanceToDestination: number | null;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  userLocation,
  userAccuracy,
  destination,
  destinationAddress,
  onSelectDestination,
  alertRadius,
  isTracking,
  distanceToDestination,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const connectingLineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapStyle, setMapStyle] = React.useState<'dark' | 'light'>('dark');

  // Initialisation de la carte Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Position de départ par défaut (Paris centre) si localisation pas encore dispo
    const defaultCenter: [number, number] = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [48.8566, 2.3522];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 15,
      zoomControl: false, // On utilise nos propres boutons ou on le place proprement
      attributionControl: false,
    });

    // Attribution discrète
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; <a href="https://openstreetmap.org" class="text-slate-500 hover:underline">OSM</a>')
      .addTo(map);

    // Tuile par défaut : CartoDB Dark Matter pour un rendu moderne
    const tileUrl =
      mapStyle === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Clic sur la carte pour définir la destination
    map.on('click', (e: L.LeafletMouseEvent) => {
      onSelectDestination({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Changement de style de carte (Dark Voyager vs OSM classique)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const tileUrl =
      mapStyle === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(mapInstanceRef.current);
  }, [mapStyle]);

  // Mise à jour du marqueur de position utilisateur
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;
    const map = mapInstanceRef.current;

    // Icône personnalisée HTML pour l'utilisateur (pulsation bleue lumineuse)
    const userHtml = `
      <div class="relative flex items-center justify-center w-7 h-7">
        <div class="absolute w-7 h-7 rounded-full bg-blue-500/30 user-pulse-marker"></div>
        <div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md shadow-blue-500/50"></div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userHtml,
      className: 'bg-transparent',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }

    // Cercle de précision GPS
    if (userAccuracy && userAccuracy > 0) {
      if (!userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
          radius: Math.min(userAccuracy, 400),
          color: '#3b82f6',
          weight: 1,
          opacity: 0.4,
          fillColor: '#60a5fa',
          fillOpacity: 0.1,
          dashArray: '3, 6',
        }).addTo(map);
      } else {
        userAccuracyCircleRef.current.setLatLng([userLocation.lat, userLocation.lng]);
        userAccuracyCircleRef.current.setRadius(Math.min(userAccuracy, 400));
      }
    }
  }, [userLocation, userAccuracy]);

  // Mise à jour du marqueur de destination et du cercle de rayon d'alerte
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (!destination) {
      // Nettoyer si aucune destination
      if (destinationMarkerRef.current) {
        map.removeLayer(destinationMarkerRef.current);
        destinationMarkerRef.current = null;
      }
      if (radiusCircleRef.current) {
        map.removeLayer(radiusCircleRef.current);
        radiusCircleRef.current = null;
      }
      if (connectingLineRef.current) {
        map.removeLayer(connectingLineRef.current);
        connectingLineRef.current = null;
      }
      return;
    }

    // Icône personnalisée de destination (Épingle rouge moderne avec ombre)
    const destHtml = `
      <div class="relative flex flex-col items-center group cursor-pointer">
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 border-2 border-white shadow-lg shadow-rose-950/40 text-white transform hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div class="w-1.5 h-1.5 bg-rose-700 rounded-full mt-0.5"></div>
      </div>
    `;

    const destIcon = L.divIcon({
      html: destHtml,
      className: 'bg-transparent',
      iconSize: [32, 40],
      iconAnchor: [16, 38],
    });

    if (!destinationMarkerRef.current) {
      const marker = L.marker([destination.lat, destination.lng], {
        icon: destIcon,
        draggable: true, // L'utilisateur peut affiner l'épingle en la glissant
        zIndexOffset: 900,
      }).addTo(map);

      marker.on('dragend', (e) => {
        const newPos = e.target.getLatLng();
        onSelectDestination({
          lat: newPos.lat,
          lng: newPos.lng,
        });
      });

      destinationMarkerRef.current = marker;
    } else {
      destinationMarkerRef.current.setLatLng([destination.lat, destination.lng]);
    }

    // Cercle de rayon d'alerte
    const isInsideRadius =
      distanceToDestination !== null && distanceToDestination <= alertRadius;

    const circleOptions: L.CircleOptions = {
      radius: alertRadius,
      color: isInsideRadius ? '#ef4444' : '#f59e0b',
      weight: 2,
      opacity: 0.8,
      fillColor: isInsideRadius ? '#f87171' : '#fbbf24',
      fillOpacity: isInsideRadius ? 0.35 : 0.18,
      dashArray: isInsideRadius ? undefined : '5, 5',
      className: isInsideRadius ? 'alert-pulse-circle' : '',
    };

    if (!radiusCircleRef.current) {
      radiusCircleRef.current = L.circle(
        [destination.lat, destination.lng],
        circleOptions
      ).addTo(map);
    } else {
      radiusCircleRef.current.setLatLng([destination.lat, destination.lng]);
      radiusCircleRef.current.setRadius(alertRadius);
      radiusCircleRef.current.setStyle(circleOptions);
    }

    // Trait reliant la position de l'utilisateur à la destination
    if (userLocation) {
      const lineCoordinates: [number, number][] = [
        [userLocation.lat, userLocation.lng],
        [destination.lat, destination.lng],
      ];

      const lineOptions: L.PolylineOptions = {
        color: isInsideRadius ? '#ef4444' : '#38bdf8',
        weight: 3,
        opacity: 0.7,
        dashArray: '4, 8',
      };

      if (!connectingLineRef.current) {
        connectingLineRef.current = L.polyline(lineCoordinates, lineOptions).addTo(map);
      } else {
        connectingLineRef.current.setLatLngs(lineCoordinates);
        connectingLineRef.current.setStyle(lineOptions);
      }
    }
  }, [destination, alertRadius, userLocation, distanceToDestination, onSelectDestination]);

  // Actions d'ajustement de vue
  const handleRecenterUser = () => {
    if (!mapInstanceRef.current || !userLocation) return;
    mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 16, {
      duration: 0.8,
    });
  };

  const handleRecenterDestination = () => {
    if (!mapInstanceRef.current || !destination) return;
    mapInstanceRef.current.flyTo([destination.lat, destination.lng], 16, {
      duration: 0.8,
    });
  };

  const handleFitBounds = () => {
    if (!mapInstanceRef.current) return;
    const points: [number, number][] = [];
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);
    if (destination) points.push([destination.lat, destination.lng]);

    if (points.length >= 2) {
      const bounds = L.latLngBounds(points);
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 17,
      });
    } else if (points.length === 1) {
      mapInstanceRef.current.flyTo(points[0], 16);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Conteneur de la carte Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Guide visuel d'aide si aucune destination choisie */}
      {!destination && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[400] pointer-events-none transition-all">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs font-medium text-slate-200">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>Touchez la carte pour placer votre destination</span>
          </div>
        </div>
      )}

      {/* Boutons d'actions rapides de carte (ergonomie mobile pouce droit) */}
      <div className="absolute right-3.5 top-20 z-[400] flex flex-col gap-2.5">
        {/* Recentrer sur ma position */}
        <button
          onClick={handleRecenterUser}
          disabled={!userLocation}
          title="Me localiser"
          className="w-11 h-11 rounded-xl bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 shadow-lg flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
        >
          <Locate className="w-5 h-5 text-blue-400" />
        </button>

        {/* Recentrer sur destination (si définie) */}
        {destination && (
          <button
            onClick={handleRecenterDestination}
            title="Aller à la destination"
            className="w-11 h-11 rounded-xl bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 shadow-lg flex items-center justify-center active:scale-95 transition-all hover:bg-slate-800"
          >
            <Navigation className="w-5 h-5 text-rose-400" />
          </button>
        )}

        {/* Vue globale (utilisateur + destination) */}
        {userLocation && destination && (
          <button
            onClick={handleFitBounds}
            title="Ajuster la vue du trajet"
            className="w-11 h-11 rounded-xl bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 shadow-lg flex items-center justify-center active:scale-95 transition-all hover:bg-slate-800"
          >
            <Eye className="w-5 h-5 text-amber-400" />
          </button>
        )}

        {/* Bascule style de carte */}
        <button
          onClick={() => setMapStyle((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          title="Changer le style de carte"
          className="w-11 h-11 rounded-xl bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 shadow-lg flex items-center justify-center active:scale-95 transition-all hover:bg-slate-800 text-xs"
        >
          <Layers className="w-5 h-5 text-slate-300" />
        </button>
      </div>
    </div>
  );
};
