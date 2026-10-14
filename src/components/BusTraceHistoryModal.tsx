import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Bus,
  Search,
  Plus,
  Trash2,
  Download,
  Eye,
  MapPin,
  Clock,
  Gauge,
  Navigation,
  Check,
  RefreshCw,
  Share2,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  busTraceService,
  BusTraceRecord,
  BUS_LINE_COLORS,
} from '../services/BusTraceService';
import { Coordinates, formatDistance } from '../utils/geo';
import { Translations, Language } from '../utils/i18n';

interface BusTraceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTraceForPreview: (trace: BusTraceRecord) => void;
  onSelectDestination: (coords: Coordinates, name: string) => void;
  currentLocation: Coordinates | null;
  currentDestination: Coordinates | null;
  currentDestinationName: string | null;
  activePreviewTraceId: string | null;
  onClearPreview: () => void;
  t: Translations;
  lang: Language;
}

export const BusTraceHistoryModal: React.FC<BusTraceHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectTraceForPreview,
  onSelectDestination,
  currentLocation,
  currentDestination,
  currentDestinationName,
  activePreviewTraceId,
  onClearPreview,
  t,
  lang,
}) => {
  const [traces, setTraces] = useState<BusTraceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recent'>('all');
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Formulaire d'ajout manuel de ligne de bus
  const [newLineNumber, setNewLineNumber] = useState('');
  const [newLineName, setNewLineName] = useState('');
  const [newColor, setNewColor] = useState(BUS_LINE_COLORS[0].hex);
  const [newStartName, setNewStartName] = useState('');
  const [newDestName, setNewDestName] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Synchronisation avec le service
  useEffect(() => {
    const unsub = busTraceService.subscribe((list) => {
      setTraces(list);
    });
    return unsub;
  }, []);

  // Pré-remplissage intelligent quand on ouvre le formulaire d'ajout
  useEffect(() => {
    if (isAddingManual) {
      if (currentDestinationName && !newDestName) {
        setNewDestName(currentDestinationName);
      }
      if (currentLocation && !newStartName) {
        setNewStartName(lang === 'ar' ? 'موقعي الحالي' : lang === 'en' ? 'My Location' : 'Ma position actuelle');
      }
    }
  }, [isAddingManual, currentDestinationName, currentLocation, lang]);

  const showNotice = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  // Filtrage et recherche
  const filteredTraces = useMemo(() => {
    return traces.filter((trace) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        trace.busLine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trace.startPoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trace.destinationPoint.name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchSearch;
    });
  }, [traces, searchQuery]);

  // Statistiques globales
  const totalDistanceKm = useMemo(() => {
    const totalMeters = traces.reduce((acc, curr) => acc + (curr.distanceMeters || 0), 0);
    return (totalMeters / 1000).toFixed(1);
  }, [traces]);

  const totalPointsRecorded = useMemo(() => {
    return traces.reduce((acc, curr) => acc + (curr.coordinates?.length || 0), 0);
  }, [traces]);

  if (!isOpen) return null;

  const handleCreateTrace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLineNumber.trim() || !newDestName.trim()) return;

    const startCoords = currentLocation || { lat: 48.8566, lng: 2.3522 };
    const destCoords = currentDestination || { lat: 48.8606, lng: 2.3376 };

    // Générer quelques points intermédiaires si pas de trace GPS directe
    const sampleCoords: Coordinates[] = [
      startCoords,
      {
        lat: startCoords.lat + (destCoords.lat - startCoords.lat) * 0.33,
        lng: startCoords.lng + (destCoords.lng - startCoords.lng) * 0.33,
      },
      {
        lat: startCoords.lat + (destCoords.lat - startCoords.lat) * 0.66,
        lng: startCoords.lng + (destCoords.lng - startCoords.lng) * 0.66,
      },
      destCoords,
    ];

    const metrics = busTraceService.calculateTraceMetrics(sampleCoords, 900);

    const created = busTraceService.addTrace({
      busLine: newLineNumber.trim().toUpperCase(),
      name:
        newLineName.trim() ||
        `${newStartName || t.startPoint} ➔ ${newDestName || t.arrivalTerminus}`,
      color: newColor,
      date: Date.now(),
      durationSeconds: 900,
      distanceMeters: metrics.distanceMeters,
      avgSpeedKmh: 18.5,
      maxSpeedKmh: 45.0,
      startPoint: {
        name: newStartName.trim() || 'Arrêt initial',
        lat: startCoords.lat,
        lng: startCoords.lng,
      },
      destinationPoint: {
        name: newDestName.trim(),
        lat: destCoords.lat,
        lng: destCoords.lng,
      },
      coordinates: sampleCoords,
      notes: newNotes.trim() || undefined,
    });

    setIsAddingManual(false);
    setNewLineNumber('');
    setNewLineName('');
    setNewStartName('');
    setNewDestName('');
    setNewNotes('');
    showNotice(t.traceSavedSuccess);
    onSelectTraceForPreview(created);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`${t.deleteTraceConfirm}\n\n${name}`)) {
      busTraceService.deleteTrace(id);
      if (activePreviewTraceId === id) {
        onClearPreview();
      }
      showNotice(lang === 'ar' ? 'تم حذف المسار من السجل' : lang === 'en' ? 'Bus trace removed' : 'Tracé supprimé de l’historique');
    }
  };

  const handleExportGpx = (trace: BusTraceRecord) => {
    busTraceService.exportAsGpx(trace);
    showNotice(`Export GPX : Ligne ${trace.busLine}`);
  };

  const handleExportGeoJson = (trace: BusTraceRecord) => {
    busTraceService.exportAsGeoJson(trace);
    showNotice(`Export GeoJSON : Ligne ${trace.busLine}`);
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : lang === 'en' ? 'en-US' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (sec: number) => {
    const mins = Math.round(sec / 60);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${h}h ${remainingMins}m`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bus-trace-title"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-inner">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="bus-trace-title" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{t.busTraceHistory}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800/50">
                  {traces.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Lignes régulières, trajets réels parcourus et traces GPS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bannière de feedback temporaire */}
        {feedbackNotice && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 px-4 py-2 text-xs flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              {feedbackNotice}
            </span>
          </div>
        )}

        {/* Corps déroulant */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Panneau récapitulatif & Statistiques */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-center">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Bus className="w-3.5 h-3.5 text-amber-400" />
                Lignes
              </span>
              <span className="text-base sm:text-lg font-bold text-white mt-0.5">
                {traces.length}
              </span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-center">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-sky-400" />
                Distance
              </span>
              <span className="text-base sm:text-lg font-bold text-white mt-0.5">
                {totalDistanceKm} km
              </span>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex flex-col justify-center">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Points GPS
              </span>
              <span className="text-base sm:text-lg font-bold text-white mt-0.5">
                {totalPointsRecorded}
              </span>
            </div>
          </div>

          {/* Barre d'outils (Recherche + Ajout manuel + Restauration) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par ligne (38, 91...), terminus ou arrêt..."
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddingManual((prev) => !prev)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                  isAddingManual
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingManual ? t.cancel : t.manualAddBusTrace}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  busTraceService.resetToSamples();
                  showNotice('Exemples de lignes restaurés');
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                title={t.resetSampleTraces}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Formulaire d'ajout manuel dépliable */}
          {isAddingManual && (
            <form
              onSubmit={handleCreateTrace}
              className="p-4 rounded-xl bg-slate-800/90 border border-amber-500/40 space-y-3 animate-fade-in shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Bus className="w-4 h-4" />
                  Nouveau tracé de ligne de bus
                </span>
                <span className="text-[11px] text-slate-400">Enregistrement manuel ou rapide</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {t.busLineNumber} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 38, 91, 72, N01..."
                    value={newLineNumber}
                    onChange={(e) => setNewLineNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-bold focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Couleur officielle du badge
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                    {BUS_LINE_COLORS.map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setNewColor(col.hex)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          newColor === col.hex ? 'ring-2 ring-white scale-110 shadow-md' : 'opacity-80'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.label}
                      >
                        {newColor === col.hex && <Check className="w-3 h-3 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {t.startPoint}
                  </label>
                  <input
                    type="text"
                    placeholder="Nom de l’arrêt ou station de départ"
                    value={newStartName}
                    onChange={(e) => setNewStartName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {t.arrivalTerminus} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nom du terminus ou arrêt d'arrivée"
                    value={newDestName}
                    onChange={(e) => setNewDestName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Notes ou description du tracé
                </label>
                <input
                  type="text"
                  placeholder="Ex: Fréquence 5 min, passage quais de Seine, climatisé..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingManual(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-700/60"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm"
                >
                  {t.saveTrace}
                </button>
              </div>
            </form>
          )}

          {/* Liste des tracés enregistrés */}
          {filteredTraces.length === 0 ? (
            <div className="p-8 text-center bg-slate-800/30 rounded-2xl border border-dashed border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/20">
                <Bus className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">{t.noBusTraces}</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">{t.noBusTracesDesc}</p>
              </div>
              <button
                type="button"
                onClick={() => busTraceService.resetToSamples()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.resetSampleTraces}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTraces.map((trace) => {
                const isSelected = activePreviewTraceId === trace.id;

                return (
                  <div
                    key={trace.id}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-amber-950/20 border-amber-500/80 shadow-md ring-1 ring-amber-500/40'
                        : 'bg-slate-800/50 hover:bg-slate-800/80 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Badge Ligne de Bus */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className="px-2.5 py-1.5 rounded-lg text-white font-extrabold text-xs sm:text-sm tracking-wide shadow flex items-center justify-center min-w-[42px] border border-white/20 shrink-0"
                          style={{ backgroundColor: trace.color || '#2563eb' }}
                        >
                          {trace.busLine}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                              {trace.name}
                            </h3>
                            {isSelected && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                                Affiché sur carte
                              </span>
                            )}
                          </div>

                          {/* Itinéraire Départ ➔ Terminus */}
                          <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-400">{trace.startPoint.name}</span>
                            <span className="text-amber-400">➔</span>
                            <span className="font-semibold text-white">{trace.destinationPoint.name}</span>
                          </div>

                          {/* Métriques du tracé */}
                          <div className="flex items-center gap-3 sm:gap-4 text-[11px] text-slate-400 mt-2 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {formatDuration(trace.durationSeconds)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Navigation className="w-3 h-3 text-slate-400" />
                              {formatDistance(trace.distanceMeters).full}
                            </span>
                            {trace.avgSpeedKmh && (
                              <span className="flex items-center gap-1">
                                <Gauge className="w-3 h-3 text-slate-400" />
                                {trace.avgSpeedKmh} km/h
                              </span>
                            )}
                            <span className="text-slate-400">
                              {formatTime(trace.date)}
                            </span>
                          </div>

                          {trace.notes && (
                            <p className="text-[11px] text-slate-400 mt-1.5 italic bg-slate-900/40 px-2 py-1 rounded border border-slate-800">
                              {trace.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Suppression */}
                      <button
                        type="button"
                        onClick={() => handleDelete(trace.id, trace.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title={t.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Barre d'action sur le tracé */}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-700/50 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleExportGpx(trace)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors"
                          title="Télécharger le fichier GPX"
                        >
                          <Download className="w-3 h-3 text-amber-400" />
                          <span>GPX</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportGeoJson(trace)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors"
                          title="Télécharger le GeoJSON"
                        >
                          <FileText className="w-3 h-3 text-sky-400" />
                          <span>GeoJSON</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Définir l'arrêt comme destination GPS */}
                        <button
                          type="button"
                          onClick={() => {
                            onSelectDestination(
                              { lat: trace.destinationPoint.lat, lng: trace.destinationPoint.lng },
                              `Ligne ${trace.busLine} - ${trace.destinationPoint.name}`
                            );
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
                        >
                          <MapPin className="w-3 h-3 text-rose-400" />
                          <span>{t.setAsDestination}</span>
                        </button>

                        {/* Afficher le tracé sur la carte */}
                        {isSelected ? (
                          <button
                            type="button"
                            onClick={onClearPreview}
                            className="px-3 py-1 rounded-lg text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            <span>{t.clearBusTraceFromMap}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectTraceForPreview(trace);
                              onClose();
                            }}
                            className="px-3 py-1 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{t.viewBusTraceOnMap}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pied de page */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <span>
            {traces.length} tracé{traces.length > 1 ? 's' : ''} de ligne{traces.length > 1 ? 's' : ''} de bus
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
