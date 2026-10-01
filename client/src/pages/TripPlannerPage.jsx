import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripApi, vehicleApi, cargoApi, routeApi } from '../services/api';
import RouteMap from '../components/map/RouteMap';
import {
  Navigation,
  Clock,
  Fuel,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Zap,
  TrendingUp,
  MapPin,
  Truck,
  Package,
  Layers,
  CheckCircle2,
  Calendar,
  Compass,
  ArrowRight,
  Share2
} from 'lucide-react';
import CoLoadingFeatureSection from '../components/coloading/CoLoadingFeatureSection';

const PRESET_CORRIDORS = [
  { name: 'Mumbai → Pune (Hackathon Core)', origin: 'Mumbai, Maharashtra', dest: 'Pune, Maharashtra' },
  { name: 'Bhiwandi Hub → Chakan Auto Hub', origin: 'Bhiwandi Logistics Hub, Maharashtra', dest: 'Chakan Auto Corridor, Pune' },
  { name: 'JNPT Port → Hinjawadi Tech Park', origin: 'Navi Mumbai, Maharashtra', dest: 'Pune, Maharashtra' }
];

const OPTIMIZATION_MODES = [
  { id: 'BALANCED', label: 'Balanced', icon: Compass, desc: 'Equal weighting on time, cost & safety' },
  { id: 'FASTEST', label: 'Fastest', icon: Zap, desc: 'Prioritize minimal transit duration' },
  { id: 'CHEAPEST', label: 'Cheapest', icon: IndianRupee, desc: 'Prioritize lowest total expenditure' },
  { id: 'FUEL_EFFICIENT', label: 'Fuel Efficient', icon: Fuel, desc: 'Minimize liters & emission footprint' },
  { id: 'DEADLINE_PRIORITY', label: 'Deadline Priority', icon: Clock, desc: 'Guarantees SLA arrival buffer' },
  { id: 'LOW_TRAFFIC', label: 'Low Traffic', icon: TrendingUp, desc: 'Bypass bottlenecks & urban gridlock' }
];

