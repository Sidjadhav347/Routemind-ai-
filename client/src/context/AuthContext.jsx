import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authApi, userApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('routemind_token') || null);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  // Initialize session once on initial mount
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    async function initSession() {
      const storedToken = localStorage.getItem('routemind_token');
      if (storedToken && storedToken !== 'undefined' && storedToken !== 'null') {
        try {
          const res = await authApi.getMe();
          if (res.success && res.data?.user) {
            setUser(res.data.user);
            setPreferences(res.data.preferences || null);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('[Auth] Stored session invalid or expired, clearing:', err.message);
          localStorage.removeItem('routemind_token');
          setToken(null);
        }
      }

      // If no valid stored session, attempt smooth demo auto-login for zero-friction hackathon UX
      try {
        const loginRes = await authApi.login({ email: 'demo@routemind.ai', password: 'password123' });
        if (loginRes.success && loginRes.data) {
          localStorage.setItem('routemind_token', loginRes.data.token);
          setToken(loginRes.data.token);
          setUser(loginRes.data.user);

          // Attempt to load user preferences
          try {
            const meRes = await authApi.getMe();
            if (meRes.success && meRes.data?.preferences) {
              setPreferences(meRes.data.preferences);
            }
          } catch {
            // Preferences are optional on initial load
          }
        }
      } catch (err) {
        console.warn('[Auth] Demo auto-login unavailable (server may be offline):', err.message);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, []);

  const login = async (email, password) => {
    const cleanEmail = (email || '').trim();
    const res = await authApi.login({ email: cleanEmail, password });
    if (res.success && res.data) {
      localStorage.setItem('routemind_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);

      // Refresh preferences in background
      try {
        const meRes = await authApi.getMe();
        if (meRes.success && meRes.data?.preferences) {
          setPreferences(meRes.data.preferences);
        }
      } catch {
        // Non-critical
      }

      return res.data;
    }
    throw new Error('Login failed: Invalid credentials or server error');
  };

  const loginDemoOffline = () => {
    const demoUser = {
      id: '00000000-0000-4000-a000-000000000001',
      email: 'demo@routemind.ai',
      name: 'Alex Mercer (Logistics Dispatcher - Demo Mode)',
      role: 'OPERATOR'
    };
    const mockToken = 'mock_routemind_offline_demo_token';
    localStorage.setItem('routemind_token', mockToken);
    setToken(mockToken);
    setUser(demoUser);
    setPreferences({
      preferred_mode: 'BALANCED',
      max_travel_budget: 3500.00,
      preferred_fuel_efficiency: 10.0,
      arrival_buffer_mins: 30,
      notify_on_traffic: true,
      notify_on_reroute: true
    });
    return { user: demoUser, token: mockToken };
  };

  const register = async (userData) => {
    const cleanEmail = (userData.email || '').trim();
    const res = await authApi.register({ ...userData, email: cleanEmail });
    if (res.success && res.data) {
      localStorage.setItem('routemind_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error('Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('routemind_token');
    setToken(null);
    setUser(null);
    setPreferences(null);
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setUser(res.data.user);
        setPreferences(res.data.preferences);
      }
    } catch (err) {
      console.error('[Auth] Failed to refresh user:', err);
    }
  };

  const updatePreferences = async (newPrefs) => {
    try {
      const res = await userApi.updatePreferences(newPrefs);
      if (res.success) {
        setPreferences(res.data);
      }
      return res;
    } catch {
      // Local optimistic fallback
      setPreferences(prev => ({ ...prev, ...newPrefs }));
      return { success: true, data: newPrefs };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      preferences,
      token,
      loading,
      login,
      loginDemoOffline,
      register,
      logout,
      refreshUser,
      updatePreferences,
      isAuthenticated: Boolean(user)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
