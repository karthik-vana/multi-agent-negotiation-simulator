import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import ScenarioSelection from './pages/ScenarioSelection';
import AgentConfiguration from './pages/AgentConfiguration';
import NegotiationArenaPlaceholder from './pages/NegotiationArenaPlaceholder';
import HistoryPlaceholder from './pages/HistoryPlaceholder';
import SettingsPlaceholder from './pages/SettingsPlaceholder';
import { ScenarioProvider } from './context/ScenarioContext';

function App() {
  return (
    <ScenarioProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="scenarios" element={<ScenarioSelection />} />
            <Route path="agents" element={<AgentConfiguration />} />
            <Route path="arena" element={<NegotiationArenaPlaceholder />} />
            <Route path="history" element={<HistoryPlaceholder />} />
            <Route path="settings" element={<SettingsPlaceholder />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ScenarioProvider>
  );
}

export default App;
