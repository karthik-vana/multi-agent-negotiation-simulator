import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, AlertCircle, CheckCircle2, Sliders, Sparkles, Layers, X } from 'lucide-react';
import { getAllScenarios } from '../data/scenarios';
import { useScenario } from '../context/ScenarioContext';
import { useSettings } from '../context/SettingsContext';
import { validateNegotiationConfig } from '../utils/configurationValidator';
import ScenarioCard from '../components/ScenarioCard';

const ScenarioSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scenarios = getAllScenarios();
  const { selectedScenarioId, selectedScenario, selectScenario, clearSelection } = useScenario();
  const { t } = useSettings();
  const [validationError, setValidationError] = useState('');

  // Handle incoming redirect error (e.g. attempting to navigate to configure agent without a scenario)
  useEffect(() => {
    if (location.state?.error) {
      setValidationError(location.state.error);
    }
  }, [location.state]);

  const handleSelectScenario = (scenarioId) => {
    // If already selected, clicking the card toggles it off back to unselected state
    if (selectedScenarioId === scenarioId) {
      clearSelection();
      setValidationError('');
    } else {
      selectScenario(scenarioId);
      if (validationError) {
        setValidationError('');
      }
    }
  };

  const handleContinue = () => {
    if (!selectedScenarioId) {
      setValidationError(
        t ? t('pleaseSelectScenario') : 'Please select a negotiation scenario before proceeding to agent configuration.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const validation = validateNegotiationConfig(selectedScenarioId);
    if (!validation.isValid) {
      setValidationError(
        t ? t('pleaseSelectScenario') : (validation.errors[0] || 'Please select a negotiation scenario before proceeding to agent configuration.')
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationError('');
    // Navigate with both URL search parameter and router navigation state
    navigate(`/agents?scenario=${selectedScenarioId}`, {
      state: {
        scenarioId: selectedScenarioId,
        scenario: selectedScenario
      }
    });
  };

  const getSelectedScenarioName = () => {
    if (!selectedScenario) return '';
    const key = selectedScenario.id.replace(/-/g, '_');
    return t ? (t(`scenario_${key}_name`) || selectedScenario.name) : selectedScenario.name;
  };

  return (
    <div className="scenario-selection-page">
      {/* Module Header Section */}
      <div className="scenario-page-header">
        <div className="scenario-stepper-badge">
          <Layers size={14} />
          <span>{t ? t('step1ScenarioSelection') : 'Step 1 of 3 • Scenario Selection'}</span>
        </div>
        <h1 className="scenario-page-title">{t ? t('chooseScenarioTitle') : 'Choose Your Negotiation Scenario'}</h1>
        <p className="scenario-page-subtitle">
          {t ? t('chooseScenarioSubtitle') : 'Select one of the three predefined negotiation templates below. The chosen scenario establishes the operational context, stakeholder objectives, and boundary constraints before you configure the participating AI agent personas.'}
        </p>
      </div>

      {/* Validation Warning Alert (if user tries to continue without a selection) */}
      {validationError && (
        <div className="scenario-alert scenario-alert-warning" role="alert" id="scenario-validation-alert">
          <AlertCircle size={18} className="alert-icon" />
          <div className="alert-content">
            <strong>{t ? t('selectionRequired') : 'Selection Required:'}</strong> {validationError}
          </div>
          <button
            type="button"
            className="alert-dismiss-btn"
            onClick={() => setValidationError('')}
            title="Dismiss message"
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 3 Scenario Cards Grid */}
      <div className="scenarios-grid" id="scenarios-grid">
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            isSelected={selectedScenarioId === scenario.id}
            onSelect={handleSelectScenario}
          />
        ))}
      </div>

      {/* Bottom Action & Continuity Bar */}
      <div className="scenario-action-bar">
        <div className="scenario-selection-status">
          {selectedScenario ? (
            <div className="status-selected-box">
              <CheckCircle2 size={18} style={{ color: selectedScenario.accentColor }} />
              <div>
                <span className="status-label">{t ? t('activeSelection') : 'Active Selection:'}</span>
                <span className="status-scenario-name">{getSelectedScenarioName()}</span>
                <span className="status-participants-pill">
                  {selectedScenario.participantCount} {t ? t('participatingAgents') : 'Agents'}
                </span>
              </div>
            </div>
          ) : (
            <div className="status-unselected-box">
              <span className="status-dot" />
              <span>{t ? t('noScenarioSelected') : 'No scenario selected. Click any card above to choose your simulation context.'}</span>
            </div>
          )}
        </div>

        <div className="scenario-cta-wrapper">
          <button
            type="button"
            id="continue-to-agent-config-btn"
            className={`btn-continue ${selectedScenarioId ? 'ready' : 'disabled'}`}
            onClick={handleContinue}
            title={
              selectedScenarioId
                ? 'Proceed to configure agents for this scenario'
                : 'Please select a scenario first'
            }
          >
            <span>{t ? t('continueToAgentConfig') : 'Configure Agents'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScenarioSelection;
