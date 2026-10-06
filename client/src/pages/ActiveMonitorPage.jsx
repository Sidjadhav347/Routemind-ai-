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
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-[#ea580c] animate-pulse" />
              Active Trip Telemetry &amp; Live Monitor
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${
              trip?.status === 'ACTIVE' ? 'bg-orange-50 text-[#ea580c] border-orange-200 animate-pulse' :
              trip?.status === 'REROUTE_RECOMMENDED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
              trip?.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {trip?.status || 'PLANNED'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time road disruption detection, continuous ETA re-evaluation, and autonomous route diversion alerts.
          </p>
        </div>

        {/* Trip Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTripId || ''}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-heading font-medium text-slate-800 focus:outline-none focus:border-[#ea580c] focus:bg-white shadow-xs"
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
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-mono">Dismiss</button>
        </div>
      )}

      {/* DYNAMIC REROUTE ALERT BANNER */}
      {rerouteAlert && (
        <div className="bg-white rounded-3xl p-6 border-2 border-orange-400 shadow-xl space-y-4 animate-in zoom-in-95 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#ea580c] flex items-center justify-center shadow-lg shadow-orange-500/30">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-heading font-black tracking-widest uppercase px-2 py-0.5 rounded bg-orange-100 text-[#ea580c] border border-orange-200">
                    URGENT REROUTE ADVISORY
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-heading font-extrabold text-slate-900 tracking-tight mt-0.5">
                  Route Change Recommended: Save <span className="text-[#ea580c]">{rerouteAlert.timeSavedMinutes} Minutes</span>
                </h2>
              </div>
            </div>

            <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-heading font-bold flex items-center gap-1.5 self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{rerouteAlert.confidencePercent}% Confidence</span>
            </div>
          </div>

          {/* Side by side comparison (CURRENT vs NEW) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Current Route */}
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 text-xs space-y-2">
              <div className="text-[11px] font-heading font-bold text-rose-700 uppercase tracking-wider flex items-center justify-between">
                <span>Current Trajectory (Delayed)</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">CONGESTED</span>
              </div>
              <div className="font-heading font-bold text-sm text-slate-900">{rerouteAlert.currentRoute?.name}</div>
              <div className="flex items-center justify-between pt-1 border-t border-rose-200">
                <span className="text-slate-500">Degraded Arrival ETA:</span>
                <span className="text-rose-600 font-extrabold text-sm">{rerouteAlert.currentRoute?.eta}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">Duration: {rerouteAlert.currentRoute?.durationMinutes} min (+{rerouteAlert.timeSavedMinutes}m penalty)</div>
            </div>

            {/* Recommended Alternative Route */}
            <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-300 text-xs space-y-2">
              <div className="text-[11px] font-heading font-bold text-[#ea580c] uppercase tracking-wider flex items-center justify-between">
                <span>Recommended Diversion Corridor</span>
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-[#ea580c] font-bold text-[10px]">OPTIMAL</span>
              </div>
              <div className="font-heading font-bold text-sm text-slate-900">{rerouteAlert.recommendedRoute?.name}</div>
              <div className="flex items-center justify-between pt-1 border-t border-orange-200">
                <span className="text-slate-600">Expedited Arrival ETA:</span>
                <span className="text-[#ea580c] font-extrabold text-sm">{rerouteAlert.recommendedRoute?.eta}</span>
              </div>
              <div className="text-[11px] text-slate-600 font-mono">Duration: {rerouteAlert.recommendedRoute?.durationMinutes} min (Arrive {rerouteAlert.timeSavedMinutes}m sooner)</div>
            </div>
          </div>

          {/* AI Explanation Text */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium">
            <span className="font-heading font-bold text-[#ea580c] uppercase tracking-wider">AI Explanation: </span>
            {rerouteAlert.aiExplanation}
          </div>

          {/* Action Button: Switch Route */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setRerouteAlert(null)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-xs font-heading font-semibold transition border border-slate-200"
            >
              Ignore &amp; Stay on Current Route
            </button>
            <button
              onClick={handleAcceptReroute}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] text-white text-xs font-heading font-extrabold uppercase tracking-wider shadow-md shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-white" />
              <span>Switch to New Route &amp; Save {rerouteAlert.timeSavedMinutes} Mins</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Interactive Map & Live Trip Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map View (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="w-full h-[480px] rounded-3xl overflow-hidden shadow-xs border border-slate-200">
            {trip ? (
              <RouteMap
                origin={{ lat: parseFloat(trip.origin_lat), lng: parseFloat(trip.origin_lng), address: trip.origin_address }}
                destination={{ lat: parseFloat(trip.destination_lat), lng: parseFloat(trip.destination_lng), address: trip.destination_address }}
                routes={routes}
                activeRouteId={trip.current_route_id}
                trafficEvents={trafficEvents}
                isLiveTrip={true}
                allowPinning={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">Loading trip telemetry...</div>
            )}
          </div>

          {/* Hackathon Simulation Trigger Deck */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#ea580c] animate-pulse" />
              <div>
                <div className="text-xs font-bold text-slate-900">Traffic Disruption Simulator</div>
                <div className="text-[10px] text-slate-400">Inject dynamic congestion surge to trigger AI rerouting</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSimulateDisruption(28)}
                disabled={isSimulating}
                className="px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#ea580c] border border-orange-200 text-xs font-bold transition flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#ea580c]" />
                <span>Simulate +28m Traffic Jam</span>
              </button>

              <button
                onClick={() => handleSimulateDisruption(42)}
                disabled={isSimulating}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Simulate Accident (+42m)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Telemetry Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {trip && activeRoute ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="text-[10px] text-[#ea580c] font-mono font-bold uppercase tracking-wider">Active Corridor</div>
                  <h3 className="font-heading font-extrabold text-base text-slate-900 mt-0.5">{activeRoute.route_name}</h3>
                </div>
                <span className="text-xs font-heading font-black px-2.5 py-0.5 rounded-full bg-orange-100 text-[#ea580c] border border-orange-200">
                  {activeRoute.route_code}
                </span>
              </div>

              {/* Progress & Live Telemetry Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] text-slate-400 font-heading font-semibold uppercase">Estimated Arrival</div>
                  <div className="text-lg font-heading font-extrabold text-slate-900 mt-0.5">{activeRoute.current_eta}</div>
                  <div className="text-[10px] text-emerald-600 font-mono mt-0.5">● On Schedule SLA</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] text-slate-400 font-heading font-semibold uppercase">Time Remaining</div>
                  <div className="text-lg font-heading font-extrabold text-[#ea580c] mt-0.5">{activeRoute.duration_minutes} min</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{activeRoute.distance_km} km distance</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] text-slate-400 font-heading font-semibold uppercase">Fuel &amp; Toll Budget</div>
                  <div className="text-lg font-heading font-extrabold text-emerald-700 mt-0.5">₹{activeRoute.total_cost}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{activeRoute.fuel_liters} L • Tolls: ₹{activeRoute.toll_cost}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] text-slate-400 font-heading font-semibold uppercase">Live Traffic Flow</div>
                  <div className="text-lg font-heading font-extrabold text-slate-900 mt-0.5">{activeRoute.traffic_level}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{activeRoute.delay_risk_percent}% delay exposure</div>
                </div>
              </div>

              {/* Vehicle & Consignment Summary */}
              {tripDetails?.vehicle && (
                <div className="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-200 text-xs space-y-1">
                  <div className="text-[10px] font-heading font-bold text-[#ea580c] uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#ea580c]" />
                    Vehicle &amp; Payload Clearance
                  </div>
                  <div className="text-slate-900 font-heading font-bold">{tripDetails.vehicle.name}</div>
                  <div className="text-slate-500 text-[11px] font-mono">
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
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] text-white font-heading font-extrabold text-xs uppercase tracking-wider shadow-md shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Complete Delivery &amp; Update Analytics</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
              Select or start a trip from the Trip Optimizer to begin live telemetry monitoring.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
