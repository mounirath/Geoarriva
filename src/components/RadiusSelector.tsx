import React from 'react';
import { BellRing } from 'lucide-react';
import { formatDistance } from '../utils/geo';
import { Translations } from '../utils/i18n';

interface RadiusSelectorProps {
  radius: number; // in meters
  onChangeRadius: (newRadius: number) => void;
  disabled?: boolean;
  t: Translations;
}

export const RadiusSelector: React.FC<RadiusSelectorProps> = ({
  radius,
  onChangeRadius,
  disabled = false,
  t,
}) => {
  const currentFormat = formatDistance(radius);

  const presets = [
    { label: '200 m', value: 200, tip: t.tipMetro },
    { label: '500 m', value: 500, tip: t.tipBus },
    { label: '1 km', value: 1000, tip: t.tipSuburban },
    { label: '2 km', value: 2000, tip: t.tipTrain },
    { label: '5 km', value: 5000, tip: t.tipHighSpeed },
  ];

  const activeTip =
    presets.find((p) => p.value === radius)?.tip ||
    (radius < 400
      ? t.veryShortAlert
      : radius < 1500
      ? t.urbanTransitIdeal
      : t.fastTrainIdeal);

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-200">
            {t.radiusSelectorTitle}
          </span>
        </div>
        <div className="flex items-baseline gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg">
          <span className="text-sm font-bold text-amber-400 font-mono tabular-nums">
            {currentFormat.value}
          </span>
          <span className="text-[11px] font-medium text-amber-300">
            {currentFormat.unit}
          </span>
        </div>
      </div>

      {/* Slider avec graduations */}
      <div className="space-y-1">
        <input
          type="range"
          min="100"
          max="5000"
          step="50"
          value={radius}
          disabled={disabled}
          onChange={(e) => onChangeRadius(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50"
        />
        <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
          <span>100 m</span>
          <span className="text-slate-300 font-medium">{activeTip}</span>
          <span>5 km</span>
        </div>
      </div>

      {/* Boutons de présélection rapide */}
      <div className="grid grid-cols-5 gap-1.5 pt-1">
        {presets.map((preset) => {
          const isSelected = radius === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              disabled={disabled}
              onClick={() => onChangeRadius(preset.value)}
              className={`py-1.5 px-1 rounded-xl text-[11px] font-medium transition-all text-center ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              } disabled:opacity-50 disabled:pointer-events-none active:scale-95`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
