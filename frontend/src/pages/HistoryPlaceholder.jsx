import React from 'react';
import { FileText } from 'lucide-react';

const HistoryPlaceholder = () => {
  return (
    <div className="placeholder-box">
      <div className="placeholder-icon">
        <FileText size={28} />
      </div>
      <span className="placeholder-badge">Milestone 4 Workspace</span>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
        History & Reports Placeholder
      </h2>
      <p style={{ maxWidth: '520px', margin: '0 auto', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
        This page is a placeholder for archived negotiation transcripts,
        concession curves, objective satisfaction metrics, and downloadable summary reports.
      </p>
    </div>
  );
};

export default HistoryPlaceholder;
