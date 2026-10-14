import { Coordinates, calculateHaversineDistance } from '../utils/geo';

export interface BusTraceRecord {
  id: string;
  busLine: string; // ex: "38", "91", "42", "N01"
  name: string; // Titre du trajet ex: "Gare du Nord ➔ Porte d'Orléans"
  color: string; // Couleur thématique de la ligne de bus (HEX)
  date: number; // Horodatage en ms
  durationSeconds: number; // Durée en secondes
  distanceMeters: number; // Distance parcourue en mètres
  startPoint: {
    name: string;
    lat: number;
    lng: number;
  };
  destinationPoint: {
    name: string;
    lat: number;
    lng: number;
  };
  coordinates: Coordinates[]; // Points GPS réels du tracé
  avgSpeedKmh?: number; // Vitesse moyenne en km/h
  maxSpeedKmh?: number; // Vitesse max en km/h
  notes?: string;
}

const STORAGE_KEY = 'transit_bus_traces_history';

// Tracés d'exemples urbains réalistes pré-enregistrés
const INITIAL_BUS_TRACES: BusTraceRecord[] = [
  {
    id: 'sample-bus-38',
    busLine: '38',
    name: "Gare du Nord ➔ Porte d'Orléans",
    color: '#2563eb', // Bleu RATP
    date: Date.now() - 1000 * 60 * 60 * 4, // Il y a 4 heures
    durationSeconds: 1680, // 28 min
    distanceMeters: 6420,
    avgSpeedKmh: 14.8,
    maxSpeedKmh: 38.5,
    startPoint: {
      name: 'Gare du Nord (Départ)',
      lat: 48.8809,
      lng: 2.3553,
    },
    destinationPoint: {
      name: "Porte d'Orléans (Terminus)",
      lat: 48.8236,
      lng: 2.3255,
    },
    coordinates: [
      { lat: 48.8809, lng: 2.3553 },
      { lat: 48.8755, lng: 2.3562 },
      { lat: 48.8688, lng: 2.3534 },
      { lat: 48.8612, lng: 2.3498 },
      { lat: 48.8534, lng: 2.3475 },
      { lat: 48.8475, lng: 2.3412 },
      { lat: 48.8398, lng: 2.3365 },
      { lat: 48.8312, lng: 2.3308 },
      { lat: 48.8236, lng: 2.3255 },
    ],
    notes: 'Ligne directe à travers le centre, passage par Châtelet et Denfert-Rochereau.',
  },
  {
    id: 'sample-bus-91',
    busLine: '91',
    name: 'Gare Montparnasse ➔ Bastille',
    color: '#059669', // Vert émeraude
    date: Date.now() - 1000 * 60 * 60 * 26, // Hier
    durationSeconds: 1320, // 22 min
    distanceMeters: 4850,
    avgSpeedKmh: 15.6,
    maxSpeedKmh: 42.0,
    startPoint: {
      name: 'Gare Montparnasse',
      lat: 48.8412,
      lng: 2.3205,
    },
    destinationPoint: {
      name: 'Place de la Bastille',
      lat: 48.8531,
      lng: 2.3698,
    },
    coordinates: [
      { lat: 48.8412, lng: 2.3205 },
      { lat: 48.8392, lng: 2.3332 },
      { lat: 48.8378, lng: 2.3495 },
      { lat: 48.8425, lng: 2.3618 },
      { lat: 48.8485, lng: 2.3685 },
      { lat: 48.8531, lng: 2.3698 },
    ],
    notes: 'Liaison rive gauche vers rive droite via Gobelins et Gare de Lyon.',
  },
  {
    id: 'sample-bus-72',
    busLine: '72',
    name: 'Hôtel de Ville ➔ Tour Eiffel',
    color: '#d97706', // Ambre / Or
    date: Date.now() - 1000 * 60 * 60 * 52, // Il y a 2 jours
    durationSeconds: 1540, // 25 min
    distanceMeters: 5600,
    avgSpeedKmh: 16.2,
    maxSpeedKmh: 44.0,
    startPoint: {
      name: 'Hôtel de Ville de Paris',
      lat: 48.8566,
      lng: 2.3522,
    },
    destinationPoint: {
      name: 'Tour Eiffel / Pont d’Iéna',
      lat: 48.8584,
      lng: 2.2945,
    },
    coordinates: [
      { lat: 48.8566, lng: 2.3522 },
      { lat: 48.8588, lng: 2.3421 },
      { lat: 48.8615, lng: 2.3325 },
      { lat: 48.8642, lng: 2.3201 },
      { lat: 48.8621, lng: 2.3055 },
      { lat: 48.8584, lng: 2.2945 },
    ],
    notes: 'Trajet longeant les quais de Seine avec vue panoramique.',
  },
];

export const BUS_LINE_COLORS = [
  { label: 'Bleu Express', hex: '#2563eb' },
  { label: 'Vert Émeraude', hex: '#059669' },
  { label: 'Ambre / Or', hex: '#d97706' },
  { label: 'Rouge Tram/Bus', hex: '#dc2626' },
  { label: 'Pourpre', hex: '#9333ea' },
  { label: 'Cyan / Azur', hex: '#0284c7' },
  { label: 'Rose Rubis', hex: '#e11d48' },
  { label: 'Indigo Nuit', hex: '#4f46e5' },
];

class BusTraceService {
  private traces: BusTraceRecord[] = [];
  private listeners: Set<(traces: BusTraceRecord[]) => void> = new Set();

  constructor() {
    this.loadTraces();
  }

