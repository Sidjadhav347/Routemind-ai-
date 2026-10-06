import React, { useState, useEffect } from 'react';
import { aiApi } from '../services/api';
import {
  Sliders,
  Sparkles,
  Zap,
  IndianRupee,
  Fuel,
  Compass,
  Clock,
  Truck,
  TrendingDown,
  ShieldCheck,
  CheckCircle,
  BarChart2
} from 'lucide-react';

export default function WhatIfSimulatorPage() {
  const [vehicleType, setVehicleType] = useState('HEAVY_TRUCK');
  const [cargoWeight, setCargoWeight] = useState(3000);
  const [origin, setOrigin] = useState('Mumbai');
  const [destination, setDestination] = useState('Pune');
  const [deadline, setDeadline] = useState('18:00');
  const [budget, setBudget] = useState(2000);

  const [loading, setLoading] = useState(false);
  const [simulationData, setSimulationData] = useState(null);

  useEffect(() => {
    // Run default benchmark scenario on load (Mumbai-Pune 3000kg Heavy Truck)
    runSimulation();
  }, []);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await aiApi.runSimulation({
        vehicle_type: vehicleType,
        cargo_weight_kg: Number(cargoWeight),
        origin_name: origin,
        destination_name: destination,
        deadline_time: deadline,
        budget: Number(budget)
      });
      if (res.success && res.data) {
        setSimulationData(res.data);
      }
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const scenarios = simulationData?.scenarios || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Sliders className="w-6 h-6 text-[#ea580c]" />
              What-If Transportation Scenario Simulator
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-orange-50 text-[#ea580c] border border-orange-200 uppercase">
              SCENARIO ENGINE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Simulate trade-offs between speed, cost, fuel efficiency and arrival buffers across variable vehicle loads.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] text-white font-heading font-extrabold text-xs uppercase tracking-wider shadow-md shadow-orange-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 self-start md:self-auto"
        >
          {loading ? <Sparkles className="w-4 h-4 animate-spin text-white" /> : <BarChart2 className="w-4 h-4 text-white" />}
          <span>Re-Simulate Scenarios</span>
        </button>
      </div>

      {/* Simulator Control Matrix */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Vehicle Class</label>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#ea580c] focus:bg-white transition"
          >
            <option value="HEAVY_TRUCK">Heavy Hauler Truck (16T)</option>
            <option value="LIGHT_TRUCK">Light Commercial Truck (5T)</option>
            <option value="VAN">Urban e-Delivery Van</option>
            <option value="CAR">Courier Hybrid Sedan</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Cargo Load (kg)</label>
          <input
            type="number"
            value={cargoWeight}
            onChange={(e) => setCargoWeight(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#ea580c] focus:bg-white transition font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Origin Hub</label>
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#ea580c] focus:bg-white transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Destination</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#ea580c] focus:bg-white transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Target Deadline</label>
          <input
            type="time"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#ea580c] focus:bg-white transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Max Budget (₹)</label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#ea580c] focus:bg-white transition font-mono"
          />
        </div>
      </div>

      {/* Comparative Simulation Results (4 Cards: Fastest, Cheapest, Fuel Efficient, Balanced) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* FASTEST */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-orange-300 shadow-xs flex flex-col justify-between space-y-4 transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-600" />
                FASTEST
              </span>
              <span className="text-xs font-bold text-slate-500">ETA {scenarios.FASTEST?.eta}</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">₹{scenarios.FASTEST?.cost}</div>
              <div className="text-xs text-slate-500 mt-0.5">{scenarios.FASTEST?.durationMinutes} min • {scenarios.FASTEST?.distanceKm} km</div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              {scenarios.FASTEST?.summary}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Fuel Consumption:</span>
              <strong className="text-slate-900">{scenarios.FASTEST?.fuelLiters} L</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Toll Tariffs:</span>
              <strong className="text-slate-900">₹{scenarios.FASTEST?.tolls}</strong>
            </div>
          </div>
        </div>

        {/* CHEAPEST */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-orange-300 shadow-xs flex flex-col justify-between space-y-4 transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <IndianRupee className="w-3 h-3 text-emerald-600" />
                CHEAPEST
              </span>
              <span className="text-xs font-bold text-slate-500">ETA {scenarios.CHEAPEST?.eta}</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-emerald-700">₹{scenarios.CHEAPEST?.cost}</div>
              <div className="text-xs text-slate-500 mt-0.5">{scenarios.CHEAPEST?.durationMinutes} min • {scenarios.CHEAPEST?.distanceKm} km</div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              {scenarios.CHEAPEST?.summary}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Fuel Consumption:</span>
              <strong className="text-slate-900">{scenarios.CHEAPEST?.fuelLiters} L</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Toll Tariffs:</span>
              <strong className="text-emerald-700">₹{scenarios.CHEAPEST?.tolls} (Lowest)</strong>
            </div>
          </div>
        </div>

        {/* FUEL EFFICIENT */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-orange-300 shadow-xs flex flex-col justify-between space-y-4 transition">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                <Fuel className="w-3 h-3 text-teal-600" />
                FUEL EFFICIENT
              </span>
              <span className="text-xs font-bold text-slate-500">ETA {scenarios.FUEL_EFFICIENT?.eta}</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-teal-800">₹{scenarios.FUEL_EFFICIENT?.cost}</div>
              <div className="text-xs text-slate-500 mt-0.5">{scenarios.FUEL_EFFICIENT?.durationMinutes} min • {scenarios.FUEL_EFFICIENT?.distanceKm} km</div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              {scenarios.FUEL_EFFICIENT?.summary}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Fuel Consumption:</span>
              <strong className="text-teal-700 font-bold">{scenarios.FUEL_EFFICIENT?.fuelLiters} L (Eco)</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Toll Tariffs:</span>
              <strong className="text-slate-900">₹{scenarios.FUEL_EFFICIENT?.tolls}</strong>
            </div>
          </div>
        </div>

        {/* BALANCED */}
        <div className="bg-white p-5 rounded-3xl border-2 border-[#ea580c] shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded bg-[#ea580c] text-white flex items-center gap-1">
                <Compass className="w-3 h-3 text-white" />
                AI BALANCED (TOP)
              </span>
              <span className="text-xs font-bold text-[#ea580c]">ETA {scenarios.BALANCED?.eta}</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900">₹{scenarios.BALANCED?.cost}</div>
              <div className="text-xs text-slate-500 mt-0.5">{scenarios.BALANCED?.durationMinutes} min • {scenarios.BALANCED?.distanceKm} km</div>
            </div>
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
              {scenarios.BALANCED?.summary}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200 text-[11px] space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Fuel Consumption:</span>
              <strong className="text-slate-900">{scenarios.BALANCED?.fuelLiters} L</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Arrival Buffer:</span>
              <strong className="text-emerald-700 font-bold">45 min safe SLA</strong>
            </div>
          </div>
        </div>
      </div>

      {/* AI Comparative Synthesis */}
      {simulationData?.aiExplanation && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#ea580c]" />
            <h3 className="font-heading font-bold text-sm text-slate-900">AI Scenario Recommendation &amp; Logistics Trade-Off Synthesis</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed font-medium">
            {simulationData.aiExplanation}
          </p>
        </div>
      )}
    </div>
  );
}
