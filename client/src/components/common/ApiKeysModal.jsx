import React, { useState, useEffect } from 'react';
import { configApi } from '../../services/api';
import {
  Key,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Sparkles,
  Save,
  FileCode
} from 'lucide-react';

export default function ApiKeysModal({ isOpen, onClose }) {
  const [keysInfo, setKeysInfo] = useState(null);
  const [googleKeyInput, setGoogleKeyInput] = useState('');
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadKeys();
    }
  }, [isOpen]);

  const loadKeys = async () => {
    try {
      const res = await configApi.getKeys();
      if (res.success) {
        setKeysInfo(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch keys config:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const payload = {};
      if (googleKeyInput.trim()) payload.googleMapsApiKey = googleKeyInput.trim();
      if (geminiKeyInput.trim()) payload.geminiApiKey = geminiKeyInput.trim();

      const res = await configApi.updateKeys(payload);
      if (res.success) {
        setFeedback({
          type: res.data?.verification?.valid === false ? 'warning' : 'success',
          message: res.data?.verification?.message || res.message
        });
        setGoogleKeyInput('');
        setGeminiKeyInput('');
        loadKeys();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update API keys'
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel p-6 sm:p-8 border border-emerald-500/40 bg-[#06140e] shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-emerald-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Google Maps &amp; AI Keys</h3>
              <p className="text-xs text-slate-400">Configure your API credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : feedback.type === 'warning'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Current Status Pill */}
        <div className="p-4 rounded-2xl bg-[#040907] border border-emerald-900/60 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Maps API Status:</span>
            </span>
            {keysInfo?.hasGoogleMapsKey ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Active ({keysInfo.googleMapsApiKeyMasked || 'Configured'})
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                Not Set (Using Smart OSRM)
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Gemini AI API Status:</span>
            </span>
            {keysInfo?.hasGeminiKey ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Active (Gemini 1.5)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                RouteMind Domain Engine
              </span>
            )}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Maps API Key</span>
              </label>
              <a
                href="https://console.cloud.google.com/google/maps-apis"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
              >
                <span>Get Key from Google Cloud</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="text"
              placeholder="Paste AIzaSy... key here"
              value={googleKeyInput}
              onChange={(e) => setGoogleKeyInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#081510] border border-emerald-500/25 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
            <p className="text-[11px] text-slate-400">
              Enables Google Directions API (driving corridors &amp; live traffic) and Google Geocoding API.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Gemini API Key (Optional)</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
              >
                <span>Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="Paste AI Studio API key here"
              value={geminiKeyInput}
              onChange={(e) => setGeminiKeyInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#081510] border border-emerald-500/25 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Quick instructions on .env placement */}
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-slate-300 space-y-1.5">
            <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Or Put in server/.env File:</span>
            </div>
            <div className="p-2 rounded-lg bg-[#040907] font-mono text-[10px] text-slate-300 select-all border border-emerald-900/40">
              GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
            </div>
            <p className="text-slate-400 text-[10px]">
              Located at: <code className="text-emerald-300">c:\workshop\server\.env</code>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-900/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving || (!googleKeyInput.trim() && !geminiKeyInput.trim())}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-emerald-glow disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Key...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save &amp; Activate Key</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
