import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Loader2, Compass } from 'lucide-react';
import { Coordinates, searchLocation, GeocodingResult } from '../utils/geo';

interface SearchBarProps {
  onSelectLocation: (coords: Coordinates, label: string) => void;
  destinationAddress: string | null;
  onClearDestination: () => void;
}

// Suggestions de points d'intérêt fréquents dans les transports
const TRANSIT_SUGGESTIONS = [
  { label: 'Gare de Lyon, Paris', lat: 48.8443, lng: 2.3744 },
  { label: 'Gare Montparnasse, Paris', lat: 48.8412, lng: 2.3205 },
  { label: 'Gare du Nord, Paris', lat: 48.8809, lng: 2.3553 },
  { label: 'Aéroport Charles de Gaulle (CDG)', lat: 49.0097, lng: 2.5479 },
  { label: 'La Défense, Grande Arche', lat: 48.8924, lng: 2.2361 },
  { label: 'Gare Part-Dieu, Lyon', lat: 45.7606, lng: 4.8594 },
  { label: 'Gare Saint-Charles, Marseille', lat: 43.3032, lng: 5.3806 },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectLocation,
  destinationAddress,
  onClearDestination,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Synchroniser la barre si une destination a été choisie par clic
  useEffect(() => {
    if (destinationAddress) {
      setQuery(destinationAddress);
    }
  }, [destinationAddress]);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 3 || query === destinationAddress) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const res = await searchLocation(query);
      setResults(res);
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, destinationAddress]);

  // Fermer la liste déroulante au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (coords: Coordinates, label: string) => {
    setQuery(label);
    setIsOpen(false);
    onSelectLocation(coords, label);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    onClearDestination();
  };

  return (
    <div
      ref={searchContainerRef}
      className="relative w-full max-w-md mx-auto px-3.5 pt-3 z-[500]"
    >
      <div className="relative flex items-center">
        {/* Champ de recherche */}
        <div className="relative w-full flex items-center bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden focus-within:border-amber-500/80 focus-within:ring-1 focus-within:ring-amber-500/50 transition-all">
          <div className="pl-3.5 pr-2 text-slate-400">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Search className="w-4 h-4 text-slate-400" />
            )}
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Rechercher une gare, arrêt ou adresse..."
            className="w-full py-2.5 pr-10 text-xs sm:text-sm bg-transparent text-slate-100 placeholder-slate-400 focus:outline-none"
          />

          {query && (
            <button
              onClick={handleClear}
              className="absolute right-2.5 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Effacer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Menu déroulant de suggestions et résultats */}
      {isOpen && (
        <div className="absolute left-3.5 right-3.5 mt-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-2xl shadow-2xl max-h-72 overflow-y-auto divide-y divide-slate-800/80">
          {/* Résultats de recherche OSM */}
          {results.length > 0 ? (
            <div className="py-1">
              <div className="px-3.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Résultats de recherche
              </div>
              {results.map((res, index) => (
                <button
                  key={index}
                  onClick={() =>
                    handleSelect({ lat: res.lat, lng: res.lng }, res.displayName)
                  }
                  className="w-full text-left px-3.5 py-2.5 flex items-start gap-3 hover:bg-slate-800/70 transition-colors group"
                >
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-200 line-clamp-2 group-hover:text-white">
                    {res.displayName}
                  </span>
                </button>
              ))}
            </div>
          ) : query.trim().length >= 3 && !isLoading ? (
            <div className="px-4 py-4 text-center text-xs text-slate-400">
              Aucun résultat trouvé pour cette adresse. Touchez directement la carte.
            </div>
          ) : null}

          {/* Raccourcis fréquents */}
          {results.length === 0 && (
            <div className="py-1">
              <div className="px-3.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Points d'intérêt fréquents</span>
              </div>
              {TRANSIT_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    handleSelect({ lat: item.lat, lng: item.lng }, item.label)
                  }
                  className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-slate-800/70 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-xs text-slate-300 truncate">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
