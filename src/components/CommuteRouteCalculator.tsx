import React, { useState } from 'react';
import { MetroRegion, CommuteCorridor } from '../types/traffic';
import { Route, Clock, Calendar, Zap, Fuel, ArrowRightLeft, Sparkles, AlertTriangle } from 'lucide-react';

interface CommuteRouteCalculatorProps {
  region: MetroRegion;
  onSelectCorridor: (corridor: CommuteCorridor) => void;
}

export const CommuteRouteCalculator: React.FC<CommuteRouteCalculatorProps> = ({
  region,
  onSelectCorridor,
}) => {
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>(region.corridors[0]?.id || '');
  const [targetDepartureOffset, setTargetDepartureOffset] = useState<number>(0); // 0 = now, 30 = in 30 mins, 60 = in 1 hour

  const activeCorridor = region.corridors.find((c) => c.id === selectedCorridorId) || region.corridors[0];

  if (!activeCorridor) return null;

  // Calculate dynamic savings if leaving later
  // Evening rush tends to peak at 5:30 PM and subside by 6:45 PM
  const simulatedLaterSavings = activeCorridor.delayMinutes > 15 ? Math.min(26, Math.round(activeCorridor.delayMinutes * 0.7)) : 4;
  const idlingFuelLossGal = ((activeCorridor.delayMinutes / 60) * 0.45).toFixed(2);
  const idlingCostDollars = (parseFloat(idlingFuelLossGal) * 4.65).toFixed(2);

  const handleCorridorChange = (id: string) => {
    setSelectedCorridorId(id);
    const corr = region.corridors.find((c) => c.id === id);
    if (corr) {
      onSelectCorridor(corr);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-sm text-slate-100">Commute Delay Calculator</h3>
        </div>
        <span className="text-[11px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
          Smart Departure AI
        </span>
      </div>

      {/* Select Corridor */}
      <div>
        <label className="text-[11px] font-medium text-slate-400 mb-1 block">Selected Commute Route</label>
        <select
          value={selectedCorridorId}
          onChange={(e) => handleCorridorChange(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition-colors"
        >
          {region.corridors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.currentDurationMinutes} min • +{c.delayMinutes}m delay)
            </option>
          ))}
        </select>
      </div>

      {/* Route Summary Metrics */}
      <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
        <div className="space-y-1">
          <span className="text-[11px] text-slate-400">Current Trip Duration</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-slate-100">{activeCorridor.currentDurationMinutes}</span>
            <span className="text-xs text-slate-400">mins</span>
          </div>
          <span className="text-[10px] text-rose-400 font-medium">
            +{activeCorridor.delayMinutes} min above free flow ({activeCorridor.freeFlowMinutes}m)
          </span>
        </div>

        <div className="space-y-1 border-l border-slate-800 pl-3">
          <span className="text-[11px] text-slate-400">Stop-and-Go Loss</span>
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium pt-1">
            <Fuel className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>~{idlingFuelLossGal} gal (${idlingCostDollars})</span>
          </div>
          <span className="text-[10px] text-slate-500">Based on idling emissions</span>
        </div>
      </div>

      {/* Smart Departure Recommendation Box */}
      <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Optimal Departure Window</span>
        </div>

        {activeCorridor.delayMinutes > 10 ? (
          <div className="text-xs text-slate-300 space-y-1.5">
            <p>
              Holding departure by <strong className="text-amber-300">35 minutes</strong> is projected to save you{' '}
              <strong className="text-emerald-400 font-mono">~{simulatedLaterSavings} minutes</strong> in traffic as the peak bottleneck dissipates.
            </p>
            <div className="flex items-center justify-between text-[11px] bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Departing Now:</span>
              <span className="font-mono text-rose-300 font-semibold">{activeCorridor.currentDurationMinutes} min trip</span>
            </div>
            <div className="flex items-center justify-between text-[11px] bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-emerald-900/30">
              <span className="text-emerald-400">Departing +35m:</span>
              <span className="font-mono text-emerald-300 font-semibold">
                {Math.max(activeCorridor.freeFlowMinutes, activeCorridor.currentDurationMinutes - simulatedLaterSavings)} min trip
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-emerald-300">
            Green light! Congestion on this corridor is at or near baseline levels. Optimal departure is immediate.
          </p>
        )}
      </div>

      {/* Alternate Detour Quick Compare */}
      {activeCorridor.alternateRoute && (
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Suggested Detour Bypass</div>
            <div className="font-semibold text-slate-200">{activeCorridor.alternateRoute.name}</div>
            <div className="text-[11px] text-slate-400">{activeCorridor.alternateRoute.durationMinutes} mins • {activeCorridor.alternateRoute.distanceMiles} mi</div>
          </div>
          <div className="text-right">
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold font-mono text-xs border border-emerald-500/30 inline-block">
              Save {activeCorridor.alternateRoute.savesMinutes}m
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
