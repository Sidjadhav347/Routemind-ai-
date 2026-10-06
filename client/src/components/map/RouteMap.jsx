import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Plus,
  X,
  Crosshair,
  Layers,
  Trash2,
  Navigation,
  Compass,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Radio,
  Zap,
  ShieldCheck,
  Eye,
  Sliders,
  Gauge,
  Maximize2
} from 'lucide-react';

// Fix standard Leaflet icon path issues in React Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG Map Marker Icons
const createCustomIcon = (color, label, pulse = false) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        position: relative;
        background: ${color};
        color: white;
        border: 2px solid white;
        box-shadow: 0 0 16px ${color};
        border-radius: 50%;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 800;
        cursor: grab;
      ">
        ${label}
        ${pulse ? `<span style="
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid ${color};
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></span>` : ''}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
};

const originIcon = createCustomIcon('#10b981', 'A');
const destIcon = createCustomIcon('#ef4444', 'B');
const waypointIcon = (idx) => createCustomIcon('#8b5cf6', `W${idx + 1}`);
const tempClickIcon = createCustomIcon('#f59e0b', '📍', true);

// User Live GPS Beacon Icon
const userGpsIcon = L.divIcon({
  className: 'user-gps-pin',
  html: `
    <div class="user-gps-beacon">
      <div class="beacon-wave"></div>
      <div class="beacon-core"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

// Live Moving Vehicle Marker Icon with Headlight Beam & Speed Badge
const createLiveVehicleIcon = (speedKmH = 68, headingDeg = 0) => {
  return L.divIcon({
    className: 'live-vehicle-pin',
    html: `
      <div class="live-truck-marker" style="transform: rotate(${headingDeg}deg);">
        <div class="headlight-beam"></div>
        <div class="truck-body">
          <svg style="transform: rotate(-${headingDeg}deg); width: 20px; height: 20px; fill: white;" viewBox="0 0 24 24">
            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        </div>
        <div class="speed-tag" style="transform: translateX(-50%) rotate(-${headingDeg}deg);">
          ${Math.round(speedKmH)} km/h
        </div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21]
  });
};

// Structural Road Clearance Hazard Pin
const createClearanceHazardIcon = (label, restrictionType = 'HEIGHT') => {
  const isHeight = restrictionType === 'HEIGHT';
  const color = isHeight ? '#f59e0b' : '#f43f5e';
  const iconEmoji = isHeight ? '⚠️' : '⚖️';

  return L.divIcon({
    className: 'hazard-pin',
    html: `
      <div class="clearance-hazard-pin">
        <div class="hazard-badge" style="background: ${color}; box-shadow: 0 0 16px ${color};">
          <span>${iconEmoji}</span>
          <span>${label}</span>
        </div>
      </div>
    `,
    iconSize: [80, 26],
    iconAnchor: [40, 13]
  });
};

// Incident Marker Icon
const incidentIcon = L.divIcon({
  className: 'incident-pin',
  html: `
    <div style="
      background: #f43f5e;
      color: white;
      border: 2px solid #fff;
      box-shadow: 0 0 20px #f43f5e;
      border-radius: 8px;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 4px;
      animation: pulse 1.5s infinite;
    ">
      ⚠️ CONGESTION
    </div>
  `,
  iconSize: [90, 26],
  iconAnchor: [45, 13]
});

// Helper for live reverse geocoding
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
      { headers: { 'User-Agent': 'RouteMind-Map-App/1.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(', ');
        return parts.slice(0, 3).join(', ');
      }
    }
  } catch (err) {
    console.warn('Reverse geocode error:', err.message);
  }
  return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

// Leaflet Map Events Handler
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

// Auto bounds adjuster component
function BoundsAdjuster({ bounds, followCoords = null }) {
  const map = useMap();
  useEffect(() => {
    if (followCoords && followCoords[0] && followCoords[1]) {
      map.panTo(followCoords, { animate: true, duration: 0.5 });
    } else if (bounds && bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } catch (err) {
        console.warn('Could not fit bounds:', err);
      }
    }
  }, [bounds, followCoords, map]);
  return null;
}

// Helper to calculate bearing between two coordinate pairs
function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = deg => (deg * Math.PI) / 180;
  const toDeg = rad => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = toDeg(Math.atan2(y, x));
  return (θ + 360) % 360;
}

