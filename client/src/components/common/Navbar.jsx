import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationApi, trafficApi } from '../../services/api';
import {
  Navigation,
  Activity,
  Sliders,
  Truck,
  Package,
  BarChart3,
  Bot,
  Bell,
  LogOut,
  PlayCircle,
  CheckCircle,
  AlertTriangle,
  Radio,
  ChevronDown,
  Share2,
  Key
} from 'lucide-react';
import ApiKeysModal from './ApiKeysModal';

export default function Navbar({ onOpenAI = () => {}, onTriggerScenario = () => {} }) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showApiKeys, setShowApiKeys] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const [scenarios, setScenarios] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      loadScenarios();
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      const res = await notificationApi.getAll();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.warn('Could not load notifications:', err);
    }
  };

  const loadScenarios = async () => {
    try {
      const res = await trafficApi.getScenarios();
      if (res.success) {
        setScenarios(res.data);
      }
    } catch (err) {
      console.warn('Could not load scenarios:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    await notificationApi.markAllAsRead();
    loadNotifications();
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-emerald-900/30 bg-[#040907]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo - Styled like StinPort Facet Logo */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-amber-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform duration-200">
            <Navigation className="w-5 h-5 text-slate-950 fill-slate-950/20 -rotate-45" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full border-2 border-[#040907]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-lg tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                RouteMind
              </span>
              <span className="text-[10px] font-heading font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                AI
              </span>
            </div>
            <div className="text-[10px] text-emerald-400/80 font-medium tracking-wide hidden sm:block">
              Predict. Optimize. <span className="text-amber-400 font-semibold">Move Smarter.</span>
            </div>
          </div>
        </div>

        {/* Navigation Links in Decent & Attractive Typography */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1.5">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-heading font-semibold transition ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-950/30'
                }`
              }
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Planner</span>
            </NavLink>

            <NavLink
              to="/monitor"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-heading font-semibold transition ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-950/30'
                }`
              }
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Live Monitor</span>
            </NavLink>

            <NavLink
              to="/simulator"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-heading font-semibold transition ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-950/30'
                }`
              }
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Simulator</span>
            </NavLink>

            <NavLink
              to="/coloading"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-heading font-semibold transition relative group ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-950/30'
                }`
              }
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Co-Loading</span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                AI
              </span>
            </NavLink>

            <NavLink
              to="/vehicles"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-heading font-semibold transition ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-950/30'
                }`
              }
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Fleet</span>
            </NavLink>

            <NavLink
              to="/cargo"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-heading font-semibold transition ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-950/30'
                }`
              }
            >
              <Package className="w-3.5 h-3.5" />
              <span>Cargo</span>
            </NavLink>

            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-heading font-semibold transition ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-emerald-300 hover:bg-emerald-950/30'
                }`
              }
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </NavLink>
          </nav>
        )}

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-2.5">
          {isAuthenticated ? (
            <>
              {/* Hackathon Demo Presets Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowScenarios(!showScenarios)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 transition text-xs font-heading font-bold shadow-md shadow-amber-500/10"
                >
                  <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="hidden sm:inline uppercase text-[11px] tracking-wider">Demo Scenarios</span>
                  <ChevronDown className="w-3 h-3 text-amber-400" />
                </button>

                {showScenarios && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl glass-panel p-2 shadow-2xl z-50 bg-[#08140f]/95 border border-emerald-500/30 animate-in fade-in zoom-in-95">
                    <div className="p-2 border-b border-emerald-900/40 flex items-center justify-between">
                      <span className="text-xs font-heading font-bold text-slate-200 uppercase tracking-wider">
                        Interactive Mobility Scenarios
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold font-mono">
                        LIVE SIM
                      </span>
                    </div>
                    <div className="py-1 space-y-1">
                      {scenarios.map(sc => (
                        <button
                          key={sc.id}
                          onClick={() => {
                            setShowScenarios(false);
                            onTriggerScenario(sc);
                          }}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-emerald-950/40 transition flex flex-col gap-1 border border-transparent hover:border-emerald-500/30"
                        >
                          <div className="text-xs font-heading font-bold text-emerald-300 flex items-center gap-1.5">
                            <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                            {sc.title}
                          </div>
                          <div className="text-[11px] text-slate-400 leading-tight">
                            {sc.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Assistant Button - Glowing Emerald Pill */}
              <button
                onClick={onOpenAI}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 text-xs font-heading font-extrabold uppercase tracking-wider shadow-emerald-glow hover:shadow-emerald-glow-hover transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Bot className="w-3.5 h-3.5 text-slate-950 fill-slate-950/20" />
                <span>AI Co-Pilot</span>
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl bg-[#08140f] hover:bg-emerald-950/50 text-slate-300 hover:text-emerald-300 border border-emerald-900/40 transition relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold flex items-center justify-center animate-bounce-subtle">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl glass-panel p-3 shadow-2xl z-50 bg-[#08140f]/95 border border-emerald-500/30 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-900/40">
                      <span className="text-xs font-heading font-bold text-slate-200 uppercase tracking-wider">Transit Notifications</span>
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-emerald-400 hover:underline font-mono"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {notifications.length === 0 ? (
                        <div className="text-xs text-slate-500 py-4 text-center">No alerts at this time.</div>
                      ) : (
                        notifications.slice(0, 5).map(n => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-xl text-xs border ${
                              n.severity === 'ALERT'
                                ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                                : n.severity === 'WARNING'
                                ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                                : 'bg-[#040907]/80 border-emerald-900/40 text-slate-300'
                            }`}
                          >
                            <div className="font-bold flex items-center gap-1.5 font-heading">
                              {n.severity === 'ALERT' ? <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                              {n.title}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">{n.message}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* API Keys Configuration Button */}
              <button
                onClick={() => setShowApiKeys(true)}
                title="Configure Google Maps & AI API Keys"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition text-xs font-semibold"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Google API Key</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-xl bg-[#08140f] hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 border border-emerald-900/40 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowApiKeys(true)}
                title="Configure Google Maps & AI API Keys"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition text-xs font-semibold"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Google API Key</span>
              </button>

              <NavLink
                to="/login"
                className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 text-xs font-heading font-extrabold uppercase tracking-wider transition-all duration-200 shadow-emerald-glow hover:shadow-emerald-glow-hover transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Sign In
              </NavLink>
            </div>
          )}
        </div>
      </div>

      <ApiKeysModal isOpen={showApiKeys} onClose={() => setShowApiKeys(false)} />
    </header>
  );
}
