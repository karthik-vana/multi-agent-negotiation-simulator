import React from 'react';
import { Layers } from 'lucide-react';

const ScenariosPlaceholder = () => {
  return (
    <div className="placeholder-box">
      <div className="placeholder-icon">
        <Layers size={28} />
      </div>
      <span className="placeholder-badge">Task 2 Workspace</span>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
        Scenarios Module Placeholder
      </h2>
      <p style={{ maxWidth: '520px', margin: '0 auto', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
        This page is a placeholder for the Scenario Selection Module.
        Teammates assigned to Task 2 will implement the scenario selection cards,
        template definitions, and participant roster displays here.
      </p>
    </div>
  );
};

export default ScenariosPlaceholder;
