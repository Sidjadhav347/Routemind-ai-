import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navigation, Lock, Mail, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('demo@routemind.ai');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@routemind.ai');
    setPassword('password123');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-emerald-900/40 shadow-2xl space-y-6 bg-[#08140f]/90">
        {/* Brand */}
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
        <button
          type="button"
          onClick={handleFillDemo}
          className="w-full p-3 rounded-full bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-900/40 text-emerald-300 text-xs font-heading font-bold transition flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>1-Click Hackathon Demo Credentials</span>
          </div>
          <span className="text-[10px] bg-emerald-500/30 px-2.5 py-0.5 rounded-full text-emerald-200 uppercase font-black font-mono">
            Auto-fill
          </span>
        </button>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-heading font-bold uppercase tracking-wider text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#040907] border border-emerald-900/60 rounded-xl px-3.5 py-2.5 pl-10 text-slate-100 focus:outline-none focus:border-emerald-500"
                placeholder="name@company.com"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block font-heading font-bold uppercase tracking-wider text-slate-300 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#040907] border border-emerald-900/60 rounded-xl px-3.5 py-2.5 pl-10 text-slate-100 focus:outline-none focus:border-emerald-500"
                placeholder="••••••••"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-heading font-extrabold text-xs uppercase tracking-wider shadow-emerald-glow hover:shadow-emerald-glow-hover transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Dispatch Console'}</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 font-bold hover:underline font-heading">
            Register Operator Account
          </Link>
        </div>
      </div>
    </div>
  );
}
