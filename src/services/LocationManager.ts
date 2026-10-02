/**
 * LocationManager - Service centralisé de gestion de la géolocalisation GPS native
 * 
 * Responsabilités :
 * - Détection et écoute de l'état des permissions (Permissions API)
 * - Déclenchement automatique de la demande de géolocalisation au premier démarrage
 * - Récupération haute précision (enableHighAccuracy) de latitude, longitude, précision, vitesse
 * - Gestion granulaire des codes d'erreur du standard W3C (PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT)
 * - Suivi en continu (watchPosition) lors des trajets
 */

import { Coordinates } from '../utils/geo';

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface LocationData {
  coords: Coordinates;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface LocationError {
  code: number; // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT, -1 = UNSUPPORTED
  message: string;
}

export type LocationListener = (data: LocationData) => void;
export type StatusListener = (status: PermissionState) => void;
export type ErrorListener = (error: LocationError | null) => void;

class LocationManagerService {
  private permissionStatus: PermissionState = 'prompt';
  private currentLocation: LocationData | null = null;
  private currentError: LocationError | null = null;
  private isAcquiring: boolean = false;
  private watchId: number | null = null;
  private permissionStatusObj: globalThis.PermissionStatus | null = null;

  private locationListeners: Set<LocationListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();
  private initialized: boolean = false;

  constructor() {
    // Restauration de la dernière position connue pour affichage instantané au démarrage
    if (typeof window !== 'undefined') {
      try {
        if (typeof localStorage !== 'undefined') {
          const cached = localStorage.getItem('arreva_last_location');
          if (cached) {
            this.currentLocation = JSON.parse(cached);
          }
        }
      } catch (e) {
        // ignore
      }

      if (typeof document !== 'undefined') {
        document.addEventListener('deviceready', async () => {
          await this.requestCordovaPermissions();
          this.requestLocation(false).catch(() => {});
        });
      }
      this.init();
    }
  }

  /**
   * Demande les permissions Android natives si l'application s'exécute sous Cordova
   */
  public async requestCordovaPermissions(): Promise<boolean> {
    if (typeof window === 'undefined') return true;
    const cordova = (window as any).cordova;
    if (cordova && cordova.plugins && cordova.plugins.permissions) {
      const p = cordova.plugins.permissions;
      return new Promise((resolve) => {
        p.checkPermission(
          p.ACCESS_FINE_LOCATION,
          (status: any) => {
            if (status && status.hasPermission) {
              resolve(true);
            } else {
              p.requestPermissions(
                [p.ACCESS_FINE_LOCATION, p.ACCESS_COARSE_LOCATION],
                (res: any) => resolve(res && res.hasPermission),
                () => resolve(false)
              );
            }
          },
          () => resolve(false)
        );
      });
    }
    return true;
  }

  /**
   * Initialise la vérification de la permission et déclenche la demande au démarrage
   */
  public async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    if (!('geolocation' in navigator)) {
      this.updateStatus('unsupported');
      this.updateError({
        code: -1,
        message: 'La géolocalisation n\'est pas supportée par ce navigateur.',
      });
      return;
    }

    // 1. Vérification via navigator.permissions.query({ name: 'geolocation' })
    if ('permissions' in navigator && typeof navigator.permissions.query === 'function') {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        this.permissionStatusObj = status;
        this.updateStatus(status.state as PermissionState);

        // Écouter les changements en temps réel (ex: l'utilisateur débloque dans les réglages)
        status.onchange = () => {
          const nextState = status.state as PermissionState;
          this.updateStatus(nextState);
          if (nextState === 'granted') {
            this.requestLocation(false);
          } else if (nextState === 'denied') {
            this.updateError({
              code: 1,
              message: 'Permission de géolocalisation refusée dans le navigateur.',
            });
          }
        };

        // Si déjà accordé, récupérer immédiatement sans bloquer l'UI
        if (status.state === 'granted') {
          this.requestLocation(false);
          return;
        }

        // Si en attente ('prompt'), forcer la demande native immédiatement au démarrage
        if (status.state === 'prompt') {
          this.requestLocation(true);
          return;
        }

        // Si déjà refusé ('denied')
        if (status.state === 'denied') {
          this.updateError({
            code: 1,
            message: 'Permission de géolocalisation bloquée ou refusée.',
          });
          return;
        }
      } catch (err) {
        console.warn('navigator.permissions.query non disponible ou erreur:', err);
      }
    }

    // 2. Fallback direct : déclencher getCurrentPosition dès le chargement
    this.requestLocation(true);
  }

  /**
   * Demande la localisation avec l'API native navigator.geolocation.getCurrentPosition
   */
  public async requestLocation(isFirstStartup: boolean = false): Promise<LocationData> {
    if (typeof window !== 'undefined' && (window as any).cordova) {
      try {
        await this.requestCordovaPermissions();
      } catch (e) {
        // ignore
      }
    }

    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        const err: LocationError = {
          code: -1,
          message: 'La géolocalisation n\'est pas supportée.',
        };
        this.updateStatus('unsupported');
        this.updateError(err);
        reject(err);
        return;
      }

      this.isAcquiring = true;
      this.updateError(null);

      const options: PositionOptions = {
        enableHighAccuracy: true, // Force l'utilisation du récepteur GPS haute précision
        timeout: 15000,           // 15 secondes pour capter le signal satellite / borne
        maximumAge: 0,            // Pas de cache pour garantir une position instantanée
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.isAcquiring = false;
          const locData: LocationData = {
            coords: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp,
          };

          this.currentLocation = locData;
          this.updateStatus('granted');
          this.updateError(null);
          this.notifyLocation(locData);
          resolve(locData);
        },
        (error: GeolocationPositionError) => {
          this.isAcquiring = false;

          let friendlyMessage = 'Erreur lors de la récupération de la position.';
          let status: PermissionState = this.permissionStatus;

          switch (error.code) {
            case error.PERMISSION_DENIED:
              status = 'denied';
              friendlyMessage = 'Accès à la position refusé par l\'utilisateur ou le navigateur.';
              break;
            case error.POSITION_UNAVAILABLE:
              friendlyMessage = 'Signal GPS direct indisponible. Tentative réseau standard...';
              break;
            case error.TIMEOUT:
              friendlyMessage = 'Délai GPS haute précision dépassé. Tentative réseau standard...';
              break;
          }

          // Si TIMEOUT ou POSITION_UNAVAILABLE, tenter immédiatement via la géolocalisation native standard (Wi-Fi / borne)
          if ((error.code === 2 || error.code === 3) && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (posFallback) => {
                this.isAcquiring = false;
                const locData: LocationData = {
                  coords: {
                    lat: posFallback.coords.latitude,
                    lng: posFallback.coords.longitude,
                  },
                  accuracy: posFallback.coords.accuracy,
                  speed: posFallback.coords.speed,
                  heading: posFallback.coords.heading,
                  timestamp: posFallback.timestamp,
                };

                this.currentLocation = locData;
                this.updateStatus('granted');
                this.updateError(null);
                this.notifyLocation(locData);
                resolve(locData);
              },
              (fallbackErr) => {
                this.isAcquiring = false;
                const locErr: LocationError = {
                  code: fallbackErr.code,
                  message: 'Position GPS temporairement indisponible.',
                };
                this.updateStatus(status);
                this.updateError(locErr);
                reject(locErr);
              },
              { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
            );
            return;
          }

          const locErr: LocationError = {
            code: error.code,
            message: friendlyMessage,
          };

          this.updateStatus(status);
          this.updateError(locErr);
          reject(locErr);
        },
        options
      );
    });
  }

  /**
   * Démarre la surveillance continue du trajet (watchPosition)
   */
  public startWatch(onUpdate: (data: LocationData) => void): number | null {
    if (!('geolocation' in navigator)) return null;

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000,
    };

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const data: LocationData = {
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp,
        };
        this.currentLocation = data;
        this.notifyLocation(data);
        onUpdate(data);
      },
      (error) => {
        console.warn('watchPosition error:', error.message);
      },
      options
    );

    this.watchId = id;
    return id;
  }

  /**
   * Arrête la surveillance continue
   */
  public stopWatch(): void {
    if (this.watchId !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Getters
  public getStatus(): PermissionState {
    return this.permissionStatus;
  }

  public getLocation(): LocationData | null {
    return this.currentLocation;
  }

  public getError(): LocationError | null {
    return this.currentError;
  }

  public getIsAcquiring(): boolean {
    return this.isAcquiring;
  }

  // Abonnements
  public subscribeLocation(fn: LocationListener): () => void {
    this.locationListeners.add(fn);
    if (this.currentLocation) fn(this.currentLocation);
    return () => this.locationListeners.delete(fn);
  }

  public subscribeStatus(fn: StatusListener): () => void {
    this.statusListeners.add(fn);
    fn(this.permissionStatus);
    return () => this.statusListeners.delete(fn);
  }

  public subscribeError(fn: ErrorListener): () => void {
    this.errorListeners.add(fn);
    fn(this.currentError);
    return () => this.errorListeners.delete(fn);
  }

  private updateStatus(newStatus: PermissionState): void {
    if (this.permissionStatus !== newStatus) {
      this.permissionStatus = newStatus;
      this.statusListeners.forEach((fn) => fn(newStatus));
    }
  }

  private updateError(newError: LocationError | null): void {
    this.currentError = newError;
    this.errorListeners.forEach((fn) => fn(newError));
  }

  private notifyLocation(data: LocationData): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('arreva_last_location', JSON.stringify(data));
      }
    } catch (e) {
      // ignore
    }
    this.locationListeners.forEach((fn) => fn(data));
  }
}

// Instance singleton
export const locationManager = new LocationManagerService();
