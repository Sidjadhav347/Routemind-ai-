import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Navigation,
  Activity,
  Sliders,
  Bot,
  X,
  Sparkles,
  Compass
} from 'lucide-react';

export default function FloatingActionMenu({ onOpenAI = () => {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loginDemoOffline } = useAuth();
  const menuRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Safe navigation handler that ensures access without breaking flow
  const handleActionClick = (action) => {
    setIsOpen(false);
    if (!isAuthenticated) {
      loginDemoOffline();
    }

    if (action.type === 'ai') {
      onOpenAI();
    } else if (action.path) {
      if (action.path === '/#coloading-feature') {
        if (location.pathname === '/') {
          document.getElementById('coloading-feature')?.scrollIntoView({ behavior: 'smooth' });
        } else {
          navigate('/#coloading-feature');
        }
      } else {
        navigate(action.path);
      }
    }
  };

  // Actions stacked from bottom (nearest trigger) to top, matching Jitter design
  const actions = [
    {
      id: 'planner',
      label: 'Route Planner',
      sublabel: 'Multi-Corridor AI Optimization',
      path: '/',
      icon: Navigation,
      gradient: 'from-[#6d28d9] to-[#7c3aed]',
      shadow: 'shadow-purple-900/40',
      active: location.pathname === '/'
    },
    {
      id: 'monitor',
      label: 'Live Monitor',
      sublabel: 'Real-time Telemetry & Clearance',
      path: '/monitor',
      icon: Activity,
      gradient: 'from-[#7c3aed] to-[#8b5cf6]',
      shadow: 'shadow-purple-800/40',
      active: location.pathname === '/monitor'
    },
    {
      id: 'simulator',
      label: 'What-If Simulator',
      sublabel: 'Traffic, Road & Weight Stress Tests',
      path: '/simulator',
      icon: Sliders,
      gradient: 'from-[#8b5cf6] to-[#a855f7]',
      shadow: 'shadow-purple-700/40',
      active: location.pathname === '/simulator'
    },
    {
      id: 'ai-copilot',
      label: 'AI Co-Pilot',
      sublabel: 'Gemini Autonomous Assistant',
      type: 'ai',
      icon: Bot,
      gradient: 'from-[#a855f7] to-[#c084fc]',
      shadow: 'shadow-purple-600/40',
      badge: 'GEMINI',
      active: false
    }
  ];

  return (
    <div
      ref={menuRef}
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end select-none pointer-events-auto"
      aria-label="Floating Action Menu"
    >
      {/* Backdrop overlay when open to emphasize floating hierarchy */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/35 backdrop-blur-[2px] z-30 transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Speed-Dial Action Items (Stacked Vertically Upward with Spring Animation) */}
      <div className={`relative z-40 flex flex-col items-end gap-3 mb-3 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {isOpen &&
          actions.map((act, index) => {
            const IconComponent = act.icon;
            // Delay staggered from bottom to top
            const delayMs = index * 55;

            return (
              <div
                key={act.id}
                style={{ animationDelay: `${delayMs}ms` }}
                className="jitter-spring-in flex items-center gap-3 group cursor-pointer"
                onClick={() => handleActionClick(act)}
              >
                {/* Action Pill Badge (Slides in from right) */}
                <div
                  style={{ animationDelay: `${delayMs + 25}ms` }}
                  className="jitter-pill-in hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl glass-panel bg-[#08140f]/90 border border-purple-500/30 text-white shadow-xl shadow-black/50 group-hover:border-purple-400 group-hover:bg-[#121c17] transition-all duration-200 transform group-hover:-translate-x-1"
                >
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-heading font-bold text-white group-hover:text-purple-300 transition-colors flex items-center justify-end gap-1.5">
                      {act.label}
                      {act.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40 font-extrabold uppercase">
                          {act.badge}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                      {act.sublabel}
                    </span>
                  </div>
                </div>

                {/* Circular Action Button */}
                <button
                  type="button"
                  aria-label={act.label}
                  className={`w-12 h-12 rounded-full bg-gradient-to-tr ${act.gradient} ${act.shadow} shadow-lg border border-white/20 text-white flex items-center justify-center transition-all duration-200 transform group-hover:scale-110 group-hover:shadow-purple-500/50 group-active:scale-95 ${
                    act.active ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#040907]' : ''
                  }`}
                >
                  <IconComponent className="w-5 h-5 text-white stroke-[2.2]" />
                </button>
              </div>
            );
          })}
      </div>

      {/* Main Trigger Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle Quick Mobility Menu"
        className={`relative z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-[#6d28d9] via-[#8b5cf6] to-[#a855f7] border border-white/25 text-white shadow-2xl shadow-purple-900/60 flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 ${
          !isOpen ? 'jitter-ripple' : 'ring-2 ring-purple-300/60 shadow-purple-500/40'
        }`}
        title={isOpen ? 'Close Quick Menu (Esc)' : 'Quick Mobility Actions'}
      >
        {/* Subtle glowing halo */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500/20 to-emerald-400/20 blur-md pointer-events-none" />

        {/* Morphing Jitter Icon (Signature 4-circle grid morphing to dismiss X) */}
        <div
          className={`relative z-10 transition-transform duration-300 ease-out transform ${
            isOpen ? 'rotate-[135deg] scale-105' : 'rotate-0 scale-100'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white stroke-[2.4]" />
          ) : (
            <div className="grid grid-cols-2 gap-1.5 p-0.5">
              <div className="w-2.5 h-2.5 rounded-full border-[2.2px] border-white" />
              <div className="w-2.5 h-2.5 rounded-full border-[2.2px] border-white" />
              <div className="w-2.5 h-2.5 rounded-full border-[2.2px] border-white" />
              <div className="w-2.5 h-2.5 rounded-full border-[2.2px] border-white" />
            </div>
          )}
        </div>

        {/* Active notification indicator dot */}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-gradient-to-tr from-amber-400 to-emerald-400 border-2 border-[#040907]" />
          </span>
        )}
      </button>
    </div>
  );
}
