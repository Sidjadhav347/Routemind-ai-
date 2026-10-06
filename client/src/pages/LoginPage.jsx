import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Navigation,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Terminal,
  Sparkles,
  LogOut,
  X
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('demo@routemind.ai');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState(null);
  const [isServerOffline, setIsServerOffline] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user, login, loginDemoOffline, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, show friendly session card with instant Exit button
  if (isAuthenticated && user) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#ea580c] via-[#f97316] to-[#fb923c] flex items-center justify-center mx-auto shadow-xl shadow-orange-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200 font-bold">
              Active Session Verified
            </span>
            <h2 className="text-xl font-heading font-extrabold text-slate-900 mt-3">
              Already Signed In
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Signed in as <span className="text-[#ea580c] font-bold">{user.name || user.email}</span>
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Role: {user.role || 'OPERATOR'}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#ea580c] to-[#f97316] hover:from-[#c2410c] hover:to-[#ea580c] text-white font-heading font-extrabold text-xs uppercase tracking-wider shadow-md shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <span>Exit to Dispatch Console</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-heading font-bold transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Sign Out & Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleExitToConsole = () => {
    // If not authenticated, enable demo session so protected route passes
    if (!isAuthenticated) {
      loginDemoOffline();
    }
    navigate('/');
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setIsServerOffline(false);
    setLoading(true);

    const cleanEmail = (email || '').trim();
    if (!cleanEmail) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      await login(cleanEmail, password);
      navigate('/');
    } catch (err) {
      const errMsg = typeof err === 'string'
        ? err
        : (err?.message || err?.error || 'Login failed. Please verify your credentials.');
      
      setError(errMsg);

      if (err?.code === 'BACKEND_OFFLINE' || errMsg.includes('port 5000') || errMsg.includes('Cannot connect')) {
        setIsServerOffline(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = async () => {
    setEmail('demo@routemind.ai');
    setPassword('password123');
    setError(null);
    setIsServerOffline(false);
    setLoading(true);

    try {
      await login('demo@routemind.ai', 'password123');
      navigate('/');
    } catch (err) {
      console.warn('Backend login attempt:', err);
      // Fallback seamlessly to offline demo mode
      loginDemoOffline();
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@routemind.ai');
    setPassword('password123');
    setError(null);
    setIsServerOffline(false);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6">
        {/* Navigation Exit Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
          <button
            type="button"
            onClick={handleExitToConsole}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-heading font-medium transition group"
            title="Exit login page and return to dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform text-[#ea580c]" />
            <span>Exit to Console</span>
          </button>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200 font-bold">
            Dispatch Gateway
          </span>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ea580c] via-[#f97316] to-[#fb923c] flex items-center justify-center mx-auto shadow-lg shadow-orange-500/25">
            <div className="flex items-end gap-0.5 h-5 px-1">
              <div className="w-2 h-3 bg-white rounded-full" />
              <div className="w-2 h-5 bg-white rounded-full" />
              <div className="w-2 h-4 bg-white rounded-full" />
            </div>
          </div>
          <h2 className="text-2xl font-heading font-extrabold tracking-tight text-slate-900 mt-2">
            RouteMind <span className="text-[#ea580c]">AI</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
            Predict. Optimize. <span className="text-[#ea580c] font-bold">Move Smarter.</span>
          </p>
        </div>

        {/* 1-Click Demo Login Banner */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleInstantDemoLogin}
            disabled={loading}
            className="w-full p-3 rounded-2xl bg-orange-50/70 border border-orange-200 hover:bg-orange-100/70 text-[#ea580c] text-xs font-heading font-bold transition flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ea580c] animate-pulse" />
              <span>1-Click Live Demo Sign-In</span>
            </div>
            <span className="text-[10px] bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white px-2.5 py-0.5 rounded-full font-black uppercase font-mono group-hover:scale-105 transition-transform shadow-xs">
              Instant
            </span>
          </button>

          <button
            type="button"
            onClick={handleFillDemo}
            className="w-full py-1 text-center text-[11px] text-slate-400 hover:text-[#ea580c] font-mono transition"
          >
            Auto-fill credentials (demo@routemind.ai / password123)
          </button>
        </div>

        {/* Error Alert with Troubleshooting */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2.5 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>

            {isServerOffline && (
              <div className="pt-2 border-t border-rose-200 text-[11px] space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    loginDemoOffline();
                    navigate('/');
                  }}
                  className="w-full py-2 rounded-xl bg-orange-100 hover:bg-orange-200 text-[#ea580c] border border-orange-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#ea580c]" />
                  <span>Enter with Offline Demo Mode</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-heading font-bold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pl-10 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition"
                placeholder="demo@routemind.ai"
                autoComplete="email"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block font-heading font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 pl-10 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#fb923c] hover:from-[#c2410c] hover:to-[#ea580c] text-white font-heading font-extrabold text-xs uppercase tracking-wider shadow-md shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Dispatch Console'}</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </form>

        <div className="space-y-2 text-center text-xs">
          <div className="text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#ea580c] font-bold hover:underline font-heading">
              Register Operator Account
            </Link>
          </div>

          <div>
            <button
              type="button"
              onClick={handleExitToConsole}
              className="text-[11px] text-slate-400 hover:text-slate-700 font-mono transition"
            >
              Skip sign-in &amp; exit to guest demo mode →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
