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
      <div className="glass-panel p-6 rounded-3xl border border-emerald-900/40 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white tracking-tight flex items-center gap-2 uppercase">
            <Package className="w-6 h-6 text-emerald-400" />
            Cargo Consignments & Manifests
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage payload weights, fragile handling specifications and delivery SLA priorities.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-heading font-extrabold text-xs uppercase tracking-wider shadow-emerald-glow hover:shadow-emerald-glow-hover transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>New Cargo Consignment</span>
        </button>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cargoList.map(c => (
          <div key={c.id} className="glass-panel p-6 rounded-3xl border border-emerald-900/40 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {c.type}
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                  c.priority === 'URGENT' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  c.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-slate-800 text-slate-300'
                }`}>
                  {c.priority} PRIORITY
                </span>
              </div>

              <h3 className="font-black text-base text-white mt-3 line-clamp-1">{c.name}</h3>

              {/* Weight & Fragile Flag */}
              <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500 font-semibold">Total Weight</div>
                  <div className="font-extrabold text-indigo-300 text-base mt-0.5">
                    {Number(c.weight_kg).toLocaleString()} kg
                  </div>
                  <div className="text-[10px] text-slate-400">Qty: {c.quantity || 1} units</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500 font-semibold">Handling Spec</div>
                  <div className="font-bold text-slate-200 mt-0.5">
                    {c.is_fragile ? '⚠️ Fragile Class' : 'Standard Heavy'}
                  </div>
                  <div className="text-[10px] text-slate-400">{c.length_m}x{c.width_m}x{c.height_m}m dims</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
              <button
                onClick={() => handleOpenEdit(c)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
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
                {editingId ? 'Edit Cargo Item' : 'New Cargo Consignment'}
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
                <label className="block font-semibold text-slate-300 mb-1">Consignment Description</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Industrial Turbines & Assemblies"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Cargo Category</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {CARGO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Dispatch Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Total Weight (kg)</label>
                  <input
                    type="number"
                    required
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Package Units</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_fragile}
                    onChange={(e) => setFormData({ ...formData, is_fragile: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-0"
                  />
                  <span>Fragile / Shock-Sensitive Material (Requires smooth gradient corridors)</span>
                </label>
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