// Known real-world road restriction checkpoints
const KNOWN_ROAD_HAZARDS = [
  {
    id: 'res-old-ghat-height',
    name: 'Heritage Railway Overpass (3.5m Clearance)',
    lat: 18.7562,
    lng: 73.3768,
    type: 'HEIGHT',
    label: '3.5m Height Limit',
    maxHeightM: 3.5,
    maxWeightTonnes: 10.0,
    corridor: 'Old Mumbai-Pune Highway / Khandala Bhor Ghat',
    warning: 'Overhead clearance restricted to 3.50m. Commercial trucks > 3.5m must use Expressway.'
  },
  {
    id: 'res-urban-flyover-weight',
    name: 'Municipal River Flyover (7.5T Load Restriction)',
    lat: 18.5793,
    lng: 73.8143,
    type: 'WEIGHT',
    label: '7.5T Load Limit',
    maxHeightM: 4.5,
    maxWeightTonnes: 7.5,
    corridor: 'Old Pune Approach / Dapodi Flyover',
    warning: 'Structural load restricted to 7.5 Tonnes. Heavy commercial freight must use Outer Ring Bypass.'
  },
  {
    id: 'res-solapur-toll',
    name: 'Solapur Fastag Heavy Freight Gantry (5.5m)',
    lat: 17.6599,
    lng: 75.9064,
    type: 'CLEARANCE',
    label: '5.5m Gantry',
    maxHeightM: 5.5,
    maxWeightTonnes: 45.0,
    corridor: 'NH166 / NH52 Interchange',
    warning: 'Standard 5.50m overhead clearance. Multi-axle commercial vehicles 100% compliant.'
  }
];

