import React from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Users, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, Sliders } from 'lucide-react';
import { useScenario } from '../context/ScenarioContext';
import { getScenarioById } from '../data/scenarios';

const AgentConfigurationPlaceholder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { selectedScenario: contextScenario, selectedScenarioId } = useScenario();

  // Support reading from Context, Navigation State, or Query Parameters
  const paramScenarioId = searchParams.get('scenario');
  const stateScenario = location.state?.scenario;
  const activeScenario =
    contextScenario ||
    stateScenario ||
    (paramScenarioId ? getScenarioById(paramScenarioId) : null);

  return (
    <div className="agent-config-placeholder-container">
      {/* Back button to Scenario Selection */}
      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => navigate('/scenarios')}
          className="btn-back"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
            padding: '6px 0'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Scenario Selection</span>
        </button>
      </div>

      {activeScenario ? (
        <div className="content-card" style={{ borderLeft: `4px solid ${activeScenario.accentColor}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: `${activeScenario.accentColor}18`,
                  color: activeScenario.accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Sliders size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Active Scenario Context (Transferred from Task 2)
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {activeScenario.name}
                </h2>
              </div>
            </div>

            <span
              style={{
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-color)',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text-muted)'
              }}
            >
              Scenario ID: <code>{activeScenario.id}</code>
            </span>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '20px', lineHeight: 1.6 }}>
            {activeScenario.detailedDescription || activeScenario.shortDescription}
          </p>

          {/* Participant Roles to be configured in Task 4 */}
          <div style={{ background: 'var(--bg-surface-subtle)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '12px' }}>
              Stakeholder Agent Slots to be configured ({activeScenario.participantCount} Participants):
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {activeScenario.participants?.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {p.role}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Affiliation: {p.stakeholder}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Developer handover note */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534',
              fontSize: '0.84rem'
            }}
          >
            <CheckCircle2 size={16} />
            <span>
              <strong>Task 2 Selection Handover Complete:</strong> Scenario data was cleanly delivered to this page.
              Task 4 will implement personality selectors and objective sliders for the agents above.
            </span>
          </div>
        </div>
      ) : (
        <div className="scenario-alert scenario-alert-warning" style={{ marginBottom: '24px' }}>
          <AlertCircle size={20} className="alert-icon" />
          <div className="alert-content">
            <strong>No Scenario Selected:</strong> You navigated directly to Agent Configuration without choosing a
            negotiation scenario. Please select one of the three pre-built templates first.
            <div style={{ marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => navigate('/scenarios')}
                style={{
                  background: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Go to Scenario Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task 4 Placeholder Container */}
      <div className="placeholder-box">
        <div className="placeholder-icon">
          <Users size={28} />
        </div>
        <span className="placeholder-badge">Task 4 Workspace</span>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
          Agent Configuration Module
        </h2>
        <p style={{ maxWidth: '520px', margin: '0 auto', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          This page is designated for Task 4. Teammates will build the reusable AgentCard components,
          personality selection controls (Aggressive, Collaborative, Risk-Averse), and objective/constraint reviewers.
        </p>
      </div>
    </div>
  );
};

export default AgentConfigurationPlaceholder;
