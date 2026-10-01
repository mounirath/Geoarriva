import React, { useState } from 'react';
import {
  X,
  Star,
  MapPin,
  Trash2,
  Plus,
  Navigation,
  Compass,
  Check,
} from 'lucide-react';
import { Coordinates } from '../utils/geo';

export interface FavoriteLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  icon?: string;
}

const DEFAULT_FAVORITES: FavoriteLocation[] = [
  {
    id: 'fav-1',
    name: 'Gare de Lyon, Paris',
    lat: 48.8443,
    lng: 2.3744,
  },
  {
    id: 'fav-2',
    name: 'Gare Montparnasse, Paris',
    lat: 48.8412,
    lng: 2.3205,
  },
  {
    id: 'fav-3',
    name: 'Aéroport Paris-Charles de Gaulle',
    lat: 49.0097,
    lng: 2.5479,
  },
  {
    id: 'fav-4',
    name: 'La Défense - Grande Arche',
    lat: 48.8924,
    lng: 2.2361,
  },
];

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: FavoriteLocation[];
  onSelectFavorite: (coords: Coordinates, name: string) => void;
  onAddFavorite: (name: string, coords: Coordinates) => void;
  onDeleteFavorite: (id: string) => void;
  currentDestination: Coordinates | null;
  currentDestinationName: string | null;
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
}) => {
  const [newFavName, setNewFavName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleSaveCurrent = () => {
    if (!currentDestination) return;
    const name = newFavName.trim() || currentDestinationName || 'Mon arrêt favori';
    onAddFavorite(name, currentDestination);
    setNewFavName('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        {/* En-tête */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Arrêts & Trajets favoris
              </h3>
              <p className="text-xs text-slate-400">
                Accès direct à vos destinations habituelles
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

        {/* Option pour enregistrer la destination actuelle */}
        {currentDestination && (
          <div className="my-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            {!isAdding ? (
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="text-[11px] font-semibold text-amber-400">
                    Destination sur la carte
                  </div>
                  <div className="text-xs text-slate-200 truncate mt-0.5">
                    {currentDestinationName || 'Point sélectionné'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setNewFavName(currentDestinationName || '');
                    setIsAdding(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0 hover:bg-amber-400 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Enregistrer</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newFavName}
                  onChange={(e) => setNewFavName(e.target.value)}
                  placeholder="Nom du favori (ex: Domicile, Gare...)"
                  className="w-full py-1.5 px-3 bg-slate-900 border border-amber-500/60 rounded-xl text-xs text-white focus:outline-none"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="text-xs text-slate-400 px-2 py-1"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveCurrent}
                    className="px-3 py-1 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Liste des favoris */}
        <div className="py-2 space-y-2 max-h-72 overflow-y-auto pr-1">
          {favorites.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              Aucun arrêt favori enregistré. Sélectionnez un point sur la carte pour l'ajouter.
            </div>
          ) : (
            favorites.map((fav) => (
              <div
                key={fav.id}
                onClick={() => {
                  onSelectFavorite({ lat: fav.lat, lng: fav.lng }, fav.name);
                  onClose();
                }}
                className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between gap-3 group"
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
                    title="Supprimer ce favori"
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
