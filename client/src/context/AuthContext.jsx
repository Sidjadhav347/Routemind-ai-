import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, userApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('routemind_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      let activeToken = token;
      if (!activeToken) {
        try {
          const loginRes = await authApi.login({ email: 'demo@routemind.ai', password: 'password123' });
          if (loginRes.success && loginRes.data) {
            localStorage.setItem('routemind_token', loginRes.data.token);
            setToken(loginRes.data.token);
            setUser(loginRes.data.user);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Auto-login fallback:', err);
          setLoading(false);
          return;
        }
      }
      try {
        const res = await authApi.getMe();
        if (res.success && res.data) {
          setUser(res.data.user);
          setPreferences(res.data.preferences);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session expired or invalid, refreshing demo session:', err);
        try {
          const retryRes = await authApi.login({ email: 'demo@routemind.ai', password: 'password123' });
          if (retryRes.success && retryRes.data) {
            localStorage.setItem('routemind_token', retryRes.data.token);
            setToken(retryRes.data.token);
            setUser(retryRes.data.user);
          }
        } catch {
          logout();
        }
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.success && res.data) {
      localStorage.setItem('routemind_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error('Login failed');
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
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
      console.error('Failed to refresh user:', err);
    }
  };

  const updatePreferences = async (newPrefs) => {
    const res = await userApi.updatePreferences(newPrefs);
    if (res.success) {
      setPreferences(res.data);
    }
    return res;
  };

  return (
    <AuthContext.Provider value={{
      user,
      preferences,
      token,
      loading,
      login,
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
