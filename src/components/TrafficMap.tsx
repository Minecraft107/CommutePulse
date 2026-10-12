import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MetroRegion, TrafficIncident, CongestionSegment, TrafficCamera, CommuteCorridor } from '../types/traffic';
import { Layers, Video, ShieldAlert, AlertTriangle, CloudRain, Car, Wrench, Compass, Eye, EyeOff, Radio, Maximize2 } from 'lucide-react';

interface TrafficMapProps {
  region: MetroRegion;
  selectedIncident: TrafficIncident | null;
  onSelectIncident: (incident: TrafficIncident | null) => void;
  selectedCamera: TrafficCamera | null;
  onSelectCamera: (cam: TrafficCamera | null) => void;
  activeCorridor: CommuteCorridor | null;
  incidents: TrafficIncident[];
  segments: CongestionSegment[];
  cameras: TrafficCamera[];
}

export const TrafficMap: React.FC<TrafficMapProps> = ({
  region,
  selectedIncident,
  onSelectIncident,
  selectedCamera,
  onSelectCamera,
  activeCorridor,
  incidents,
  segments,
  cameras,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapTheme, setMapTheme] = useState<'dark' | 'voyager'>('dark');
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [showTrafficLines, setShowTrafficLines] = useState<boolean>(true);
  const [showCameras, setShowCameras] = useState<boolean>(true);
  const [showCorridorHighlight, setShowCorridorHighlight] = useState<boolean>(true);

  // Layer groups refs for easy updating without recreating the whole map
  const incidentsLayerRef = useRef<L.LayerGroup | null>(null);
  const segmentsLayerRef = useRef<L.LayerGroup | null>(null);
  const camerasLayerRef = useRef<L.LayerGroup | null>(null);
  const corridorLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: region.center,
        zoom: region.zoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Add Zoom Control at top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Attribution
      L.control
        .attribution({
          position: 'bottomright',
          prefix: '<span class="text-xs text-slate-400">CommutePulse Live Radar • OpenStreetMap & CartoDB</span>',
        })
        .addTo(map);

      // Layer groups
      incidentsLayerRef.current = L.layerGroup().addTo(map);
      segmentsLayerRef.current = L.layerGroup().addTo(map);
      camerasLayerRef.current = L.layerGroup().addTo(map);
      corridorLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle region change (pan/zoom)
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(region.center, region.zoom, {
        duration: 1.2,
      });
    }
  }, [region.id]);

  // Update Tile Layer when theme changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const tileUrl =
      mapTheme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tiles = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    });

    tiles.addTo(mapInstanceRef.current);
    tileLayerRef.current = tiles;
  }, [mapTheme]);

  // Draw Traffic Congestion Segments
  useEffect(() => {
    if (!segmentsLayerRef.current || !mapInstanceRef.current) return;
    segmentsLayerRef.current.clearLayers();

    if (!showTrafficLines) return;

    segments.forEach((seg) => {
      let color = '#10b981'; // Green
      let dashArray: string | undefined = undefined;
      let opacity = 0.9;
      let weight = 6;

      if (seg.status === 'moderate') {
        color = '#f59e0b'; // Amber
        weight = 7;
      } else if (seg.status === 'heavy') {
        color = '#ef4444'; // Orange-red
        weight = 8;
      } else if (seg.status === 'gridlock') {
        color = '#be123c'; // Rose crimson
        weight = 9;
      } else if (seg.status === 'closed') {
        color = '#1e1b4b';
        dashArray = '6, 8';
        weight = 8;
      }

      // Outer glow polyline for heavy/gridlock
      if (seg.status === 'gridlock' || seg.status === 'heavy') {
        const glow = L.polyline(seg.coordinates, {
          color: seg.status === 'gridlock' ? '#e11d48' : '#f97316',
          weight: weight + 6,
          opacity: 0.35,
          lineCap: 'round',
          lineJoin: 'round',
        });
        glow.addTo(segmentsLayerRef.current!);
      }

      const polyline = L.polyline(seg.coordinates, {
        color,
        weight,
        opacity,
        dashArray,
        lineCap: 'round',
        lineJoin: 'round',
      });

      // Interactive popup
      const popupContent = `
        <div class="p-2 text-slate-900 font-sans max-w-xs">
          <div class="flex items-center justify-between border-b pb-1.5 mb-1.5">
            <span class="font-bold text-sm bg-slate-900 text-white px-2 py-0.5 rounded text-xs">${seg.highway} ${seg.direction}</span>
            <span class="text-xs uppercase font-semibold tracking-wider text-${seg.status === 'gridlock' ? 'red-600' : seg.status === 'heavy' ? 'orange-600' : 'amber-600'}">
              ${seg.status}
            </span>
          </div>
          <div class="text-xs font-medium text-slate-800 mb-1">${seg.name}</div>
          <div class="grid grid-cols-2 gap-2 text-xs bg-slate-100 p-2 rounded">
            <div>
              <span class="text-slate-500 block">Current Speed</span>
              <span class="font-bold text-base ${seg.currentSpeedMph < 20 ? 'text-rose-600' : 'text-slate-800'}">${seg.currentSpeedMph} mph</span>
              <span class="text-[10px] text-slate-400">Norm: ${seg.freeFlowSpeedMph} mph</span>
            </div>
            <div>
              <span class="text-slate-500 block">Est. Delay</span>
              <span class="font-bold text-base text-rose-600">+${seg.delayMinutes} min</span>
              <span class="text-[10px] text-slate-500">Trend: ${seg.trend}</span>
            </div>
          </div>
        </div>
      `;

      polyline.bindPopup(popupContent, {
        closeButton: true,
        className: 'custom-traffic-popup',
      });

      polyline.addTo(segmentsLayerRef.current!);
    });
  }, [segments, showTrafficLines]);

  // Draw Incidents
  useEffect(() => {
    if (!incidentsLayerRef.current || !mapInstanceRef.current) return;
    incidentsLayerRef.current.clearLayers();

    if (!showIncidents) return;

    incidents.forEach((inc) => {
      const isSelected = selectedIncident?.id === inc.id;

      // Color scheme based on severity and type
      let bgClass = 'bg-amber-500 text-slate-950';
      let ringClass = 'border-amber-400';
      let pulseRing = false;

      if (inc.severity === 'critical') {
        bgClass = 'bg-rose-600 text-white';
        ringClass = 'border-rose-400';
        pulseRing = true;
      } else if (inc.severity === 'major') {
        bgClass = 'bg-orange-500 text-white';
        ringClass = 'border-orange-400';
      } else if (inc.type === 'weather') {
        bgClass = 'bg-sky-500 text-white';
        ringClass = 'border-sky-400';
      } else if (inc.type === 'police') {
        bgClass = 'bg-blue-600 text-white';
        ringClass = 'border-blue-400';
      }

      const iconSvg =
        inc.type === 'accident'
          ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
          : inc.type === 'construction'
          ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`
          : inc.type === 'weather'
          ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`
          : inc.type === 'police'
          ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
          : `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

      const markerHtml = `
        <div class="relative cursor-pointer group flex items-center justify-center">
          ${
            pulseRing
              ? `<div class="absolute -inset-2 rounded-full bg-rose-500/40 animate-ping-slow pointer-events-none"></div>`
              : ''
          }
          <div class="w-8 h-8 rounded-full ${bgClass} border-2 ${isSelected ? 'border-white ring-4 ring-rose-500 scale-125' : ringClass} shadow-xl flex items-center justify-center transition-transform hover:scale-110">
            ${iconSvg}
          </div>
          <div class="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 text-white text-[11px] font-medium px-2 py-0.5 rounded whitespace-nowrap shadow-md pointer-events-none border border-slate-700">
            ${inc.highway}: ${inc.type.toUpperCase()}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-incident-marker',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([inc.lat, inc.lng], { icon: customIcon });

      marker.on('click', () => {
        onSelectIncident(inc);
      });

      marker.addTo(incidentsLayerRef.current!);
    });
  }, [incidents, showIncidents, selectedIncident]);

  // Draw Cameras
  useEffect(() => {
    if (!camerasLayerRef.current || !mapInstanceRef.current) return;
    camerasLayerRef.current.clearLayers();

    if (!showCameras) return;

    cameras.forEach((cam) => {
      const isSelected = selectedCamera?.id === cam.id;
      const camMarkerHtml = `
        <div class="relative cursor-pointer group flex items-center justify-center">
          <div class="w-7 h-7 rounded-lg bg-sky-700 border-2 ${isSelected ? 'border-amber-300 ring-2 ring-sky-300 scale-125' : 'border-sky-300'} text-white shadow-lg flex items-center justify-center transition-transform hover:scale-115">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
          </div>
          <div class="absolute -bottom-6 bg-slate-900/95 text-sky-200 text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none border border-sky-800">
            ${cam.speed} mph
          </div>
        </div>
      `;

      const camIcon = L.divIcon({
        className: 'custom-incident-marker',
        html: camMarkerHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([cam.lat, cam.lng], { icon: camIcon });
      marker.on('click', () => {
        onSelectCamera(cam);
      });

      marker.addTo(camerasLayerRef.current!);
    });
  }, [cameras, showCameras, selectedCamera]);

  // Draw Active Corridor Highlight
  useEffect(() => {
    if (!corridorLayerRef.current || !mapInstanceRef.current) return;
    corridorLayerRef.current.clearLayers();

    if (activeCorridor && showCorridorHighlight) {
      // Glow underlay
      const glowPath = L.polyline(activeCorridor.coordinates, {
        color: '#38bdf8',
        weight: 14,
        opacity: 0.45,
        lineCap: 'round',
      });
      glowPath.addTo(corridorLayerRef.current);

      // Main route polyline
      const mainPath = L.polyline(activeCorridor.coordinates, {
        color: '#0284c7',
        weight: 6,
        opacity: 1,
        dashArray: '10, 6',
      });
      mainPath.addTo(corridorLayerRef.current);

      // Start & End markers
      const startCoord = activeCorridor.coordinates[0];
      const endCoord = activeCorridor.coordinates[activeCorridor.coordinates.length - 1];

      const startIcon = L.divIcon({
        className: 'custom-incident-marker',
        html: `<div class="bg-emerald-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-md border border-white shadow-md">ORIGIN</div>`,
        iconAnchor: [20, 10],
      });
      const endIcon = L.divIcon({
        className: 'custom-incident-marker',
        html: `<div class="bg-rose-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-md border border-white shadow-md">DEST</div>`,
        iconAnchor: [20, 10],
      });

      L.marker(startCoord, { icon: startIcon }).addTo(corridorLayerRef.current);
      L.marker(endCoord, { icon: endIcon }).addTo(corridorLayerRef.current);

      // Fit bounds to corridor if active
      if (activeCorridor.coordinates.length > 1) {
        mapInstanceRef.current.fitBounds(L.latLngBounds(activeCorridor.coordinates), {
          padding: [60, 60],
          maxZoom: 13,
        });
      }
    }
  }, [activeCorridor, showCorridorHighlight]);

  // Center on selected incident
  useEffect(() => {
    if (selectedIncident && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedIncident.lat, selectedIncident.lng], 14, {
        duration: 0.9,
      });
    }
  }, [selectedIncident]);

  // Center on selected camera
  useEffect(() => {
    if (selectedCamera && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedCamera.lat, selectedCamera.lng], 14, {
        duration: 0.9,
      });
    }
  }, [selectedCamera]);

  return (
    <div className="relative w-full h-full min-h-[460px] flex-1 bg-slate-950 overflow-hidden select-none">
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Map HUD Top Bar */}
      <div className="absolute top-4 left-4 z-[400] flex flex-wrap items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1.5 shadow-xl flex items-center gap-1.5 text-xs text-slate-200">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Radar Active</span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700"></div>

          {/* Theme switcher */}
          <button
            onClick={() => setMapTheme(mapTheme === 'dark' ? 'voyager' : 'dark')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              mapTheme === 'dark'
                ? 'bg-slate-800 text-sky-400 border border-slate-700'
                : 'bg-white text-slate-900 border border-slate-300 shadow-sm'
            }`}
            title="Toggle Map Style"
          >
            {mapTheme === 'dark' ? 'Night Radar' : 'Day Commuter'}
          </button>

          {/* Layer Controls */}
          <div className="h-4 w-[1px] bg-slate-700"></div>

          <button
            onClick={() => setShowTrafficLines(!showTrafficLines)}
            className={`px-2 py-1 rounded-lg flex items-center gap-1 font-medium text-xs transition-all ${
              showTrafficLines ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Traffic Flow</span>
          </button>

          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`px-2 py-1 rounded-lg flex items-center gap-1 font-medium text-xs transition-all ${
              showIncidents ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Alerts ({incidents.length})</span>
          </button>

          <button
            onClick={() => setShowCameras(!showCameras)}
            className={`px-2 py-1 rounded-lg flex items-center gap-1 font-medium text-xs transition-all ${
              showCameras ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>CCTV Cams</span>
          </button>
        </div>

        {/* Reset View Button */}
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo(region.center, region.zoom, { duration: 0.8 });
            }
          }}
          className="bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700 p-2 rounded-xl text-slate-200 shadow-lg transition-all"
          title="Reset to Metro Center"
        >
          <Compass className="w-4 h-4 text-slate-300" />
        </button>
      </div>

      {/* Floating Speed & Congestion Legend (Bottom Left) */}
      <div className="absolute bottom-5 left-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl text-xs text-slate-300 max-w-xs">
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
          <span>Congestion Index</span>
          <span className="text-slate-200 font-mono font-bold">{region.overallCongestionScore}% delay</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>60+ mph</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>40-59</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>20-39</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-700 animate-pulse"></span>
            <span>&lt;20 Stop</span>
          </div>
        </div>
      </div>
    </div>
  );
};
