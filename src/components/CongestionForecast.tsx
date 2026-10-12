import React from 'react';
import { MetroRegion } from '../types/traffic';
import { TrendingUp, Clock, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';

interface CongestionForecastProps {
  region: MetroRegion;
}

export const CongestionForecast: React.FC<CongestionForecastProps> = ({ region }) => {
  const forecast = region.hourlyForecast;

  // Determine current rush status & commuter advice
  const peakAdvice =
    region.overallCongestionScore > 85
      ? 'Severe Bottleneck: Delay departure by 40-50 mins or divert to light rail / secondary expressways.'
      : region.overallCongestionScore > 65
      ? 'Peak Rush Hour: Heavy slowdowns active across major corridors. Expect +15 to +30 min delays.'
      : 'Moderate Flow: Normal commuter volume, minor slowdowns at customary merge points.';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-sm text-slate-100">Hourly Rush Hour Barometer</h3>
        </div>
        <span className="text-[11px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 font-semibold">
          {region.peakStatus}
        </span>
      </div>

      {/* Advice banner */}
      <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl text-xs flex items-start gap-2.5">
        <div className="p-1 rounded bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
          <Clock className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-200">Commuter Guidance</span>
          <p className="text-slate-400 text-[11px] leading-relaxed">{peakAdvice}</p>
        </div>
      </div>

      {/* Hourly Bar Graph */}
      <div className="pt-2">
        <div className="flex items-end justify-between gap-1 h-28 px-1">
          {forecast.map((item, idx) => {
            const isHigh = item.level > 75;
            const isMedium = item.level > 50 && item.level <= 75;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                {/* Tooltip on hover */}
                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white text-[10px] px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap pointer-events-none z-10 shadow-lg">
                  {item.hour}: {item.level}% ({item.label})
                </div>

                {/* Bar */}
                <div className="w-full bg-slate-800/80 rounded-t-md h-full flex items-end overflow-hidden">
                  <div
                    className={`w-full transition-all duration-500 rounded-t-md ${
                      item.isCurrent
                        ? 'bg-gradient-to-t from-sky-600 to-sky-400 ring-2 ring-sky-300'
                        : isHigh
                        ? 'bg-gradient-to-t from-rose-600 to-rose-400'
                        : isMedium
                        ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                        : 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                    }`}
                    style={{ height: `${item.level}%` }}
                  />
                </div>

                {/* Label */}
                <span
                  className={`text-[9px] font-mono whitespace-nowrap ${
                    item.isCurrent ? 'text-sky-300 font-bold' : 'text-slate-500'
                  }`}
                >
                  {item.hour}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400 px-1 border-t border-slate-800/80 pt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-emerald-500"></span>
            <span>&lt;50% Free</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-amber-500"></span>
            <span>50-75% Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-rose-500"></span>
            <span>&gt;75% Heavy Peak</span>
          </div>
          <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
            <span className="w-2 h-2 rounded bg-sky-400 ring-1 ring-sky-200"></span>
            <span>Now</span>
          </div>
        </div>
      </div>
    </div>
  );
};
