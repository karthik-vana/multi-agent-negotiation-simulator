import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Sparkles, ArrowLeft, Bot } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const HistoryPlaceholder = () => {
  const navigate = useNavigate();
  const { t } = useSettings();

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="placeholder-box" style={{ padding: '60px 36px', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle Under Development Badge */}
        <div style={{ marginBottom: '16px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#d97706',
              border: '1px solid rgba(245, 158, 11, 0.28)',
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }}
          >
            <Sparkles size={13} />
            <span>{t ? t('underDevelopment') : 'Under Development'}</span>
          </span>
        </div>

        {/* Icon */}
        <div className="placeholder-icon" style={{ width: '64px', height: '64px', marginBottom: '20px' }}>
          <FileText size={32} />
        </div>

        {/* Heading */}
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px', letterSpacing: '-0.02em' }}>
          {t ? t('history') : 'History & Reports'}
        </h2>

        {/* Description */}
        <p
          style={{
            maxWidth: '580px',
            margin: '0 auto 28px',
            color: 'var(--text-muted)',
            fontSize: '0.96rem',
            lineHeight: 1.6,
          }}
        >
          {t ? t('historyUnderDevDesc') : "The History & Reports analytics engine is under development. Soon, you'll be able to review archived negotiation transcripts, concession curves, and comprehensive outcome analytics."}
        </p>

        {/* Navigation Action */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-practice-back"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={16} />
            <span>{t ? t('backToDashboard') : 'Back to Dashboard'}</span>
          </button>
          <button
            type="button"
            className="btn-practice-back"
            onClick={() => navigate('/scenarios')}
          >
            <Bot size={16} />
            <span>{t ? t('exploreSimulationMode') : 'Explore Simulation Mode'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryPlaceholder;
