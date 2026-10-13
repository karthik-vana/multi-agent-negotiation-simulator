import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, CheckCircle2, Sliders, Sparkles, Layers } from 'lucide-react';
import { getAllScenarios } from '../data/scenarios';
import { useScenario } from '../context/ScenarioContext';
import ScenarioCard from '../components/ScenarioCard';

const ScenarioSelection = () => {
  const navigate = useNavigate();
  const scenarios = getAllScenarios();
  const { selectedScenarioId, selectedScenario, selectScenario } = useScenario();
  const [validationError, setValidationError] = useState('');

  const handleSelectScenario = (scenarioId) => {
    selectScenario(scenarioId);
    if (validationError) {
      setValidationError('');
    }
  };

  const handleContinue = () => {
    if (!selectedScenarioId) {
      setValidationError('Please select a negotiation scenario before proceeding to agent configuration.');
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

  return (
    <div className="scenario-selection-page">
      {/* Module Header Section */}
      <div className="scenario-page-header">
        <div className="scenario-stepper-badge">
          <Layers size={14} />
          <span>Step 1 of 3 • Scenario Selection</span>
        </div>
        <h1 className="scenario-page-title">Choose Your Negotiation Scenario</h1>
        <p className="scenario-page-subtitle">
          Select one of the three predefined negotiation templates below. The chosen scenario establishes the
          operational context, stakeholder objectives, and boundary constraints before you configure the participating
          AI agent personas.
        </p>
      </div>

      {/* Validation Warning Alert (if user tries to continue without a selection) */}
      {validationError && (
        <div className="scenario-alert scenario-alert-warning" role="alert">
          <AlertCircle size={18} className="alert-icon" />
          <div className="alert-content">
            <strong>Selection Required:</strong> {validationError}
          </div>
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
                <span className="status-label">Active Selection:</span>
                <span className="status-scenario-name">{selectedScenario.name}</span>
                <span className="status-participants-pill">
                  {selectedScenario.participantCount} Agents
                </span>
              </div>
            </div>
          ) : (
            <div className="status-unselected-box">
              <span className="status-dot" />
              <span>No scenario selected. Click any card above to choose your simulation context.</span>
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
            <span>Configure Agents</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScenarioSelection;