  private loadTraces(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.traces = parsed;
          return;
        }
      }
      this.traces = INITIAL_BUS_TRACES;
      this.persist();
    } catch (e) {
      this.traces = INITIAL_BUS_TRACES;
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.traces));
      this.notifyListeners();
    } catch (e) {
      console.warn('Failed to persist bus traces', e);
    }
  }

  private notifyListeners(): void {
    const list = [...this.traces];
    this.listeners.forEach((listener) => {
      try {
        listener(list);
      } catch (err) {
        console.error(err);
      }
    });
  }

  public subscribe(listener: (traces: BusTraceRecord[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.traces]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getTraces(): BusTraceRecord[] {
    return [...this.traces];
  }

  public getTraceById(id: string): BusTraceRecord | undefined {
    return this.traces.find((t) => t.id === id);
  }

  public addTrace(data: Omit<BusTraceRecord, 'id'>): BusTraceRecord {
    const newTrace: BusTraceRecord = {
      ...data,
      id: `bus-trace-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    // Insérer en tête d'historique (plus récent d'abord)
    this.traces = [newTrace, ...this.traces];
    this.persist();
    return newTrace;
  }

  public updateTrace(id: string, updates: Partial<BusTraceRecord>): void {
    this.traces = this.traces.map((t) => (t.id === id ? { ...t, ...updates } : t));
    this.persist();
  }

  public deleteTrace(id: string): void {
    this.traces = this.traces.filter((t) => t.id !== id);
    this.persist();
  }

  public clearAllTraces(): void {
    this.traces = [];
    this.persist();
  }

  public resetToSamples(): void {
    this.traces = INITIAL_BUS_TRACES;
    this.persist();
  }

  /**
   * Calcule les métriques globales d'un tracé de coordonnées GPS
   */
  public calculateTraceMetrics(coords: Coordinates[], durationSec: number): {
    distanceMeters: number;
    avgSpeedKmh: number;
  } {
    if (coords.length < 2) {
      return { distanceMeters: 0, avgSpeedKmh: 0 };
    }

    let totalDist = 0;
    for (let i = 1; i < coords.length; i++) {
      totalDist += calculateHaversineDistance(
        coords[i - 1].lat,
        coords[i - 1].lng,
        coords[i].lat,
        coords[i].lng
      );
    }

    const durationHours = durationSec > 0 ? durationSec / 3600 : 0.001;
    const avgSpeed = (totalDist / 1000) / durationHours;

    return {
      distanceMeters: Math.round(totalDist),
      avgSpeedKmh: Math.round(avgSpeed * 10) / 10,
    };
  }

  /**
   * Export au format GPX pour utilisation dans tout lecteur GPS standard
   */
  public exportAsGpx(trace: BusTraceRecord): void {
    const dateIso = new Date(trace.date).toISOString();
    let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    gpx += `<gpx version="1.1" creator="TransitAlarm" xmlns="http://www.topografix.com/GPX/1/1">\n`;
    gpx += `  <metadata>\n`;
    gpx += `    <name>Ligne ${trace.busLine} - ${trace.name}</name>\n`;
    gpx += `    <time>${dateIso}</time>\n`;
    gpx += `    <desc>${trace.notes || 'Tracé de ligne de bus enregistré'}</desc>\n`;
    gpx += `  </metadata>\n`;
    gpx += `  <wpt lat="${trace.startPoint.lat}" lon="${trace.startPoint.lng}">\n`;
    gpx += `    <name>${trace.startPoint.name} (Départ)</name>\n`;
    gpx += `  </wpt>\n`;
    gpx += `  <wpt lat="${trace.destinationPoint.lat}" lon="${trace.destinationPoint.lng}">\n`;
    gpx += `    <name>${trace.destinationPoint.name} (Arrivée)</name>\n`;
    gpx += `  </wpt>\n`;
    gpx += `  <trk>\n`;
    gpx += `    <name>Ligne de bus ${trace.busLine}</name>\n`;
    gpx += `    <trkseg>\n`;

    const points = trace.coordinates.length > 0
      ? trace.coordinates
      : [trace.startPoint, trace.destinationPoint];

    points.forEach((pt) => {
      gpx += `      <trkpt lat="${pt.lat}" lon="${pt.lng}"></trkpt>\n`;
    });

    gpx += `    </trkseg>\n`;
    gpx += `  </trk>\n`;
    gpx += `</gpx>`;

    this.downloadFile(gpx, `bus_ligne_${trace.busLine}_${new Date(trace.date).toISOString().slice(0, 10)}.gpx`, 'application/gpx+xml');
  }

  /**
   * Export au format GeoJSON standard
   */
  public exportAsGeoJson(trace: BusTraceRecord): void {
    const points = trace.coordinates.length > 0
      ? trace.coordinates
      : [trace.startPoint, trace.destinationPoint];

    const geoJson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            busLine: trace.busLine,
            name: trace.name,
            date: new Date(trace.date).toISOString(),
            distanceMeters: trace.distanceMeters,
            durationSeconds: trace.durationSeconds,
            avgSpeedKmh: trace.avgSpeedKmh,
            startName: trace.startPoint.name,
            destinationName: trace.destinationPoint.name,
          },
          geometry: {
            type: 'LineString',
            coordinates: points.map((p) => [p.lng, p.lat]),
          },
        },
      ],
    };

    this.downloadFile(
      JSON.stringify(geoJson, null, 2),
      `bus_ligne_${trace.busLine}_${new Date(trace.date).toISOString().slice(0, 10)}.geojson`,
      'application/geo+json'
    );
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const busTraceService = new BusTraceService();
