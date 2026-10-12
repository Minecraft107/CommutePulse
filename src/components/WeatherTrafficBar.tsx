import React from 'react';
import { MetroRegion } from '../types/traffic';
import { CloudRain, Wind, Eye, Thermometer, AlertTriangle } from 'lucide-react';

interface WeatherTrafficBarProps {
  weather: MetroRegion['weather'];
}

export const WeatherTrafficBar: React.FC<WeatherTrafficBarProps> = ({ weather }) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-slate-100 font-medium">
          <Thermometer className="w-3.5 h-3.5 text-amber-400" />
          <span>{weather.tempF}°F</span>
          <span className="text-slate-400 font-normal">({weather.condition})</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          <span>Visibility: {weather.visibility}</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <Wind className="w-3.5 h-3.5 text-indigo-400" />
          <span>Wind: {weather.windMph} mph</span>
        </div>
      </div>

      {weather.alert && (
        <div className="flex items-center gap-1.5 text-amber-300 bg-amber-950/50 border border-amber-800/40 px-2.5 py-1 rounded-lg text-[11px] font-medium">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{weather.alert}</span>
        </div>
      )}
    </div>
  );
};
