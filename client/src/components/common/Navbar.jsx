import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationApi, trafficApi } from '../../services/api';
import {
  Search,
  Bell,
  LogOut,
  Radio,
  PlayCircle,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Building2,
  Menu
} from 'lucide-react';

export default function Navbar({ onOpenAI = () => {}, onTriggerScenario = () => {}, onToggleSidebar = () => {} }) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

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

  const unreadCount = notifications.filter(n => !n.is_read).length || 3;

  const handleMarkAllRead = async () => {
    await notificationApi.markAllAsRead();
    loadNotifications();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 select-none shadow-xs">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Brand Logo matching reference */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            aria-label="Toggle Navigation Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            {/* Orange Square Logo with 3 Signal Bars */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ea580c] via-[#f97316] to-[#fb923c] flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
              <div className="flex items-end gap-0.5 h-4 px-1">
                <div className="w-1.5 h-2.5 bg-white rounded-full" />
                <div className="w-1.5 h-4 bg-white rounded-full" />
                <div className="w-1.5 h-3 bg-white rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-extrabold text-lg tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors">
                  RouteMind
                </span>
                <span className="font-heading font-extrabold text-lg tracking-tight text-[#ea580c]">
                  AI
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Search Bar with ⌘K (Top navigation buttons removed per user instruction) */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-2">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search routes, vehicles or drivers"
              className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-200/90 rounded-xl pl-9 pr-12 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white focus:ring-2 focus:ring-orange-500/10 transition shadow-inner"
            />
            <kbd className="absolute right-3 top-2 px-1.5 py-0.5 text-[10px] text-slate-400 bg-white border border-slate-200 rounded font-mono shadow-xs">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Side: Live Data Synced, Notifications, Demo Scenarios, Org Dropdown */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Live Data Synced Status Indicator */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-medium text-emerald-700">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Live data synced</span>
              </div>

              {/* Demo Scenarios Trigger Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowScenarios(!showScenarios)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100/80 text-[#c2410c] border border-orange-200 transition text-xs font-heading font-bold shadow-xs"
                >
                  <Radio className="w-3.5 h-3.5 text-[#ea580c] animate-pulse" />
                  <span className="hidden sm:inline uppercase text-[10px] tracking-wider">Scenarios</span>
                  <ChevronDown className="w-3 h-3 text-[#ea580c]" />
                </button>

                {showScenarios && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                    <div className="p-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-heading font-bold text-slate-800 uppercase tracking-wider">
                        Interactive Mobility Scenarios
                      </span>
                      <span className="text-[10px] bg-orange-100 text-[#ea580c] px-2 py-0.5 rounded-full font-bold font-mono">
                        LIVE SIM
                      </span>
                    </div>
                    <div className="py-1 space-y-1">
                      {scenarios.map((sc) => (
                        <button
                          key={sc.id}
                          onClick={() => {
                            setShowScenarios(false);
                            onTriggerScenario(sc);
                          }}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-orange-50/70 transition flex flex-col gap-1 border border-transparent hover:border-orange-200"
                        >
                          <div className="text-xs font-heading font-bold text-slate-900 flex items-center gap-1.5">
                            <PlayCircle className="w-3.5 h-3.5 text-[#ea580c]" />
                            {sc.title}
                          </div>
                          <div className="text-[11px] text-slate-500 leading-tight">
                            {sc.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Bell with Red Badge */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl bg-white border border-slate-200 p-3 shadow-2xl z-50 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-heading font-bold text-slate-800 uppercase tracking-wider">
                        Transit Notifications
                      </span>
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-[#ea580c] hover:underline font-mono font-medium"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {notifications.length === 0 ? (
                        <div className="text-xs text-slate-400 py-4 text-center">No alerts at this time.</div>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <div
                            key={n.id}
                            className={`p-2.5 rounded-xl text-xs border ${
                              n.severity === 'ALERT'
                                ? 'bg-rose-50 border-rose-200 text-rose-900'
                                : n.severity === 'WARNING'
                                ? 'bg-amber-50 border-amber-200 text-amber-900'
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="font-bold flex items-center gap-1.5 font-heading">
                              {n.severity === 'ALERT' ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              )}
                              {n.title}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1">{n.message}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Organization / User Dropdown matching screenshot ("NorthWest Logistics ▾") */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-heading font-semibold text-slate-700 transition"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#ea580c]" />
                  <span>NorthWest Logistics</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 border border-slate-200 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink
                to="/login"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] text-white text-xs font-heading font-bold shadow-md shadow-orange-500/25 transition-all transform hover:-translate-y-0.5"
              >
                Sign In
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
