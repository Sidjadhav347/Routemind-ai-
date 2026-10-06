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
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#ea580c] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            Fleet Vehicle Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure vehicle dimensions, tare weights, and payload capacities for road clearance checks.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] text-white font-heading font-bold text-xs tracking-wider shadow-sm transition-all duration-200 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Add Fleet Vehicle</span>
        </button>
      </div>

      {/* Vehicle Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {vehicles.map(v => (
          <div key={v.id} className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-orange-300 hover:shadow-md transition">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200">
                  {v.type}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {v.status}
                </span>
              </div>

              <h3 className="font-extrabold text-base text-slate-900 mt-3">{v.name}</h3>

              {/* Physical Dimensions */}
              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5 text-[#ea580c]" />
                  Road Clearance Profile
                </div>
                <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-600 pt-0.5">
                  <div>H: <strong className={v.height_m > 3.5 ? 'text-amber-600 font-bold' : 'text-slate-800'}>{v.height_m}m</strong></div>
                  <div>W: <strong className="text-slate-800">{v.width_m}m</strong></div>
                  <div>L: <strong className="text-slate-800">{v.length_m}m</strong></div>
                </div>
              </div>

              {/* Payload & Fuel Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-medium">Gross Capacity</div>
                  <div className="font-extrabold text-slate-900 mt-0.5">
                    {Number(v.max_weight_capacity_kg).toLocaleString()} kg
                  </div>
                  <div className="text-[10px] text-slate-400">Tare: {v.tare_weight_kg}kg</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-medium">Fuel & Economy</div>
                  <div className="font-extrabold text-[#ea580c] mt-0.5">
                    {v.fuel_efficiency_km_l} km/L
                  </div>
                  <div className="text-[10px] text-slate-400">{v.fuel_type} • ₹{v.fuel_price_per_unit}/u</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleOpenEdit(v)}
                className="p-2 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-500 hover:text-[#ea580c] border border-slate-200 transition"
                title="Edit Vehicle"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(v.id)}
                className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingId ? 'Edit Fleet Vehicle' : 'Register New Fleet Vehicle'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. FreightMaster Heavy Hauler"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#ea580c]"
                  >
                    {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fuel Type</label>
                  <select
                    value={formData.fuel_type}
                    onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#ea580c]"
                  >
                    {FUEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Height (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.height_m}
                    onChange={(e) => setFormData({ ...formData, height_m: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Width (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.width_m}
                    onChange={(e) => setFormData({ ...formData, width_m: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Length (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.length_m}
                    onChange={(e) => setFormData({ ...formData, length_m: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Capacity (kg)</label>
                  <input
                    type="number"
                    required
                    value={formData.max_weight_capacity_kg}
                    onChange={(e) => setFormData({ ...formData, max_weight_capacity_kg: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tare Weight (kg)</label>
                  <input
                    type="number"
                    required
                    value={formData.tare_weight_kg}
                    onChange={(e) => setFormData({ ...formData, tare_weight_kg: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fuel Economy (km/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.fuel_efficiency_km_l}
                    onChange={(e) => setFormData({ ...formData, fuel_efficiency_km_l: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fuel Price (₹/unit)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.fuel_price_per_unit}
                    onChange={(e) => setFormData({ ...formData, fuel_price_per_unit: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] text-white font-bold text-xs tracking-wider shadow-sm transition"
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
