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
import FloatingActionMenu from './components/common/FloatingActionMenu';
import Sidebar from './components/common/Sidebar';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = window.location;
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-[#ea580c] selection:text-white">
      <Navbar
        onOpenAI={() => setIsAIOpen(true)}
        onTriggerScenario={handleTriggerScenario}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
      />

      {/* Live Demo Scenario Alert Banner */}
      {activeScenarioBanner && (
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/15 border-b border-orange-300 px-4 py-2.5 text-xs flex items-center justify-between text-orange-950 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#ea580c] text-white text-[10px] tracking-wider shadow-xs">
              DEMO SCENARIO ENGAGED
            </span>
            <strong>{activeScenarioBanner.title}:</strong>
            <span>{activeScenarioBanner.description}</span>
          </div>
          <button
            onClick={() => setActiveScenarioBanner(null)}
            className="text-[#ea580c] hover:text-[#9a3412] font-bold ml-4 underline text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Flex Layout with Left Sidebar */}
      <div className="flex-1 flex min-w-0">
        {!isAuthPage && (
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        )}

        {/* Main Routed Page Content */}
        <main className="flex-1 min-w-0 pb-16 overflow-y-auto">
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
      </div>

      {/* Floating Action Menu (Jitter-style Spring Speed Dial) */}
      <FloatingActionMenu onOpenAI={() => setIsAIOpen(true)} />

      {/* Floating AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        onApplyAction={(action, extractedData) => {
          if (action.includes('scenario')) {
            navigate('/simulator', { state: { prefill: extractedData } });
          } else if (action.includes('pre-fill') || action.includes('trip') || action.includes('Plan')) {
            navigate('/', { state: { prefill: extractedData } });
          }
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
