import React from 'react';
import { Settings } from 'lucide-react';

const SettingsPlaceholder = () => {
  return (
    <div className="placeholder-box">
      <div className="placeholder-icon">
        <Settings size={28} />
      </div>
      <span className="placeholder-badge">System Settings</span>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
        Settings Placeholder
      </h2>
      <p style={{ maxWidth: '520px', margin: '0 auto', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
        This page is a placeholder for environment settings, LLM provider API credentials,
        timeout thresholds, and default simulation parameters.
      </p>
    </div>
  );
};

export default SettingsPlaceholder;
