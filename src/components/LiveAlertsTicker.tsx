import React, { useState, useEffect } from 'react';
import { TrafficIncident, MetroRegion } from '../types/traffic';
import { Volume2, VolumeX, AlertOctagon, Radio, PlusCircle, Bell, BellOff } from 'lucide-react';
import { TrafficAudioBroadcaster } from '../utils/audioReport';
import { playAlertChime } from '../utils/soundAlert';

interface LiveAlertsTickerProps {
  region: MetroRegion;
  criticalIncidents: TrafficIncident[];
  onSelectIncident: (inc: TrafficIncident) => void;
  onOpenReportModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const LiveAlertsTicker: React.FC<LiveAlertsTickerProps> = ({
  region,
  criticalIncidents,
  onSelectIncident,
  onOpenReportModal,
  soundEnabled,
  onToggleSound,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTickerIndex, setCurrentTickerIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = TrafficAudioBroadcaster.addListener((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => unsubscribe();
  }, []);

  // Cycle ticker items every 6 seconds
  useEffect(() => {
    if (criticalIncidents.length === 0) return;
    const interval = setInterval(() => {
      setCurrentTickerIndex((prev) => (prev + 1) % criticalIncidents.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [criticalIncidents.length]);

  const activeAlert = criticalIncidents[currentTickerIndex] || criticalIncidents[0];

  const handleToggleBroadcast = () => {
    if (isSpeaking) {
      TrafficAudioBroadcaster.stop();
    } else {
      playAlertChime('info');
      const script = TrafficAudioBroadcaster.generateBroadcastScript(region);
      TrafficAudioBroadcaster.speak(script);
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
      {/* Alert Banner / Ticker */}
      <div className="flex items-center gap-3 flex-1 min-w-[280px] overflow-hidden">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-950/80 border border-rose-500/40 rounded-lg text-rose-400 text-xs font-bold uppercase tracking-wider shrink-0 animate-pulse">
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Active Alerts</span>
        </div>

        {activeAlert ? (
          <button
            onClick={() => onSelectIncident(activeAlert)}
            className="flex items-center gap-2 text-xs truncate hover:text-white transition-colors text-left group"
          >
            <span className="font-semibold text-rose-300 bg-rose-900/40 px-1.5 py-0.5 rounded border border-rose-700/50 shrink-0">
              {activeAlert.highway}
            </span>
            <span className="text-slate-300 font-medium truncate group-hover:underline">
              {activeAlert.title} — {activeAlert.laneImpact}
            </span>
            <span className="text-[11px] text-slate-400 shrink-0">({activeAlert.reportedAt})</span>
          </button>
        ) : (
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Corridors operating without major critical obstructions</span>
          </div>
        )}
      </div>

      {/* Commuter Action Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Voice Bulletin Radio Button */}
        <button
          onClick={handleToggleBroadcast}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            isSpeaking
              ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse shadow-lg'
              : 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white border-slate-700'
          }`}
          title={isSpeaking ? 'Stop Audio Broadcast' : 'Listen to Live Commuter Traffic Bulletin'}
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate-950" />
              <span>Broadcasting... (Stop)</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Listen Radio Bulletin</span>
            </>
          )}
        </button>

        {/* Sound alerts on/off */}
        <button
          onClick={onToggleSound}
          className={`p-1.5 rounded-lg border transition-all ${
            soundEnabled
              ? 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-750'
              : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
          }`}
          title={soundEnabled ? 'Alert chimes active' : 'Alert chimes muted'}
        >
          {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
        </button>

        {/* Report Hazard */}
        <button
          onClick={onOpenReportModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Report Hazard</span>
        </button>
      </div>
    </div>
  );
};
