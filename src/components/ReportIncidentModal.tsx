import React, { useState } from 'react';
import { TrafficIncident, IncidentType, IncidentSeverity, MetroRegion } from '../types/traffic';
import { X, AlertTriangle, Car, Wrench, Shield, CloudRain, Send, MapPin } from 'lucide-react';
import { playAlertChime } from '../utils/soundAlert';

interface ReportIncidentModalProps {
  region: MetroRegion;
  isOpen: boolean;
  onClose: () => void;
  onSubmitIncident: (incident: TrafficIncident) => void;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  region,
  isOpen,
  onClose,
  onSubmitIncident,
}) => {
  const [type, setType] = useState<IncidentType>('accident');
  const [severity, setSeverity] = useState<IncidentSeverity>('major');
  const [highway, setHighway] = useState<string>(region.corridors[0]?.highwayTag || 'I-80 E');
  const [direction, setDirection] = useState<string>('Eastbound');
  const [locationDescription, setLocationDescription] = useState<string>('');
  const [laneImpact, setLaneImpact] = useState<string>('Right lane blocked');
  const [details, setDetails] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationDescription.trim() || !details.trim()) {
      alert('Please fill out the location description and details.');
      return;
    }

    // Place near region center with slight random offset for realistic positioning
    const latOffset = (Math.random() - 0.5) * 0.05;
    const lngOffset = (Math.random() - 0.5) * 0.05;

    const newIncident: TrafficIncident = {
      id: `crowd-${Date.now()}`,
      title: `${type === 'accident' ? 'Collision' : type === 'hazard' ? 'Road Hazard' : type === 'police' ? 'Police Activity' : 'Traffic Slowdown'} Reported by Commuter`,
      type,
      severity,
      highway,
      direction,
      locationDescription,
      lat: region.center[0] + latOffset,
      lng: region.center[1] + lngOffset,
      reportedAt: 'Just now',
      updatedAt: 'Just now',
      laneImpact,
      clearingEstimate: 'Reported by commuter network, dispatch alerted',
      details,
      verified: true,
      source: 'Verified Commuter Network (Live 511)',
      upvotes: 1,
    };

    playAlertChime('critical');
    onSubmitIncident(newIncident);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-100">Report Commuter Hazard</h3>
              <p className="text-[11px] text-slate-400">Broadcast real-time road conditions to fellow drivers</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          {/* Incident Type Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 mb-1.5 block">Incident Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('accident');
                  setSeverity('critical');
                }}
                className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition-all ${
                  type === 'accident'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Collision</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('hazard');
                  setSeverity('major');
                }}
                className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition-all ${
                  type === 'hazard'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Debris/Stall</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('construction');
                  setSeverity('moderate');
                }}
                className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition-all ${
                  type === 'construction'
                    ? 'bg-orange-600 text-white border-orange-500 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Roadwork</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('weather');
                  setSeverity('moderate');
                }}
                className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition-all ${
                  type === 'weather'
                    ? 'bg-sky-600 text-white border-sky-500 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5" />
                <span>Fog/Water</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('police');
                  setSeverity('advisory');
                }}
                className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition-all ${
                  type === 'police'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Police</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('closure');
                  setSeverity('critical');
                }}
                className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition-all ${
                  type === 'closure'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>Closure</span>
              </button>
            </div>
          </div>

          {/* Highway & Direction */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 mb-1 block">Highway / Route</label>
              <input
                type="text"
                value={highway}
                onChange={(e) => setHighway(e.target.value)}
                placeholder="e.g. I-80 East, US-101, I-405"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 mb-1 block">Direction</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="Northbound">Northbound</option>
                <option value="Southbound">Southbound</option>
                <option value="Eastbound">Eastbound</option>
                <option value="Westbound">Westbound</option>
                <option value="Both directions">Both directions</option>
              </select>
            </div>
          </div>

          {/* Location Description */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 mb-1 block">Exact Location / Interchange</label>
            <input
              type="text"
              value={locationDescription}
              onChange={(e) => setLocationDescription(e.target.value)}
              placeholder="e.g. Just before Exit 14, near Broadway off-ramp"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          {/* Lane Impact */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 mb-1 block">Lanes Blocked / Status</label>
            <select
              value={laneImpact}
              onChange={(e) => setLaneImpact(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="Right shoulder only">Right shoulder only</option>
              <option value="Right lane blocked">Right lane blocked</option>
              <option value="Center lanes blocked">Center lanes blocked</option>
              <option value="2 of 4 lanes blocked">2 of 4 lanes blocked</option>
              <option value="All lanes completely stopped">All lanes completely stopped</option>
              <option value="All lanes open, visual rubbernecking">All lanes open, visual rubbernecking</option>
            </select>
          </div>

          {/* Notes / Details */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 mb-1 block">Additional Details</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              placeholder="e.g. 2 vehicles involved on right shoulder, tow truck en route, traffic slowing rapidly."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs shadow-lg transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Alert</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
