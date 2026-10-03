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

  private passiveWatchId: number | null = null;
  private retryTimeoutId: any = null;

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
          this.requestLocation().catch(() => {});
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
   * Démarre une surveillance passive permanente en arrière-plan
   */
  public startPassiveWatcher(): void {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return;
    if (this.passiveWatchId !== null) return;

    try {
      this.passiveWatchId = navigator.geolocation.watchPosition(
        (pos) => {
          const locData: LocationData = {
            coords: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            },
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            timestamp: pos.timestamp,
          };
          this.currentLocation = locData;
          this.isAcquiring = false;
          this.updateStatus('granted');
          this.updateError(null);
          this.notifyLocation(locData);
        },
        (err) => {
          if (err.code === 1) {
            this.updateStatus('denied');
            this.updateError({
              code: 1,
              message: 'Permission GPS refusée. Veuillez autoriser la localisation.',
            });
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 25000,
          maximumAge: 10000,
        }
      );
    } catch (e) {
      console.warn('Erreur lors du démarrage du watcher passif:', e);
    }
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

    // Démarre la surveillance passive permanente
    this.startPassiveWatcher();

    // 1. Vérification via navigator.permissions.query({ name: 'geolocation' })
    if ('permissions' in navigator && typeof navigator.permissions.query === 'function') {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        this.permissionStatusObj = status;
        this.updateStatus(status.state as PermissionState);

        status.onchange = () => {
          const nextState = status.state as PermissionState;
          this.updateStatus(nextState);
          if (nextState === 'granted') {
            this.requestLocation().catch(() => {});
          } else if (nextState === 'denied') {
            this.updateError({
              code: 1,
              message: 'Permission de géolocalisation refusée dans le navigateur.',
            });
          }
        };

        if (status.state === 'granted') {
          this.requestLocation().catch(() => {});
          return;
        }

        if (status.state === 'prompt') {
          this.requestLocation().catch(() => {});
          return;
        }

        if (status.state === 'denied') {
          this.updateError({
            code: 1,
            message: 'Permission de géolocalisation bloquée ou refusée.',
          });
          return;
        }
      } catch (err) {
        console.warn('navigator.permissions.query non disponible:', err);
      }
    }

    // 2. Fallback direct : déclencher requestLocation dès le chargement
    this.requestLocation().catch(() => {});
  }

  /**
   * Demande la localisation avec stratégie en cascade ultra-résiliente :
   * 1. Tentative rapide via le fournisseur réseau/cellules (instantané sur mobile)
   * 2. Affinage haute précision par satellite
   * 3. Réessai automatique sans bloquer l'interface
   */
  public async requestLocation(): Promise<LocationData> {
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
          message: 'La géolocalisation n\'est pas supportée sur cet appareil.',
        };
        this.updateStatus('unsupported');
        this.updateError(err);
        reject(err);
        return;
      }

      this.isAcquiring = true;
      this.startPassiveWatcher();

      let resolved = false;

      // Niveau 1 : Position réseau / Wi-Fi / antennes (réponse ultra-rapide 50ms sur mobile)
      navigator.geolocation.getCurrentPosition(
        (fastPosition) => {
          const locData: LocationData = {
            coords: {
              lat: fastPosition.coords.latitude,
              lng: fastPosition.coords.longitude,
            },
            accuracy: fastPosition.coords.accuracy,
            speed: fastPosition.coords.speed,
            heading: fastPosition.coords.heading,
            timestamp: fastPosition.timestamp,
          };

          this.currentLocation = locData;
          this.isAcquiring = false;
          this.updateStatus('granted');
          this.updateError(null);
          this.notifyLocation(locData);

          if (!resolved) {
            resolved = true;
            resolve(locData);
          }
        },
        () => {
          // Si le cache réseau rapide échoue, le niveau 2 satellite prend le relais
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );

      // Niveau 2 : Position GPS haute précision par satellite
      navigator.geolocation.getCurrentPosition(
        (gpsPosition) => {
          const locData: LocationData = {
            coords: {
              lat: gpsPosition.coords.latitude,
              lng: gpsPosition.coords.longitude,
            },
            accuracy: gpsPosition.coords.accuracy,
            speed: gpsPosition.coords.speed,
            heading: gpsPosition.coords.heading,
            timestamp: gpsPosition.timestamp,
          };

          this.currentLocation = locData;
          this.isAcquiring = false;
          this.updateStatus('granted');
          this.updateError(null);
          this.notifyLocation(locData);

          if (!resolved) {
            resolved = true;
            resolve(locData);
          }
        },
        (error: GeolocationPositionError) => {
          // Si on a déjà une position via le niveau 1 ou le cache, ne pas afficher d'erreur
          if (resolved || this.currentLocation) {
            this.isAcquiring = false;
            return;
          }

          this.isAcquiring = false;
          let friendlyMessage = 'Recherche du signal GPS...';
          let status: PermissionState = this.permissionStatus;

          switch (error.code) {
            case error.PERMISSION_DENIED:
              status = 'denied';
              friendlyMessage = 'Accès GPS refusé. Veuillez autoriser la localisation.';
              break;
            case error.POSITION_UNAVAILABLE:
              friendlyMessage = 'Localisation désactivée sur votre téléphone. Activez le GPS dans les réglages rapides.';
              break;
            case error.TIMEOUT:
              friendlyMessage = 'Recherche des satellites... Réessai automatique.';
              // Réessayer automatiquement après 3 secondes
              if (this.retryTimeoutId) clearTimeout(this.retryTimeoutId);
              this.retryTimeoutId = setTimeout(() => {
                if (!this.currentLocation) {
                  this.requestLocation().catch(() => {});
                }
              }, 3000);
              break;
          }

          const locErr: LocationError = {
            code: error.code,
            message: friendlyMessage,
          };

          this.updateStatus(status);
          this.updateError(locErr);
          reject(locErr);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
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
