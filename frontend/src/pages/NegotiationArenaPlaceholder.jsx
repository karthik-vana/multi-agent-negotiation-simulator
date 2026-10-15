import React from 'react';
import { Swords } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const NegotiationArenaPlaceholder = () => {
  const { t } = useSettings();

  return (
    <div className="placeholder-box">
      <div className="placeholder-icon">
        <Swords size={28} />
      </div>
      <span className="placeholder-badge">{t ? t('arena') : 'Milestone 2 & 3 Workspace'}</span>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
        {t ? t('arena') : 'Negotiation Arena'}
      </h2>
      <p style={{ maxWidth: '520px', margin: '0 auto', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
        {t ? t('headerSubtitleArena') : 'Real-time multi-agent negotiation execution and turn-by-turn reasoning.'}
      </p>
    </div>
  );
};

export default NegotiationArenaPlaceholder;
