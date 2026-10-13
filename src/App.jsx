import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import ScenariosPlaceholder from './pages/ScenariosPlaceholder';
import AgentConfigurationPlaceholder from './pages/AgentConfigurationPlaceholder';
import NegotiationArenaPlaceholder from './pages/NegotiationArenaPlaceholder';
import HistoryPlaceholder from './pages/HistoryPlaceholder';
import SettingsPlaceholder from './pages/SettingsPlaceholder';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="scenarios" element={<ScenariosPlaceholder />} />
          <Route path="agents" element={<AgentConfigurationPlaceholder />} />
          <Route path="arena" element={<NegotiationArenaPlaceholder />} />
          <Route path="history" element={<HistoryPlaceholder />} />
          <Route path="settings" element={<SettingsPlaceholder />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
