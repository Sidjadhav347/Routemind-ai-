import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { tripApi, trafficApi } from '../services/api';
import RouteMap from '../components/map/RouteMap';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Compass,
  ArrowRight,
  Zap,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  Truck,
  Layers,
  Radio
} from 'lucide-react';

export default function ActiveMonitorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tripIdParam = searchParams.get('tripId');

  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(tripIdParam || null);
  const [tripDetails, setTripDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // Dynamic Rerouting Dialog / Alert state
  const [rerouteAlert, setRerouteAlert] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [trafficEvents, setTrafficEvents] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    if (selectedTripId) {
      loadTripDetails(selectedTripId);
    }
  }, [selectedTripId]);

  const loadTrips = async () => {
    try {
      const res = await tripApi.getAll();
      if (res.success && res.data.length > 0) {
        setTrips(res.data);
        if (!selectedTripId) {
          // Select active or latest trip
          const active = res.data.find(t => t.status === 'ACTIVE') || res.data[0];
          setSelectedTripId(active.id);
        }
      }
    } catch (err) {
      console.warn('Failed to load trips:', err);
    }
  };

  const loadTripDetails = async (id) => {
    setLoading(true);
    try {
      const res = await tripApi.getById(id);
      if (res.success && res.data) {
        setTripDetails(res.data);
        setTrafficEvents(res.data.trafficEvents || []);
      }
    } catch (err) {
      console.warn('Failed to load trip details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Hackathon Step 9: Traffic changes & Dynamic Reroute Evaluation
  const handleSimulateDisruption = async (delayMinutes = 28) => {
    if (!selectedTripId) return;
    setIsSimulating(true);
    setRerouteAlert(null);

    try {
      const res = await tripApi.simulateIncident(selectedTripId, {
        type: 'CONGESTION',
        delayMinutes: delayMinutes
      });

      if (res.success && res.data) {
        if (res.data.trafficEvent) {
          setTrafficEvents(prev => [res.data.trafficEvent, ...prev]);
        }
        if (res.data.rerouteProposal && res.data.rerouteProposal.isRerouteRecommended) {
          setRerouteAlert(res.data.rerouteProposal);
        }
        loadTripDetails(selectedTripId);
      }
    } catch (err) {
      console.error('Failed to trigger simulation:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Step 13: Accept Reroute and Switch Route
  const handleAcceptReroute = async () => {
    if (!selectedTripId || !rerouteAlert?.recommendedRoute?.id) return;

    try {
      const res = await tripApi.applyReroute(selectedTripId, rerouteAlert.recommendedRoute.id);
      if (res.success) {
        setSuccessMessage(`Switched active transit corridor to ${rerouteAlert.recommendedRoute.name}. Estimated time saved: ${rerouteAlert.timeSavedMinutes} minutes.`);
        setRerouteAlert(null);
        loadTripDetails(selectedTripId);
      }
    } catch (err) {
      console.error('Failed to switch route:', err);
    }
  };

  const handleCompleteTrip = async () => {
    if (!selectedTripId) return;
    try {
      await tripApi.complete(selectedTripId);
      setSuccessMessage('Trip completed successfully and archived to Logistics Analytics!');
      loadTripDetails(selectedTripId);
      setTimeout(() => navigate('/analytics'), 1500);
    } catch (err) {
      console.error('Failed to complete trip:', err);
    }
  };

  const trip = tripDetails?.trip;
  const routes = tripDetails?.routes || [];
  const activeRoute = routes.find(r => r.id === trip?.current_route_id) || routes[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Bar with Trip Selector & Status */}
      <div className="glass-panel p-6 rounded-3xl border border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-tight flex items-center gap-2 uppercase">
              <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
              Active Trip Telemetry & Live Monitor
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${
              trip?.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' :
              trip?.status === 'REROUTE_RECOMMENDED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
              trip?.status === 'COMPLETED' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
              'bg-[#08140f] text-slate-300 border-emerald-900/40'
            }`}>
              {trip?.status || 'PLANNED'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time road disruption detection, continuous ETA re-evaluation, and autonomous route diversion alerts.
          </p>
        </div>

        {/* Trip Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTripId || ''}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="bg-[#08140f] border border-emerald-900/60 rounded-xl px-3.5 py-2 text-xs font-heading font-medium text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            {trips.map(t => (
              <option key={t.id} value={t.id}>
                {t.origin_address.split(',')[0]} → {t.destination_address.split(',')[0]} ({t.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white text-xs font-mono">Dismiss</button>
        </div>
      )}

      {/* DYNAMIC REROUTE ALERT BANNER (Step 12 & 13) */}
      {rerouteAlert && (
        <div className="glass-panel p-6 rounded-3xl border-2 border-rose-500/80 glow-rose bg-gradient-to-r from-rose-950/50 via-[#08140f]/90 to-emerald-950/40 shadow-2xl space-y-4 animate-in zoom-in-95 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-600/40 animate-bounce-subtle">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-black tracking-widest uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    URGENT REROUTE ADVISORY
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">Step 12-14 Hackathon Flow</span>
                </div>
                <h2 className="text-lg sm:text-xl font-heading font-extrabold text-white tracking-tight mt-0.5 uppercase">
                  Route Change Recommended: Save <span className="text-emerald-400">{rerouteAlert.timeSavedMinutes} Minutes</span>
                </h2>
              </div>
            </div>

            <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-heading font-bold flex items-center gap-1.5 self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{rerouteAlert.confidencePercent}% Confidence</span>
            </div>
          </div>

          {/* Side by side comparison (CURRENT vs NEW) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Current Route */}
            <div className="p-4 rounded-2xl bg-[#040907]/90 border border-rose-800/40 text-xs space-y-2">
              <div className="text-[11px] font-heading font-bold text-rose-400 uppercase tracking-wider flex items-center justify-between">
                <span>Current Trajectory (Delayed)</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px]">CONGESTED</span>
              </div>
              <div className="font-heading font-bold text-sm text-slate-200">{rerouteAlert.currentRoute?.name}</div>
              <div className="flex items-center justify-between pt-1 border-t border-emerald-950/60">
                <span className="text-slate-400">Degraded Arrival ETA:</span>
                <span className="text-rose-400 font-extrabold text-sm">{rerouteAlert.currentRoute?.eta}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">Duration: {rerouteAlert.currentRoute?.durationMinutes} min (+{rerouteAlert.timeSavedMinutes}m penalty)</div>
            </div>

            {/* Recommended Alternative Route */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/60 text-xs space-y-2 glow-emerald">
              <div className="text-[11px] font-heading font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                <span>Recommended Diversion Corridor</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">OPTIMAL</span>
              </div>
              <div className="font-heading font-bold text-sm text-white">{rerouteAlert.recommendedRoute?.name}</div>
              <div className="flex items-center justify-between pt-1 border-t border-emerald-900/60">
                <span className="text-slate-300">Expedited Arrival ETA:</span>
                <span className="text-emerald-400 font-extrabold text-sm">{rerouteAlert.recommendedRoute?.eta}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">Duration: {rerouteAlert.recommendedRoute?.durationMinutes} min (Arrive {rerouteAlert.timeSavedMinutes}m sooner)</div>
            </div>
          </div>

          {/* AI Explanation Text */}
          <div className="p-3.5 rounded-2xl bg-[#040907]/90 border border-emerald-900/50 text-xs sm:text-sm text-slate-200 font-medium">
            <span className="font-heading font-bold text-emerald-400 uppercase tracking-wider">AI Explanation: </span>
            {rerouteAlert.aiExplanation}
          </div>

          {/* Action Button: Switch Route */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setRerouteAlert(null)}
              className="px-4 py-2 rounded-full bg-[#08140f] hover:bg-emerald-950/40 text-slate-300 text-xs font-heading font-semibold transition border border-emerald-900/40"
            >
              Ignore & Stay on Current Route
            </button>
            <button
              onClick={handleAcceptReroute}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 text-xs font-heading font-extrabold uppercase tracking-wider shadow-emerald-glow hover:shadow-emerald-glow-hover transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-slate-950 fill-slate-950/20" />
              <span>Switch to New Route & Save {rerouteAlert.timeSavedMinutes} Mins</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Interactive Map & Live Trip Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map View (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="w-full h-[480px] rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
            {trip ? (
              <RouteMap
                origin={{ lat: parseFloat(trip.origin_lat), lng: parseFloat(trip.origin_lng), address: trip.origin_address }}
                destination={{ lat: parseFloat(trip.destination_lat), lng: parseFloat(trip.destination_lng), address: trip.destination_address }}
                routes={routes}
                activeRouteId={trip.current_route_id}
                trafficEvents={trafficEvents}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">Loading trip telemetry...</div>
            )}
          </div>

          {/* Hackathon Simulation Trigger Deck */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
              <div>
                <div className="text-xs font-bold text-slate-200">Hackathon Disruption Simulator</div>
                <div className="text-[10px] text-slate-400">Inject dynamic congestion surge to trigger AI rerouting</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSimulateDisruption(28)}
                disabled={isSimulating}
                className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Simulate +28m Traffic Jam</span>
              </button>

              <button
                onClick={() => handleSimulateDisruption(42)}
                disabled={isSimulating}
                className="px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate Accident (+42m)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Telemetry Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {trip && activeRoute ? (
            <div className="glass-panel p-6 rounded-3xl border border-emerald-900/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
                <div>
                  <div className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">Active Corridor</div>
                  <h3 className="font-heading font-extrabold text-base text-white mt-0.5 uppercase">{activeRoute.route_name}</h3>
                </div>
                <span className="text-xs font-heading font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeRoute.route_code}
                </span>
              </div>

              {/* Progress & Live Telemetry Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#08140f] border border-emerald-900/50">
                  <div className="text-[10px] text-slate-500 font-heading font-semibold uppercase">Estimated Arrival</div>
                  <div className="text-lg font-heading font-extrabold text-white mt-0.5">{activeRoute.current_eta}</div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-0.5">● On Schedule SLA</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#08140f] border border-emerald-900/50">
                  <div className="text-[10px] text-slate-500 font-heading font-semibold uppercase">Time Remaining</div>
                  <div className="text-lg font-heading font-extrabold text-amber-300 mt-0.5">{activeRoute.duration_minutes} min</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{activeRoute.distance_km} km distance</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#08140f] border border-emerald-900/50">
                  <div className="text-[10px] text-slate-500 font-heading font-semibold uppercase">Fuel & Toll Budget</div>
                  <div className="text-lg font-heading font-extrabold text-emerald-400 mt-0.5">₹{activeRoute.total_cost}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{activeRoute.fuel_liters} L • Tolls: ₹{activeRoute.toll_cost}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#08140f] border border-emerald-900/50">
                  <div className="text-[10px] text-slate-500 font-heading font-semibold uppercase">Live Traffic Flow</div>
                  <div className="text-lg font-heading font-extrabold text-slate-200 mt-0.5">{activeRoute.traffic_level}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{activeRoute.delay_risk_percent}% delay exposure</div>
                </div>
              </div>

              {/* Vehicle & Consignment Summary */}
              {tripDetails?.vehicle && (
                <div className="p-3.5 rounded-2xl bg-[#08140f]/70 border border-emerald-900/40 text-xs space-y-1">
                  <div className="text-[10px] font-heading font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    Vehicle & Payload Clearance
                  </div>
                  <div className="text-slate-200 font-heading font-bold">{tripDetails.vehicle.name}</div>
                  <div className="text-slate-400 text-[11px] font-mono">
                    Payload: {tripDetails.cargo ? tripDetails.cargo.name : 'Standard'} •
                    Height: {tripDetails.vehicle.height_m}m •
                    Efficiency: {tripDetails.vehicle.fuel_efficiency_km_l} km/L
                  </div>
                </div>
              )}

              {/* Action: Complete Trip */}
              <div className="pt-2">
                <button
                  onClick={handleCompleteTrip}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-heading font-extrabold text-xs uppercase tracking-wider shadow-emerald-glow hover:shadow-emerald-glow-hover transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-slate-950 fill-slate-950/20" />
                  <span>Complete Delivery & Update Analytics</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center text-slate-500 text-xs">
              Select or start a trip from the Trip Optimizer to begin live telemetry monitoring.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
