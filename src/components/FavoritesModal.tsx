import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  MapPin,
  Trash2,
  Plus,
  Search,
  Check,
  Compass,
  Loader2,
} from 'lucide-react';
import { Coordinates, searchLocation, GeocodingResult } from '../utils/geo';
import { Translations } from '../utils/i18n';

export interface FavoriteLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  icon?: string;
}

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: FavoriteLocation[];
  onSelectFavorite: (coords: Coordinates, name: string) => void;
  onAddFavorite: (name: string, coords: Coordinates) => void;
  onDeleteFavorite: (id: string) => void;
  currentDestination: Coordinates | null;
  currentDestinationName: string | null;
  t: Translations;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  favorites,
  onSelectFavorite,
  onAddFavorite,
  onDeleteFavorite,
  currentDestination,
  currentDestinationName,
  t,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [customName, setCustomName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<GeocodingResult | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsAdding(false);
      setCustomName('');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedResult(null);
      setSuccessNotice(null);
    }
  }, [isOpen]);

  // Recherche d'adresses en direct
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchLocation(searchQuery);
      setSearchResults(res);
      setIsSearching(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  // Enregistrer le point de la carte
  const handleSaveCurrentMapPoint = () => {
    if (!currentDestination) return;
    const name = customName.trim() || currentDestinationName || t.selectedPoint;
    onAddFavorite(name, currentDestination);
    setCustomName('');
    setIsAdding(false);
    setSuccessNotice(t.favAddedSuccess);
    setTimeout(() => setSuccessNotice(null), 2000);
  };

  // Enregistrer l'adresse issue de la recherche
  const handleSaveSearchedAddress = () => {
    if (!selectedResult) return;
    const name = customName.trim() || selectedResult.displayName.split(',')[0];
    onAddFavorite(name, { lat: selectedResult.lat, lng: selectedResult.lng });
    setCustomName('');
    setSelectedResult(null);
    setSearchQuery('');
    setSearchResults([]);
    setIsAdding(false);
    setSuccessNotice(t.favAddedSuccess);
    setTimeout(() => setSuccessNotice(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 overflow-hidden animate-in slide-in-from-bottom-4 duration-200 max-h-[90vh] flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {t.favModalTitle}
              </h3>
              <p className="text-xs text-slate-400">
                {t.favModalSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message de succès */}
        {successNotice && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 shrink-0 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Bouton pour afficher/masquer le formulaire d'ajout */}
        <div className="pt-3 pb-1 shrink-0">
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              type="button"
              className="w-full py-2.5 px-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>{t.addNewFavorite}</span>
            </button>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/40 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span>{t.addNewFavorite}</span>
                <button
                  onClick={() => setIsAdding(false)}
                  className="text-slate-400 hover:text-white text-[11px]"
                >
                  {t.cancel}
                </button>
              </div>

              {/* Si une destination est actuellement sur la carte */}
              {currentDestination && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] text-amber-300 font-medium">
                      {t.destOnMapLabel}
                    </div>
                    <div className="text-xs text-slate-200 truncate">
                      {currentDestinationName || t.selectedPoint}
                    </div>
                  </div>
                  <button
                    onClick={handleSaveCurrentMapPoint}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] shrink-0"
                  >
                    {t.saveCurrentDest}
                  </button>
                </div>
              )}

              {/* Barre de recherche d'adresse / arrêt à ajouter */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300">
                  {t.favSearchAddress}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedResult(null);
                    }}
                    placeholder="Ex: Gare Montparnasse, Châtelet..."
                    className="w-full py-2 pl-8 pr-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  {isSearching && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 absolute right-2.5 top-2.5" />
                  )}
                </div>

                {/* Résultats de recherche dans la modal */}
                {searchResults.length > 0 && !selectedResult && (
                  <div className="max-h-36 overflow-y-auto divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900">
                    {searchResults.map((res, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedResult(res);
                          setCustomName(res.displayName.split(',')[0]);
                        }}
                        className="w-full text-start p-2 hover:bg-slate-800 flex items-start gap-2 text-xs text-slate-300"
                      >
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span className="truncate">{res.displayName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Nom personnalisé */}
              {selectedResult && (
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span className="truncate">{selectedResult.displayName}</span>
                  </div>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={t.favNamePlaceholder}
                    className="w-full py-2 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleSaveSearchedAddress}
                    type="button"
                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
                  >
                    {t.confirm}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Liste des favoris existants */}
        <div className="py-2 space-y-2 overflow-y-auto pr-1 flex-1">
          {favorites.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              {t.noFavsSaved}
            </div>
          ) : (
            favorites.map((fav) => (
              <div
                key={fav.id}
                onClick={() => {
                  onSelectFavorite({ lat: fav.lat, lng: fav.lng }, fav.name);
                  onClose();
                }}
                className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-rose-400 shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-white truncate">
                      {fav.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {fav.lat.toFixed(4)}, {fav.lng.toFixed(4)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFavorite(fav.id);
                    }}
                    className="w-7 h-7 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 flex items-center justify-center transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
