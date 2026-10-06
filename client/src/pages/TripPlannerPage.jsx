import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tripApi, vehicleApi, cargoApi, routeApi } from '../services/api';
import RouteMap from '../components/map/RouteMap';
import { useAuth } from '../context/AuthContext';
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
  Share2,
  Radio,
  Plus,
  Route as RouteIcon,
  MoreHorizontal,
  ChevronRight
} from 'lucide-react';
import CoLoadingFeatureSection from '../components/coloading/CoLoadingFeatureSection';

const PRESET_CORRIDORS = [
  {
    name: 'Mumbai → Pune (Hackathon Core)',
    origin: 'Mumbai, Maharashtra',
    dest: 'Pune, Maharashtra',
    originCoord: { lat: 19.0760, lng: 72.8777, address: 'Mumbai, Maharashtra' },
    destCoord: { lat: 18.5204, lng: 73.8567, address: 'Pune, Maharashtra' }
  },
  {
    name: 'Nashik → Mumbai (Agro Corridor)',
    origin: 'Nashik, Maharashtra',
    dest: 'Mumbai, Maharashtra',
    originCoord: { lat: 19.9975, lng: 73.7898, address: 'Nashik, Maharashtra' },
    destCoord: { lat: 19.0760, lng: 72.8777, address: 'Mumbai, Maharashtra' }
  },
  {
    name: 'Bhiwandi Hub → Chakan Auto Hub',
    origin: 'Bhiwandi Logistics Hub, Maharashtra',
    dest: 'Chakan Auto Corridor, Pune',
    originCoord: { lat: 19.2967, lng: 73.0631, address: 'Bhiwandi Logistics Hub, Maharashtra' },
    destCoord: { lat: 18.7606, lng: 73.8617, address: 'Chakan Auto Corridor, Pune' }
  },
  {
    name: 'JNPT Port → Hinjawadi Tech Park',
    origin: 'Navi Mumbai, Maharashtra',
    dest: 'Hinjawadi, Pune',
    originCoord: { lat: 18.9499, lng: 72.9515, address: 'Navi Mumbai, Maharashtra' },
    destCoord: { lat: 18.5913, lng: 73.7389, address: 'Hinjawadi, Pune' }
  }
];

