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
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#ea580c]" />
            Operational Mobility Analytics &amp; AI Insights
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical transit metrics, dynamic reroute efficiency, expenditure savings, and predictive bottleneck trends.
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Estimated Savings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold font-heading uppercase">
            <span>Optimization Savings</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-emerald-600">
            ₹{Number(overview.estimatedSavings || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            vs. unoptimized legacy routing (16.5% ROI)
          </div>
        </div>

        {/* Total Cost */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold font-heading uppercase">
            <span>Total Fleet Expenditure</span>
            <TrendingUp className="w-4 h-4 text-[#ea580c]" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-slate-900">
            ₹{Number(overview.totalCost || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Across {overview.completedTrips || 0} completed dispatches
          </div>
        </div>

        {/* Dynamic Reroutes Saved */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold font-heading uppercase">
            <span>Autonomous Reroutes</span>
            <RotateCcw className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-amber-600">
            {overview.totalReroutesCount || 0} Events
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Saved approx ~{(overview.totalReroutesCount || 0) * 24} min in traffic
          </div>
        </div>

        {/* Total Fuel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Fuel &amp; Transit Distance</span>
            <Fuel className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-black text-slate-900">
            {overview.totalFuelLiters || 0} L
          </div>
          <div className="text-[11px] text-slate-400">
            {overview.totalDistanceKm || 0} km total distance logged
          </div>
        </div>
      </div>

      {/* AI Historical Insights */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#ea580c]" />
          AI Machine Learning Insights &amp; Patterns
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiInsights.map((ins, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{ins.title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200">
                  {ins.dataMetric}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                "{ins.insight}"
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Completed Trips Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden space-y-3 p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#ea580c]" />
          Completed Trip Manifests &amp; Audit Log
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Transit Corridor</th>
                <th className="p-3">Vehicle &amp; Payload</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Expense</th>
                <th className="p-3">Distance / Fuel</th>
                <th className="p-3">Optimization</th>
                <th className="p-3">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-semibold text-slate-900">
                    <div>{t.origin_address.split(',')[0]} → {t.destination_address.split(',')[0]}</div>
                    <div className="text-[10px] text-slate-400">Express Corridor</div>
                  </td>
                  <td className="p-3">
                    <div className="text-slate-800">{t.vehicle_name}</div>
                    <div className="text-[10px] text-slate-400">{t.cargo_name}</div>
                  </td>
                  <td className="p-3 font-medium">
                    <div>{t.actual_duration_min} mins</div>
                    {t.total_delay_min > 0 ? (
                      <div className="text-[10px] text-amber-600">+{t.total_delay_min}m delay</div>
                    ) : (
                      <div className="text-[10px] text-emerald-600">On Time SLA</div>
                    )}
                  </td>
                  <td className="p-3 font-bold text-[#ea580c]">
                    ₹{t.actual_cost}
                  </td>
                  <td className="p-3">
                    <div>{t.distance_km} km</div>
                    <div className="text-[10px] text-slate-400">{t.fuel_used_l} L fuel</div>
                  </td>
                  <td className="p-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200">
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
