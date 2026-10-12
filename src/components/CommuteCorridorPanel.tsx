import React from 'react';
import { CommuteCorridor, CongestionStatus } from '../types/traffic';
import { Navigation, Clock, ShieldCheck, AlertCircle, ArrowRight, CornerDownRight, Zap } from 'lucide-react';

interface CommuteCorridorPanelProps {
  corridors: CommuteCorridor[];
  activeCorridor: CommuteCorridor | null;
  onSelectCorridor: (corridor: CommuteCorridor) => void;
}

export const CommuteCorridorPanel: React.FC<CommuteCorridorPanelProps> = ({
  corridors,
  activeCorridor,
  onSelectCorridor,
}) => {
  const getStatusBadge = (status: CongestionStatus, delayMinutes: number) => {
    if (delayMinutes >= 25 || status === 'gridlock') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/80 text-rose-400 border border-rose-800">
          GRIDLOCK +{delayMinutes}m
        </span>
      );
    }
    if (delayMinutes >= 12 || status === 'heavy') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-950/80 text-orange-400 border border-orange-800">
          HEAVY +{delayMinutes}m
        </span>
      );
    }
    if (delayMinutes > 3 || status === 'moderate') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800">
          MODERATE +{delayMinutes}m
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
        FREE FLOW
      </span>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-sky-400" />
          <h3 className="font-semibold text-sm text-slate-100">Key Commute Corridors</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">Live DOT Telemetry</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {corridors.map((corridor) => {
          const isSelected = activeCorridor?.id === corridor.id;
          const delayPercent = Math.round((corridor.delayMinutes / corridor.freeFlowMinutes) * 100);

          return (
            <div
              key={corridor.id}
              onClick={() => onSelectCorridor(corridor)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/95 border-sky-500 ring-2 ring-sky-500/30 shadow-lg'
                  : 'bg-slate-950/60 hover:bg-slate-800/50 border-slate-800/90 text-slate-300'
              }`}
            >
              {/* Corridor header */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-slate-800 text-sky-300 rounded font-mono text-[10px] font-bold border border-slate-700">
                      {corridor.highwayTag}
                    </span>
                    <span className="text-xs font-semibold text-slate-100">{corridor.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <span>{corridor.from}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <span>{corridor.to}</span>
                    <span className="text-slate-600">•</span>
                    <span>{corridor.distanceMiles} mi</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {getStatusBadge(corridor.status, corridor.delayMinutes)}
                </div>
              </div>

              {/* ETA numbers & Bar */}
              <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2 rounded-lg my-2 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Current ETA</div>
                  <div className="text-sm font-bold text-slate-100 font-mono">{corridor.currentDurationMinutes} min</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Normal Free Flow</div>
                  <div className="text-sm font-medium text-slate-300 font-mono">{corridor.freeFlowMinutes} min</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Delay Time</div>
                  <div className={`text-sm font-bold font-mono ${corridor.delayMinutes > 15 ? 'text-rose-400' : 'text-amber-400'}`}>
                    +{corridor.delayMinutes} min
                  </div>
                </div>
              </div>

              {/* Progress bar representing congestion excess */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full transition-all rounded-full ${
                    corridor.status === 'gridlock'
                      ? 'bg-rose-500'
                      : corridor.status === 'heavy'
                      ? 'bg-orange-500'
                      : corridor.status === 'moderate'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(15, delayPercent))}%` }}
                />
              </div>

              {/* Detour suggestion */}
              {corridor.alternateRoute && (
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs bg-sky-950/20 px-2.5 py-1.5 rounded-lg border border-sky-900/40">
                  <div className="flex items-center gap-1.5 text-sky-300 truncate">
                    <CornerDownRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">Alt: {corridor.alternateRoute.name}</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-emerald-400 shrink-0">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span>Saves {corridor.alternateRoute.savesMinutes}m</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
