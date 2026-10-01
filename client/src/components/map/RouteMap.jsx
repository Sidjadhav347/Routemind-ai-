import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
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
  AlertTriangle
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
      ⚠️ DELAY
    </div>
  `,
  iconSize: [70, 26],
  iconAnchor: [35, 13]
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
  return `Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
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
function BoundsAdjuster({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } catch (err) {
        console.warn('Could not fit bounds:', err);
      }
    }
  }, [bounds, map]);
  return null;
}

export default function RouteMap({
  origin = { lat: 19.0760, lng: 72.8777, address: 'Mumbai' },
  destination = { lat: 18.5204, lng: 73.8567, address: 'Pune' },
  waypoints = [],
  routes = [],
  activeRouteId = null,
  onSelectRoute = () => {},
  trafficEvents = [],
  vehiclePosition = null,
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

  const defaultCenter = [
    (origin?.lat && destination?.lat ? (origin.lat + destination.lat) / 2 : 18.8),
    (origin?.lng && destination?.lng ? (origin.lng + destination.lng) / 2 : 73.3)
  ];

  // Tile layer configurations
  const tileLayers = {
    dark: {
      name: 'RouteMind Dark',
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

  // Handle map click
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
      // Free click: open instant pin placement menu at clicked coordinate
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

  // Calculate bounding box across all coordinates
  const allCoordinates = [];
  if (origin?.lat && origin?.lng) allCoordinates.push([origin.lat, origin.lng]);
  if (destination?.lat && destination?.lng) allCoordinates.push([destination.lat, destination.lng]);
  waypoints.forEach(w => {
    if (w.lat && w.lng) allCoordinates.push([w.lat, w.lng]);
  });
  routes.forEach(r => {
    if (Array.isArray(r.polyline)) {
      r.polyline.forEach(pt => allCoordinates.push(pt));
    }
  });

  return (
    <div className="relative w-full h-full min-h-[440px] rounded-3xl overflow-hidden border border-emerald-900/40 shadow-2xl bg-[#040907] flex flex-col">
      {/* Top Map Action Toolbar: Location Pinning Controls & Map Layer Switcher */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between pointer-events-none gap-2">
        {/* Left Side: Pin Mode Buttons */}
        {allowPinning && (
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl glass-panel bg-[#06140e]/90 border border-emerald-500/30 shadow-xl backdrop-blur-md pointer-events-auto flex-wrap">
            <button
              onClick={() => setPinMode(pinMode === 'origin' ? null : 'origin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                pinMode === 'origin'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-emerald-glow'
                  : 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-950/40'
              }`}
              title="Click map to place Origin Pin A"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Pin Origin (A)</span>
            </button>

            <button
              onClick={() => setPinMode(pinMode === 'destination' ? null : 'destination')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                pinMode === 'destination'
                  ? 'bg-rose-500 text-white font-bold shadow-rose-glow'
                  : 'text-slate-300 hover:text-rose-300 hover:bg-rose-950/40'
              }`}
              title="Click map to place Destination Pin B"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>Pin Dest (B)</span>
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

            {waypoints.length > 0 && (
              <button
                onClick={() => onWaypointsChange?.([])}
                className="px-2 py-1.5 rounded-xl text-[11px] text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 transition flex items-center gap-1"
                title="Clear all waypoints"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear ({waypoints.length})</span>
              </button>
            )}
          </div>
        )}

        {/* Right Side: Map Layer Switcher */}
        <div className="relative pointer-events-auto">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#08140f]/90 hover:bg-[#0c1f17] text-white text-xs font-semibold border border-emerald-500/30 shadow-lg backdrop-blur-md transition"
            title="Switch Map Tiles (Google Maps / Dark Mode)"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{currentTile.name}</span>
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 mt-1.5 p-1.5 rounded-xl bg-[#06120d]/95 border border-emerald-500/30 shadow-2xl backdrop-blur-md flex flex-col gap-1 w-44 animate-in fade-in">
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

      {/* Leaflet Map Canvas */}
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

        {/* Map Click Listener for Dropping Pins */}
        <MapClickHandler onMapClick={handleMapClick} />

        {/* Origin Marker (Draggable) */}
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

        {/* Destination Marker (Draggable) */}
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

        {/* Waypoint Markers (Draggable) */}
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

        {/* Temporary Click Pin (Menu to choose Pin Role) */}
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

        {/* Render Route Polylines */}
        {routes.map((route, idx) => {
          if (!route.polyline || !Array.isArray(route.polyline)) return null;

          const isSelected = activeRouteId ? route.id === activeRouteId : (route.is_recommended || idx === 0);
          const isCompatible = route.is_compatible !== false;

          let lineColor = '#64748b'; // slate muted
          let lineWeight = 4;
          let lineOpacity = 0.55;

          if (isSelected) {
            lineColor = isCompatible ? '#10b981' : '#f43f5e'; // Emerald for active or Red for violation
            lineWeight = 6;
            lineOpacity = 0.95;
          } else if (route.route_code === 'Route B') {
            lineColor = '#f59e0b'; // Amber
            lineOpacity = 0.65;
          } else if (route.route_code === 'Route C') {
            lineColor = '#06b6d4'; // Cyan
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

        {/* Traffic Incident Event Markers */}
        {trafficEvents.map((evt, i) => {
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

        {/* Auto Bounds Adjustment */}
        {allCoordinates.length > 1 && <BoundsAdjuster bounds={allCoordinates} />}
      </MapContainer>

      {/* Floating Bottom Coordinates & Legend Ribbon */}
      <div className="absolute bottom-4 left-4 z-10 glass-panel px-3 py-2 rounded-xl text-xs space-y-1 shadow-lg bg-[#040907]/85 border border-emerald-900/40">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-slate-400">
            A: <strong className="text-emerald-400">{origin?.address?.slice(0, 18) || 'Origin'}</strong>
          </span>
          <span className="text-slate-400">
            B: <strong className="text-rose-400">{destination?.address?.slice(0, 18) || 'Destination'}</strong>
          </span>
          {waypoints.length > 0 && (
            <span className="text-indigo-400 font-semibold">{waypoints.length} Stop(s)</span>
          )}
        </div>
      </div>
    </div>
  );
}