const LOADING_STEPS = [
  'Analyzing candidate corridors...',
  'Checking real-time traffic & bottlenecks...',
  'Checking vehicle load & road clearance constraints...',
  'Calculating dynamic fuel, toll & operating costs...',
  'Scanning co-loading capacity opportunities...',
  'Generating AI recommendation grounded in telemetry...'
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [networkMode, setNetworkMode] = useState('live'); // 'live' | 'traffic' | 'risk'

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
  const [cargoWeight, setCargoWeight] = useState(2500);
  const [cargoVolume, setCargoVolume] = useState(12);
  const [optimizationMode, setOptimizationMode] = useState('BALANCED');
  const [desiredDeadline, setDesiredDeadline] = useState('18:00'); // 6:00 PM
  const [budget, setBudget] = useState('2000');

  // Calculation Results
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [generatedTrip, setGeneratedTrip] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [departurePrediction, setDeparturePrediction] = useState(null);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Progressive loading message interval
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Sync AI Co-Pilot pre-filled logistics parameters
  useEffect(() => {
    if (location.state?.prefill) {
      const { origin, destination, deadline } = location.state.prefill;
      if (origin) {
        setOriginQuery(origin);
        routeApi.geocode(origin).then(res => {
          if (res.success && res.data) setOriginCoord(res.data);
        }).catch(() => {});
      }
      if (destination) {
        setDestinationQuery(destination);
        routeApi.geocode(destination).then(res => {
          if (res.success && res.data) setDestCoord(res.data);
        }).catch(() => {});
      }
      if (deadline && deadline.includes(':')) {
        setDesiredDeadline(deadline);
      }
    }
  }, [location.state]);

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
      let defaultW = 2500;
      let defaultV = 12;
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
        defaultW = cRes.data[0].weight_kg || 2500;
        defaultV = cRes.data[0].volume_m3 || 12;
        setCargoWeight(defaultW);
        setCargoVolume(defaultV);
      }
      // Automatically generate initial routes on first view
      if (defaultVehId) {
        runRouteGeneration(defaultVehId, defaultCargoId, originCoord, destCoord, [], defaultW, defaultV);
      }
    } catch (err) {
      console.warn('Failed to load fleet/cargo:', err);
    }
  };

  const handleApplyPreset = (preset) => {
    setOriginQuery(preset.origin);
    setDestinationQuery(preset.dest);
    const newOrig = preset.originCoord || { lat: 19.0760, lng: 72.8777, address: preset.origin };
    const newDest = preset.destCoord || { lat: 18.5204, lng: 73.8567, address: preset.dest };
    setOriginCoord(newOrig);
    setDestCoord(newDest);
    setWaypoints([]);
    runRouteGeneration(selectedVehicleId, selectedCargoId, newOrig, newDest, [], cargoWeight, cargoVolume);
  };

  const handleOriginPinned = (newOrigin) => {
    setOriginCoord(newOrigin);
    setOriginQuery(newOrigin.address || `${newOrigin.lat}, ${newOrigin.lng}`);
    runRouteGeneration(selectedVehicleId, selectedCargoId, newOrigin, destCoord, waypoints, cargoWeight, cargoVolume);
  };

  const handleDestinationPinned = (newDest) => {
    setDestCoord(newDest);
    setDestinationQuery(newDest.address || `${newDest.lat}, ${newDest.lng}`);
    runRouteGeneration(selectedVehicleId, selectedCargoId, originCoord, newDest, waypoints, cargoWeight, cargoVolume);
  };

  const handleWaypointsChanged = (newWaypoints) => {
    setWaypoints(newWaypoints);
    runRouteGeneration(selectedVehicleId, selectedCargoId, originCoord, destCoord, newWaypoints, cargoWeight, cargoVolume);
  };

  const handleCargoSelection = (cId) => {
    setSelectedCargoId(cId);
    const cargo = cargoList.find(c => c.id === cId);
    if (cargo) {
      setCargoWeight(cargo.weight_kg);
      setCargoVolume(cargo.volume_m3 || 10);
    }
  };

  const runRouteGeneration = async (
    vId = selectedVehicleId,
    cId = selectedCargoId,
    orig = originCoord,
    dest = destCoord,
    wps = waypoints,
    weightVal = cargoWeight,
    volumeVal = cargoVolume
  ) => {
    const activeVehId = vId || selectedVehicleId;
    if (!activeVehId) {
      setErrorMsg('Please select a vehicle from your fleet.');
      return;
    }
    setErrorMsg(null);
    // Clear old results immediately (Requirement 22)
    setGeneratedTrip(null);
    setRoutes([]);
    setSelectedRouteId(null);
    setDeparturePrediction(null);
    setAiExplanation(null);
    setLoading(true);

    try {
      const today = new Date();
      const [hours, minutes] = desiredDeadline.split(':');
      today.setHours(parseInt(hours || '18', 10), parseInt(minutes || '0', 10), 0, 0);

      const chosenVehicle = vehicles.find(v => v.id === activeVehId);
      const effectiveWeight = parseFloat(weightVal) || 0;
      const effectiveVolume = parseFloat(volumeVal) || 0;
      const parsedBudget = parseFloat(budget) || 2000;

      const payload = {
        origin: orig || originCoord,
        destination: dest || destCoord,
        waypoints: wps || waypoints,
        vehicle_id: activeVehId,
        vehicleType: chosenVehicle?.type,
        cargo_id: cId || selectedCargoId || null,
        weight: effectiveWeight,
        weight_kg: effectiveWeight,
        volume: effectiveVolume,
        volume_m3: effectiveVolume,
        desired_arrival_time: today.toISOString(),
        deadline: desiredDeadline,
        budget: parsedBudget,
        max_budget: parsedBudget,
        optimization_mode: optimizationMode,
        optimizationMode: optimizationMode
      };

      console.log('Trip Input:', payload); // Debugging log (Requirement 24)

      const res = await tripApi.create(payload);
      console.log('Optimization Response:', res.data); // Debugging log (Requirement 24)

      if (res.success && res.data) {
        setGeneratedTrip(res.data.trip);
        setRoutes(res.data.routes);
        setSelectedRouteId(res.data.recommendedRoute?.id || res.data.routes[0]?.id);
        setDeparturePrediction(res.data.departurePrediction);
        setAiExplanation(res.data.aiExplanation);
        if (res.data.trip?.origin?.lat && res.data.trip?.destination?.lat) {
          setOriginCoord(res.data.trip.origin);
          setDestCoord(res.data.trip.destination);
        }
      }
    } catch (err) {
      console.error('Trip optimization error:', err);
      setErrorMsg(err.message || 'Failed to optimize routes. Please verify constraints.');
    } finally {
      setLoading(false);
    }
  };

  const [isLocating, setIsLocating] = useState(false);

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
        setIsLocating(false);
        try {
          const res = await routeApi.reverseGeocode(lat, lng);
          const address = res?.data?.address || `GPS Location (${lat}, ${lng})`;
          handleOriginPinned({ lat, lng, address });
        } catch {
          handleOriginPinned({ lat, lng, address: `GPS Location (${lat}, ${lng})` });
        }
      },
      (err) => {
        setIsLocating(false);
        alert('Could not retrieve device location: ' + err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleGenerateRoutes = () => {
    runRouteGeneration(selectedVehicleId, selectedCargoId, originCoord, destCoord, waypoints, cargoWeight, cargoVolume);
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

  const userName = user?.name ? user.name.split(' ')[0] : 'Alex';
  const formattedDate = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* OPERATIONS OVERVIEW Hero Banner matching screenshot */}
      <div className="relative bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Aesthetic Background Elements: Concentric geometric orbital rings */}
        <div className="aesthetic-rings-container">
          <div className="aesthetic-ring-1" />
          <div className="aesthetic-ring-2" />
          <div className="aesthetic-ring-3" />
        </div>

        {/* Soft atmospheric orange radial gradient */}
        <div className="absolute -top-12 -right-12 w-80 h-80 bg-gradient-to-bl from-orange-200/35 via-amber-100/20 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4.5 bg-[#ea580c] rounded-full inline-block" />
              <span className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-slate-500">
                OPERATIONS OVERVIEW
              </span>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Good morning, {userName}
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Here's how your network is performing across Benelux today.
            </p>
          </div>

          {/* Right Actions: Date Pill & "+ Plan a route" Button */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs text-xs font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{formattedDate}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                document.getElementById('route-planner-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] text-white font-heading font-bold text-xs shadow-md shadow-orange-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Plan a route</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric KPI Cards matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active routes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active routes</span>
            <div className="w-8 h-8 rounded-xl bg-[#fff7ed] text-[#ea580c] flex items-center justify-center">
              <RouteIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-heading font-black text-slate-900 tracking-tight">42</span>
            <span className="text-xs font-medium text-slate-400">live now</span>
          </div>
          <div className="flex items-end justify-between pt-1">
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span>↑ 8.2%</span>
              <span className="text-slate-400 font-normal">vs. last Tuesday</span>
            </span>
            {/* Mini Bar Chart Graphic in Orange */}
            <div className="flex items-end gap-0.5 h-5">
              <div className="w-1 bg-orange-200 rounded-t h-2" />
              <div className="w-1 bg-orange-300 rounded-t h-3" />
              <div className="w-1 bg-orange-400 rounded-t h-2.5" />
              <div className="w-1 bg-orange-400 rounded-t h-4" />
              <div className="w-1 bg-orange-500 rounded-t h-3.5" />
              <div className="w-1 bg-orange-500 rounded-t h-5" />
              <div className="w-1 bg-[#ea580c] rounded-t h-4.5" />
              <div className="w-1 bg-[#ea580c] rounded-t h-5" />
            </div>
          </div>
        </div>

        {/* Card 2: On-time delivery */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">On-time delivery</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-heading font-black text-slate-900 tracking-tight">94.6%</span>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-600">↑ 2.1% above target</span>
            </div>
            {/* Green Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '94.6%' }} />
            </div>
          </div>
        </div>

        {/* Card 3: Distance saved */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Distance saved</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-heading font-black text-slate-900 tracking-tight">1,284</span>
            <span className="text-xs font-medium text-slate-400">km</span>
          </div>
          <div className="flex items-end justify-between pt-1">
            <span className="text-xs font-semibold text-emerald-700">
              €1,926 <span className="text-slate-400 font-normal">estimated savings</span>
            </span>
            {/* Mini Bar Chart in Emerald */}
            <div className="flex items-end gap-0.5 h-5">
              <div className="w-1 bg-emerald-200 rounded-t h-2" />
              <div className="w-1 bg-emerald-300 rounded-t h-2.5" />
              <div className="w-1 bg-emerald-300 rounded-t h-3.5" />
              <div className="w-1 bg-emerald-400 rounded-t h-3" />
              <div className="w-1 bg-emerald-500 rounded-t h-4" />
              <div className="w-1 bg-emerald-500 rounded-t h-4.5" />
              <div className="w-1 bg-emerald-600 rounded-t h-5" />
            </div>
          </div>
        </div>

        {/* Card 4: Attention needed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Attention needed</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-heading font-black text-slate-900 tracking-tight">5</span>
            <span className="text-xs font-medium text-slate-400">exceptions</span>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <span className="text-rose-600">2 high priority</span>
              <span className="text-slate-300">·</span>
              <span className="text-amber-600">3 moderate</span>
            </div>
            {/* Segmented status line */}
            <div className="flex items-center gap-1 h-1.5 w-full">
              <div className="w-2/5 bg-rose-500 h-1.5 rounded-full" />
              <div className="w-3/5 bg-amber-400 h-1.5 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Two-Column Operations Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Network Map & Route Planner Engine (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card: Live Network Map */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-heading font-extrabold text-lg text-slate-900 tracking-tight">
                  Live network
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  42 active routes · Updated just now
                </p>
              </div>

              {/* Toggle Pills: [Live] [Traffic] [Risk] */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                {['live', 'traffic', 'risk'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setNetworkMode(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold capitalize transition ${
                      networkMode === m
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Map Container with Floating Truck Tag from Screenshot */}
            <div className="relative w-full h-[500px] rounded-2xl overflow-hidden border border-slate-200">
              {/* Floating Vehicle Status Box matching Screenshot */}
              <div className="absolute top-4 left-4 z-[900] bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-slate-200/90 shadow-lg max-w-xs pointer-events-auto">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#ea580c] flex items-center justify-center shrink-0 shadow-xs">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-heading font-bold text-xs text-slate-900">TRK-104</span>
                        <span className="text-[10px] text-slate-400 font-mono">Route RM-2847</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600 mt-0.5 truncate max-w-[150px]">
                        {originQuery.split(',')[0]} → {destinationQuery.split(',')[0]}
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold shrink-0">
                    On time
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-slate-100 text-[11px]">
                  <div>
                    <div className="text-slate-400 text-[9px] uppercase font-mono">ETA</div>
                    <div className="font-bold text-slate-800">11:42</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[9px] uppercase font-mono">Remaining</div>
                    <div className="font-bold text-slate-800">148 km</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[9px] uppercase font-mono">Driver</div>
                    <div className="font-bold text-slate-800">M. Visser</div>
                  </div>
                </div>
              </div>

              {/* RouteMap Component */}
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
                cleanView={true}
              />
            </div>
          </div>

          {/* Interactive Route Planning Console Form */}
          <div id="route-planner-section" className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4.5 bg-[#ea580c] rounded-full inline-block" />
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Route Planning &amp; Corridor Engine
                </h3>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200 font-bold">
                OPTIMIZER ACTIVE
              </span>
            </div>

            {/* Step 1: Origin, Destination & Waypoints */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-heading font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#ea580c]" />
                  <span>1. Origin &amp; Destination Waypoints</span>
                </label>
                {pinMode && (
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full animate-pulse">
                    Map Pin Mode Active ({pinMode})
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Departure Origin */}
                <div>
                  <div className="flex items-center justify-between mb-1 text-[11px]">
                    <span className="font-semibold text-slate-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
                      <span>Departure (Pin A)</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleLocateMe}
                        disabled={isLocating}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-[#ea580c] hover:bg-orange-100 border border-orange-200 transition flex items-center gap-1"
                        title="Locate via device GPS"
                      >
                        <Radio className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                        <span>{isLocating ? 'GPS...' : 'Locate Me'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPinMode(pinMode === 'origin' ? null : 'origin')}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                          pinMode === 'origin'
                            ? 'bg-[#ea580c] text-white shadow-xs'
                            : 'text-[#ea580c] hover:bg-orange-50'
                        }`}
                      >
                        {pinMode === 'origin' ? 'Click Map' : 'Pin on Map'}
                      </button>
                    </div>
                  </div>
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
                    placeholder="Enter departure city..."
                    className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-[#ea580c] focus:ring-2 focus:ring-orange-500/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 transition"
                  />
                </div>

                {/* Arrival Destination */}
                <div>
                  <div className="flex items-center justify-between mb-1 text-[11px]">
                    <span className="font-semibold text-slate-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>Destination (Pin B)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setPinMode(pinMode === 'destination' ? null : 'destination')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                        pinMode === 'destination'
                          ? 'bg-rose-500 text-white'
                          : 'text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      {pinMode === 'destination' ? 'Click Map' : 'Pin on Map'}
                    </button>
                  </div>
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
                    placeholder="Enter destination city..."
                    className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-[#ea580c] focus:ring-2 focus:ring-orange-500/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 transition"
                  />
                </div>
              </div>

              {/* Waypoints display if any */}
              {waypoints.length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Waypoints ({waypoints.length}):</span>
                    {waypoints.map((wp, i) => (
                      <span key={i} className="bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px] text-slate-700 font-mono">
                        W{i + 1}: {wp.address || `${wp.lat.toFixed(2)}, ${wp.lng.toFixed(2)}`}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setWaypoints([])}
                    className="text-rose-600 hover:underline text-[11px] font-bold"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Fleet Vehicle & Cargo Load */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="text-xs font-heading font-bold text-slate-700 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#ea580c]" />
                <span>2. Fleet Vehicle &amp; Cargo Specifications</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Assigned Commercial Vehicle</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-[#ea580c] rounded-xl px-3 py-2 text-xs text-slate-900 transition"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.type}) — {v.height_m}m Tall • Max {v.max_weight_capacity_kg}kg
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Cargo Consignment</label>
                  <select
                    value={selectedCargoId}
                    onChange={(e) => handleCargoSelection(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-[#ea580c] rounded-xl px-3 py-2 text-xs text-slate-900 transition"
                  >
                    <option value="">Custom / Direct Entry</option>
                    {cargoList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.weight_kg} kg, {c.volume_m3 || 10} m³) • {c.priority}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Weight & Volume Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#ea580c] rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Volume (m³)</label>
                  <input
                    type="number"
                    value={cargoVolume}
                    onChange={(e) => setCargoVolume(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#ea580c] rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Optimization Objectives */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="text-xs font-heading font-bold text-slate-700 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#ea580c]" />
                <span>3. Optimization Objective</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {OPTIMIZATION_MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = optimizationMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setOptimizationMode(mode.id)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-[#fff7ed] border-[#ea580c] text-[#ea580c] shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#ea580c]' : 'text-slate-400'}`} />
                        <span>{mode.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{mode.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Deadline & Budget + Submit Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">Target Arrival SLA</label>
                <input
                  type="time"
                  value={desiredDeadline}
                  onChange={(e) => setDesiredDeadline(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#ea580c] rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 font-medium mb-1">Budget Ceiling (₹)</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="2000"
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#ea580c] rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              onClick={handleGenerateRoutes}
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#fb923c] hover:from-[#c2410c] hover:to-[#ea580c] text-white font-heading font-extrabold text-sm uppercase tracking-wider shadow-md shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-white" />
                  <span className="truncate">{LOADING_STEPS[loadingStep]}</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 fill-white/20" />
                  <span>Generate &amp; Optimize Routes</span>
                </>
              )}
            </button>
          </div>

          {/* AI Route Explanation Card (Shown when routes are generated) */}
          {aiExplanation && activeRoute && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#ea580c] flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-slate-900">AI Route Recommendation</h3>
                    <div className="text-[11px] text-slate-500">Autonomous Telemetry &amp; Clearance Reasoning</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{aiExplanation.confidence}% Confidence</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/70 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                "{aiExplanation.reason}"
              </div>

              {/* Key Benefits & Warnings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Key Transit Advantages
                  </div>
                  {aiExplanation.benefits?.slice(0, 2).map((b, i) => (
                    <div key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="text-emerald-500">•</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Advisory Constraints
                  </div>
                  {aiExplanation.warnings?.slice(0, 2).map((w, i) => (
                    <div key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="text-amber-500">•</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Candidate Corridor Comparison Cards */}
          {routes.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#ea580c]" />
                    Candidate Corridor Comparison
                  </h2>
                  <p className="text-xs text-slate-500">
                    Evaluating transit duration, tolls, fuel efficiency, and road clearances.
                  </p>
                </div>

                {generatedTrip && (
                  <button
                    onClick={handleStartTrip}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] text-white font-heading font-bold text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 transition flex items-center gap-2"
                  >
                    <span>Engage Live Trip Telemetry</span>
                    <ArrowRight className="w-4 h-4 text-white" />
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
                      className={`p-5 rounded-3xl border transition cursor-pointer relative flex flex-col justify-between bg-white ${
                        isSelected
                          ? 'border-[#ea580c] ring-2 ring-orange-500/20 shadow-md'
                          : 'border-slate-200 hover:border-orange-300 shadow-xs'
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                            r.route_code === 'Route A' ? 'bg-[#ea580c] text-white' :
                            r.route_code === 'Route B' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-white'
                          }`}>
                            {r.route_code}
                          </span>
                          {r.is_recommended && (
                            <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-orange-100 text-[#ea580c] border border-orange-200">
                              AI TOP PICK
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-black text-[#ea580c]">{r.route_score}/100</div>
                          <div className="text-[9px] text-slate-400 uppercase">Score</div>
                        </div>
                      </div>

                      {/* Route Title & Summary */}
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{r.route_name}</h3>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{r.summary}</p>
                      </div>

                      {/* Physical Clearance Status */}
                      <div className="my-3">
                        {isCompatible ? (
                          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>100% Road Clearance Compliant</span>
                          </div>
                        ) : (
                          <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-1.5 font-medium leading-tight">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                            <span>{r.incompatibility_reason}</span>
                          </div>
                        )}
                      </div>

                      {/* Core Metrics Matrix */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                        <div className="p-2 rounded-xl bg-slate-50">
                          <div className="text-[10px] text-slate-400">Duration &amp; ETA</div>
                          <div className="font-bold text-slate-800 mt-0.5">{r.duration_minutes} min ({r.current_eta})</div>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-50">
                          <div className="text-[10px] text-slate-400">Total Transit Cost</div>
                          <div className="font-bold text-[#ea580c] mt-0.5">₹{r.total_cost}</div>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-50">
                          <div className="text-[10px] text-slate-400">Fuel Required</div>
                          <div className="font-bold text-slate-800 mt-0.5">{r.fuel_liters} L (₹{r.fuel_cost})</div>
                        </div>

                        <div className="p-2 rounded-xl bg-slate-50">
                          <div className="text-[10px] text-slate-400">Traffic / Delay Risk</div>
                          <div className={`font-bold mt-0.5 ${
                            r.traffic_level === 'LOW' ? 'text-emerald-600' :
                            r.traffic_level === 'HEAVY' ? 'text-amber-600' : 'text-slate-800'
                          }`}>
                            {r.traffic_level} ({r.delay_risk_percent}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI-Assisted Departure Time Prediction */}
          {departurePrediction && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#ea580c]" />
                    AI-Assisted Departure Timing Prediction
                  </h2>
                  <p className="text-xs text-slate-500">
                    Probabilistic traffic bottleneck avoidance modeling.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className="px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#ea580c] font-bold">
                    Recommended: {departurePrediction.recommendedDeparture}
                  </div>
                  <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                    Buffer: {departurePrediction.safetyBufferMinutes} mins
                  </div>
                </div>
              </div>

              {/* 4 Departure Windows Scenarios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {departurePrediction.scenarios?.map(sc => (
                  <div
                    key={sc.id}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                      sc.isRecommended
                        ? 'bg-orange-50/70 border-[#ea580c] text-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-heading font-bold uppercase tracking-wider text-[10px] text-[#ea580c]">{sc.status}</span>
                        <span className="text-[11px] font-mono font-bold text-slate-500">{sc.confidencePercent}% Conf</span>
                      </div>
                      <div className="text-xl font-heading font-black text-slate-900 mt-1">
                        {sc.departureTime}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        ETA: <span className="text-slate-800 font-semibold">{sc.expectedArrival}</span>
                      </div>
                    </div>

                    <div className="mt-3 text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span>Buffer: {sc.bufferMinutes}m</span>
                      {sc.isRecommended && (
                        <span className="text-[#ea580c] font-bold uppercase text-[10px]">Recommended</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Embedded Co-Loading Marketplace Network Feature (Same Page) */}
          <CoLoadingFeatureSection
            currentOrigin={originQuery}
            currentDestination={destinationQuery}
            currentWeight={cargoWeight}
            onApplyLaneToPlanner={(lane) => {
              handleApplyPreset({ origin: lane.origin, dest: lane.destination });
            }}
          />
        </div>

        {/* Right Column: Predictive Insights & Corridor Intelligence (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Predictive Insights Card matching Screenshot */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Predictive insights
                </h3>
                <p className="text-xs text-slate-400">
                  Prioritized by operational impact
                </p>
              </div>

              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Insight 1: HIGH IMPACT (Congestion) matching screenshot */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                    HIGH IMPACT
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">8 min ago</span>
              </div>

              <div>
                <h4 className="font-heading font-bold text-xs text-slate-900">
                  Congestion building on A12
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  3 routes will be delayed by 18–24 min if no action is taken.
                </p>
                <div className="mt-2 text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Rerouting can save 51 minutes</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/monitor')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-heading font-bold text-[11px] shadow-xs transition"
                >
                  Review routes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleApplyPreset(PRESET_CORRIDORS[0]);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-orange-100/70 hover:bg-orange-100 text-[#ea580c] font-heading font-bold text-[11px] transition"
                >
                  Apply recommendation
                </button>
              </div>
            </div>

            {/* Insight 2: DEPARTURE WINDOW matching screenshot */}
            <div className="p-4 rounded-2xl bg-orange-50/40 border border-orange-200/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-orange-100 text-[#ea580c] flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#ea580c] bg-orange-100/70 px-2 py-0.5 rounded-md">
                    DEPARTURE WINDOW
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">21 min ago</span>
              </div>

              <div>
                <h4 className="font-heading font-bold text-xs text-slate-900">
                  Delay Rotterdam departure
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Leaving 20 minutes later avoids peak port traffic for route RM-2853.
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setDesiredDeadline('18:45');
                    handleGenerateRoutes();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-heading font-bold text-[11px] shadow-xs transition"
                >
                  Adjust schedule
                </button>
              </div>
            </div>

            {/* Insight 3: Co-Loading Match Opportunity */}
            <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Share2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    CO-LOADING MATCH
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Just now</span>
              </div>

              <div>
                <h4 className="font-heading font-bold text-xs text-slate-900">
                  Capacity match found on return leg
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Matching 2,400 kg shipment on return corridor saves ₹3,200 in deadhead costs.
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => document.getElementById('coloading-feature')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-heading font-bold text-[11px] shadow-xs transition flex items-center gap-1.5"
                >
                  <span>Explore Marketplace</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Corridors Preset Pill List */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3">
            <h4 className="font-heading font-bold text-xs text-slate-500 uppercase tracking-wider">
              Quick Freight Corridors
            </h4>
            <div className="space-y-2">
              {PRESET_CORRIDORS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/40 text-left transition flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-heading font-bold text-slate-800 group-hover:text-[#ea580c] transition-colors">
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {preset.origin} → {preset.dest}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#ea580c] transition" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
