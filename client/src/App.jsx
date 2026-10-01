import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/common/Navbar';
import TripPlannerPage from './pages/TripPlannerPage';
import ActiveMonitorPage from './pages/ActiveMonitorPage';
import WhatIfSimulatorPage from './pages/WhatIfSimulatorPage';
import VehiclesPage from './pages/VehiclesPage';
import CargoPage from './pages/CargoPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CoLoadingMarketplacePage from './pages/CoLoadingMarketplacePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AIAssistantDrawer from './components/ai-assistant/AIAssistantDrawer';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Authenticating RouteMind telemetry...
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function MainAppContent() {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [activeScenarioBanner, setActiveScenarioBanner] = useState(null);
  const navigate = useNavigate();

  const handleTriggerScenario = (scenario) => {
    setActiveScenarioBanner(scenario);
    // If it's Scenario 2 (Heavy Traffic) or Scenario 3 (Accident), direct them to Active Monitor
    if (scenario.id === 'scenario-heavy-traffic' || scenario.id === 'scenario-accident') {
      navigate('/monitor');
    } else if (scenario.id === 'scenario-restriction') {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Navbar
        onOpenAI={() => setIsAIOpen(true)}
        onTriggerScenario={handleTriggerScenario}
      />

      {/* Live Demo Scenario Alert Banner */}
      {activeScenarioBanner && (
        <div className="bg-gradient-to-r from-amber-600/30 via-indigo-600/30 to-rose-600/30 border-b border-amber-500/40 px-4 py-2 text-xs flex items-center justify-between text-amber-200">
          <div className="flex items-center gap-2">
            <span className="font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px]">
              DEMO SCENARIO ENGAGED
            </span>
            <strong>{activeScenarioBanner.title}:</strong>
            <span>{activeScenarioBanner.description}</span>
          </div>
          <button
            onClick={() => setActiveScenarioBanner(null)}
            className="text-amber-400 hover:text-white font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Routed Page Content */}
      <main className="flex-1 pb-12">
        <Routes>
          <Route path="/" element={<ProtectedRoute><TripPlannerPage /></ProtectedRoute>} />
          <Route path="/monitor" element={<ProtectedRoute><ActiveMonitorPage /></ProtectedRoute>} />
          <Route path="/simulator" element={<ProtectedRoute><WhatIfSimulatorPage /></ProtectedRoute>} />
          <Route path="/coloading" element={<Navigate to="/#coloading-feature" replace />} />
          <Route path="/vehicles" element={<ProtectedRoute><VehiclesPage /></ProtectedRoute>} />
          <Route path="/cargo" element={<ProtectedRoute><CargoPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Floating AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        onApplyAction={(action) => {
          if (action.includes('scenario')) navigate('/simulator');
          else if (action.includes('pre-fill')) navigate('/');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
