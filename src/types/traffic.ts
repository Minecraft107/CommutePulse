export type IncidentType = 'accident' | 'construction' | 'closure' | 'hazard' | 'police' | 'weather';

export type IncidentSeverity = 'critical' | 'major' | 'moderate' | 'advisory';

export type CongestionStatus = 'free' | 'moderate' | 'heavy' | 'gridlock' | 'closed';

export interface TrafficIncident {
  id: string;
  title: string;
  type: IncidentType;
  severity: IncidentSeverity;
  highway: string;
  direction?: string;
  locationDescription: string;
  lat: number;
  lng: number;
  reportedAt: string; // ISO or relative
  updatedAt: string;
  laneImpact: string; // e.g. "2 of 4 lanes blocked, right shoulder occupied"
  clearingEstimate: string; // e.g. "Est. clearing in 45 mins"
  details: string;
  verified: boolean;
  source: string; // e.g. "State DOT / Highway Patrol", "Commuter Reports", "Sensor Array"
  upvotes: number;
}

export interface CongestionSegment {
  id: string;
  highway: string;
  direction: string;
  name: string;
  coordinates: [number, number][]; // [lat, lng]
  currentSpeedMph: number;
  freeFlowSpeedMph: number;
  delayMinutes: number;
  status: CongestionStatus;
  lengthMiles: number;
  trend: 'improving' | 'worsening' | 'stable';
  activeIncidentId?: string;
}

export interface TrafficCamera {
  id: string;
  name: string;
  highway: string;
  mileMarker: string;
  lat: number;
  lng: number;
  direction: string;
  speed: number;
  status: 'Operational' | 'Maintenance';
  description: string;
}

export interface CommuteCorridor {
  id: string;
  name: string;
  from: string;
  to: string;
  highwayTag: string;
  currentDurationMinutes: number;
  freeFlowMinutes: number;
  delayMinutes: number;
  distanceMiles: number;
  status: CongestionStatus;
  coordinates: [number, number][];
  alternateRoute?: {
    name: string;
    highway: string;
    durationMinutes: number;
    distanceMiles: number;
    savesMinutes: number;
    coordinates?: [number, number][];
  };
}

export interface HourlyForecast {
  hour: string;
  level: number; // 0 - 100
  isCurrent?: boolean;
  label: string;
}

export interface MetroRegion {
  id: string;
  name: string;
  shortCode: string;
  state: string;
  center: [number, number];
  zoom: number;
  weather: {
    tempF: number;
    condition: string;
    visibility: string;
    windMph: number;
    alert?: string;
  };
  overallCongestionScore: number; // 0 - 100
  activeIncidentCount: number;
  peakStatus: 'Normal Flow' | 'Morning Rush' | 'Evening Rush' | 'Severe Gridlock';
  hourlyForecast: HourlyForecast[];
  corridors: CommuteCorridor[];
  segments: CongestionSegment[];
  incidents: TrafficIncident[];
  cameras: TrafficCamera[];
}
