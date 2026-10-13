import React from 'react';
import { Swords } from 'lucide-react';

const NegotiationArenaPlaceholder = () => {
  return (
    <div className="placeholder-box">
      <div className="placeholder-icon">
        <Swords size={28} />
      </div>
      <span className="placeholder-badge">Milestone 2 & 3 Workspace</span>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
        Negotiation Arena Placeholder
      </h2>
      <p style={{ maxWidth: '520px', margin: '0 auto', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
        This page is a placeholder for the live chat-style Negotiation Arena.
        The turn management orchestrator, LLM agent reasoning displays, live stance indicators,
        and human interactive input controls will be integrated here.
      </p>
    </div>
  );
};

export default NegotiationArenaPlaceholder;
