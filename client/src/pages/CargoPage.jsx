import React, { useState, useEffect } from 'react';
import { cargoApi } from '../services/api';
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  ShieldAlert,
  Weight,
  Layers,
  Sparkles
} from 'lucide-react';

const CARGO_TYPES = ['GENERAL', 'PERISHABLE', 'HAZARDOUS', 'FRAGILE', 'ELECTRONICS', 'INDUSTRIAL'];
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

export default function CargoPage() {
  const [cargoList, setCargoList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialForm = {
    name: '',
    type: 'INDUSTRIAL',
    weight_kg: 3000,
    quantity: 1,
    length_m: 2.0,
    width_m: 1.5,
    height_m: 1.5,
    is_fragile: false,
    priority: 'HIGH'
  };

  const [formData, setFormData] = useState(initialForm);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    loadCargo();
  }, []);

  const loadCargo = async () => {
    try {
      const res = await cargoApi.getAll();
      if (res.success) setCargoList(res.data);
    } catch (err) {
      console.error('Failed to load cargo:', err);
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

  const handleOpenEdit = (c) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      type: c.type,
      weight_kg: Number(c.weight_kg),
      quantity: Number(c.quantity),
      length_m: Number(c.length_m || 1),
      width_m: Number(c.width_m || 1),
      height_m: Number(c.height_m || 1),
      is_fragile: Boolean(c.is_fragile),
      priority: c.priority || 'NORMAL'
    });
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this consignment record?')) return;
    try {
      await cargoApi.delete(id);
      loadCargo();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (editingId) {
        await cargoApi.update(editingId, formData);
      } else {
        await cargoApi.create(formData);
      }
      setShowModal(false);
      loadCargo();
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
              <Package className="w-4 h-4" />
            </div>
            Cargo Consignments & Manifests
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage payload weights, fragile handling specifications and delivery SLA priorities.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] text-white font-heading font-bold text-xs tracking-wider shadow-sm transition-all duration-200 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>New Cargo Consignment</span>
        </button>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cargoList.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-orange-300 hover:shadow-md transition">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200">
                  {c.type}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  c.priority === 'URGENT' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  c.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {c.priority} PRIORITY
                </span>
              </div>

              <h3 className="font-extrabold text-base text-slate-900 mt-3 line-clamp-1">{c.name}</h3>

              {/* Weight & Fragile Flag */}
              <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-medium">Total Weight</div>
                  <div className="font-extrabold text-[#ea580c] text-base mt-0.5">
                    {Number(c.weight_kg).toLocaleString()} kg
                  </div>
                  <div className="text-[10px] text-slate-400">Qty: {c.quantity || 1} units</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-medium">Handling Spec</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {c.is_fragile ? '⚠️ Fragile Class' : 'Standard Heavy'}
                  </div>
                  <div className="text-[10px] text-slate-400">{c.length_m}x{c.width_m}x{c.height_m}m dims</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleOpenEdit(c)}
                className="p-2 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-500 hover:text-[#ea580c] border border-slate-200 transition"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition"
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
                {editingId ? 'Edit Cargo Item' : 'New Cargo Consignment'}
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
                <label className="block font-semibold text-slate-700 mb-1">Consignment Description</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Industrial Turbines & Assemblies"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cargo Category</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#ea580c]"
                  >
                    {CARGO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dispatch Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#ea580c]"
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Weight (kg)</label>
                  <input
                    type="number"
                    required
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Package Units</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#ea580c]"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_fragile}
                    onChange={(e) => setFormData({ ...formData, is_fragile: e.target.checked })}
                    className="w-4 h-4 rounded text-[#ea580c] bg-slate-50 border-slate-300 focus:ring-0"
                  />
                  <span>Fragile / Shock-Sensitive Material (Requires smooth gradient corridors)</span>
                </label>
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
                  {editingId ? 'Save Changes' : 'Register Consignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
