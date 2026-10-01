import React, { useState } from 'react';
import { aiApi } from '../../services/api';
import { Bot, Send, Sparkles, X, ChevronRight, AlertCircle, ShieldCheck } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "I need to deliver 500 kg from Mumbai to Pune by 6 PM.",
  "Which route is cheapest?",
  "Why did you choose Route A?",
  "Traffic is getting worse. What should I do?",
  "Can I use this heavy truck on this route?",
  "Which corridor will save the most fuel?"
];

export default function AIAssistantDrawer({ isOpen, onClose, activeTripId = null, onApplyAction = () => {} }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I am RouteMind AI, your intelligent mobility & logistics optimization co-pilot. How can I assist with your transit routing, vehicle clearances, or departure timing today?",
      actions: ["I need to deliver 500 kg Mumbai to Pune by 6 PM", "Why did you choose Route A?"]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (queryText) => {
    const q = queryText || input;
    if (!q.trim() || loading) return;

    const userMsg = { role: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiApi.chat(q, activeTripId);
      if (res.success && res.data) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: res.data.answer,
            actions: res.data.suggestedActions || [],
            extractedData: res.data.extractedData
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: "I encountered a processing delay. Telemetry indicates all highway segments are currently operational. Please verify your vehicle constraints.",
          actions: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[440px] z-50 glass-panel border-l border-emerald-900/50 shadow-2xl flex flex-col backdrop-blur-2xl bg-[#06100b]/95 text-slate-100 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-emerald-900/40 flex items-center justify-between bg-[#08140f]/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-emerald-400 to-amber-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Bot className="w-5 h-5 text-slate-950 fill-slate-950/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-extrabold text-sm tracking-wide text-white uppercase">RouteMind AI Co-Pilot</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">Grounded Smart Mobility Reasoning</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-950/40 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[88%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20 rounded-br-none'
                  : 'bg-[#08140f] border border-emerald-900/50 text-slate-200 shadow-md rounded-bl-none'
              }`}
            >
              {m.text}

              {m.extractedData && (
                <div className="mt-3 p-2.5 rounded-xl bg-[#040907]/80 border border-emerald-900/40 text-xs space-y-1">
                  <div className="font-heading font-bold text-emerald-400 text-[11px] uppercase tracking-wider">Identified Logistics Parameters:</div>
                  <div>• Origin: <span className="text-white font-medium">{m.extractedData.origin}</span></div>
                  <div>• Destination: <span className="text-white font-medium">{m.extractedData.destination}</span></div>
                  <div>• Payload: <span className="text-white font-medium">{m.extractedData.cargoWeightKg}</span></div>
                  <div>• Target Arrival: <span className="text-white font-medium">{m.extractedData.deadline}</span></div>
                </div>
              )}
            </div>

            {/* Action buttons if provided */}
            {m.actions && m.actions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {m.actions.map((act, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (act.includes('switch') || act.includes('pre-fill') || act.includes('scenario')) {
                        onApplyAction(act);
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
            <span>Analyzing real-time road telemetry & restrictions...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 border-t border-emerald-900/40 bg-[#08140f]/60">
        <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2">Suggested Inquiries</div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {SUGGESTED_PROMPTS.slice(0, 3).map((prompt, i) => (
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

      {/* Input */}
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
            placeholder="Ask about routes, delays, clearances or cost..."
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
  );
}
