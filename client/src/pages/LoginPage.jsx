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
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-emerald-900/40 shadow-2xl space-y-6 bg-[#08140f]/90 backdrop-blur-xl text-center animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-emerald-400 to-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
            <ShieldCheck className="w-8 h-8 text-slate-950" />
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              Active Session Verified
            </span>
            <h2 className="text-xl font-heading font-extrabold text-white mt-3">
              Already Signed In
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Signed in as <span className="text-emerald-400 font-bold">{user.name || user.email}</span>
            </p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Role: {user.role || 'OPERATOR'}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-heading font-extrabold text-xs uppercase tracking-wider shadow-emerald-glow hover:shadow-emerald-glow-hover transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <span>Exit to Dispatch Console</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 rounded-2xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 text-xs font-heading font-bold transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
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
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-emerald-900/40 shadow-2xl space-y-6 bg-[#08140f]/90 backdrop-blur-xl">
        {/* Navigation Exit Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40 text-xs">
          <button
            type="button"
            onClick={handleExitToConsole}
            className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-300 font-mono transition group"
            title="Exit login page and return to dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform text-emerald-400" />
            <span>Exit to Console</span>
          </button>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Dispatch Gateway
          </span>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-emerald-400 to-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
            <Navigation className="w-6 h-6 text-slate-950 fill-slate-950/20 -rotate-45" />
          </div>
          <h2 className="text-2xl font-heading font-extrabold tracking-tight text-white mt-2 uppercase">
            RouteMind AI
          </h2>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
            Predict. Optimize. <span className="text-amber-400 font-bold">Move Smarter.</span>
          </p>
        </div>

        {/* 1-Click Demo Login Banner */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleInstantDemoLogin}
            disabled={loading}
            className="w-full p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 hover:bg-emerald-900/40 text-emerald-300 text-xs font-heading font-bold transition flex items-center justify-between group shadow-lg shadow-emerald-950/40"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>1-Click Hackathon Demo Sign-In</span>
            </div>
            <span className="text-[10px] bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 px-2.5 py-0.5 rounded-full font-black uppercase font-mono group-hover:scale-105 transition-transform">
              Instant
            </span>
          </button>

          <button
            type="button"
            onClick={handleFillDemo}
            className="w-full py-1 text-center text-[11px] text-slate-400 hover:text-emerald-300 font-mono transition"
          >
            Auto-fill credentials only (demo@routemind.ai / password123)
          </button>
        </div>

        {/* Error Alert with Troubleshooting */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs space-y-2.5 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>

            {isServerOffline && (
              <div className="pt-2 border-t border-rose-900/50 text-[11px] space-y-2">
                <div className="text-slate-300">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                    <Terminal className="w-3.5 h-3.5" /> Quick Server Startup:
                  </div>
                  Run this command in your project terminal:
                  <div className="mt-1 font-mono text-[10px] bg-slate-950/80 px-2 py-1.5 rounded-lg border border-slate-800 text-emerald-300">
                    npm run dev
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    loginDemoOffline();
                    navigate('/');
                  }}
                  className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Enter with Offline Demo Mode</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-heading font-bold uppercase tracking-wider text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#040907] border border-emerald-900/60 rounded-xl px-3.5 py-2.5 pl-10 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
                placeholder="demo@routemind.ai"
                autoComplete="email"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block font-heading font-bold uppercase tracking-wider text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#040907] border border-emerald-900/60 rounded-xl px-3.5 py-2.5 pl-10 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-heading font-extrabold text-xs uppercase tracking-wider shadow-emerald-glow hover:shadow-emerald-glow-hover transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Dispatch Console'}</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </form>

        <div className="space-y-2 text-center text-xs">
          <div className="text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-400 font-bold hover:underline font-heading">
              Register Operator Account
            </Link>
          </div>

          <div>
            <button
              type="button"
              onClick={handleExitToConsole}
              className="text-[11px] text-slate-500 hover:text-emerald-300 font-mono transition"
            >
              Skip sign-in & exit to guest demo mode →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