export default function TripPlannerPage() {
  const navigate = useNavigate();

  // Form State
  const [originQuery, setOriginQuery] = useState('Mumbai, Maharashtra');
  const [destinationQuery, setDestinationQuery] = useState('Pune, Maharashtra');
  const [originCoord, setOriginCoord] = useState({ lat: 19.0760, lng: 72.8777, address: 'Mumbai, Maharashtra' });
  const [destCoord, setDestCoord] = useState({ lat: 18.5204, lng: 73.8567, address: 'Pune, Maharashtra' });
  const [waypoints, setWaypoints] = useState([]);
  const [pinMode, setPinMode] = useState(null); // 'origin' | 'destination' | 'waypoint' | null

  const [vehicles, setVehicles] = useState([]);
  const [cargoList, setCargoList] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedCargoId, setSelectedCargoId] = useState('');
  const [optimizationMode, setOptimizationMode] = useState('BALANCED');
  const [desiredDeadline, setDesiredDeadline] = useState('18:00'); // 6:00 PM
  const [budget, setBudget] = useState('2000');

  // Calculation Results
  const [loading, setLoading] = useState(false);
  const [generatedTrip, setGeneratedTrip] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [departurePrediction, setDeparturePrediction] = useState(null);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    loadFleetAndCargo();
    if (window.location.hash === '#coloading-feature' || window.location.hash === '#coloading') {
      setTimeout(() => {
        document.getElementById('coloading-feature')?.scrollIntoView({ behavior: 'smooth' });
      }, 350);
    }
  }, []);

  const loadFleetAndCargo = async () => {
    try {
      const [vRes, cRes] = await Promise.all([vehicleApi.getAll(), cargoApi.getAll()]);
      let defaultVehId = null;
      let defaultCargoId = null;
      if (vRes.success && vRes.data.length > 0) {
        setVehicles(vRes.data);
        const heavy = vRes.data.find(v => v.type === 'HEAVY_TRUCK') || vRes.data[0];
        defaultVehId = heavy.id;
        setSelectedVehicleId(heavy.id);
      }
      if (cRes.success && cRes.data.length > 0) {
        setCargoList(cRes.data);
        defaultCargoId = cRes.data[0].id;
        setSelectedCargoId(defaultCargoId);
      }
      // Automatically generate initial routes on first view
      if (defaultVehId) {
        runRouteGeneration(defaultVehId, defaultCargoId);
      }
    } catch (err) {
      console.warn('Failed to load fleet/cargo:', err);
    }
  };

  const handleApplyPreset = (preset) => {
    setOriginQuery(preset.origin);
    setDestinationQuery(preset.dest);
    const newOrig = { lat: 19.0760, lng: 72.8777, address: preset.origin };
    const newDest = { lat: 18.5204, lng: 73.8567, address: preset.dest };
    setOriginCoord(newOrig);
    setDestCoord(newDest);
    setWaypoints([]);
    runRouteGeneration(selectedVehicleId, selectedCargoId, newOrig, newDest, []);
  };

  const handleOriginPinned = (newOrigin) => {
    setOriginCoord(newOrigin);
    setOriginQuery(newOrigin.address || `${newOrigin.lat}, ${newOrigin.lng}`);
    runRouteGeneration(selectedVehicleId, selectedCargoId, newOrigin, destCoord, waypoints);
  };

  const handleDestinationPinned = (newDest) => {
    setDestCoord(newDest);
    setDestinationQuery(newDest.address || `${newDest.lat}, ${newDest.lng}`);
    runRouteGeneration(selectedVehicleId, selectedCargoId, originCoord, newDest, waypoints);
  };

  const handleWaypointsChanged = (newWaypoints) => {
    setWaypoints(newWaypoints);
    runRouteGeneration(selectedVehicleId, selectedCargoId, originCoord, destCoord, newWaypoints);
  };

  const runRouteGeneration = async (
    vId = selectedVehicleId,
    cId = selectedCargoId,
    orig = originCoord,
    dest = destCoord,
    wps = waypoints
  ) => {
    const activeVehId = vId || selectedVehicleId;
    if (!activeVehId) {
      setErrorMsg('Please select a vehicle from your fleet.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      const today = new Date();
      const [hours, minutes] = desiredDeadline.split(':');
      today.setHours(parseInt(hours || '18', 10), parseInt(minutes || '0', 10), 0, 0);

      const payload = {
        origin: orig || originCoord,
        destination: dest || destCoord,
        waypoints: wps || waypoints,
        vehicle_id: activeVehId,
        cargo_id: cId || selectedCargoId || null,
        desired_arrival_time: today.toISOString(),
        max_budget: parseFloat(budget) || 2000,
        optimization_mode: optimizationMode
      };

      const res = await tripApi.create(payload);
      if (res.success && res.data) {
        setGeneratedTrip(res.data.trip);
        setRoutes(res.data.routes);
        setSelectedRouteId(res.data.recommendedRoute?.id || res.data.routes[0]?.id);
        setDeparturePrediction(res.data.departurePrediction);
        setAiExplanation(res.data.aiExplanation);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to optimize routes. Please verify constraints.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoutes = () => {
    runRouteGeneration(selectedVehicleId, selectedCargoId, originCoord, destCoord, waypoints);
  };

  const handleStartTrip = async () => {
    if (!generatedTrip) return;
    try {
      await tripApi.start(generatedTrip.id);
      navigate(`/monitor?tripId=${generatedTrip.id}`);
    } catch (err) {
      setErrorMsg('Failed to start trip: ' + err.message);
    }
  };

  const activeRoute = routes.find(r => r.id === selectedRouteId) || routes[0];
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const selectedCargo = cargoList.find(c => c.id === selectedCargoId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Same-Page Feature Switcher Pills */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-panel border border-emerald-900/50 bg-[#06120b] w-fit flex-wrap">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-heading font-bold bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
        >
          <Navigation className="w-3.5 h-3.5 fill-slate-950/20" />
          <span>Route & Trip Planner</span>
        </button>
        <button
          type="button"
          onClick={() => document.getElementById('coloading-feature')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-heading font-bold text-amber-300 hover:text-white hover:bg-amber-950/30 transition border border-amber-500/30 shadow-sm shadow-amber-500/10"
        >
          <Share2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Co-Loading Marketplace Network</span>
          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200 font-extrabold">
            Same-Page Feature
          </span>
        </button>
      </div>

      {/* Hero Showcase Banner Matching StinPort Global Trade Theme */}
      <div className="relative glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/25 overflow-hidden">
        {/* Ambient Emerald Halo Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-heading font-extrabold tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                AI SMART MOBILITY GATEWAY
              </span>
              <span className="text-[10px] font-mono tracking-wider text-amber-400 font-bold uppercase hidden sm:inline">
                • GLOBAL CORRIDOR ENGINE
              </span>
            </div>

            <h1 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-white leading-none">
              DESIGNING A DIGITAL GATEWAY FOR <span className="text-amber-400 font-black">GLOBAL TRADE</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-2xl">
              AN INTELLIGENT TELEMETRY SYSTEM BUILT TO OPTIMIZE, CLEAR RESTRICTIONS, AND CONNECT <span className="text-emerald-400 font-bold">FREIGHT MARKETS.</span>
            </p>
          </div>

          {/* Metadata Specs Grid Matching Screenshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-emerald-900/40 lg:pl-6 text-[11px]">
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 font-bold">ROLE</div>
              <div className="font-heading font-extrabold text-white mt-0.5">MOBILITY AI</div>
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 font-bold">SCOPE</div>
              <div className="font-heading font-extrabold text-white mt-0.5">HEAVY FREIGHT</div>
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 font-bold">FOCUS AREAS</div>
              <div className="font-heading font-extrabold text-amber-400 mt-0.5">REROUTE ≥8m</div>
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 font-bold">STATUS</div>
              <div className="font-heading font-extrabold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </div>
            </div>
          </div>
        </div>

        {/* Quick Corridor Presets Bar */}
        <div className="mt-6 pt-4 border-t border-emerald-900/30 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">FREIGHT CORRIDORS:</span>
            {PRESET_CORRIDORS.map((preset, i) => (
              <button
                key={i}
                onClick={() => handleApplyPreset(preset)}
                className="text-xs px-3.5 py-1.5 rounded-full bg-[#08140f] hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 border border-emerald-900/60 hover:border-emerald-500/50 transition font-heading font-semibold"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Input Form vs Map Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Constraints & Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                1. Origin, Destination &amp; Waypoints
              </h2>
              {pinMode && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40 animate-pulse">
                  Pin Mode Active
                </span>
              )}
            </div>

            <div className="space-y-3">
              {/* Departure Origin */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Departure Origin (Pin A)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setPinMode(pinMode === 'origin' ? null : 'origin')}
                    className={`text-[11px] px-2.5 py-0.5 rounded-lg border flex items-center gap-1 transition font-medium ${
                      pinMode === 'origin'
                        ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-emerald-glow'
                        : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/40'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{pinMode === 'origin' ? 'Click Map to Place' : 'Pin on Map'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={originQuery}
                    onChange={(e) => setOriginQuery(e.target.value)}
                    onBlur={async () => {
                      if (originQuery && originQuery !== originCoord?.address) {
                        try {
                          const res = await routeApi.geocode(originQuery);
                          if (res.data) handleOriginPinned(res.data);
                        } catch (e) {}
                      }
                    }}
                    placeholder="Enter city or click 'Pin on Map'..."
                    className="w-full bg-[#06120c] border border-emerald-500/20 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-400 transition"
                  />
                  <span className="absolute right-3 top-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    A
                  </span>
                </div>
                {originCoord?.lat && (
                  <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-1">
                    <span>GPS: {originCoord.lat.toFixed(4)}, {originCoord.lng.toFixed(4)} (Draggable on map)</span>
                  </div>
                )}
              </div>

              {/* Waypoint Stops (Optional) */}
              {waypoints.length > 0 && (
                <div className="p-2.5 rounded-xl bg-[#05110b] border border-indigo-500/20 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-indigo-300">Waypoint Stops ({waypoints.length})</span>
                    <button
                      type="button"
                      onClick={() => setWaypoints([])}
                      className="text-rose-400 hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                  {waypoints.map((wp, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-[#081810] border border-emerald-900/40">
                      <span className="text-slate-300 truncate max-w-[200px]">
                        W{idx + 1}: {wp.address || `${wp.lat.toFixed(4)}, ${wp.lng.toFixed(4)}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleWaypointsChanged(waypoints.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-400 p-0.5"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Arrival Destination */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>Arrival Destination (Pin B)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setPinMode(pinMode === 'destination' ? null : 'destination')}
                    className={`text-[11px] px-2.5 py-0.5 rounded-lg border flex items-center gap-1 transition font-medium ${
                      pinMode === 'destination'
                        ? 'bg-rose-500 text-white font-bold border-rose-400 shadow-rose-glow'
                        : 'text-rose-400 border-rose-500/30 hover:bg-rose-950/40'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{pinMode === 'destination' ? 'Click Map to Place' : 'Pin on Map'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={destinationQuery}
                    onChange={(e) => setDestinationQuery(e.target.value)}
                    onBlur={async () => {
                      if (destinationQuery && destinationQuery !== destCoord?.address) {
                        try {
                          const res = await routeApi.geocode(destinationQuery);
                          if (res.data) handleDestinationPinned(res.data);
                        } catch (e) {}
                      }
                    }}
                    placeholder="Enter delivery location or click 'Pin on Map'..."
                    className="w-full bg-[#06120c] border border-emerald-500/20 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-400 transition"
                  />
                  <span className="absolute right-3 top-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    B
                  </span>
                </div>
                {destCoord?.lat && (
                  <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-1">
                    <span>GPS: {destCoord.lat.toFixed(4)}, {destCoord.lng.toFixed(4)} (Draggable on map)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle & Cargo Pickers */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-400" />
                2. Fleet Vehicle & Cargo Load
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Vehicle</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.type}) — {v.height_m}m Tall • Max {v.max_weight_capacity_kg}kg
                    </option>
                  ))}
                </select>

                {selectedVehicle && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] grid grid-cols-2 gap-2 text-slate-400">
                    <div>Height: <span className="text-slate-200 font-semibold">{selectedVehicle.height_m}m</span></div>
                    <div>Length: <span className="text-slate-200 font-semibold">{selectedVehicle.length_m}m</span></div>
                    <div>Tare Weight: <span className="text-slate-200 font-semibold">{selectedVehicle.tare_weight_kg}kg</span></div>
                    <div>Fuel Economy: <span className="text-slate-200 font-semibold">{selectedVehicle.fuel_efficiency_km_l} km/L</span></div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Cargo Consignment</label>
                <select
                  value={selectedCargoId}
                  onChange={(e) => setSelectedCargoId(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="">No Special Cargo (Empty Transit)</option>
                  {cargoList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.weight_kg} kg) • Priority: {c.priority}
                    </option>
                  ))}
                </select>

                {selectedVehicle && selectedCargo && (
                  <div className="mt-2 p-2 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-[11px] flex items-center justify-between text-indigo-300">
                    <span>Total Gross Load:</span>
                    <span className="font-bold text-white">
                      {(selectedVehicle.tare_weight_kg + selectedCargo.weight_kg).toLocaleString()} kg
                      ({((selectedVehicle.tare_weight_kg + selectedCargo.weight_kg) / 1000).toFixed(1)} Tonnes)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Optimization Objective Selector */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <label className="block text-xs font-semibold text-slate-400">3. Optimization Objective</label>
              <div className="grid grid-cols-2 gap-2">
                {OPTIMIZATION_MODES.map(mode => {
                  const Icon = mode.icon;
                  const isSelected = optimizationMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setOptimizationMode(mode.id)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                          : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <span>{mode.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{mode.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Deadline & Budget */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Arrival SLA</label>
                <input
                  type="time"
                  value={desiredDeadline}
                  onChange={(e) => setDesiredDeadline(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Budget Ceiling (₹)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="2000"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Submit Button - Glowing Emerald Pill */}
            <button
              onClick={handleGenerateRoutes}
              disabled={loading}
              className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-heading font-extrabold text-sm uppercase tracking-wider shadow-emerald-glow hover:shadow-emerald-glow-hover transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Evaluating Road Clearances & Telemetry...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 fill-slate-950/20" />
                  <span>Generate & Optimize Routes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Map & Live Corridor View (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Location Pinning Controls Bar */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl glass-panel border border-emerald-500/30 bg-[#08140f]/80 flex-wrap">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-heading font-bold text-slate-200 uppercase tracking-wide">
                Pin Location:
              </span>
              <span className="text-[11px] text-slate-400">
                {pinMode ? `Active: Click map to place ${pinMode.toUpperCase()}` : 'Select a mode to pin on map'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPinMode(pinMode === 'origin' ? null : 'origin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  pinMode === 'origin'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/40 ring-2 ring-emerald-300'
                    : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Pin Origin (A)</span>
              </button>
              <button
                type="button"
                onClick={() => setPinMode(pinMode === 'destination' ? null : 'destination')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  pinMode === 'destination'
                    ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/40 ring-2 ring-rose-300'
                    : 'bg-rose-950/40 text-rose-300 border border-rose-500/40 hover:bg-rose-900/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span>Pin Dest (B)</span>
              </button>
              <button
                type="button"
                onClick={() => setPinMode(pinMode === 'waypoint' ? null : 'waypoint')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  pinMode === 'waypoint'
                    ? 'bg-purple-500 text-white font-bold shadow-md shadow-purple-500/40 ring-2 ring-purple-300'
                    : 'bg-purple-950/40 text-purple-300 border border-purple-500/40 hover:bg-purple-900/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span>+ Waypoint</span>
              </button>
              {pinMode && (
                <button
                  type="button"
                  onClick={() => setPinMode(null)}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                  title="Cancel Pin Mode"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-emerald-900/40">
            <RouteMap
              origin={originCoord}
              destination={destCoord}
              waypoints={waypoints}
              routes={routes}
              activeRouteId={selectedRouteId}
              onSelectRoute={(r) => setSelectedRouteId(r.id)}
              onOriginChange={handleOriginPinned}
              onDestinationChange={handleDestinationPinned}
              onWaypointsChange={handleWaypointsChanged}
              externalPinMode={pinMode}
              onPinModeChange={setPinMode}
              allowPinning={true}
            />
          </div>

          {/* AI Route Explanation Card (Shown when routes are generated) */}
          {aiExplanation && activeRoute && (
            <div className="glass-panel p-5 rounded-3xl border border-emerald-500/30 bg-emerald-950/20 shadow-xl space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/40">
                    <Sparkles className="w-4 h-4 text-slate-950" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-indigo-200">AI Route Recommendation</h3>
                    <div className="text-[11px] text-slate-400">Grounded Mobility Reasoning Analysis</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{aiExplanation.confidence}% Confidence</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                "{aiExplanation.reason}"
              </div>

              {/* Key Benefits & Warnings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Key Transit Advantages
                  </div>
                  {aiExplanation.benefits?.slice(0, 2).map((b, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <span className="text-emerald-400">•</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Advisory Constraints
                  </div>
                  {aiExplanation.warnings?.slice(0, 2).map((w, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <span className="text-amber-400">•</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comparative Route Cards (Section 11) */}
      {routes.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-heading font-extrabold text-white tracking-tight flex items-center gap-2 uppercase">
                <Layers className="w-5 h-5 text-emerald-400" />
                Candidate Corridor Comparison
              </h2>
              <p className="text-xs text-slate-400">
                Evaluating transit speed, toll tariffs, fuel efficiency, and structural bridge clearances.
              </p>
            </div>

            {generatedTrip && (
              <button
                onClick={handleStartTrip}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-heading font-extrabold text-xs uppercase tracking-wider shadow-emerald-glow hover:shadow-emerald-glow-hover transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
              >
                <span>Engage Live Trip Telemetry</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {routes.map(r => {
              const isSelected = r.id === selectedRouteId;
              const isCompatible = r.is_compatible !== false;

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRouteId(r.id)}
                  className={`p-5 rounded-3xl border transition cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'glass-panel border-emerald-500/80 glow-emerald bg-[#081810]/90 shadow-2xl'
                      : 'glass-panel border-emerald-950/60 hover:border-emerald-500/40 bg-[#06100b]/70'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                        r.route_code === 'Route A' ? 'bg-indigo-500 text-white' :
                        r.route_code === 'Route B' ? 'bg-amber-500 text-slate-950' : 'bg-cyan-500 text-slate-950'
                      }`}>
                        {r.route_code}
                      </span>
                      {r.is_recommended && (
                        <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          AI TOP PICK
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black text-indigo-300">{r.route_score}/100</div>
                      <div className="text-[9px] text-slate-500 uppercase">Route Score</div>
                    </div>
                  </div>

                  {/* Route Title & Summary */}
                  <div>
                    <h3 className="font-bold text-sm text-slate-100 line-clamp-1">{r.route_name}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{r.summary}</p>
                  </div>

                  {/* Physical Restriction Status */}
                  <div className="my-3">
                    {isCompatible ? (
                      <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-[11px] flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>100% Vehicle & Load Clearance Compliant</span>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-[11px] flex items-start gap-1.5 font-medium leading-tight">
                        <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        <span>{r.incompatibility_reason}</span>
                      </div>
                    )}
                  </div>

                  {/* Core Metrics Matrix */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
                    <div className="p-2 rounded-xl bg-slate-950/60">
                      <div className="text-[10px] text-slate-500">Duration & ETA</div>
                      <div className="font-bold text-slate-200 mt-0.5">{r.duration_minutes} min ({r.current_eta})</div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/60">
                      <div className="text-[10px] text-slate-500">Total Transit Cost</div>
                      <div className="font-bold text-emerald-400 mt-0.5">₹{r.total_cost}</div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/60">
                      <div className="text-[10px] text-slate-500">Fuel Required</div>
                      <div className="font-bold text-slate-200 mt-0.5">{r.fuel_liters} L (₹{r.fuel_cost})</div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/60">
                      <div className="text-[10px] text-slate-500">Congestion / Delay Risk</div>
                      <div className={`font-bold mt-0.5 ${
                        r.traffic_level === 'LOW' ? 'text-emerald-400' :
                        r.traffic_level === 'HEAVY' ? 'text-amber-400' : 'text-slate-200'
                      }`}>
                        {r.traffic_level} ({r.delay_risk_percent}% risk)
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI-Assisted Departure Time Prediction (Section 20) */}
      {departurePrediction && (
        <div className="glass-panel p-6 rounded-3xl border border-emerald-900/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-heading font-extrabold text-white tracking-tight flex items-center gap-2 uppercase">
                <Clock className="w-5 h-5 text-emerald-400" />
                AI-Assisted Departure Timing Prediction
              </h2>
              <p className="text-xs text-slate-400">
                Probabilistic modeling factoring historical bottleneck curves and safety arrival margins.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-heading">
                Recommended Departure: <strong className="text-white ml-1">{departurePrediction.recommendedDeparture}</strong>
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-[#08140f] border border-emerald-900/60 text-slate-300 font-heading">
                Safety Buffer: <strong className="text-amber-400 ml-1">{departurePrediction.safetyBufferMinutes} mins</strong>
              </div>
            </div>
          </div>

          {/* 4 Departure Windows Scenarios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {departurePrediction.scenarios?.map(sc => (
              <div
                key={sc.id}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                  sc.isRecommended
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-[#08140f]/80 border-emerald-950/60 text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-heading font-bold uppercase tracking-wider text-[10px] text-emerald-400">{sc.status}</span>
                    <span className="text-[11px] font-mono font-bold text-amber-300">{sc.confidencePercent}% Conf</span>
                  </div>
                  <div className="text-xl font-heading font-black text-white mt-1">
                    {sc.departureTime}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Expected Arrival: <span className="text-slate-200 font-semibold">{sc.expectedArrival}</span>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-400 pt-2 border-t border-emerald-900/40 flex items-center justify-between font-heading">
                  <span>Buffer: {sc.bufferMinutes} mins</span>
                  {sc.isRecommended && (
                    <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">Recommended</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 italic">
            * {departurePrediction.disclaimer}
          </div>
        </div>
      )}

      {/* Embedded Co-Loading Marketplace Network Feature (Same Page) */}
      <CoLoadingFeatureSection
        currentOrigin={originQuery}
        currentDestination={destinationQuery}
        onApplyLaneToPlanner={(lane) => {
          handleApplyPreset({ origin: lane.origin, dest: lane.destination });
        }}
      />
    </div>
  );
}
