import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import ScenarioSelection from './pages/ScenarioSelection';
import AgentConfigurationPlaceholder from './pages/AgentConfigurationPlaceholder';
import NegotiationArenaPlaceholder from './pages/NegotiationArenaPlaceholder';
import HistoryPlaceholder from './pages/HistoryPlaceholder';
import SettingsPlaceholder from './pages/SettingsPlaceholder';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import { ScenarioProvider } from './context/ScenarioContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <ScenarioProvider>
        <BrowserRouter>
          <Routes>
            {/* Public authentication routes */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />

            {/* Protected application routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="scenarios" element={<ScenarioSelection />} />
              <Route path="agents" element={<AgentConfigurationPlaceholder />} />
              <Route path="arena" element={<NegotiationArenaPlaceholder />} />
              <Route path="history" element={<HistoryPlaceholder />} />
              <Route path="settings" element={<SettingsPlaceholder />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ScenarioProvider>
    </AuthProvider>
  );
}

export default App;
