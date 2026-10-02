import { useState, useEffect, useCallback } from 'react';
import {
  locationManager,
  PermissionState,
  LocationData,
  LocationError,
} from '../services/LocationManager';
import { Coordinates } from '../utils/geo';

export interface UseLocationManagerReturn {
  location: Coordinates | null;
  accuracy: number | null;
  speed: number | null;
  timestamp: number | null;
  permissionStatus: PermissionState;
  isLoading: boolean;
  error: LocationError | null;
  isRealGps: boolean;
  requestLocation: () => Promise<LocationData>;
  startWatch: (onUpdate: (data: LocationData) => void) => void;
  stopWatch: () => void;
}

export function useLocationManager(): UseLocationManagerReturn {
  const [locationData, setLocationData] = useState<LocationData | null>(() =>
    locationManager.getLocation()
  );
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>(() =>
    locationManager.getStatus()
  );
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    locationManager.getIsAcquiring()
  );
  const [error, setError] = useState<LocationError | null>(() =>
    locationManager.getError()
  );

  useEffect(() => {
    // S'abonner aux changements du LocationManager
    const unsubLoc = locationManager.subscribeLocation((data) => {
      setLocationData(data);
      setIsLoading(false);
    });

    const unsubStatus = locationManager.subscribeStatus((status) => {
      setPermissionStatus(status);
    });

    const unsubError = locationManager.subscribeError((err) => {
      setError(err);
      setIsLoading(false);
    });

    // Lancer immédiatement la vérification/demande au montage
    locationManager.init();

    return () => {
      unsubLoc();
      unsubStatus();
      unsubError();
    };
  }, []);

  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await locationManager.requestLocation(false);
      setLocationData(data);
      setIsLoading(false);
      return data;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  }, []);

  const startWatch = useCallback((onUpdate: (data: LocationData) => void) => {
    locationManager.startWatch((data) => {
      setLocationData(data);
      onUpdate(data);
    });
  }, []);

  const stopWatch = useCallback(() => {
    locationManager.stopWatch();
  }, []);

  return {
    location: locationData ? locationData.coords : null,
    accuracy: locationData ? locationData.accuracy : null,
    speed: locationData ? locationData.speed : null,
    timestamp: locationData ? locationData.timestamp : null,
    permissionStatus,
    isLoading,
    error,
    isRealGps: !!locationData && permissionStatus === 'granted',
    requestLocation,
    startWatch,
    stopWatch,
  };
}