export default function RouteMap({
  origin = { lat: 19.0760, lng: 72.8777, address: 'Mumbai' },
  destination = { lat: 18.5204, lng: 73.8567, address: 'Pune' },
  waypoints = [],
  routes = [],
  activeRouteId = null,
  onSelectRoute = () => {},
  trafficEvents = [],
  vehiclePosition = null,
  isLiveTrip = false,
  // Location Pinning Callbacks
  onOriginChange,
  onDestinationChange,
  onWaypointsChange,
  allowPinning = true,
  externalPinMode = null,
  onPinModeChange = () => {}
}) {
  const [internalPinMode, setInternalPinMode] = useState(null); // 'origin' | 'destination' | 'waypoint' | null
  const pinMode = externalPinMode !== null ? externalPinMode : internalPinMode;

  const setPinMode = (mode) => {
    setInternalPinMode(mode);
    onPinModeChange(mode);
  };

  const [tempPin, setTempPin] = useState(null); // { lat, lng, address }
  const [mapLayer, setMapLayer] = useState('dark');
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Real-Time GPS User Location State
  const [userLocation, setUserLocation] = useState(null); // { lat, lng, accuracy }
  const [isLocating, setIsLocating] = useState(false);
  const [isTrackingGps, setIsTrackingGps] = useState(false);
  const [locateSuccess, setLocateSuccess] = useState(false);
  const gpsWatchIdRef = useRef(null);

  // Real-Time Moving Vehicle Telemetry Simulator State
  const [simPlaying, setSimPlaying] = useState(isLiveTrip || false);
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState(1);
  const [simProgress, setSimProgress] = useState(0); // 0.0 to 1.0
  const [followVehicle, setFollowVehicle] = useState(false);
  const [liveVehicleState, setLiveVehicleState] = useState(null); // { lat, lng, speed, heading, progress }

  // Map Feature Toggles
  const [showTrafficLayer, setShowTrafficLayer] = useState(true);
  const [showClearanceHazards, setShowClearanceHazards] = useState(true);
  const [showTelemetryHud, setShowTelemetryHud] = useState(true);

  // Active Route
  const activeRoute = routes.find(r => r.id === activeRouteId) || routes[0];
  const polylineCoords = activeRoute?.polyline && Array.isArray(activeRoute.polyline) && activeRoute.polyline.length > 1
    ? activeRoute.polyline
    : [[origin?.lat || 19.076, origin?.lng || 72.877], [destination?.lat || 18.520, destination?.lng || 73.856]];

  // 1. REAL-TIME USER GPS GEOLOCATION HANDLER
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy || 10);

        setUserLocation({ lat, lng, accuracy });
        setIsLocating(false);
        setLocateSuccess(true);

        const address = await reverseGeocode(lat, lng);
        onOriginChange?.({
          lat,
          lng,
          address: address || `Current GPS Location (${lat}, ${lng})`
        });

        setTimeout(() => setLocateSuccess(false), 3500);
      },
      (err) => {
        console.warn('Geolocation query failed:', err.message);
        setIsLocating(false);
        // Fallback realistic location if user blocked permissions
        const fallbackLat = 19.0760;
        const fallbackLng = 72.8777;
        setUserLocation({ lat: fallbackLat, lng: fallbackLng, accuracy: 25 });
        alert(`Location permission not granted. Set default position to Mumbai Hub (${fallbackLat}, ${fallbackLng}).`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Continuous GPS Tracking
  const toggleGpsTracking = () => {
    if (isTrackingGps) {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
      setIsTrackingGps(false);
    } else {
      if (!navigator.geolocation) return;
      setIsTrackingGps(true);
      gpsWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          setUserLocation({ lat, lng, accuracy: Math.round(pos.coords.accuracy || 8) });
        },
        (err) => console.warn('GPS watch error:', err.message),
        { enableHighAccuracy: true, maximumAge: 2000 }
      );
    }
  };

  useEffect(() => {
    return () => {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      }
    };
  }, []);

  // 2. REAL-TIME MOVING VEHICLE TELEMETRY SIMULATION ENGINE
  useEffect(() => {
    if (!polylineCoords || polylineCoords.length < 2) return;

    if (vehiclePosition && vehiclePosition.lat && vehiclePosition.lng) {
      setLiveVehicleState({
        lat: vehiclePosition.lat,
        lng: vehiclePosition.lng,
        speed: vehiclePosition.speedKmH || 65,
        heading: vehiclePosition.heading || 45,
        progress: vehiclePosition.progressPercent || 0.5
      });
      return;
    }

    if (!simPlaying) return;

    const interval = setInterval(() => {
      setSimProgress(prev => {
        const next = prev + 0.0025 * simSpeedMultiplier;
        if (next >= 1.0) {
          return 0; // Loop simulation
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [simPlaying, simSpeedMultiplier, polylineCoords, vehiclePosition]);

  // Compute live vehicle coordinate & heading from progress
  useEffect(() => {
    if (!polylineCoords || polylineCoords.length < 2) return;

    const totalPoints = polylineCoords.length;
    const exactIndex = simProgress * (totalPoints - 1);
    const i = Math.floor(exactIndex);
    const nextI = Math.min(i + 1, totalPoints - 1);
    const fraction = exactIndex - i;

    const p1 = polylineCoords[i];
    const p2 = polylineCoords[nextI];

    if (!p1 || !p2) return;

    const currentLat = p1[0] + (p2[0] - p1[0]) * fraction;
    const currentLng = p1[1] + (p2[1] - p1[1]) * fraction;
    const heading = calculateBearing(p1[0], p1[1], p2[0], p2[1]);

    // Check if near any traffic disruption event
    let currentSpeed = 68;
    const nearEvent = trafficEvents.find(evt => {
      if (!evt.lat || !evt.lng) return false;
      const dLat = Math.abs(evt.lat - currentLat);
      const dLng = Math.abs(evt.lng - currentLng);
      return dLat < 0.08 && dLng < 0.08;
    });

    if (nearEvent) {
      currentSpeed = 18; // Heavy traffic slowdown
    }

    setLiveVehicleState({
      lat: currentLat,
      lng: currentLng,
      speed: currentSpeed,
      heading,
      progress: simProgress,
      isCongested: Boolean(nearEvent)
    });
  }, [simProgress, polylineCoords, trafficEvents]);

  const defaultCenter = [
    (origin?.lat && destination?.lat ? (origin.lat + destination.lat) / 2 : 18.8),
    (origin?.lng && destination?.lng ? (origin.lng + destination.lng) / 2 : 73.3)
  ];

  // Tile layer configurations
  const tileLayers = {
    dark: {
      name: 'RouteMind Dark (Tactical)',
      url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      attribution: '&copy; CARTO'
    },
    google_streets: {
      name: 'Google Maps (Road)',
      url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      attribution: '&copy; Google Maps'
    },
    google_hybrid: {
      name: 'Google Maps (Hybrid)',
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      attribution: '&copy; Google Maps'
    },
    google_satellite: {
      name: 'Google Satellite',
      url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      attribution: '&copy; Google Maps'
    }
  };

  const currentTile = tileLayers[mapLayer] || tileLayers.dark;

  // Handle map click for pin placement
  const handleMapClick = async (latlng) => {
    const lat = parseFloat(latlng.lat.toFixed(6));
    const lng = parseFloat(latlng.lng.toFixed(6));

    if (pinMode === 'origin') {
      const address = await reverseGeocode(lat, lng);
      onOriginChange?.({ lat, lng, address });
      setPinMode(null);
    } else if (pinMode === 'destination') {
      const address = await reverseGeocode(lat, lng);
      onDestinationChange?.({ lat, lng, address });
      setPinMode(null);
    } else if (pinMode === 'waypoint') {
      const address = await reverseGeocode(lat, lng);
      const newWp = [...waypoints, { lat, lng, address }];
      onWaypointsChange?.(newWp);
      setPinMode(null);
    } else {
      const address = await reverseGeocode(lat, lng);
      setTempPin({ lat, lng, address });
    }
  };

  const handleSetTempAsOrigin = () => {
    if (!tempPin) return;
    onOriginChange?.({ ...tempPin });
    setTempPin(null);
  };

  const handleSetTempAsDestination = () => {
    if (!tempPin) return;
    onDestinationChange?.({ ...tempPin });
    setTempPin(null);
  };

  const handleSetTempAsWaypoint = () => {
    if (!tempPin) return;
    onWaypointsChange?.([...waypoints, { ...tempPin }]);
    setTempPin(null);
  };

  // Drag handlers
  const handleOriginDragEnd = async (e) => {
    const latlng = e.target.getLatLng();
    const lat = parseFloat(latlng.lat.toFixed(6));
    const lng = parseFloat(latlng.lng.toFixed(6));
    const address = await reverseGeocode(lat, lng);
    onOriginChange?.({ lat, lng, address });
  };

  const handleDestDragEnd = async (e) => {
    const latlng = e.target.getLatLng();
    const lat = parseFloat(latlng.lat.toFixed(6));
    const lng = parseFloat(latlng.lng.toFixed(6));
    const address = await reverseGeocode(lat, lng);
    onDestinationChange?.({ lat, lng, address });
  };

  const handleWaypointDragEnd = async (idx, e) => {
    const latlng = e.target.getLatLng();
    const lat = parseFloat(latlng.lat.toFixed(6));
    const lng = parseFloat(latlng.lng.toFixed(6));
    const address = await reverseGeocode(lat, lng);
    const updated = [...waypoints];
    updated[idx] = { ...updated[idx], lat, lng, address };
    onWaypointsChange?.(updated);
  };

  const handleRemoveWaypoint = (idx) => {
    const updated = waypoints.filter((_, i) => i !== idx);
    onWaypointsChange?.(updated);
  };

  // Coordinates array for auto bounding
  const allCoordinates = [];
  if (origin?.lat && origin?.lng) allCoordinates.push([origin.lat, origin.lng]);
  if (destination?.lat && destination?.lng) allCoordinates.push([destination.lat, destination.lng]);
  waypoints.forEach(w => {
    if (w.lat && w.lng) allCoordinates.push([w.lat, w.lng]);
  });
  if (userLocation) allCoordinates.push([userLocation.lat, userLocation.lng]);
  routes.forEach(r => {
    if (Array.isArray(r.polyline)) {
      r.polyline.forEach(pt => allCoordinates.push(pt));
    }
  });

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-3xl overflow-hidden border border-emerald-900/50 shadow-2xl bg-[#040907] flex flex-col">
      {/* TOP MAP ACTION TOOLBAR */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between pointer-events-none gap-2 flex-wrap">
        {/* Left Side: Pin Mode Buttons & Live GPS Locate Button */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl glass-panel bg-[#06140e]/95 border border-emerald-500/40 shadow-2xl backdrop-blur-md pointer-events-auto flex-wrap">
          {/* REAL-TIME GPS CURRENT LOCATION BUTTON */}
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-md ${
              locateSuccess
                ? 'bg-cyan-500 text-slate-950 font-black shadow-cyan-glow animate-pulse'
                : 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900/60'
            }`}
            title="Locate me using device GPS and set as departure origin"
          >
            <Radio className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-cyan-400' : 'text-emerald-400'}`} />
            <span>{isLocating ? 'Acquiring GPS...' : locateSuccess ? '📍 GPS Locked!' : '🎯 Locate Me'}</span>
          </button>

          {/* Continuous Tracking Toggle */}
          <button
            onClick={toggleGpsTracking}
            className={`px-2 py-1.5 rounded-xl text-[11px] font-mono font-bold transition ${
              isTrackingGps
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle live continuous GPS tracking watch"
          >
            {isTrackingGps ? '🛰️ Live Track ON' : 'Track'}
          </button>

          <div className="w-[1px] h-4 bg-emerald-900/60 mx-1" />

          {/* Pinning Controls */}
          {allowPinning && (
            <>
              <button
                onClick={() => setPinMode(pinMode === 'origin' ? null : 'origin')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  pinMode === 'origin'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-emerald-glow'
                    : 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-950/40'
                }`}
                title="Click map to place Origin Pin A"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Pin A</span>
              </button>

              <button
                onClick={() => setPinMode(pinMode === 'destination' ? null : 'destination')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  pinMode === 'destination'
                    ? 'bg-rose-500 text-white font-bold shadow-rose-glow'
                    : 'text-slate-300 hover:text-rose-300 hover:bg-rose-950/40'
                }`}
                title="Click map to place Destination Pin B"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span>Pin B</span>
              </button>

              <button
                onClick={() => setPinMode(pinMode === 'waypoint' ? null : 'waypoint')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  pinMode === 'waypoint'
                    ? 'bg-indigo-500 text-white font-bold shadow-indigo-glow'
                    : 'text-slate-300 hover:text-indigo-300 hover:bg-indigo-950/40'
                }`}
                title="Click map to add a Waypoint Stop"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Waypoint</span>
              </button>
            </>
          )}
        </div>

        {/* Right Side: Map Controls & Layer Switcher */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Traffic Flow Overlay Toggle */}
          <button
            onClick={() => setShowTrafficLayer(!showTrafficLayer)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 backdrop-blur-md ${
              showTrafficLayer
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/20'
                : 'bg-[#08140f]/90 text-slate-400 border-emerald-900/40 hover:text-slate-200'
            }`}
            title="Toggle Live Real-Time Highway Traffic Heatmap"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono">TRAFFIC {showTrafficLayer ? 'ON' : 'OFF'}</span>
          </button>

          {/* Clearance Hazards Toggle */}
          <button
            onClick={() => setShowClearanceHazards(!showClearanceHazards)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 backdrop-blur-md ${
              showClearanceHazards
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/20'
                : 'bg-[#08140f]/90 text-slate-400 border-emerald-900/40 hover:text-slate-200'
            }`}
            title="Toggle Physical Road Clearances & Bridge Restriction Markers"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-mono">CLEARANCES</span>
          </button>

          {/* Map Layer Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#08140f]/95 hover:bg-[#0c1f17] text-white text-xs font-semibold border border-emerald-500/40 shadow-lg backdrop-blur-md transition"
              title="Switch Map Tiles (Google Maps / Dark Mode)"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{currentTile.name}</span>
            </button>

            {showLayerMenu && (
              <div className="absolute right-0 mt-1.5 p-1.5 rounded-xl bg-[#06120d]/95 border border-emerald-500/40 shadow-2xl backdrop-blur-md flex flex-col gap-1 w-48 animate-in fade-in z-[2000]">
                {Object.entries(tileLayers).map(([key, item]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setMapLayer(key);
                      setShowLayerMenu(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-left text-xs font-medium transition flex items-center justify-between ${
                      mapLayer === key
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                        : 'text-slate-300 hover:bg-emerald-950/40 hover:text-white'
                    }`}
                  >
                    <span>{item.name}</span>
                    {key.startsWith('google') && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">G</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Pin Mode Alert Instruction Banner */}
      {pinMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 rounded-full glass-panel bg-[#061810]/95 border border-emerald-400 shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in zoom-in-95 pointer-events-auto">
          <Crosshair className="w-4 h-4 text-emerald-400 animate-spin" />
          <span className="text-white">
            {pinMode === 'origin' && 'Click anywhere on the map to pin Departure Origin (A)'}
            {pinMode === 'destination' && 'Click anywhere on the map to pin Arrival Destination (B)'}
            {pinMode === 'waypoint' && 'Click anywhere on the map to drop a Waypoint Stop'}
          </span>
          <button
            onClick={() => setPinMode(null)}
            className="w-5 h-5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center ml-2"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* REAL-TIME TELEMETRY HUD (Heads-Up Display) */}
      {showTelemetryHud && liveVehicleState && (
        <div className="absolute top-16 right-3 z-[1000] p-3 rounded-2xl glass-panel bg-[#06140e]/90 border border-emerald-500/40 shadow-2xl backdrop-blur-md text-xs space-y-1.5 w-52 pointer-events-auto animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between border-b border-emerald-900/40 pb-1">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE TELEMETRY HUD
            </span>
            <button
              onClick={() => setShowTelemetryHud(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-0.5 font-mono">
            <div className="p-1.5 rounded-lg bg-[#040907] border border-emerald-900/40">
              <div className="text-[9px] text-slate-400 uppercase">GPS SPEED</div>
              <div className={`font-black text-sm ${liveVehicleState.isCongested ? 'text-rose-400 animate-pulse' : 'text-emerald-300'}`}>
                {Math.round(liveVehicleState.speed)} km/h
              </div>
            </div>

            <div className="p-1.5 rounded-lg bg-[#040907] border border-emerald-900/40">
              <div className="text-[9px] text-slate-400 uppercase">BEARING</div>
              <div className="font-black text-sm text-cyan-300">
                {Math.round(liveVehicleState.heading)}°
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-300 flex items-center justify-between pt-1">
            <span>Route Transit:</span>
            <span className="text-emerald-400 font-bold">{(liveVehicleState.progress * 100).toFixed(0)}% Completed</span>
          </div>

          {liveVehicleState.isCongested && (
            <div className="text-[10px] p-1 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Congestion Bottleneck Detected</span>
            </div>
          )}
        </div>
      )}

      {/* LEAFLET MAP CANVAS */}
      <MapContainer
        center={defaultCenter}
        zoom={9}
        scrollWheelZoom={true}
        className={`w-full h-full z-0 ${pinMode ? 'cursor-crosshair' : ''}`}
      >
        <TileLayer
          key={mapLayer}
          attribution={currentTile.attribution}
          url={currentTile.url}
        />

        {/* Map Click Listener */}
        <MapClickHandler onMapClick={handleMapClick} />

        {/* USER LIVE GPS BEACON MARKER */}
        {userLocation && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userGpsIcon}>
              <Popup className="dark-popup">
                <div className="text-slate-900 font-medium text-xs space-y-1">
                  <div className="font-bold text-cyan-600 flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
                    <span>Your Real-Time GPS Location</span>
                  </div>
                  <div className="text-slate-800 text-[11px]">Accuracy: ±{userLocation.accuracy} meters</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* GPS Accuracy Circle */}
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={Math.min(userLocation.accuracy || 20, 200)}
              pathOptions={{
                color: '#06b6d4',
                fillColor: '#06b6d4',
                fillOpacity: 0.12,
                weight: 1.5
              }}
            />
          </>
        )}

        {/* ORIGIN MARKER (Pin A - Draggable) */}
        {origin?.lat && origin?.lng && (
          <Marker
            position={[origin.lat, origin.lng]}
            icon={originIcon}
            draggable={allowPinning}
            eventHandlers={{
              dragend: handleOriginDragEnd
            }}
          >
            <Popup className="dark-popup">
              <div className="text-slate-900 font-medium text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="block text-emerald-600 font-bold uppercase tracking-wider">Pin A: Origin</strong>
                  <span className="text-[10px] text-slate-500 font-mono">Draggable ⠿</span>
                </div>
                <div className="font-semibold text-slate-800">{origin.address || 'Departure Location'}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* DESTINATION MARKER (Pin B - Draggable) */}
        {destination?.lat && destination?.lng && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={destIcon}
            draggable={allowPinning}
            eventHandlers={{
              dragend: handleDestDragEnd
            }}
          >
            <Popup className="dark-popup">
              <div className="text-slate-900 font-medium text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="block text-rose-600 font-bold uppercase tracking-wider">Pin B: Destination</strong>
                  <span className="text-[10px] text-slate-500 font-mono">Draggable ⠿</span>
                </div>
                <div className="font-semibold text-slate-800">{destination.address || 'Arrival Location'}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* WAYPOINT MARKERS (Draggable) */}
        {waypoints.map((wp, i) => (
          <Marker
            key={i}
            position={[wp.lat, wp.lng]}
            icon={waypointIcon(i)}
            draggable={allowPinning}
            eventHandlers={{
              dragend: (e) => handleWaypointDragEnd(i, e)
            }}
          >
            <Popup className="dark-popup">
              <div className="text-slate-900 font-medium text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="block text-indigo-600 font-bold">Waypoint Stop {i + 1}</strong>
                  <button
                    onClick={() => handleRemoveWaypoint(i)}
                    className="text-rose-600 hover:text-rose-800 text-[10px] font-bold"
                  >
                    Remove
                  </button>
                </div>
                <div className="text-slate-800">{wp.address || `Waypoint ${i + 1}`}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* REAL-TIME MOVING VEHICLE MARKER */}
        {liveVehicleState && liveVehicleState.lat && liveVehicleState.lng && (
          <Marker
            position={[liveVehicleState.lat, liveVehicleState.lng]}
            icon={createLiveVehicleIcon(liveVehicleState.speed, liveVehicleState.heading)}
            zIndexOffset={1000}
          >
            <Popup className="dark-popup">
              <div className="text-slate-900 text-xs p-1 space-y-1.5">
                <div className="font-bold text-sm text-emerald-700 flex items-center justify-between">
                  <span>FreightMaster 3500</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black">
                    ● ACTIVE TRANSIT
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1 font-mono text-[11px]">
                  <div className="p-1 rounded bg-slate-100">
                    <span className="text-slate-500 text-[10px]">Speed:</span>
                    <div className="font-bold text-slate-900">{Math.round(liveVehicleState.speed)} km/h</div>
                  </div>
                  <div className="p-1 rounded bg-slate-100">
                    <span className="text-slate-500 text-[10px]">Heading:</span>
                    <div className="font-bold text-slate-900">{Math.round(liveVehicleState.heading)}°</div>
                  </div>
                </div>
                <div className="text-slate-600 text-[11px] pt-1">
                  Corridor Progress: <strong>{(liveVehicleState.progress * 100).toFixed(1)}%</strong>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* ROAD RESTRICTION & BRIDGE CLEARANCE HAZARD PINS */}
        {showClearanceHazards && KNOWN_ROAD_HAZARDS.map((hazard) => (
          <Marker
            key={hazard.id}
            position={[hazard.lat, hazard.lng]}
            icon={createClearanceHazardIcon(hazard.label, hazard.type)}
          >
            <Popup className="dark-popup">
              <div className="text-slate-900 text-xs p-1 space-y-1">
                <div className="font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Physical Highway Restriction</span>
                </div>
                <div className="font-bold text-slate-900">{hazard.name}</div>
                <div className="text-slate-700 font-mono text-[11px]">
                  Max Height: <strong>{hazard.maxHeightM}m</strong> • Max Weight: <strong>{hazard.maxWeightTonnes}T</strong>
                </div>
                <div className="text-slate-600 text-[11px] pt-1 border-t border-slate-200">
                  {hazard.warning}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* TEMPORARY CLICK PIN */}
        {tempPin && (
          <Marker position={[tempPin.lat, tempPin.lng]} icon={tempClickIcon}>
            <Popup
              onClose={() => setTempPin(null)}
              autoPan={true}
              className="dark-popup"
            >
              <div className="text-slate-900 p-1 space-y-2 text-xs w-48">
                <div>
                  <div className="font-bold text-amber-600 text-xs flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Pinned Location</span>
                  </div>
                  <div className="font-medium text-slate-800 text-[11px] mt-0.5 line-clamp-2">
                    {tempPin.address}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    {tempPin.lat.toFixed(4)}, {tempPin.lng.toFixed(4)}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex flex-col gap-1">
                  <button
                    onClick={handleSetTempAsOrigin}
                    className="w-full text-left px-2 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] flex items-center justify-between"
                  >
                    <span>Set as Origin</span>
                    <span className="px-1 bg-emerald-600 text-white rounded text-[9px]">A</span>
                  </button>
                  <button
                    onClick={handleSetTempAsDestination}
                    className="w-full text-left px-2 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-[11px] flex items-center justify-between"
                  >
                    <span>Set as Destination</span>
                    <span className="px-1 bg-rose-600 text-white rounded text-[9px]">B</span>
                  </button>
                  <button
                    onClick={handleSetTempAsWaypoint}
                    className="w-full text-left px-2 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold text-[11px] flex items-center justify-between"
                  >
                    <span>Add as Waypoint</span>
                    <span className="px-1 bg-indigo-600 text-white rounded text-[9px]">W</span>
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* RENDER ROUTE POLYLINES WITH TRAFFIC FLOW SEGMENTS */}
        {routes.map((route, idx) => {
          if (!route.polyline || !Array.isArray(route.polyline)) return null;

          const isSelected = activeRouteId ? route.id === activeRouteId : (route.is_recommended || idx === 0);
          const isCompatible = route.is_compatible !== false;

          let lineColor = '#64748b';
          let lineWeight = 4;
          let lineOpacity = 0.55;

          if (isSelected) {
            lineColor = isCompatible ? '#10b981' : '#f43f5e';
            lineWeight = 6;
            lineOpacity = 0.95;
          } else if (route.route_code === 'Route B') {
            lineColor = '#f59e0b';
            lineOpacity = 0.65;
          } else if (route.route_code === 'Route C') {
            lineColor = '#06b6d4';
            lineOpacity = 0.65;
          }

          return (
            <Polyline
              key={route.id || idx}
              positions={route.polyline}
              pathOptions={{
                color: lineColor,
                weight: lineWeight,
                opacity: lineOpacity,
                dashArray: !isCompatible ? '6, 8' : undefined
              }}
              eventHandlers={{
                click: () => onSelectRoute(route)
              }}
            >
              <Popup>
                <div className="text-slate-900 text-xs">
                  <div className="font-bold text-sm text-emerald-700">{route.route_code}: {route.route_name}</div>
                  <div className="mt-1 flex items-center justify-between gap-4">
                    <span>⏱ {route.duration_minutes} min (ETA {route.current_eta})</span>
                    <span className="font-bold">₹{route.total_cost}</span>
                  </div>
                  <div className="mt-1 text-slate-600">⛽ {route.fuel_liters} L • 🚦 Traffic: {route.traffic_level}</div>
                  {!isCompatible && (
                    <div className="mt-1 text-rose-600 font-bold">⚠️ Clearance/Load Violation</div>
                  )}
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* TRAFFIC INCIDENT EVENT MARKERS */}
        {showTrafficLayer && trafficEvents.map((evt, i) => {
          if (!evt.lat || !evt.lng) return null;
          return (
            <Marker key={evt.id || i} position={[evt.lat, evt.lng]} icon={incidentIcon}>
              <Popup>
                <div className="text-slate-900 text-xs p-1">
                  <div className="font-bold text-rose-600 uppercase tracking-wide">🚨 {evt.type} Alert</div>
                  <div className="font-semibold text-slate-800">{evt.locationName || evt.affectedRouteName}</div>
                  <div className="text-rose-700 mt-1 font-bold">+{evt.delayMinutes} min Delay Surge</div>
                  <div className="text-slate-600 text-[11px] mt-1">{evt.recommendedAction}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* AUTO BOUNDS / FOLLOW VEHICLE ADJUSTER */}
        <BoundsAdjuster
          bounds={allCoordinates.length > 1 ? allCoordinates : null}
          followCoords={followVehicle && liveVehicleState ? [liveVehicleState.lat, liveVehicleState.lng] : null}
        />
      </MapContainer>

      {/* BOTTOM REAL-TIME VEHICLE SIMULATION & TELEMETRY CONTROLS */}
      <div className="absolute bottom-3 left-3 right-3 z-10 glass-panel p-2.5 rounded-2xl shadow-2xl bg-[#06140e]/95 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
        {/* Playback & Speed Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSimPlaying(!simPlaying)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
              simPlaying
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 hover:bg-emerald-400'
            }`}
            title={simPlaying ? 'Pause Live Moving Vehicle' : 'Start Live Moving Vehicle Simulation'}
          >
            {simPlaying ? <Pause className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
            <span>{simPlaying ? 'Pause Sim' : 'Live Vehicle'}</span>
          </button>

          <button
            onClick={() => {
              const speeds = [1, 2, 5];
              const nextIdx = (speeds.indexOf(simSpeedMultiplier) + 1) % speeds.length;
              setSimSpeedMultiplier(speeds[nextIdx]);
            }}
            className="px-2 py-1.5 rounded-xl bg-[#081510] text-emerald-400 font-mono text-xs font-bold border border-emerald-900/60 hover:bg-emerald-950/40 transition"
            title="Adjust simulation speed multiplier"
          >
            {simSpeedMultiplier}x
          </button>

          <button
            onClick={() => setFollowVehicle(!followVehicle)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
              followVehicle
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Lock camera center on moving vehicle"
          >
            <Compass className={`w-3.5 h-3.5 ${followVehicle ? 'text-cyan-400 animate-spin' : ''}`} />
            <span>Follow</span>
          </button>
        </div>

        {/* Live Corridor Progress Scrubber */}
        <div className="flex-1 min-w-[160px] max-w-xs flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.005"
            value={simProgress}
            onChange={(e) => setSimProgress(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-[#081510] rounded-lg cursor-pointer"
          />
          <span className="text-[10px] font-mono text-emerald-400 font-bold whitespace-nowrap">
            {(simProgress * 100).toFixed(0)}%
          </span>
        </div>

        {/* Segment Coordinates & Stops Summary */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-heading">
          <span>A: <strong className="text-emerald-400">{origin?.address?.slice(0, 14) || 'Origin'}</strong></span>
          <span>B: <strong className="text-rose-400">{destination?.address?.slice(0, 14) || 'Dest'}</strong></span>
          {waypoints.length > 0 && (
            <span className="text-indigo-400 font-semibold">{waypoints.length} Stop(s)</span>
          )}
        </div>
      </div>
    </div>
  );
}
