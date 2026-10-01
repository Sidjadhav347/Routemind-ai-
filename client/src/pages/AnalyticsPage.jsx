import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../services/api';
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  IndianRupee,
  Fuel,
  Clock,
  RotateCcw,
  ShieldCheck,
  CheckCircle,
  Truck,
  Layers,
  MapPin,
  Calendar
} from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await analyticsApi.getAnalytics();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const overview = data?.overview || {};
  const aiInsights = data?.aiInsights || [];
  const history = data?.history || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-emerald-900/40 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-tight flex items-center gap-2 uppercase">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            Operational Mobility Analytics & AI Insights
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical transit metrics, dynamic reroute efficiency, expenditure savings, and predictive bottleneck trends.
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Estimated Savings */}
        <div className="glass-panel p-5 rounded-3xl border border-emerald-500/40 bg-emerald-950/20 space-y-2 glow-emerald">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold font-heading uppercase">
            <span>Optimization Savings</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-emerald-400">
            ₹{Number(overview.estimatedSavings || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            vs. unoptimized legacy routing (16.5% ROI)
          </div>
        </div>

        {/* Total Cost */}
        <div className="glass-panel p-5 rounded-3xl border border-emerald-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold font-heading uppercase">
            <span>Total Fleet Expenditure</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-white">
            ₹{Number(overview.totalCost || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Across {overview.completedTrips || 0} completed dispatches
          </div>
        </div>

        {/* Dynamic Reroutes Saved */}
        <div className="glass-panel p-5 rounded-3xl border border-amber-500/30 bg-amber-950/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold font-heading uppercase">
            <span>Autonomous Reroutes</span>
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-amber-300">
            {overview.totalReroutesCount || 0} Events
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Saved approx ~{(overview.totalReroutesCount || 0) * 24} min in traffic
          </div>
        </div>

        {/* Total Fuel */}
        <div className="glass-panel p-5 rounded-3xl border border-teal-500/40 bg-teal-950/20 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Fuel & Transit Distance</span>
            <Fuel className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-300">
            {overview.totalFuelLiters || 0} L
          </div>
          <div className="text-[11px] text-slate-400">
            {overview.totalDistanceKm || 0} km total distance logged
          </div>
        </div>
      </div>

      {/* AI Historical Insights (Section 31) */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          AI Machine Learning Insights & Patterns
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiInsights.map((ins, i) => (
            <div key={i} className="glass-panel p-4 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">{ins.title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {ins.dataMetric}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                "{ins.insight}"
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Completed Trips Table (Section 29) */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden space-y-3 p-5">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          Completed Trip Manifests & Audit Log
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Transit Corridor</th>
                <th className="p-3">Vehicle & Payload</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Expense</th>
                <th className="p-3">Distance / Fuel</th>
                <th className="p-3">Optimization</th>
                <th className="p-3">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {history.map(t => (
                <tr key={t.id} className="hover:bg-slate-900/40 transition">
                  <td className="p-3 font-semibold text-white">
                    <div>{t.origin_address.split(',')[0]} → {t.destination_address.split(',')[0]}</div>
                    <div className="text-[10px] text-slate-500">Express Corridor</div>
                  </td>
                  <td className="p-3">
                    <div className="text-slate-200">{t.vehicle_name}</div>
                    <div className="text-[10px] text-slate-400">{t.cargo_name}</div>
                  </td>
                  <td className="p-3 font-medium">
                    <div>{t.actual_duration_min} mins</div>
                    {t.total_delay_min > 0 ? (
                      <div className="text-[10px] text-amber-400">+{t.total_delay_min}m delay</div>
                    ) : (
                      <div className="text-[10px] text-emerald-400">On Time SLA</div>
                    )}
                  </td>
                  <td className="p-3 font-bold text-emerald-400">
                    ₹{t.actual_cost}
                  </td>
                  <td className="p-3">
                    <div>{t.distance_km} km</div>
                    <div className="text-[10px] text-slate-400">{t.fuel_used_l} L fuel</div>
                  </td>
                  <td className="p-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {t.optimization_mode}
                    </span>
                  </td>
                  <td className="p-3 text-[11px] text-slate-400">
                    {new Date(t.completed_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
