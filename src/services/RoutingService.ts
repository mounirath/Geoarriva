import { Coordinates, calculateHaversineDistance } from '../utils/geo';

export interface RouteResult {
  coordinates: Coordinates[];
  distanceMeters: number;
  durationSeconds: number;
  isRoadRoute: boolean;
}

class RoutingService {
  private cache: Map<string, RouteResult> = new Map();

  private getCacheKey(origin: Coordinates, destination: Coordinates): string {
    const oLat = origin.lat.toFixed(4);
    const oLng = origin.lng.toFixed(4);
    const dLat = destination.lat.toFixed(4);
    const dLng = destination.lng.toFixed(4);
    return `${oLat},${oLng}->${dLat},${dLng}`;
  }

  /**
   * Calcule le tracé d'itinéraire entre deux points.
   * Utilise l'API OSRM avec repli immédiat sur ligne directe en cas d'erreur ou d'absence de réseau.
   */
  async getRoute(
    origin: Coordinates,
    destination: Coordinates,
    forceDirectLine: boolean = false
  ): Promise<RouteResult> {
    const directDistance = calculateHaversineDistance(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng
    );

    const directFallback: RouteResult = {
      coordinates: [origin, destination],
      distanceMeters: directDistance,
      durationSeconds: Math.round(directDistance / 10), // ~36 km/h
      isRoadRoute: false,
    };

    if (forceDirectLine) {
      return directFallback;
    }

    const cacheKey = this.getCacheKey(origin, destination);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return directFallback;
      }

      const data = await response.json();
      if (
        data.code === 'Ok' &&
        data.routes &&
        data.routes.length > 0 &&
        data.routes[0].geometry?.coordinates
      ) {
        const route = data.routes[0];
        const coordinates: Coordinates[] = route.geometry.coordinates.map(
          (point: [number, number]) => ({
            lat: point[1],
            lng: point[0],
          })
        );

        const result: RouteResult = {
          coordinates: coordinates.length >= 2 ? coordinates : [origin, destination],
          distanceMeters: Math.round(route.distance || directDistance),
          durationSeconds: Math.round(route.duration || directDistance / 10),
          isRoadRoute: true,
        };

        // Conserver dans le cache
        if (this.cache.size > 50) {
          const firstKey = this.cache.keys().next().value;
          if (firstKey) this.cache.delete(firstKey);
        }
        this.cache.set(cacheKey, result);

        return result;
      }

      return directFallback;
    } catch {
      // En cas de coupure réseau ou délai, utiliser le tracé direct sans bloquer l'interface
      return directFallback;
    }
  }
}

export const routingService = new RoutingService();
