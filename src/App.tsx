/**
 * arreva - Application d'alerte et réveil GPS pour les transports
 * Support Google Maps Platform & OpenStreetMap
 * Support Multilingue (Français, Anglais, Arabe), Agrandissement de texte & AdMob
 */

// Coordonnées fixes de secours (Douéra, Alger)
const fixedPosition = {
  coords: {
    latitude: 36.6833, // Latitude de Douéra
    longitude: 2.9833, // Longitude de Douéra
    accuracy: 10
  },
  timestamp: Date.now()
};

// Forcer la géolocalisation de manière globale dans l'application
if (typeof navigator !== 'undefined' && navigator.geolocation) {
  navigator.geolocation.getCurrentPosition = function(successCallback) {
    successCallback(fixedPosition as GeolocationPosition);
  };
  
  navigator.geolocation.watchPosition = function(successCallback) {
    successCallback(fixedPosition as GeolocationPosition);
    return 1; 
  };
  
  console.log("Position forcée activée sur Douéra :", fixedPosition);
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Compass,
  AlertTriangle,
  Music,
  Star,
  Map as MapIcon,
  Type,
  Megaphone,
} from 'lucide-react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { Coordinates, calculateHaversineDistance } from './utils/geo';
import { alertSystem, SoundType, SOUND_OPTIONS } from './utils/audioAlert';
import { GoogleMapComponent } from './components/GoogleMapComponent';
import { MapComponent as LeafletMapComponent } from './components/MapComponent';
import { SearchBar } from './components/SearchBar';
import { TrackingHUD } from './components/TrackingHUD';
import { AlertModal } from './components/AlertModal';
import { SoundSettingsModal } from './components/SoundSettingsModal';

export default function App() {
  // --- Intégration de l'annonce à l'ouverture (App Open Ad) ---
  useEffect(() => {
    const onDeviceReady = () => {
      const win = window as any;
      if (win.admob && win.admob.appOpenAd) {
        try {
          win.admob.appOpenAd.config({
            id: 'ca-app-pub-1050422776945344/8752251197',
            isTesting: true, // Mettez à false pour la production
            autoShow: true,  // Affichage automatique au lancement
          });
          win.admob.appOpenAd.prepare();
        } catch (e) {
          console.log("Erreur lors du chargement de l'annonce à l'ouverture :", e);
        }
      }
    };

    document.addEventListener('deviceready', onDeviceReady, false);

    // Fallback pour les tests sur navigateur web
    if (!(window as any).cordova) {
      console.log("Mode Web : Annonce à l'ouverture simulée.");
    }
  }, []);

  // Le reste de votre logique et de vos composants d'interface...
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* En-tête, cartes et HUD de l'application Arreva */}
      <header className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Compass className="text-blue-400" /> Arreva - Douéra
        </h1>
      </header>
      
      <main className="flex-1 flex flex-col p-4">
        <SearchBar />
        <div className="flex-1 my-4 bg-slate-800 rounded-lg overflow-hidden relative">
          <LeafletMapComponent />
        </div>
        <TrackingHUD />
      </main>
    </div>
  );
}
