import React from 'react';
import { FileText } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const HistoryPlaceholder = () => {
  const { t } = useSettings();

  return (
    <div className="placeholder-box">
      <div className="placeholder-icon">
        <FileText size={28} />
      </div>
      <span className="placeholder-badge">{t ? t('history') : 'Milestone 4 Workspace'}</span>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
        {t ? t('history') : 'History & Reports'}
      </h2>
      <p style={{ maxWidth: '520px', margin: '0 auto', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
        {t ? t('headerSubtitleHistory') : 'Archived negotiation transcripts, concession curves, and outcome analytics.'}
      </p>
    </div>
  );
};

export default HistoryPlaceholder;
