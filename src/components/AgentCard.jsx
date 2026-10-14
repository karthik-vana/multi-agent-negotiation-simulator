import React from 'react';
import {
  User,
  Target,
  ShieldAlert,
  Flame,
  Handshake,
  ShieldCheck,
  Info,
  Sparkles
} from 'lucide-react';
import {
  PERSONALITIES,
  PERSONALITY_DESCRIPTIONS
} from '../data/scenarios';

const personalityIcons = {
  [PERSONALITIES.AGGRESSIVE]: Flame,
  [PERSONALITIES.COLLABORATIVE]: Handshake,
  [PERSONALITIES.RISK_AVERSE]: ShieldCheck
};

const personalityColorStyles = {
  [PERSONALITIES.AGGRESSIVE]: {
    border: '#f87171',
    bg: '#fef2f2',
    text: '#b91c1c',
    glow: 'rgba(239, 68, 68, 0.15)'
  },
  [PERSONALITIES.COLLABORATIVE]: {
    border: '#818cf8',
    bg: '#eef2ff',
    text: '#4338ca',
    glow: 'rgba(79, 70, 229, 0.15)'
  },
  [PERSONALITIES.RISK_AVERSE]: {
    border: '#34d399',
    bg: '#ecfdf5',
    text: '#047857',
    glow: 'rgba(16, 185, 129, 0.15)'
  }
};

const AgentCard = ({ agent, currentPersonality, onPersonalityChange, scenarioAccent }) => {
  const activePersonality = currentPersonality || agent.defaultPersonality;
  const ActiveIcon = personalityIcons[activePersonality] || Sparkles;
  const activeColor = personalityColorStyles[activePersonality] || personalityColorStyles[PERSONALITIES.COLLABORATIVE];

  const isDefault = activePersonality === agent.defaultPersonality;

  return (
    <div
      className="agent-role-card"
      id={`agent-card-${agent.id}`}
      style={{
        '--agent-theme-border': activeColor.border,
        '--agent-theme-glow': activeColor.glow
      }}
    >
      {/* Card Header: Avatar, Name, and Stakeholder */}
      <div className="agent-card-header">
        <div
          className="agent-avatar"
          style={{
            backgroundColor: `${scenarioAccent || '#4f46e5'}18`,
            color: scenarioAccent || '#4f46e5',
            borderColor: `${scenarioAccent || '#4f46e5'}40`
          }}
        >
          {agent.avatarText || <User size={20} />}
        </div>

        <div className="agent-identity">
          <div className="agent-stakeholder-badge">{agent.stakeholder}</div>
          <h3 className="agent-name">{agent.name}</h3>
        </div>
      </div>

      {/* Role Description */}
      <p className="agent-role-desc">{agent.roleDescription}</p>

      {/* Primary Goal / Objective Section */}
      <div className="agent-section-box agent-goal-box">
        <div className="agent-section-title">
          <Target size={15} className="section-icon goal-icon" />
          <span>Primary Goal & Target</span>
        </div>
        <p className="agent-goal-text">{agent.primaryGoal}</p>
      </div>

      {/* Key Constraints Section */}
      <div className="agent-section-box agent-constraint-box">
        <div className="agent-section-title">
          <ShieldAlert size={15} className="section-icon constraint-icon" />
          <span>Key Negotiation Constraints</span>
        </div>
        <ul className="agent-constraints-list">
          {agent.keyConstraints?.map((constraint, idx) => (
            <li key={idx} className="agent-constraint-item">
              <span className="constraint-bullet" />
              <span>{constraint}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Personality Selection Controls */}
      <div className="agent-personality-control-block">
        <div className="personality-control-header">
          <span className="personality-label">Negotiation Personality:</span>
          {isDefault ? (
            <span className="default-pill">Default Preset</span>
          ) : (
            <span className="custom-pill">User Modified</span>
          )}
        </div>

        {/* 3 Personality Options Button Group */}
        <div className="personality-options-grid" role="radiogroup" aria-label="Negotiation Personality">
          {Object.values(PERSONALITIES).map((personality) => {
            const Icon = personalityIcons[personality];
            const isSelected = activePersonality === personality;
            const style = personalityColorStyles[personality];

            return (
              <button
                key={personality}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onPersonalityChange(agent.id, personality)}
                className={`personality-btn ${isSelected ? 'active' : ''}`}
                style={
                  isSelected
                    ? {
                        borderColor: style.border,
                        backgroundColor: style.bg,
                        color: style.text,
                        boxShadow: `0 0 0 2px ${style.border}, 0 4px 12px ${style.glow}`
                      }
                    : {}
                }
              >
                <Icon size={14} />
                <span>{personality}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Behavioral Description Preview */}
        <div
          className="personality-behavior-preview"
          style={{
            backgroundColor: activeColor.bg,
            borderColor: activeColor.border,
            color: activeColor.text
          }}
        >
          <div className="behavior-header">
            <ActiveIcon size={14} />
            <strong>{activePersonality} Strategy:</strong>
          </div>
          <p className="behavior-text">
            {PERSONALITY_DESCRIPTIONS[activePersonality]}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgentCard;
