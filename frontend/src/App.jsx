import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import ScenarioSelection from './pages/ScenarioSelection';
import AgentConfiguration from './pages/AgentConfiguration';
import NegotiationArenaPlaceholder from './pages/NegotiationArenaPlaceholder';
import HistoryPlaceholder from './pages/HistoryPlaceholder';
import Settings from './pages/Settings';
import PracticeMode from './pages/PracticeMode';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import { ScenarioProvider } from './context/ScenarioContext';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
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
                <Route path="simulation" element={<Navigate to="/scenarios" replace />} />
                <Route path="scenarios" element={<ScenarioSelection />} />
                <Route path="agents" element={<AgentConfiguration />} />
                <Route path="arena" element={<NegotiationArenaPlaceholder />} />
                <Route path="practice" element={<PracticeMode />} />
                <Route path="history" element={<HistoryPlaceholder />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ScenarioProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
