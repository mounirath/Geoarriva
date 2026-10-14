import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Coordinates, formatDistance, estimateRemainingTime } from '../utils/geo';
import { routingService, RouteResult } from '../services/RoutingService';
import {
  Navigation,
  Locate,
  Eye,
  Layers,
  Route,
  Compass,
  ArrowRight,
  EyeOff,
  Bus,
  X,
  Loader2,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Translations } from '../utils/i18n';
import { BusTraceRecord } from '../services/BusTraceService';

// Clé API CARTO Basemaps officielle configurée
export const CARTO_API_KEY =
  (import.meta as any).env?.VITE_CARTO_API_KEY ||
  'cb1_48if_1_e850e696c73ebaf5c2079f48';

export const getCartoTileUrl = (style: 'voyager' | 'dark' = 'voyager') => {
  if (style === 'dark') {
    return `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`;
  }
  return `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`;
};

interface MapComponentProps {
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

export const MapComponent: React.FC<MapComponentProps> = ({
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  // Calques de tracé de trajet
  const routeGlowLineRef = useRef<L.Polyline | null>(null);
  const routeCoreLineRef = useRef<L.Polyline | null>(null);
  const traveledPathLineRef = useRef<L.Polyline | null>(null);
  const busTraceGlowLineRef = useRef<L.Polyline | null>(null);
  const busTraceCoreLineRef = useRef<L.Polyline | null>(null);
  const busTraceStartMarkerRef = useRef<L.Marker | null>(null);
  const busTraceEndMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapStyle, setMapStyle] = useState<'voyager' | 'dark'>('voyager');
  const [showRouteLine, setShowRouteLine] = useState<boolean>(true);
  const [routeMode, setRouteMode] = useState<'road' | 'direct'>('road');
  const [routeData, setRouteData] = useState<RouteResult | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState<boolean>(false);

  // Historique des points parcourus pendant le suivi actif
  const traveledCoordsRef = useRef<Coordinates[]>([]);
  const hasAutoCenteredRef = useRef<boolean>(false);
  const prevTrackingRef = useRef<boolean>(false);

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
      zoomControl: false,
      attributionControl: false,
    });

    // Attribution discrète
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('&copy; <a href="https://carto.com/" target="_blank" rel="noopener" class="text-slate-500 hover:underline">CARTO</a> &copy; <a href="https://openstreetmap.org" class="text-slate-500 hover:underline">OSM</a>')
      .addTo(map);

    // Tuile par défaut : CartoDB Voyager avec clé API officielle
    const tileUrl = getCartoTileUrl(mapStyle);

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

  // Changement de style de carte (Voyager vs Dark)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const tileUrl = getCartoTileUrl(mapStyle);

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(mapInstanceRef.current);
  }, [mapStyle]);

  // Affichage du tracé historique de ligne de bus sélectionné
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Nettoyer les anciens calques du tracé de bus
    if (busTraceGlowLineRef.current) {
      map.removeLayer(busTraceGlowLineRef.current);
      busTraceGlowLineRef.current = null;
    }
    if (busTraceCoreLineRef.current) {
      map.removeLayer(busTraceCoreLineRef.current);
      busTraceCoreLineRef.current = null;
    }
    if (busTraceStartMarkerRef.current) {
      map.removeLayer(busTraceStartMarkerRef.current);
      busTraceStartMarkerRef.current = null;
    }
    if (busTraceEndMarkerRef.current) {
      map.removeLayer(busTraceEndMarkerRef.current);
      busTraceEndMarkerRef.current = null;
    }

    if (!activeBusTrace) return;

    const coords =
      activeBusTrace.coordinates && activeBusTrace.coordinates.length >= 2
        ? activeBusTrace.coordinates
        : [activeBusTrace.startPoint, activeBusTrace.destinationPoint];

    const latlngs: [number, number][] = coords.map((c) => [c.lat, c.lng]);
    const busColor = activeBusTrace.color || '#2563eb';

    // 1. Halo lumineux
    busTraceGlowLineRef.current = L.polyline(latlngs, {
      color: busColor,
      weight: 12,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // 2. Ligne centrale haute visibilité avec tirets
    busTraceCoreLineRef.current = L.polyline(latlngs, {
      color: busColor,
      weight: 5.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: '8, 8',
    }).addTo(map);

    // 3. Marqueur arrêt de départ
    const startIcon = L.divIcon({
      className: 'bus-trace-pin-start',
      html: `<div style="background-color: ${busColor}; color: white; border-radius: 9999px; padding: 4px 8px; font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; gap: 4px; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.5); white-space: nowrap;"><span style="background: white; color: ${busColor}; border-radius: 4px; padding: 1px 4px; font-size: 10px;">${activeBusTrace.busLine}</span> Départ</div>`,
      iconSize: [86, 28],
      iconAnchor: [43, 14],
    });
    busTraceStartMarkerRef.current = L.marker(
      [activeBusTrace.startPoint.lat, activeBusTrace.startPoint.lng],
      { icon: startIcon }
    ).addTo(map);

    // 4. Marqueur terminus
    const endIcon = L.divIcon({
      className: 'bus-trace-pin-end',
      html: `<div style="background-color: #dc2626; color: white; border-radius: 9999px; padding: 4px 8px; font-weight: 800; font-size: 11px; display: inline-flex; align-items: center; gap: 4px; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.5); white-space: nowrap;"><span style="background: white; color: #dc2626; border-radius: 4px; padding: 1px 4px; font-size: 10px;">🏁</span> Terminus</div>`,
      iconSize: [92, 28],
      iconAnchor: [46, 14],
    });
    busTraceEndMarkerRef.current = L.marker(
      [activeBusTrace.destinationPoint.lat, activeBusTrace.destinationPoint.lng],
      { icon: endIcon }
    ).addTo(map);

    // Cadrage automatique de la vue sur l'intégralité du tracé de bus
    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds, {
      paddingTopLeft: [70, 40],
      paddingBottomRight: [40, 160],
      maxZoom: 16,
    });
  }, [activeBusTrace]);

  // Réinitialiser ou accumuler l'historique du trajet parcouru
  useEffect(() => {
    if (!isTracking) {
      traveledCoordsRef.current = [];
      if (traveledPathLineRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(traveledPathLineRef.current);
        traveledPathLineRef.current = null;
      }
    } else if (userLocation) {
      const prev = traveledCoordsRef.current;
      const last = prev[prev.length - 1];
      if (!last || Math.abs(last.lat - userLocation.lat) > 0.00008 || Math.abs(last.lng - userLocation.lng) > 0.00008) {
        traveledCoordsRef.current = [...prev, userLocation];
      }
    }
  }, [isTracking, userLocation]);

  // Mise à jour du tracé de l'historique parcouru (Breadcrumbs)
  useEffect(() => {
    if (!mapInstanceRef.current || !isTracking || traveledCoordsRef.current.length < 2) {
      if (traveledPathLineRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(traveledPathLineRef.current);
        traveledPathLineRef.current = null;
      }
      return;
    }

    const map = mapInstanceRef.current;
    const latlngs: [number, number][] = traveledCoordsRef.current.map((c) => [c.lat, c.lng]);

    if (!traveledPathLineRef.current) {
      traveledPathLineRef.current = L.polyline(latlngs, {
        color: '#10b981', // Vert émeraude lumineux pour le parcours déjà réalisé
        weight: 3.5,
        opacity: 0.8,
        dashArray: '2, 6',
      }).addTo(map);
    } else {
      traveledPathLineRef.current.setLatLngs(latlngs);
    }
  }, [isTracking, userLocation]);

  // Calcul du tracé de route (OSM/OSRM ou direct)
  useEffect(() => {
    if (!userLocation || !destination) {
      setRouteData(null);
      return;
    }

    let isMounted = true;
    setIsRouteLoading(true);

    routingService
      .getRoute(userLocation, destination, routeMode === 'direct')
      .then((res) => {
        if (isMounted) {
          setRouteData(res);
          setIsRouteLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsRouteLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userLocation?.lat, userLocation?.lng, destination?.lat, destination?.lng, routeMode]);

  // Cadrage automatique de la caméra dès que le suivi est lancé
  useEffect(() => {
    if (isTracking && !prevTrackingRef.current && userLocation && destination && mapInstanceRef.current) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        [destination.lat, destination.lng],
      ]);
      mapInstanceRef.current.fitBounds(bounds, {
        paddingTopLeft: [70, 40],
        paddingBottomRight: [40, 160],
        maxZoom: 16,
      });
    }
    prevTrackingRef.current = isTracking;
  }, [isTracking, userLocation, destination]);

  // Mise à jour du marqueur de position utilisateur GPS
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Si pas de localisation, nettoyer les calques
    if (!userLocation) {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (userAccuracyCircleRef.current) {
        map.removeLayer(userAccuracyCircleRef.current);
        userAccuracyCircleRef.current = null;
      }
      return;
    }

    // Icône personnalisée HTML haute visibilité avec balise radar et badge descriptif
    const userHtml = `
      <div class="relative flex flex-col items-center select-none cursor-pointer">
        <div class="bg-blue-600/95 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-lg border border-white/90 whitespace-nowrap mb-1 tracking-wide backdrop-blur-md flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
          <span>Position GPS</span>
        </div>
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 user-pulse-marker"></div>
          <div class="absolute w-7 h-7 rounded-full bg-sky-400/50 gps-beacon-ring"></div>
          <div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-xl shadow-blue-500/80"></div>
        </div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userHtml,
      className: 'bg-transparent',
      iconSize: [110, 48],
      iconAnchor: [55, 40],
    });

    const popupHtml = `
      <div style="font-family: inherit; font-size: 12px; min-width: 180px; padding: 2px;">
        <div style="font-weight: 800; color: #2563eb; display: flex; align-items: center; gap: 4px; font-size: 13px;">
          📍 Position GPS actuelle
        </div>
        <div style="margin-top: 4px; font-family: monospace; font-size: 11px; color: #1e293b; background: #f1f5f9; padding: 4px 6px; border-radius: 6px; border: 1px solid #e2e8f0;">
          ${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}
        </div>
        ${
          userAccuracy
            ? `<div style="margin-top: 4px; font-size: 11px; color: #64748b;">Précision estimée : <b style="color: #0f172a;">±${Math.round(userAccuracy)} m</b></div>`
            : ''
        }
      </div>
    `;

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup(popupHtml);
    } else {
      userMarkerRef.current.setIcon(userIcon);
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      userMarkerRef.current.setPopupContent(popupHtml);
    }

    // Cercle de précision GPS
    if (userAccuracy && userAccuracy > 0) {
      if (!userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
          radius: Math.min(userAccuracy, 400),
          color: '#3b82f6',
          weight: 1.5,
          opacity: 0.5,
          fillColor: '#60a5fa',
          fillOpacity: 0.12,
          dashArray: '4, 6',
        }).addTo(map);
      } else {
        userAccuracyCircleRef.current.setLatLng([userLocation.lat, userLocation.lng]);
        userAccuracyCircleRef.current.setRadius(Math.min(userAccuracy, 400));
      }
    } else if (userAccuracyCircleRef.current) {
      map.removeLayer(userAccuracyCircleRef.current);
      userAccuracyCircleRef.current = null;
    }
  }, [userLocation, userAccuracy]);

  // Mise à jour du marqueur de destination et du cercle d'alerte
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
        draggable: !isTracking, // Verrouillé pendant le suivi actif pour éviter les erreurs de manipulation
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
  }, [destination, alertRadius, distanceToDestination, isTracking, onSelectDestination]);

  // Tracé de la ligne de trajet (Glow + Core animé vers la destination)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    // Si pas de destination ou si désactivé par l'utilisateur
    if (!destination || !userLocation || !showRouteLine) {
      if (routeGlowLineRef.current) {
        map.removeLayer(routeGlowLineRef.current);
        routeGlowLineRef.current = null;
      }
      if (routeCoreLineRef.current) {
        map.removeLayer(routeCoreLineRef.current);
        routeCoreLineRef.current = null;
      }
      return;
    }

    const isInsideRadius =
      distanceToDestination !== null && distanceToDestination <= alertRadius;

    // Points de coordonnées : itinéraire calculé ou ligne directe
    const points: [number, number][] =
      routeData && routeData.coordinates.length >= 2
        ? routeData.coordinates.map((c) => [c.lat, c.lng])
        : [
            [userLocation.lat, userLocation.lng],
            [destination.lat, destination.lng],
          ];

    // 1. Ligne de halo / Glow (dessous)
    const glowColor = isInsideRadius ? '#ef4444' : '#0284c7';
    const glowWeight = isTracking ? 8 : 5;
    const glowOpacity = isTracking ? 0.45 : 0.25;

    if (!routeGlowLineRef.current) {
      routeGlowLineRef.current = L.polyline(points, {
        color: glowColor,
        weight: glowWeight,
        opacity: glowOpacity,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    } else {
      routeGlowLineRef.current.setLatLngs(points);
      routeGlowLineRef.current.setStyle({
        color: glowColor,
        weight: glowWeight,
        opacity: glowOpacity,
      });
    }

    // 2. Ligne centrale active avec animation de flux
    const coreColor = isInsideRadius ? '#f87171' : '#38bdf8';
    const coreWeight = isTracking ? 4.5 : 3;
    const coreDash = isTracking ? '8, 12' : '4, 8';

    if (!routeCoreLineRef.current) {
      routeCoreLineRef.current = L.polyline(points, {
        color: coreColor,
        weight: coreWeight,
        opacity: 0.95,
        dashArray: coreDash,
        className: isTracking ? 'route-trace-animated route-trace-glow' : '',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    } else {
      routeCoreLineRef.current.setLatLngs(points);
      routeCoreLineRef.current.setStyle({
        color: coreColor,
        weight: coreWeight,
        dashArray: coreDash,
        className: isTracking ? 'route-trace-animated route-trace-glow' : '',
      });
    }
  }, [
    destination,
    userLocation,
    showRouteLine,
    routeData,
    isTracking,
    distanceToDestination,
    alertRadius,
  ]);

  // Auto-centrage à la première détection de position GPS
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;
    if (!hasAutoCenteredRef.current) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 16, {
        duration: 1.2,
      });
      hasAutoCenteredRef.current = true;
    }
  }, [userLocation]);

  // Actions de caméra
  const handleRecenterUser = () => {
    if (!mapInstanceRef.current || !userLocation) {
      if (onRequestLocation) {
        onRequestLocation();
      } else {
        onOpenGpsDetails?.();
      }
      return;
    }
    mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 16, {
      duration: 1.0,
    });
    if (userMarkerRef.current) {
      userMarkerRef.current.openPopup();
    }
  };

  const handleRecenterDestination = () => {
    if (!mapInstanceRef.current || !destination) return;
    mapInstanceRef.current.flyTo([destination.lat, destination.lng], 16, {
      duration: 0.8,
    });
  };

  const handleFitBounds = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const points: [number, number][] = [];
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);
    if (destination) points.push([destination.lat, destination.lng]);

    if (points.length >= 2) {
      const bounds = L.latLngBounds(points);
      mapInstanceRef.current.fitBounds(bounds, {
        paddingTopLeft: [80, 50],
        paddingBottomRight: [50, 180],
        maxZoom: 16,
      });
    } else if (points.length === 1) {
      mapInstanceRef.current.flyTo(points[0], 16);
    }
  }, [userLocation, destination]);

  const toggleRouteMode = () => {
    setRouteMode((prev) => (prev === 'road' ? 'direct' : 'road'));
  };

  const formattedDist = formatDistance(distanceToDestination);
  const etaText =
    distanceToDestination !== null
      ? estimateRemainingTime(distanceToDestination)
      : null;

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Conteneur de la carte Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Guide visuel d'aide si aucune destination choisie */}
      {!destination && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[400] pointer-events-none transition-all hidden sm:block">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs font-medium text-slate-200">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>{t.tapMapToSetDest}</span>
          </div>
        </div>
      )}

      {/* Bandeau d'information du tracé actif (Visible quand le suivi est lancé) */}
      {isTracking && destination && userLocation && showRouteLine && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[400] w-[92%] max-w-sm pointer-events-auto">
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
                onClick={toggleRouteMode}
                title={routeMode === 'road' ? t.directRoute : t.roadRoute}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 active:scale-95 transition-all text-[10px] font-medium flex items-center gap-1 border border-slate-700/60"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
              </button>
              <button
                type="button"
                onClick={handleFitBounds}
                title={t.fitView}
                className="p-1.5 rounded-lg bg-sky-600/30 hover:bg-sky-600/40 text-sky-200 active:scale-95 transition-all border border-sky-500/30"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bandeau d'information du tracé de ligne de bus sélectionné */}
      {activeBusTrace && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[400] w-[94%] max-w-md pointer-events-auto animate-fade-in">
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


      {/* Pastille flottante de position GPS sur la carte */}
      <div className="absolute top-20 left-3 z-[400] max-w-[85%] sm:max-w-sm pointer-events-auto animate-fade-in">
        {userLocation ? (
          <button
            type="button"
            onClick={handleRecenterUser}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white backdrop-blur-md border border-blue-500/50 shadow-xl text-xs transition-all active:scale-95 group"
            title="Position GPS active · Cliquer pour recentrer"
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

      {/* Boutons d'actions rapides de carte (ergonomie pouce mobile, au-dessus du tiroir bas) */}
      <div className="absolute right-3.5 bottom-20 sm:bottom-20 z-[400] flex flex-col gap-2 pointer-events-auto">
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
            title={t.goToDest}
            className="w-11 h-11 rounded-2xl bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 shadow-xl flex items-center justify-center active:scale-95 transition-all hover:bg-slate-800"
          >
            <Navigation className="w-5 h-5 text-rose-400" />
          </button>
        )}

        {/* Bouton bascule du tracé de ligne */}
        {destination && userLocation && (
          <button
            onClick={() => setShowRouteLine((prev) => !prev)}
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
            title={t.fitView}
            className="w-11 h-11 rounded-2xl bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 shadow-xl flex items-center justify-center active:scale-95 transition-all hover:bg-slate-800"
          >
            <Eye className="w-5 h-5 text-amber-400" />
          </button>
        )}

        {/* Bascule style de carte (Voyager / Dark) */}
        <button
          onClick={() => setMapStyle((prev) => (prev === 'voyager' ? 'dark' : 'voyager'))}
          title={t.changeMapStyle}
          className="w-11 h-11 rounded-2xl bg-slate-900/90 text-white backdrop-blur-md border border-slate-700/80 shadow-xl flex items-center justify-center active:scale-95 transition-all hover:bg-slate-800 text-xs"
        >
          <Layers className="w-5 h-5 text-slate-300" />
        </button>
      </div>
    </div>
  );
};
