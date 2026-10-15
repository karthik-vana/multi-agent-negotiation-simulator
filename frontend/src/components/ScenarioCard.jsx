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
import { useSettings } from '../context/SettingsContext';

const iconMap = {
  ShoppingCart: ShoppingCart,
  Briefcase: Briefcase,
  PieChart: PieChart
};

const ScenarioCard = ({ scenario, isSelected, onSelect }) => {
  const { t } = useSettings();
  const IconComponent = iconMap[scenario.iconName] || Sparkles;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(scenario.id);
    }
  };

  const scenarioKey = scenario.id.replace(/-/g, '_');
  const scenarioName = t ? (t(`scenario_${scenarioKey}_name`) || scenario.name) : scenario.name;
  const scenarioCategory = t ? (t(`scenario_${scenarioKey}_category`) || scenario.category) : scenario.category;
  const scenarioDesc = t ? (t(`scenario_${scenarioKey}_desc`) || scenario.shortDescription) : scenario.shortDescription;

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
          <span className="scenario-category-pill">{scenarioCategory}</span>
          <div
            className={`scenario-select-indicator ${isSelected ? 'active' : ''}`}
            title={isSelected ? (t ? t('clickToDeselect') : 'Click to deselect scenario') : (t ? t('selectScenario') : 'Click to select')}
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
        <h3 className="scenario-card-title">{scenarioName}</h3>
        <p className="scenario-card-desc">{scenarioDesc}</p>

        {/* Metadata badges row: Agents & Estimated Duration */}
        <div className="scenario-meta-row">
          <div className="scenario-meta-chip">
            <Users size={14} className="meta-icon" />
            <span>
              <strong>{scenario.participantCount}</strong> {t ? t('participatingAgents') : 'Participating Agents'}
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
            <span className="scenario-levers-label">{t ? t('coreLevers') : 'Core Negotiation Levers:'}</span>
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
          title={isSelected ? (t ? t('clickToDeselect') : 'Click to deselect scenario') : (t ? t('selectScenario') : 'Click to select')}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(scenario.id);
          }}
        >
          {isSelected ? (
            <>
              <CheckCircle2 size={16} />
              <span>{t ? t('selectedContext') : 'Selected Context'}</span>
            </>
          ) : (
            <span>{t ? t('selectScenario') : 'Select Scenario'}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ScenarioCard;
