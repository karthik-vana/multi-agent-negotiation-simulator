import React from 'react';
import {
  ShoppingCart,
  Briefcase,
  PieChart,
  Users,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

const iconMap = {
  ShoppingCart: ShoppingCart,
  Briefcase: Briefcase,
  PieChart: PieChart
};

const ScenarioCard = ({ scenario, isSelected, onSelect }) => {
  const IconComponent = iconMap[scenario.iconName] || Sparkles;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(scenario.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onSelect(scenario.id)}
      onKeyDown={handleKeyDown}
      className={`scenario-card ${isSelected ? 'selected' : ''}`}
      id={`scenario-card-${scenario.id}`}
      style={{
        '--card-accent': scenario.accentColor
      }}
    >
      {/* Top Banner with Category & Status Indicator */}
      <div className="scenario-card-top">
        <div
          className="scenario-icon-wrapper"
          style={{
            backgroundColor: `${scenario.accentColor}18`,
            color: scenario.accentColor
          }}
        >
          <IconComponent size={22} />
        </div>

        <div className="scenario-top-badges">
          <span className="scenario-category-pill">{scenario.category}</span>
          <div
            className={`scenario-select-indicator ${isSelected ? 'active' : ''}`}
            title={isSelected ? 'Selected Scenario' : 'Click to select'}
          >
            {isSelected ? (
              <CheckCircle2 size={18} className="indicator-check" />
            ) : (
              <span className="indicator-empty" />
            )}
          </div>
        </div>
      </div>

      {/* Title & Description */}
      <div className="scenario-card-body">
        <h3 className="scenario-card-title">{scenario.name}</h3>
        <p className="scenario-card-desc">{scenario.shortDescription}</p>

        {/* Metadata badges row: Agents & Estimated Duration */}
        <div className="scenario-meta-row">
          <div className="scenario-meta-chip">
            <Users size={14} className="meta-icon" />
            <span>
              <strong>{scenario.participantCount}</strong> Participating Agents
            </span>
          </div>

          <div className="scenario-meta-chip">
            <Clock size={14} className="meta-icon" />
            <span>{scenario.estimatedRounds}</span>
          </div>
        </div>

        {/* Key Negotiation Levers */}
        {scenario.keyLevers && scenario.keyLevers.length > 0 && (
          <div className="scenario-levers-section">
            <span className="scenario-levers-label">Core Negotiation Levers:</span>
            <div className="scenario-levers-list">
              {scenario.keyLevers.map((lever, idx) => (
                <span key={idx} className="scenario-lever-tag">
                  {lever}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Selection Button */}
      <div className="scenario-card-footer">
        <button
          type="button"
          className={`scenario-select-btn ${isSelected ? 'btn-selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(scenario.id);
          }}
        >
          {isSelected ? (
            <>
              <CheckCircle2 size={16} />
              <span>Selected Context</span>
            </>
          ) : (
            <span>Select Scenario</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ScenarioCard;
