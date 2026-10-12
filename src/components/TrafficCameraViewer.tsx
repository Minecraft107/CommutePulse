import React, { useEffect, useRef, useState } from 'react';
import { TrafficCamera } from '../types/traffic';
import { X, RefreshCw, Video, Radio, Maximize, Shield, Wifi } from 'lucide-react';

interface TrafficCameraViewerProps {
  camera: TrafficCamera | null;
  onClose: () => void;
  onSelectNextCamera?: () => void;
}

export const TrafficCameraViewer: React.FC<TrafficCameraViewerProps> = ({
  camera,
  onClose,
}) => {
  const [timestamp, setTimestamp] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live timestamp clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimestamp(
        `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${now.toLocaleTimeString(
          'en-US',
          { hour12: false }
        )} UTC`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulated live surveillance visual on HTML Canvas (smooth moving highway traffic, headlights/taillights, scanlines)
  useEffect(() => {
    if (!camera) return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas size
    canvas.width = 640;
    canvas.height = 360;

    // Simulated cars on lanes
    interface Vehicle {
      x: number;
      lane: number;
      speed: number;
      color: string;
      isTruck: boolean;
      direction: 1 | -1;
    }

    const laneCount = 4;
    const vehicles: Vehicle[] = [];
    const colors = ['#f8fafc', '#94a3b8', '#38bdf8', '#ef4444', '#facc15', '#10b981'];

    // Pre-populate vehicles
    for (let i = 0; i < 16; i++) {
      const lane = Math.floor(Math.random() * laneCount);
      const isEastbound = lane < 2;
      vehicles.push({
        x: Math.random() * 640,
        lane,
        speed: (camera.speed / 45) * (0.8 + Math.random() * 0.6) * (isEastbound ? 1 : -1),
        color: colors[Math.floor(Math.random() * colors.length)],
        isTruck: Math.random() > 0.8,
        direction: isEastbound ? 1 : -1,
      });
    }

    let frameCount = 0;

    const render = () => {
      frameCount++;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 640, 360);

      // Draw highway perspective
      const horizonY = 120;
      const roadBottomY = 360;

      // Road background
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(180, horizonY);
      ctx.lineTo(460, horizonY);
      ctx.lineTo(620, roadBottomY);
      ctx.lineTo(20, roadBottomY);
      ctx.closePath();
      ctx.fill();

      // Guardrails
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(180, horizonY);
      ctx.lineTo(20, roadBottomY);
      ctx.moveTo(460, horizonY);
      ctx.lineTo(620, roadBottomY);
      ctx.stroke();

      // Lane dividers
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([12, 16]);

      // Center divider barrier
      ctx.strokeStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(320, horizonY);
      ctx.lineTo(320, roadBottomY);
      ctx.stroke();

      // Dashed lane lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.moveTo(250, horizonY);
      ctx.lineTo(170, roadBottomY);
      ctx.moveTo(390, horizonY);
      ctx.lineTo(470, roadBottomY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw vehicles
      vehicles.forEach((veh) => {
        veh.x += veh.speed * 2.2;
        if (veh.direction === 1 && veh.x > 660) veh.x = -40;
        if (veh.direction === -1 && veh.x < -60) veh.x = 660;

        // Map lane to Y position
        const yPos = 160 + veh.lane * 46;
        const scale = 0.6 + (yPos / 360) * 0.7;

        // Vehicle body
        ctx.fillStyle = veh.color;
        const width = (veh.isTruck ? 44 : 26) * scale;
        const height = (veh.isTruck ? 18 : 14) * scale;

        ctx.beginPath();
        ctx.roundRect(veh.x, yPos, width, height, 3);
        ctx.fill();

        // Lights
        if (veh.direction === 1) {
          // Eastbound: red taillights or white headlights
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(veh.x, yPos + 2, 2, 3);
          ctx.fillRect(veh.x, yPos + height - 5, 2, 3);

          ctx.fillStyle = '#fef08a';
          ctx.fillRect(veh.x + width - 2, yPos + 2, 2, 3);
          ctx.fillRect(veh.x + width - 2, yPos + height - 5, 2, 3);
        } else {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(veh.x, yPos + 2, 2, 3);
          ctx.fillRect(veh.x, yPos + height - 5, 2, 3);

          ctx.fillStyle = '#ef4444';
          ctx.fillRect(veh.x + width - 2, yPos + 2, 2, 3);
          ctx.fillRect(veh.x + width - 2, yPos + height - 5, 2, 3);
        }
      });

      // Digital CCTV scanlines effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      for (let y = 0; y < 360; y += 4) {
        ctx.fillRect(0, y, 640, 1.5);
      }

      // Camera lens flare / noise overlay
      ctx.fillStyle = 'rgba(2, 6, 23, 0.15)';
      ctx.fillRect(0, 0, 640, 360);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [camera]);

  if (!camera) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-100">{camera.name}</span>
                <span className="text-[10px] bg-slate-800 text-sky-300 font-mono px-1.5 py-0.5 rounded border border-slate-700">
                  {camera.mileMarker}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{camera.direction}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className={`p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all ${
                isRefreshing ? 'animate-spin text-sky-400' : ''
              }`}
              title="Refresh Camera Feed"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Canvas Body */}
        <div className="relative bg-black aspect-video w-full overflow-hidden flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full object-cover" />

          {/* OSD (On-Screen Display) Overlay */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
            <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded border border-slate-800 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>LIVE FEED • 30 FPS</span>
            </div>
            <div className="bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
              {camera.highway} • {camera.name}
            </div>
          </div>

          <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded border border-slate-800 text-xs font-mono text-slate-300 pointer-events-none">
            {timestamp}
          </div>

          <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-3 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block">DOPPLER SPEED</span>
              <span className={`text-base font-bold ${camera.speed < 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {camera.speed} MPH
              </span>
            </div>
            <div className="border-l border-slate-700 pl-3">
              <span className="text-[10px] text-slate-500 block">SENSOR STATUS</span>
              <span className="text-emerald-400 text-xs font-semibold">{camera.status}</span>
            </div>
          </div>

          <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-slate-400 border border-slate-800 pointer-events-none">
            DOT CAM #{camera.id.toUpperCase()}
          </div>
        </div>

        {/* Footer Details */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>{camera.description}</span>
          <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5" /> High-Bandwidth Stream Connected
          </span>
        </div>
      </div>
    </div>
  );
};
