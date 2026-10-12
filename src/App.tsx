import React, { useState, useEffect } from 'react';
import { METRO_REGIONS } from './data/mockTrafficData';
import { MetroRegion, TrafficIncident, TrafficCamera, CommuteCorridor, CongestionSegment } from './types/traffic';
import { Header } from './components/Header';
import { LiveAlertsTicker } from './components/LiveAlertsTicker';
import { TrafficMap } from './components/TrafficMap';
import { CommuteCorridorPanel } from './components/CommuteCorridorPanel';
import { CommuteRouteCalculator } from './components/CommuteRouteCalculator';
import { IncidentFeed } from './components/IncidentFeed';
import { CongestionForecast } from './components/CongestionForecast';
import { WeatherTrafficBar } from './components/WeatherTrafficBar';
import { TrafficCameraViewer } from './components/TrafficCameraViewer';
import { ReportIncidentModal } from './components/ReportIncidentModal';
import { playAlertChime } from './utils/soundAlert';
import { Map, AlertOctagon, Video, Route, BarChart3, Radio, CheckCircle2, ChevronRight, X } from 'lucide-react';

export default function App() {
  const [selectedRegion, setSelectedRegion] = useState<MetroRegion>(METRO_REGIONS[0]);
  const [incidents, setIncidents] = useState<TrafficIncident[]>(selectedRegion.incidents);
  const [segments, setSegments] = useState<CongestionSegment[]>(selectedRegion.segments);
  const [corridors, setCorridors] = useState<CommuteCorridor[]>(selectedRegion.corridors);
  const [cameras, setCameras] = useState<TrafficCamera[]>(selectedRegion.cameras);

  const [activeTab, setActiveTab] = useState<'map' | 'incidents' | 'corridors' | 'cameras' | 'forecast'>('map');
  const [selectedIncident, setSelectedIncident] = useState<TrafficIncident | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<TrafficCamera | null>(null);
  const [activeCorridor, setActiveCorridor] = useState<CommuteCorridor | null>(selectedRegion.corridors[0] || null);

  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // When region changes, sync state
  useEffect(() => {
    setIncidents(selectedRegion.incidents);
    setSegments(selectedRegion.segments);
    setCorridors(selectedRegion.corridors);
    setCameras(selectedRegion.cameras);
    setActiveCorridor(selectedRegion.corridors[0] || null);
    setSelectedIncident(null);
    setSelectedCamera(null);
  }, [selectedRegion.id]);

  // Periodic simulated traffic speed fluctuations (adds authentic real-time alive feel)
  useEffect(() => {
    const interval = setInterval(() => {
      setSegments((prev) =>
        prev.map((seg) => {
          // slight random jitter of +/- 2 mph
          const delta = Math.floor(Math.random() * 5) - 2;
          const newSpeed = Math.max(5, Math.min(seg.freeFlowSpeedMph, seg.currentSpeedMph + delta));
          return {
            ...seg,
            currentSpeedMph: newSpeed,
          };
        })
      );
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    if (soundEnabled) playAlertChime('click');
    setTimeout(() => {
      setIsRefreshing(false);
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast('Live traffic feeds synchronized with regional DOT sensors.');
    }, 600);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleAddIncident = (newInc: TrafficIncident) => {
    setIncidents((prev) => [newInc, ...prev]);
    setSelectedIncident(newInc);
    setActiveTab('map');
    showToast(`Hazard alert published: ${newInc.highway}. Added to live map.`);
  };

  const handleUpvoteIncident = (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, upvotes: inc.upvotes + 1 } : inc))
    );
    showToast('Thank you for verifying this road condition!');
  };

  const criticalIncidents = incidents.filter(
    (i) => i.severity === 'critical' || i.severity === 'major'
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Main Header */}
      <Header
        currentRegion={selectedRegion}
        onSelectRegion={(reg) => {
          setSelectedRegion(reg);
          if (soundEnabled) playAlertChime('info');
        }}
        onRefreshData={handleManualRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />

      {/* Live Ticker & Quick Actions */}
      <LiveAlertsTicker
        region={selectedRegion}
        criticalIncidents={criticalIncidents}
        onSelectIncident={(inc) => {
          setSelectedIncident(inc);
          setActiveTab('map');
        }}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          setSoundEnabled(!soundEnabled);
          if (!soundEnabled) playAlertChime('info');
        }}
      />

      {/* Secondary Bar: Weather & Tab Navigation */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 lg:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Weather Advisory */}
          <div className="flex-1">
            <WeatherTrafficBar weather={selectedRegion.weather} />
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 shrink-0">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'map'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Congestion Map</span>
            </button>

            <button
              onClick={() => setActiveTab('incidents')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
                activeTab === 'incidents'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Incident Alerts</span>
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-mono">
                {incidents.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('corridors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'corridors'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span>Commute Routes</span>
            </button>

            <button
              onClick={() => setActiveTab('cameras')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'cameras'
                  ? 'bg-sky-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>CCTV Network</span>
              <span className="text-[10px] text-sky-300 font-mono">({cameras.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('forecast')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'forecast'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Rush Forecast</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 flex flex-col gap-6">
        {/* TAB 1: Live Interactive Map & Side Corridors */}
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
            {/* Left 8 cols: Interactive Map */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="h-[520px] xl:h-[620px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
                <TrafficMap
                  region={selectedRegion}
                  selectedIncident={selectedIncident}
                  onSelectIncident={(inc) => {
                    setSelectedIncident(inc);
                    if (inc && soundEnabled) playAlertChime('click');
                  }}
                  selectedCamera={selectedCamera}
                  onSelectCamera={(cam) => {
                    setSelectedCamera(cam);
                    if (cam && soundEnabled) playAlertChime('click');
                  }}
                  activeCorridor={activeCorridor}
                  incidents={incidents}
                  segments={segments}
                  cameras={cameras}
                />
              </div>

              {/* Selected Incident Spotlight Card if active */}
              {selectedIncident && (
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-xl flex items-start justify-between gap-4 animate-in slide-in-from-top-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold uppercase rounded">
                        {selectedIncident.severity}
                      </span>
                      <span className="font-mono text-sky-400 text-xs font-bold">{selectedIncident.highway}</span>
                      <span className="text-xs text-slate-400 font-medium">({selectedIncident.reportedAt})</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-100">{selectedIncident.title}</h4>
                    <p className="text-xs text-amber-300">{selectedIncident.laneImpact}</p>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">{selectedIncident.details}</p>
                    <p className="text-[11px] text-slate-400 pt-1">
                      Source: {selectedIncident.source} • {selectedIncident.clearingEstimate}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedIncident(null)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Right 4 cols: Corridor Watchlist & Delay Calculator */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <CommuteCorridorPanel
                corridors={corridors}
                activeCorridor={activeCorridor}
                onSelectCorridor={(corr) => {
                  setActiveCorridor(corr);
                  if (soundEnabled) playAlertChime('click');
                }}
              />

              <CommuteRouteCalculator
                region={selectedRegion}
                onSelectCorridor={(corr) => {
                  setActiveCorridor(corr);
                  if (soundEnabled) playAlertChime('click');
                }}
              />
            </div>
          </div>
        )}

        {/* TAB 2: Full Incident Alerts Feed */}
        {activeTab === 'incidents' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
            <div className="lg:col-span-8">
              <IncidentFeed
                incidents={incidents}
                selectedIncident={selectedIncident}
                onSelectIncident={(inc) => {
                  setSelectedIncident(inc);
                  setActiveTab('map');
                }}
                onUpvoteIncident={handleUpvoteIncident}
              />
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              <CongestionForecast region={selectedRegion} />

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 text-xs">
                <h4 className="font-semibold text-slate-100 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-sky-400" />
                  <span>Commuter Incident Reporting</span>
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Notice an unlisted hazard, speed trap, or sudden slowdown? Tap the button below to alert thousands of fellow commuters instantly.
                </p>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold shadow-md transition-all text-xs"
                >
                  Report Road Hazard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Commute Routes & Departure Optimizer */}
        {activeTab === 'corridors' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <CommuteCorridorPanel
                corridors={corridors}
                activeCorridor={activeCorridor}
                onSelectCorridor={(corr) => {
                  setActiveCorridor(corr);
                  setActiveTab('map');
                }}
              />
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              <CommuteRouteCalculator
                region={selectedRegion}
                onSelectCorridor={(corr) => {
                  setActiveCorridor(corr);
                }}
              />

              <CongestionForecast region={selectedRegion} />
            </div>
          </div>
        )}

        {/* TAB 4: CCTV Network Grid */}
        {activeTab === 'cameras' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">Live Traffic Surveillance Network</h3>
                <p className="text-xs text-slate-400">
                  State DOT high-definition optical streams and doppler speed radar sensors
                </p>
              </div>
              <span className="text-xs font-mono bg-sky-950 text-sky-400 px-3 py-1 rounded-full border border-sky-800">
                {cameras.length} Feeds Streaming
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cameras.map((cam) => (
                <div
                  key={cam.id}
                  onClick={() => {
                    setSelectedCamera(cam);
                    if (soundEnabled) playAlertChime('click');
                  }}
                  className="bg-slate-900 border border-slate-800 hover:border-sky-500 rounded-2xl overflow-hidden shadow-xl transition-all hover:scale-[1.01] cursor-pointer group flex flex-col"
                >
                  {/* Camera snapshot preview box */}
                  <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800">
                    <div className="text-center p-4">
                      <Video className="w-8 h-8 text-sky-400 mx-auto mb-2 opacity-80 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-semibold text-slate-200 block">{cam.highway}</span>
                      <span className="text-[11px] text-slate-400">{cam.name}</span>
                    </div>

                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/75 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>LIVE</span>
                    </div>

                    <div className="absolute bottom-2 right-2 bg-black/75 px-2 py-0.5 rounded text-[11px] font-mono text-amber-300 font-bold">
                      {cam.speed} MPH
                    </div>
                  </div>

                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-100">{cam.name}</div>
                      <div className="text-[11px] text-slate-400">{cam.direction}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Rush Hour Forecast & Historical Peak Curves */}
        {activeTab === 'forecast' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
            <div className="lg:col-span-7">
              <CongestionForecast region={selectedRegion} />
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 text-xs">
                <h4 className="font-semibold text-slate-100">Commute Tips for {selectedRegion.name}</h4>
                <ul className="space-y-2 text-slate-300 list-disc list-inside leading-relaxed text-[11px]">
                  <li>
                    <strong>Morning Commute:</strong> Bottlenecks peak sharpest between 7:30 AM and 8:45 AM. Depart prior to 7:00 AM to save an average of 32 minutes.
                  </li>
                  <li>
                    <strong>Evening Commute:</strong> Peak volume sustained between 4:45 PM and 6:30 PM. Stagger departures past 6:40 PM for near-free-flow bridge crossings.
                  </li>
                  <li>
                    <strong>Express Lanes & Tolls:</strong> FastTrak / HOV carpool restrictions are enforced during marked peak hours.
                  </li>
                  <li>
                    <strong>Rain & Fog Protocol:</strong> Variable speed advisories on major suspension bridges drop limits to 40-45 mph during high wind or fog events.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Camera Viewer Modal */}
      {selectedCamera && (
        <TrafficCameraViewer
          camera={selectedCamera}
          onClose={() => setSelectedCamera(null)}
        />
      )}

      {/* Report Incident Modal */}
      <ReportIncidentModal
        region={selectedRegion}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitIncident={handleAddIncident}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[700] bg-slate-900 border border-sky-500 text-slate-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 max-w-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 ml-auto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            CommutePulse © 2026 • Real-Time Commuter Radar & Highway Traffic Intelligence
          </span>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Powered by DOT Open Feeds & OpenStreetMap</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              All Telemetry Systems Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
