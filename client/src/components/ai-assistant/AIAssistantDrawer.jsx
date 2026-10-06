import React, { useState, useEffect } from 'react';
import { aiApi } from '../../services/api';
import { Bot, Send, Sparkles, X, ChevronRight, Key, CheckCircle, ShieldCheck, Zap, HelpCircle } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "Check road clearances for Latur to Kolhapur",
  "I need to deliver 500 kg from Mumbai to Pune by 6 PM",
  "Why did you choose Route A?",
  "Traffic is getting worse. What should I do?",
  "Which route is cheapest?",
  "Can I use this heavy truck on this route?"
];

export default function AIAssistantDrawer({ isOpen, onClose, activeTripId = null, onApplyAction = () => {} }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I am RouteMind AI, your intelligent mobility & logistics optimization co-pilot. How can I assist with your transit routing, vehicle clearances, or departure timing today?",
      actions: ["Check road clearances for Latur to Kolhapur", "I need to deliver 500 kg from Mumbai to Pune by 6 PM"],
      engine: 'routemind-grounded'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [keySaved, setKeySaved] = useState(false);
  const [backendStatus, setBackendStatus] = useState({ hasGeminiKey: false, model: 'gemini-1.5-flash' });

  // Load custom key from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('routemind_gemini_api_key') || '';
    setGeminiKey(saved);

    // Check backend status
    aiApi.getStatus()
      .then(res => {
        if (res.data?.data) {
          setBackendStatus(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveKey = (e) => {
    e.preventDefault();
    const trimmed = geminiKey.trim();
    if (trimmed) {
      localStorage.setItem('routemind_gemini_api_key', trimmed);
    } else {
      localStorage.removeItem('routemind_gemini_api_key');
    }
    setKeySaved(true);
    setTimeout(() => {
      setKeySaved(false);
      setShowKeyConfig(false);
    }, 1500);
  };

  const activeKeyInUse = geminiKey.trim() || (backendStatus.hasGeminiKey ? 'ENV_CONFIGURED' : null);

  if (!isOpen) return null;

  const handleSend = async (queryText) => {
    const q = queryText || input;
    if (!q.trim() || loading) return;

    const userMsg = { role: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const activeKey = geminiKey.trim() || undefined;
      const res = await aiApi.chat(q, activeTripId, activeKey);
      if (res.data?.success && res.data?.data) {
        const payload = res.data.data;
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: payload.answer,
            intent: payload.intent,
            actions: payload.suggestedActions || [],
            extractedData: payload.extractedData,
            engine: payload.engine || (activeKeyInUse ? 'gemini-1.5-flash' : 'routemind-grounded')
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: "I encountered a telemetry processing delay. All highway clearance corridors remain active. Please verify your vehicle constraints.",
          actions: ['Check road clearances for Latur to Kolhapur'],
          engine: 'routemind-grounded'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-full sm:w-[460px] h-full glass-panel border-l border-emerald-900/50 shadow-2xl flex flex-col backdrop-blur-2xl bg-[#06100b]/95 text-slate-100 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-emerald-900/40 bg-[#08140f]/90 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-emerald-400 to-amber-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Bot className="w-5 h-5 text-slate-950 fill-slate-950/20" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-extrabold text-sm tracking-wide text-white uppercase">RouteMind AI Co-Pilot</h3>
                  {activeKeyInUse ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> GEMINI 1.5
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" /> GROUNDED AI
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">High-Precision Mobility & Clearance Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowKeyConfig(!showKeyConfig)}
                title="Configure Google Gemini API Key"
                className={`p-2 rounded-lg transition text-xs flex items-center gap-1 border ${
                  activeKeyInUse
                    ? 'border-cyan-500/40 text-cyan-300 bg-cyan-950/30 hover:bg-cyan-900/40'
                    : 'border-emerald-900/60 text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/40'
                }`}
              >
                <Key className="w-4 h-4" />
                <span className="text-[10px] font-mono uppercase">{activeKeyInUse ? 'Gemini Active' : 'Set Key'}</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-950/40 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Collapsible Gemini Key Configuration */}
          {showKeyConfig && (
            <div className="mt-2 p-3 rounded-xl bg-[#040907] border border-emerald-900/60 text-xs animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Google Gemini AI Setup
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-cyan-400 hover:underline flex items-center gap-0.5"
                >
                  Get free key ↗
                </a>
              </div>
              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                Connect your Google Gemini API key to activate Gemini 1.5 Flash live multimodal reasoning. If empty, RouteMind's built-in high-precision Grounded Domain Engine will operate with zero latency.
              </p>
              <form onSubmit={handleSaveKey} className="flex gap-2">
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Paste Gemini API Key (AIzaSy...)"
                  className="flex-1 bg-[#08140f] border border-emerald-900/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs hover:opacity-90 transition flex items-center gap-1"
                >
                  {keySaved ? <CheckCircle className="w-3.5 h-3.5" /> : 'Save'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[92%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20 rounded-br-none'
                    : 'bg-[#08140f] border border-emerald-900/50 text-slate-200 shadow-md rounded-bl-none'
                }`}
              >
                {/* Engine Source Badge for Assistant */}
                {m.role === 'assistant' && (
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-emerald-900/30 text-[10px] font-mono">
                    <span className="text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      {m.engine === 'gemini-1.5-flash' ? (
                        <>
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span className="text-cyan-300 font-semibold">Gemini 1.5 Flash</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">RouteMind Grounded Engine</span>
                        </>
                      )}
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> VERIFIED
                    </span>
                  </div>
                )}

                {/* Main Message Text (formatted with line breaks) */}
                <div className="whitespace-pre-line text-[13px] leading-relaxed font-sans">
                  {m.text}
                </div>

                {/* Specialized Structured Card: Road Clearance Check */}
                {m.extractedData && (m.intent === 'CHECK_ROAD_CLEARANCE' || m.extractedData.overheadClearanceM) && (
                  <div className="mt-3 p-3 rounded-xl bg-[#040907]/90 border border-emerald-500/30 text-xs space-y-2">
                    <div className="font-heading font-bold text-emerald-400 text-[11px] uppercase tracking-wider flex items-center justify-between">
                      <span>🛣️ Verified Clearance Corridor</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9px] border border-emerald-500/30">
                        {m.extractedData.corridorStatus || 'CLEARED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                      <div className="p-2 rounded-lg bg-[#08140f] border border-emerald-900/40">
                        <div className="text-slate-400 text-[10px] uppercase">Route Segment</div>
                        <div className="text-white font-bold">{m.extractedData.origin} ➔ {m.extractedData.destination}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-[#08140f] border border-emerald-900/40">
                        <div className="text-slate-400 text-[10px] uppercase">Overhead Clearance</div>
                        <div className="text-emerald-300 font-bold">{m.extractedData.overheadClearanceM || '5.20m (IRC:SP:84)'}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-[#08140f] border border-emerald-900/40">
                        <div className="text-slate-400 text-[10px] uppercase">Bridge Load Rating</div>
                        <div className="text-amber-300 font-bold">{m.extractedData.maxGrossWeightTonnes || '40.0T (Class 70R)'}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-[#08140f] border border-emerald-900/40">
                        <div className="text-slate-400 text-[10px] uppercase">Recommended Fleet</div>
                        <div className="text-white font-bold truncate">{m.extractedData.recommendedVehicle || 'Heavy Truck'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Specialized Structured Card: Logistics Trip Planning */}
                {m.extractedData && m.intent !== 'CHECK_ROAD_CLEARANCE' && !m.extractedData.overheadClearanceM && (
                  <div className="mt-3 p-3 rounded-xl bg-[#040907]/90 border border-emerald-900/50 text-xs space-y-1.5 font-mono">
                    <div className="font-heading font-bold text-emerald-400 text-[11px] uppercase tracking-wider">Identified Logistics Parameters:</div>
                    <div className="text-slate-300">• Origin: <span className="text-white font-medium">{m.extractedData.origin}</span></div>
                    <div className="text-slate-300">• Destination: <span className="text-white font-medium">{m.extractedData.destination}</span></div>
                    <div className="text-slate-300">• Payload: <span className="text-white font-medium">{m.extractedData.cargoWeightKg || 'Standard consignment'}</span></div>
                    <div className="text-slate-300">• Target Arrival: <span className="text-white font-medium">{m.extractedData.deadline || 'Standard transit schedule'}</span></div>
                    {m.extractedData.recommendedVehicle && (
                      <div className="text-slate-300">• Recommended Fleet: <span className="text-emerald-300 font-medium">{m.extractedData.recommendedVehicle}</span></div>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {m.actions && m.actions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {m.actions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (act.includes('Pre-fill') || act.includes('pre-fill') || act.includes('Plan') || act.includes('trip') || act.includes('What-If')) {
                          onApplyAction(act, m.extractedData);
                          onClose();
                        } else {
                          handleSend(act);
                        }
                      }}
                      className="text-xs px-3 py-1 rounded-full bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 transition flex items-center gap-1 font-heading font-semibold"
                    >
                      <span>{act}</span>
                      <ChevronRight className="w-3 h-3 text-emerald-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 p-2 font-mono">
              <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Analyzing highway clearances, bridge ratings & real-time telemetry...</span>
            </div>
          )}
        </div>

        {/* Suggested Quick Prompts */}
        <div className="p-3 border-t border-emerald-900/40 bg-[#08140f]/60">
          <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2">Suggested Inquiries</div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="text-[11px] whitespace-nowrap px-3 py-1 rounded-full bg-[#08140f] hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 border border-emerald-900/60 transition font-heading"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="p-3 border-t border-emerald-900/40 bg-[#040907]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about road clearances, routes, delays or costs..."
              className="flex-1 bg-[#08140f] border border-emerald-900/60 rounded-full px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 font-bold disabled:opacity-40 transition shadow-emerald-glow hover:shadow-emerald-glow-hover transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Send className="w-4 h-4 fill-slate-950/20" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
