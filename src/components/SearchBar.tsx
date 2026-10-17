import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, MapPin, Loader2, Compass, Star, Navigation } from 'lucide-react';
import {
  Coordinates,
  searchLocation,
  GeocodingResult,
  calculateHaversineDistance,
  formatDistance,
} from '../utils/geo';
import { Translations, Language } from '../utils/i18n';

interface SearchBarProps {
  onSelectLocation: (coords: Coordinates, label: string) => void;
  destinationAddress: string | null;
  destinationCoords?: Coordinates | null;
  onClearDestination: () => void;
  onAddFavorite?: (name: string, coords: Coordinates) => void;
  isDestinationFavorite?: boolean;
  userLocation?: Coordinates | null;
  t: Translations;
  lang: Language;
}

// Suggestions de points d'intérêt fréquents avec libellés multilingues
const GET_TRANSIT_SUGGESTIONS = (lang: Language) => [
  {
    label:
      lang === 'ar'
        ? 'محطة ليون، باريس'
        : lang === 'en'
        ? 'Gare de Lyon, Paris'
        : 'Gare de Lyon, Paris',
    lat: 48.8443,
    lng: 2.3744,
  },
  {
    label:
      lang === 'ar'
        ? 'محطة مونبارناس، باريس'
        : lang === 'en'
        ? 'Gare Montparnasse, Paris'
        : 'Gare Montparnasse, Paris',
    lat: 48.8412,
    lng: 2.3205,
  },
  {
    label:
      lang === 'ar'
        ? 'مطار باريس شارل ديغول (CDG)'
        : lang === 'en'
        ? 'Paris Charles de Gaulle Airport (CDG)'
        : 'Aéroport Charles de Gaulle (CDG)',
    lat: 49.0097,
    lng: 2.5479,
  },
  {
    label:
      lang === 'ar'
        ? 'لا ديفانس - القوس الكبير'
        : lang === 'en'
        ? 'La Défense, Grande Arche'
        : 'La Défense, Grande Arche',
    lat: 48.8924,
    lng: 2.2361,
  },
  {
    label:
      lang === 'ar'
        ? 'محطة بارت ديو، ليon'
        : lang === 'en'
        ? 'Gare Part-Dieu, Lyon'
        : 'Gare Part-Dieu, Lyon',
    lat: 45.7606,
    lng: 4.8594,
  },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectLocation,
  destinationAddress,
  destinationCoords,
  onClearDestination,
  onAddFavorite,
  isDestinationFavorite = false,
  userLocation,
  t,
  lang,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [justAddedFav, setJustAddedFav] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Suggestions triées par proximité par rapport à l'utilisateur si disponible
  const sortedSuggestions = useMemo(() => {
    const raw = GET_TRANSIT_SUGGESTIONS(lang);
    if (!userLocation || isNaN(userLocation.lat) || isNaN(userLocation.lng)) {
      return raw.map((item) => ({ ...item, distanceMeters: undefined }));
    }
    const withDistance = raw.map((item) => ({
      ...item,
      distanceMeters: calculateHaversineDistance(
        userLocation.lat,
        userLocation.lng,
        item.lat,
        item.lng
      ),
    }));
    return withDistance.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [lang, userLocation]);

  useEffect(() => {
    if (destinationAddress) {
      setQuery(destinationAddress);
    }
  }, [destinationAddress]);

  useEffect(() => {
    if (!query || query.trim().length < 3 || query === destinationAddress) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      // Passe la position GPS de l'utilisateur pour classer en priorité les adresses les plus proches
      const res = await searchLocation(query, userLocation);
      setResults(res);
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, destinationAddress, userLocation]);

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

  const handleQuickAddFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAddFavorite || !destinationCoords) return;
    const name = destinationAddress || t.selectedPoint;
    onAddFavorite(name, destinationCoords);
    setJustAddedFav(true);
    setTimeout(() => setJustAddedFav(false), 2000);
  };

  return (
    <div
      ref={searchContainerRef}
      className="relative w-full max-w-md mx-auto z-[500]"
    >
      <div className="relative flex items-center">
        {/* Champ de recherche */}
        <div className="relative w-full flex items-center bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden focus-within:border-amber-500/80 focus-within:ring-1 focus-within:ring-amber-500/50 transition-all">
          <div className="px-3 text-slate-400">
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
            placeholder={t.searchPlaceholder}
            className="w-full py-2.5 px-2 text-xs sm:text-sm bg-transparent text-slate-100 placeholder-slate-400 focus:outline-none"
          />

          {/* Bouton rapide d'ajout aux favoris si destination active */}
          {destinationCoords && onAddFavorite && (
            <button
              onClick={handleQuickAddFavorite}
              type="button"
              className={`p-1.5 mr-1 rounded-xl transition-all ${
                justAddedFav
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : isDestinationFavorite
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
              title={
                isDestinationFavorite
                  ? t.favAlreadyExists
                  : t.addFavorite
              }
            >
              <Star
                className={`w-4 h-4 ${
                  isDestinationFavorite || justAddedFav
                    ? 'fill-amber-400 animate-pulse'
                    : ''
                }`}
              />
            </button>
          )}

          {query && (
            <button
              onClick={handleClear}
              className="px-2.5 py-1 text-slate-400 hover:text-white transition-colors"
              title={t.clear}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Menu déroulant de suggestions et résultats */}
      {isOpen && (
        <div className="absolute left-1 right-1 mt-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-2xl shadow-2xl max-h-72 overflow-y-auto divide-y divide-slate-800/80">
          {/* Résultats de recherche classés par proximité */}
          {results.length > 0 ? (
            <div className="py-1">
              <div className="px-3.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>{t.searchPlaceholder}</span>
                {userLocation && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 normal-case tracking-normal">
                    <Navigation className="w-3 h-3 text-emerald-400" />
                    {t.closestFirst}
                  </span>
                )}
              </div>
              {results.map((res, index) => {
                const distInfo =
                  res.distanceMeters !== undefined
                    ? formatDistance(res.distanceMeters)
                    : null;
                const isClosest = index === 0 && res.distanceMeters !== undefined;

                return (
                  <button
                    key={index}
                    onClick={() =>
                      handleSelect({ lat: res.lat, lng: res.lng }, res.displayName)
                    }
                    className="w-full text-start px-3.5 py-2.5 flex items-start gap-3 hover:bg-slate-800/80 transition-colors group"
                  >
                    <div className="mt-0.5 shrink-0">
                      <MapPin
                        className={`w-4 h-4 ${
                          isClosest ? 'text-emerald-400' : 'text-rose-500'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isClosest && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[9px] border border-emerald-500/30">
                            {t.nearestBadge}
                          </span>
                        )}
                        {distInfo && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold text-[10px] border border-blue-500/30">
                            ~{distInfo.full}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-200 line-clamp-2 group-hover:text-white mt-0.5">
                        {res.displayName}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : query.trim().length >= 3 && !isLoading ? (
            <div className="px-4 py-4 text-center text-xs text-slate-400">
              {t.searchNoResults}
            </div>
          ) : null}

          {/* Raccourcis fréquents classés par proximité */}
          {results.length === 0 && (
            <div className="py-1">
              <div className="px-3.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.frequentStops}</span>
                </div>
                {userLocation && (
                  <span className="text-[10px] text-slate-400 font-normal normal-case">
                    {t.closestFirst}
                  </span>
                )}
              </div>
              {sortedSuggestions.map((item, idx) => {
                const distInfo =
                  item.distanceMeters !== undefined
                    ? formatDistance(item.distanceMeters)
                    : null;
                return (
                  <button
                    key={idx}
                    onClick={() =>
                      handleSelect({ lat: item.lat, lng: item.lng }, item.label)
                    }
                    className="w-full text-start px-3.5 py-2 flex items-center justify-between gap-2.5 hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="text-xs text-slate-300 truncate">{item.label}</span>
                    </div>
                    {distInfo && (
                      <span className="text-[10px] font-semibold text-sky-400/90 shrink-0 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/40">
                        {distInfo.full}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
