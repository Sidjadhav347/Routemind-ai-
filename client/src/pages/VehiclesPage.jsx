import React, { useState, useEffect } from 'react';
import { vehicleApi } from '../services/api';
import {
  Truck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  X,
  Fuel,
  Ruler,
  Weight,
  Layers
} from 'lucide-react';

const VEHICLE_TYPES = ['HEAVY_TRUCK', 'LIGHT_TRUCK', 'VAN', 'PICKUP', 'CAR', 'BIKE', 'BUS', 'OTHER'];
const FUEL_TYPES = ['DIESEL', 'PETROL', 'ELECTRIC', 'HYBRID', 'CNG'];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialForm = {
    name: '',
    type: 'HEAVY_TRUCK',
    length_m: 12.0,
    width_m: 2.5,
    height_m: 3.8,
    max_weight_capacity_kg: 16000,
    tare_weight_kg: 7500,
    fuel_type: 'DIESEL',
    fuel_efficiency_km_l: 3.8,
    fuel_price_per_unit: 92.50,
    status: 'ACTIVE'
  };

  const [formData, setFormData] = useState(initialForm);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const res = await vehicleApi.getAll();
      if (res.success) setVehicles(res.data);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(initialForm);
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleOpenEdit = (v) => {
    setEditingId(v.id);
    setFormData({
      name: v.name,
      type: v.type,
      length_m: Number(v.length_m),
      width_m: Number(v.width_m),
      height_m: Number(v.height_m),
      max_weight_capacity_kg: Number(v.max_weight_capacity_kg),
      tare_weight_kg: Number(v.tare_weight_kg),
      fuel_type: v.fuel_type,
      fuel_efficiency_km_l: Number(v.fuel_efficiency_km_l),
      fuel_price_per_unit: Number(v.fuel_price_per_unit),
      status: v.status || 'ACTIVE'
    });
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this vehicle from your fleet?')) return;
    try {
      await vehicleApi.delete(id);
      loadVehicles();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (editingId) {
        await vehicleApi.update(editingId, formData);
      } else {
        await vehicleApi.create(formData);
      }
      setShowModal(false);
      loadVehicles();
    } catch (err) {
      setErrorMsg(err.message || 'Operation failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-emerald-900/40 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-tight flex items-center gap-2 uppercase">
            <Truck className="w-6 h-6 text-emerald-400" />
            Fleet Vehicle Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure vehicle dimensions, tare weights, and payload capacities for clearance checks.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-heading font-extrabold text-xs uppercase tracking-wider shadow-emerald-glow hover:shadow-emerald-glow-hover transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Add Fleet Vehicle</span>
        </button>
      </div>

      {/* Vehicle Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {vehicles.map(v => (
          <div key={v.id} className="glass-panel p-6 rounded-3xl border border-emerald-900/40 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {v.type}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {v.status}
                </span>
              </div>

              <h3 className="font-black text-base text-white mt-3">{v.name}</h3>

              {/* Physical Dimensions Alert */}
              <div className="mt-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5 text-indigo-400" />
                  Road Clearance Profile
                </div>
                <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-300 pt-0.5">
                  <div>H: <strong className={v.height_m > 3.5 ? 'text-amber-400 font-bold' : 'text-slate-100'}>{v.height_m}m</strong></div>
                  <div>W: <strong className="text-slate-100">{v.width_m}m</strong></div>
                  <div>L: <strong className="text-slate-100">{v.length_m}m</strong></div>
                </div>
              </div>

              {/* Payload & Fuel Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500">Gross Capacity</div>
                  <div className="font-extrabold text-slate-200 mt-0.5">
                    {Number(v.max_weight_capacity_kg).toLocaleString()} kg
                  </div>
                  <div className="text-[10px] text-slate-500">Tare: {v.tare_weight_kg}kg</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500">Fuel & Economy</div>
                  <div className="font-extrabold text-emerald-400 mt-0.5">
                    {v.fuel_efficiency_km_l} km/L
                  </div>
                  <div className="text-[10px] text-slate-500">{v.fuel_type} • ₹{v.fuel_price_per_unit}/u</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
              <button
                onClick={() => handleOpenEdit(v)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
                title="Edit Vehicle"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(v.id)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                title="Delete Vehicle"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-slate-700 bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-base text-white">
                {editingId ? 'Edit Fleet Vehicle' : 'Register New Fleet Vehicle'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Vehicle Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. FreightMaster Heavy Hauler"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Vehicle Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Fuel Type</label>
                  <select
                    value={formData.fuel_type}
                    onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Height (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.height_m}
                    onChange={(e) => setFormData({ ...formData, height_m: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Width (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.width_m}
                    onChange={(e) => setFormData({ ...formData, width_m: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Length (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.length_m}
                    onChange={(e) => setFormData({ ...formData, length_m: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Max Capacity (kg)</label>
                  <input
                    type="number"
                    required
                    value={formData.max_weight_capacity_kg}
                    onChange={(e) => setFormData({ ...formData, max_weight_capacity_kg: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tare Weight (kg)</label>
                  <input
                    type="number"
                    required
                    value={formData.tare_weight_kg}
                    onChange={(e) => setFormData({ ...formData, tare_weight_kg: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Fuel Economy (km/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.fuel_efficiency_km_l}
                    onChange={(e) => setFormData({ ...formData, fuel_efficiency_km_l: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Fuel Price (₹/unit)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.fuel_price_per_unit}
                    onChange={(e) => setFormData({ ...formData, fuel_price_per_unit: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition text-xs font-heading font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 font-heading font-extrabold text-xs uppercase tracking-wider transition shadow-emerald-glow hover:shadow-emerald-glow-hover transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {editingId ? 'Save Changes' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
