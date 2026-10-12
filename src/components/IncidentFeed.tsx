import React, { useState } from 'react';
import { TrafficIncident, IncidentType, IncidentSeverity } from '../types/traffic';
import { AlertTriangle, Car, Wrench, CloudRain, Shield, ThumbsUp, Volume2, Search, Filter, CheckCircle2, Clock } from 'lucide-react';
import { TrafficAudioBroadcaster } from '../utils/audioReport';
import { playAlertChime } from '../utils/soundAlert';

interface IncidentFeedProps {
  incidents: TrafficIncident[];
  selectedIncident: TrafficIncident | null;
  onSelectIncident: (inc: TrafficIncident) => void;
  onUpvoteIncident: (incidentId: string) => void;
}

export const IncidentFeed: React.FC<IncidentFeedProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
  onUpvoteIncident,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredIncidents = incidents.filter((inc) => {
    if (filterType !== 'all') {
      if (filterType === 'critical' && inc.severity !== 'critical') return false;
      if (filterType === 'accident' && inc.type !== 'accident') return false;
      if (filterType === 'construction' && inc.type !== 'construction') return false;
      if (filterType === 'weather' && inc.type !== 'weather') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.highway.toLowerCase().includes(q) ||
        inc.locationDescription.toLowerCase().includes(q) ||
        inc.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSpeakIncident = (e: React.MouseEvent, inc: TrafficIncident) => {
    e.stopPropagation();
    playAlertChime('click');
    const text = `Commuter incident update: ${inc.highway}. ${inc.title}. ${inc.laneImpact}. ${inc.details}. ${inc.clearingEstimate}`;
    TrafficAudioBroadcaster.speak(text);
  };

  const handleUpvote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    playAlertChime('click');
    onUpvoteIncident(id);
  };

  const getSeverityBadge = (sev: IncidentSeverity) => {
    switch (sev) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase tracking-wider animate-pulse">Critical Delay</span>;
      case 'major':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-600 text-white uppercase tracking-wider">Major Impact</span>;
      case 'moderate':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wider">Moderate</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-600 text-white uppercase tracking-wider">Advisory</span>;
    }
  };

  const getTypeIcon = (type: IncidentType) => {
    switch (type) {
      case 'accident':
        return <Car className="w-4 h-4 text-rose-400" />;
      case 'construction':
        return <Wrench className="w-4 h-4 text-amber-400" />;
      case 'weather':
        return <CloudRain className="w-4 h-4 text-sky-400" />;
      case 'police':
        return <Shield className="w-4 h-4 text-blue-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3 h-full max-h-[700px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <h3 className="font-semibold text-sm text-slate-100">Live Incident & Hazard Alerts</h3>
        </div>
        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
          {incidents.length} Active
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Filter by highway, bridge, or corridor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filterType === 'all' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
          }`}
        >
          All ({incidents.length})
        </button>
        <button
          onClick={() => setFilterType('critical')}
          className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filterType === 'critical' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
          }`}
        >
          Critical
        </button>
        <button
          onClick={() => setFilterType('accident')}
          className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filterType === 'accident' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
          }`}
        >
          Accidents
        </button>
        <button
          onClick={() => setFilterType('construction')}
          className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filterType === 'construction' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
          }`}
        >
          Roadworks
        </button>
        <button
          onClick={() => setFilterType('weather')}
          className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
            filterType === 'weather' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
          }`}
        >
          Weather
        </button>
      </div>

      {/* Incident List */}
      <div className="flex flex-col gap-2.5 overflow-y-auto pr-1 flex-1">
        {filteredIncidents.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No active incidents matching your filter. Corridors clear.
          </div>
        ) : (
          filteredIncidents.map((inc) => {
            const isSelected = selectedIncident?.id === inc.id;

            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-slate-800/95 border-sky-400 ring-2 ring-sky-500/40 shadow-lg'
                    : 'bg-slate-950/70 hover:bg-slate-800/60 border-slate-800/90'
                }`}
              >
                {/* Header: Highway & Severity Badge */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 rounded bg-slate-900 border border-slate-700">
                      {getTypeIcon(inc.type)}
                    </span>
                    <span className="font-mono font-bold text-xs text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/50">
                      {inc.highway}
                    </span>
                    {inc.direction && (
                      <span className="text-[11px] text-slate-400 font-medium">({inc.direction})</span>
                    )}
                  </div>
                  {getSeverityBadge(inc.severity)}
                </div>

                {/* Title */}
                <h4 className="font-semibold text-xs text-slate-100 mb-1 leading-snug">
                  {inc.title}
                </h4>

                {/* Location */}
                <p className="text-[11px] text-slate-400 mb-2 flex items-center gap-1">
                  <span>📍</span>
                  <span>{inc.locationDescription}</span>
                </p>

                {/* Impact callout */}
                <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-[11px] space-y-1 mb-2">
                  <div className="text-amber-300 font-medium flex items-center gap-1">
                    <span className="text-amber-400">⚠️</span>
                    <span>{inc.laneImpact}</span>
                  </div>
                  <div className="text-slate-400 flex items-center gap-1 text-[10px]">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{inc.clearingEstimate}</span>
                  </div>
                </div>

                {/* Details snippet */}
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed mb-2.5">
                  {inc.details}
                </p>

                {/* Footer meta & actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>{inc.reportedAt}</span>
                    {inc.verified && (
                      <span className="flex items-center gap-0.5 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Audio readout */}
                    <button
                      onClick={(e) => handleSpeakIncident(e, inc)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400 transition-colors"
                      title="Audio Readout"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Upvote */}
                    <button
                      onClick={(e) => handleUpvote(e, inc.id)}
                      className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded text-slate-300 hover:text-white transition-colors"
                      title="Confirm this incident"
                    >
                      <ThumbsUp className="w-3 h-3 text-sky-400" />
                      <span>{inc.upvotes}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
