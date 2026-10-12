import React from 'react';
import { METRO_REGIONS } from '../data/mockTrafficData';
import { MetroRegion } from '../types/traffic';
import { Activity, MapPin, Radio, ShieldCheck, RefreshCw, Car, Flame } from 'lucide-react';

interface HeaderProps {
  currentRegion: MetroRegion;
  onSelectRegion: (region: MetroRegion) => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  lastUpdated: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentRegion,
  onSelectRegion,
  onRefreshData,
  isRefreshing,
  lastUpdated,
}) => {
  return (
    <header className="bg-slate-950/95 border-b border-slate-800 text-slate-100 px-4 lg:px-6 py-3 sticky top-0 z-50 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-rose-500 shadow-lg shadow-sky-500/20">
            <Radio className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-ping"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">CommutePulse</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                511 Radar
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Real-time highway congestion & incident intelligence
            </p>
          </div>
        </div>

        {/* Region Switcher & Telemetry */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Region selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-inner">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <select
              value={currentRegion.id}
              onChange={(e) => {
                const found = METRO_REGIONS.find((r) => r.id === e.target.value);
                if (found) onSelectRegion(found);
              }}
              className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer pr-2"
            >
              {METRO_REGIONS.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100">
                  {r.name} ({r.state})
                </option>
              ))}
            </select>
          </div>

          {/* Congestion score pill */}
          <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400">Congestion:</span>
            <span
              className={`font-mono font-bold ${
                currentRegion.overallCongestionScore > 80
                  ? 'text-rose-400'
                  : currentRegion.overallCongestionScore > 60
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {currentRegion.overallCongestionScore}%
            </span>
            <span className="text-[10px] text-slate-500">({currentRegion.peakStatus})</span>
          </div>

          {/* Incidents badge */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span className="font-mono font-bold text-rose-400">{currentRegion.incidents.length}</span>
            <span className="text-slate-400">Active Alerts</span>
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Refresh Real-Time Traffic Feeds"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline font-medium">Sync</span>
            <span className="text-[10px] text-slate-500 font-mono hidden xl:inline">({lastUpdated})</span>
          </button>
        </div>
      </div>
    </header>
  );
};
