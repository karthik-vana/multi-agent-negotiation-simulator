import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Bot, MessageSquare, TrendingUp, Sparkles, Clock } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './PracticeMode.css';

const PracticeMode = () => {
  const navigate = useNavigate();
  const { t } = useSettings();

  return (
    <div className="practice-mode-page">
      <div className="practice-hero-card">
        <div className="practice-ambient-glow" />

        <div className="practice-content">
          {/* Badges & Status Indicators */}
          <div className="practice-badge-group">
            <span className="practice-dev-badge">
              <Sparkles size={13} />
              <span>UNDER DEVELOPMENT</span>
            </span>
            <span className="practice-status-pill">
              <span className="status-pulse-dot" />
              <span>Coming Soon</span>
            </span>
          </div>

          {/* Simple, attractive illustration icon */}
          <div className="practice-icon-wrapper">
            <GraduationCap size={40} />
          </div>

          {/* Heading */}
          <h1 className="practice-heading">
            {t ? (t('practiceTitle') || 'Practice Your Negotiation Skills') : 'Practice Your Negotiation Skills'}
          </h1>

          {/* Description */}
          <p className="practice-description">
            {t
              ? (t('practiceDesc') ||
                'Practice Mode will let you negotiate directly with an AI opponent, make offers and counteroffers, and improve your negotiation skills in realistic scenarios. This feature is currently under development.')
              : 'Practice Mode will let you negotiate directly with an AI opponent, make offers and counteroffers, and improve your negotiation skills in realistic scenarios. This feature is currently under development.'}
          </p>

          {/* Planned Features Preview (Clean & Non-functional) */}
          <div className="practice-features-preview">
            <div className="preview-feature-card">
              <div className="preview-feature-header">
                <Bot size={18} style={{ color: '#4f46e5' }} />
                <span>Interactive AI Opponent</span>
              </div>
              <p className="preview-feature-desc">
                Engage in dynamic, conversational bargaining against adaptive LLM personas.
              </p>
            </div>

            <div className="preview-feature-card">
              <div className="preview-feature-header">
                <MessageSquare size={18} style={{ color: '#0ea5e9' }} />
                <span>Offers & Counteroffers</span>
              </div>
              <p className="preview-feature-desc">
                Propose package deals, test concessions, and gauge immediate AI reactions.
              </p>
            </div>

            <div className="preview-feature-card">
              <div className="preview-feature-header">
                <TrendingUp size={18} style={{ color: '#10b981' }} />
                <span>Coaching & Feedback</span>
              </div>
              <p className="preview-feature-desc">
                Receive post-negotiation reviews, tactical scorecards, and strategy tips.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="practice-actions-row">
            <button
              type="button"
              className="btn-practice-back"
              onClick={() => navigate('/')}
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
            <button
              type="button"
              className="btn-practice-back"
              onClick={() => navigate('/scenarios')}
            >
              <Bot size={16} />
              <span>Explore Simulation Mode</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeMode;
