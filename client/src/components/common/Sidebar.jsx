import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutGrid,
  Route,
  Activity,
  Truck,
  BarChart3,
  HelpCircle,
  Settings,
  MoreHorizontal,
  LogOut,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ isOpen = true, onClose = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      path: '/',
      icon: LayoutGrid,
      exact: true
    },
    {
      id: 'planning',
      label: 'Route planning',
      path: '/',
      icon: Route,
      action: 'plan'
    },
    {
      id: 'operations',
      label: 'Live operations',
      path: '/monitor',
      icon: Activity,
      hasLiveBadge: true
    },
    {
      id: 'fleet',
      label: 'Fleet',
      path: '/vehicles',
      icon: Truck
    },
    {
      id: 'analytics',
      label: 'Analytics',
      path: '/analytics',
      icon: BarChart3
    }
  ];

  const handleItemClick = (item) => {
    onClose();
    if (item.action === 'plan') {
      if (location.pathname === '/') {
        window.scrollTo({ top: 380, behavior: 'smooth' });
      } else {
        navigate('/');
      }
    } else {
      navigate(item.path);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'AK';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside
      className={`w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 select-none z-30 transition-all duration-300 min-h-[calc(100vh-4rem)] ${
        isOpen ? 'block' : 'hidden lg:flex'
      }`}
    >
      <div className="p-4 space-y-6">
        {/* Workspace Group Header */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
            WORKSPACE
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.path && item.action !== 'plan'
                : item.action === 'plan'
                ? false
                : location.pathname.startsWith(item.path);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-heading font-medium transition-all group ${
                    isActive
                      ? 'bg-[#fff7ed] text-[#ea580c] font-bold shadow-sm shadow-orange-500/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-[#ea580c] stroke-[2.4]'
                          : 'text-slate-400 group-hover:text-slate-600 stroke-[1.8]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.hasLiveBadge && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Help, Settings & User Profile Section */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <button
          type="button"
          onClick={() => {
            alert('RouteMind AI Help Center: Check clearances, simulate incidents, or ask the AI Co-Pilot.');
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium transition"
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Help center</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/vehicles')}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium transition"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </button>

        {/* User Card */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-slate-50 transition">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#ffedd5] text-[#c2410c] flex items-center justify-center font-heading font-extrabold text-xs shadow-sm">
              {getInitials(user?.name)}
            </div>
            <div className="text-left">
              <div className="text-xs font-heading font-bold text-slate-900 leading-tight">
                {user?.name?.split('(')[0]?.trim() || 'Alex Kramer'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {user?.role === 'OPERATOR' ? 'Operations manager' : 'Fleet operator'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
