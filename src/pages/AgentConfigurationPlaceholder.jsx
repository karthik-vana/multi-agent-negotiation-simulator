import React from 'react';
import { Users } from 'lucide-react';

const AgentConfigurationPlaceholder = () => {
  return (
    <div className="placeholder-box">
      <div className="placeholder-icon">
        <Users size={28} />
      </div>
      <span className="placeholder-badge">Task 4 Workspace</span>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
        Agent Configuration Module Placeholder
      </h2>
      <p style={{ maxWidth: '520px', margin: '0 auto', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
        This page is a placeholder for the Agent Configuration Module.
        Teammates assigned to Task 4 will build the reusable AgentCard components,
        personality selection dropdowns, and objective/constraint reviewers here.
      </p>
    </div>
  );
};

export default AgentConfigurationPlaceholder;
