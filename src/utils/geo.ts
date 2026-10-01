/**
 * Utilitaires géographiques et calculs GPS (Formule de Haversine)
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  displayName: string;
  lat: number;
  lng: number;
  type?: string;
}

/**
 * Calcule la distance orthodromique entre deux points géographiques
 * en mètres à l'aide de la formule de Haversine.
 * 
 * @param lat1 Latitude du point 1 en degrés
 * @param lon1 Longitude du point 1 en degrés
 * @param lat2 Latitude du point 2 en degrés
 * @param lon2 Longitude du point 2 en degrés
 * @returns Distance en mètres
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_METERS = 6371000; // Rayon moyen de la Terre en mètres

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Formate une distance en mètres vers une chaîne lisible (m ou km)
 */
export function formatDistance(meters: number | null | undefined): {
  value: string;
  unit: string;
  full: string;
} {
  if (meters === null || meters === undefined || isNaN(meters)) {
    return { value: '--', unit: '', full: '--' };
  }

  if (meters < 1000) {
    const formatted = Math.max(0, Math.round(meters));
    return {
      value: `${formatted}`,
      unit: 'm',
      full: `${formatted} m`,
    };
  }

  const km = (meters / 1000).toFixed(1);
  return {
    value: km,
    unit: 'km',
    full: `${km} km`,
  };
}

/**
 * Formate la vitesse en km/h
 */
export function formatSpeed(speedMetersPerSec: number | null | undefined): string {
  if (speedMetersPerSec === null || speedMetersPerSec === undefined || speedMetersPerSec < 0.5) {
    return '0 km/h';
  }
  const kmh = Math.round(speedMetersPerSec * 3.6);
  return `${kmh} km/h`;
}

/**
 * Estime le temps restant pour atteindre la zone d'alerte ou la destination
 * @param distanceRemainingMeters Distance restante jusqu'au rayon ou à la destination
 * @param currentSpeedMps Vitesse actuelle en m/s (optionnelle)
 */
export function estimateRemainingTime(
  distanceRemainingMeters: number,
  currentSpeedMps?: number | null
): string {
  if (distanceRemainingMeters <= 0) {
    return 'Arrivée immédiate';
  }

  // Utiliser la vitesse actuelle si >= 5 km/h (1.4 m/s), sinon estimation type transport en commun urbain (~30 km/h = 8.3 m/s)
  const effectiveSpeed = (currentSpeedMps && currentSpeedMps > 1.4) ? currentSpeedMps : 8.3;
  const seconds = Math.round(distanceRemainingMeters / effectiveSpeed);

  if (seconds < 60) {
    return '< 1 min';
  }

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `~${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `~${hours}h ${remainingMins}m`;
}

/**
 * Recherche d'adresse via l'API Nominatim d'OpenStreetMap (gratuite & sans clé)
 */
export async function searchLocation(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const encoded = encodeURIComponent(query.trim());
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=5&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'fr,en',
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.map((item: any) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
    }));
  } catch (error) {
    console.warn('Erreur de recherche géocodage:', error);
    return [];
  }
}
