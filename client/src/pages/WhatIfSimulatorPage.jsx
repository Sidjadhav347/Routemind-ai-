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
      <div className="glass-panel p-6 rounded-3xl border border-emerald-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-tight flex items-center gap-2 uppercase">
              <Sliders className="w-6 h-6 text-emerald-400" />
              What-If Transportation Scenario Simulator
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
              HACKATHON SHOWCASE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Simulate trade-offs between speed, cost, fuel efficiency and arrival buffers across variable vehicle loads.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-heading font-extrabold text-xs uppercase tracking-wider shadow-emerald-glow hover:shadow-emerald-glow-hover transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 self-start md:self-auto"
        >
          {loading ? <Sparkles className="w-4 h-4 animate-spin text-slate-950" /> : <BarChart2 className="w-4 h-4 text-slate-950 fill-slate-950/20" />}
          <span>Re-Simulate Scenarios</span>
        </button>
      </div>

      {/* Simulator Control Matrix */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Vehicle Class</label>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="HEAVY_TRUCK">Heavy Hauler Truck (16T)</option>
            <option value="LIGHT_TRUCK">Light Commercial Truck (5T)</option>
            <option value="VAN">Urban e-Delivery Van</option>
            <option value="CAR">Courier Hybrid Sedan</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Cargo Load (kg)</label>
          <input
            type="number"
            value={cargoWeight}
            onChange={(e) => setCargoWeight(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Origin Hub</label>
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Destination</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Target Deadline</label>
          <input
            type="time"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Max Budget (₹)</label>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Comparative Simulation Results (4 Cards: Fastest, Cheapest, Fuel Efficient, Balanced) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* FASTEST */}
        <div className="glass-panel p-5 rounded-3xl border border-indigo-500/40 bg-indigo-950/20 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Zap className="w-3 h-3 text-indigo-400" />
                FASTEST
              </span>
              <span className="text-xs font-bold text-slate-400">ETA {scenarios.FASTEST?.eta}</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white">₹{scenarios.FASTEST?.cost}</div>
              <div className="text-xs text-slate-400 mt-0.5">{scenarios.FASTEST?.durationMinutes} min • {scenarios.FASTEST?.distanceKm} km</div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              {scenarios.FASTEST?.summary}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1">
            <div className="flex justify-between text-slate-300">
              <span>Fuel Consumption:</span>
              <strong className="text-slate-100">{scenarios.FASTEST?.fuelLiters} L</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Toll Tariffs:</span>
              <strong className="text-slate-100">₹{scenarios.FASTEST?.tolls}</strong>
            </div>
          </div>
        </div>

        {/* CHEAPEST */}
        <div className="glass-panel p-5 rounded-3xl border border-emerald-500/40 bg-emerald-950/20 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <IndianRupee className="w-3 h-3 text-emerald-400" />
                CHEAPEST
              </span>
              <span className="text-xs font-bold text-slate-400">ETA {scenarios.CHEAPEST?.eta}</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-emerald-400">₹{scenarios.CHEAPEST?.cost}</div>
              <div className="text-xs text-slate-400 mt-0.5">{scenarios.CHEAPEST?.durationMinutes} min • {scenarios.CHEAPEST?.distanceKm} km</div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              {scenarios.CHEAPEST?.summary}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1">
            <div className="flex justify-between text-slate-300">
              <span>Fuel Consumption:</span>
              <strong className="text-slate-100">{scenarios.CHEAPEST?.fuelLiters} L</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Toll Tariffs:</span>
              <strong className="text-emerald-400">₹{scenarios.CHEAPEST?.tolls} (Lowest)</strong>
            </div>
          </div>
        </div>

        {/* FUEL EFFICIENT */}
        <div className="glass-panel p-5 rounded-3xl border border-teal-500/40 bg-teal-950/20 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                <Fuel className="w-3 h-3 text-teal-400" />
                FUEL EFFICIENT
              </span>
              <span className="text-xs font-bold text-slate-400">ETA {scenarios.FUEL_EFFICIENT?.eta}</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-teal-300">₹{scenarios.FUEL_EFFICIENT?.cost}</div>
              <div className="text-xs text-slate-400 mt-0.5">{scenarios.FUEL_EFFICIENT?.durationMinutes} min • {scenarios.FUEL_EFFICIENT?.distanceKm} km</div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              {scenarios.FUEL_EFFICIENT?.summary}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1">
            <div className="flex justify-between text-slate-300">
              <span>Fuel Consumption:</span>
              <strong className="text-teal-300 font-bold">{scenarios.FUEL_EFFICIENT?.fuelLiters} L (Best Eco)</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Toll Tariffs:</span>
              <strong className="text-slate-100">₹{scenarios.FUEL_EFFICIENT?.tolls}</strong>
            </div>
          </div>
        </div>

        {/* BALANCED */}
        <div className="glass-panel p-5 rounded-3xl border-2 border-indigo-500 glow-indigo bg-indigo-950/30 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-500 text-white flex items-center gap-1">
                <Compass className="w-3 h-3 text-white" />
                AI BALANCED (TOP)
              </span>
              <span className="text-xs font-bold text-indigo-300">ETA {scenarios.BALANCED?.eta}</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white">₹{scenarios.BALANCED?.cost}</div>
              <div className="text-xs text-slate-300 mt-0.5">{scenarios.BALANCED?.durationMinutes} min • {scenarios.BALANCED?.distanceKm} km</div>
            </div>
            <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
              {scenarios.BALANCED?.summary}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1">
            <div className="flex justify-between text-slate-300">
              <span>Fuel Consumption:</span>
              <strong className="text-slate-100">{scenarios.BALANCED?.fuelLiters} L</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Arrival Buffer:</span>
              <strong className="text-emerald-400 font-bold">45 min safe SLA</strong>
            </div>
          </div>
        </div>
      </div>

      {/* AI Comparative Synthesis */}
      {simulationData?.aiExplanation && (
        <div className="glass-panel p-5 rounded-3xl border border-indigo-500/40 bg-slate-900/90 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-200">AI Scenario Recommendation & Logistics Trade-Off Synthesis</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed font-medium">
            {simulationData.aiExplanation}
          </p>
        </div>
      )}
    </div>
  );
}
