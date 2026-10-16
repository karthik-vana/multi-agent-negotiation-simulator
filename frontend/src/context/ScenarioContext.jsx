import React, { createContext, useContext, useState, useEffect } from 'react';
import { getScenarioById } from '../data/scenarios';
import { validateNegotiationConfig } from '../utils/configurationValidator';

const SCENARIO_STORAGE_KEY = 'mans_selected_scenario_id';
const PERSONALITIES_STORAGE_KEY = 'mans_agent_personalities';
const WORKSPACE_SCENARIO_KEY = 'mans_workspace_scenario_id';
const WORKSPACE_PERSONALITIES_KEY = 'mans_workspace_agent_personalities';
const DRAFT_STORAGE_KEY = 'mans_simulation_draft';

// Helper to check user preferences from localStorage
const getSettingsPreferences = () => {
  try {
    const raw = localStorage.getItem('negotiator_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        rememberWorkspace: parsed.preferences?.rememberWorkspace !== false,
        autoSaveDrafts: parsed.preferences?.autoSaveDrafts !== false,
      };
    }
  } catch (e) {
    console.warn('Error reading preferences in ScenarioContext:', e);
  }
  return { rememberWorkspace: true, autoSaveDrafts: true };
};

const ScenarioContext = createContext(null);

export const ScenarioProvider = ({ children }) => {
  // Initialize scenario: check workspace persistence first if enabled, else sessionStorage
  const [selectedScenarioId, setSelectedScenarioId] = useState(() => {
    try {
      const { rememberWorkspace } = getSettingsPreferences();
      if (rememberWorkspace) {
        const persisted = localStorage.getItem(WORKSPACE_SCENARIO_KEY);
        if (persisted) return persisted;
      }
      return sessionStorage.getItem(SCENARIO_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  // Initialize personalities scoped strictly to the selected scenario
  const [agentPersonalities, setAgentPersonalities] = useState(() => {
    try {
      const { rememberWorkspace } = getSettingsPreferences();
      let raw = null;
      if (rememberWorkspace) {
        raw = localStorage.getItem(WORKSPACE_PERSONALITIES_KEY);
      }
      if (!raw) {
        raw = sessionStorage.getItem(PERSONALITIES_STORAGE_KEY);
      }
      if (raw) {
        const parsed = JSON.parse(raw);
        const scenario = selectedScenarioId ? getScenarioById(selectedScenarioId) : null;
        if (scenario && scenario.agents) {
          const validIds = new Set(scenario.agents.map((a) => a.id));
          const cleaned = {};
          scenario.agents.forEach((agent) => {
            cleaned[agent.id] = (validIds.has(agent.id) && parsed[agent.id]) || agent.defaultPersonality;
          });
          return cleaned;
        }
        return parsed;
      }
    } catch {
      return {};
    }
    return {};
  });

  const [lastDraftSaved, setLastDraftSaved] = useState(() => {
    try {
      const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
      return draft ? JSON.parse(draft)?.timestamp : null;
    } catch {
      return null;
    }
  });

  const selectedScenario = selectedScenarioId ? getScenarioById(selectedScenarioId) : null;

  // Sanitize agentPersonalities whenever scenario changes to ensure no rogue agents from previous scenarios leak in
  useEffect(() => {
    if (selectedScenario && selectedScenario.agents) {
      const validIds = new Set(selectedScenario.agents.map((a) => a.id));
      const currentKeys = Object.keys(agentPersonalities);
      const hasRogueKeys = currentKeys.some((k) => !validIds.has(k));
      const hasMissingKeys = selectedScenario.agents.some((a) => !agentPersonalities[a.id]);

      if (hasRogueKeys || hasMissingKeys) {
        const cleaned = {};
        selectedScenario.agents.forEach((agent) => {
          cleaned[agent.id] = agentPersonalities[agent.id] || agent.defaultPersonality;
        });
        setAgentPersonalities(cleaned);
      }
    }
  }, [selectedScenarioId]);

  // Sync selectedScenarioId with sessionStorage and localStorage (if rememberWorkspace is ON)
  useEffect(() => {
    try {
      const { rememberWorkspace } = getSettingsPreferences();
      if (selectedScenarioId) {
        sessionStorage.setItem(SCENARIO_STORAGE_KEY, selectedScenarioId);
        if (rememberWorkspace) {
          localStorage.setItem(WORKSPACE_SCENARIO_KEY, selectedScenarioId);
        } else {
          localStorage.removeItem(WORKSPACE_SCENARIO_KEY);
        }
      } else {
        sessionStorage.removeItem(SCENARIO_STORAGE_KEY);
        localStorage.removeItem(WORKSPACE_SCENARIO_KEY);
      }
    } catch (e) {
      console.warn('Unable to persist scenario selection:', e);
    }
  }, [selectedScenarioId]);

  // Sync agentPersonalities with sessionStorage and localStorage (if rememberWorkspace is ON)
  // and auto-save draft if autoSaveDrafts is ON
  useEffect(() => {
    try {
      const { rememberWorkspace, autoSaveDrafts } = getSettingsPreferences();
      const stringified = JSON.stringify(agentPersonalities);

      sessionStorage.setItem(PERSONALITIES_STORAGE_KEY, stringified);

      if (rememberWorkspace) {
        localStorage.setItem(WORKSPACE_PERSONALITIES_KEY, stringified);
      } else {
        localStorage.removeItem(WORKSPACE_PERSONALITIES_KEY);
      }

      // Auto-save draft if user has selected a scenario and configured personalities
      if (autoSaveDrafts && selectedScenarioId && Object.keys(agentPersonalities).length > 0) {
        const timestamp = new Date().toISOString();
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            scenarioId: selectedScenarioId,
            personalities: agentPersonalities,
            timestamp,
          })
        );
        setLastDraftSaved(timestamp);
      }
    } catch (e) {
      console.warn('Unable to persist agent personalities or draft:', e);
    }
  }, [agentPersonalities, selectedScenarioId]);

  // Initialize or re-align personalities when scenario changes (strictly scoped to the selected scenario)
  const selectScenario = (id) => {
    setSelectedScenarioId(id);
    const scenario = getScenarioById(id);
    if (scenario && scenario.agents) {
      const scenarioPersonalities = {};
      scenario.agents.forEach((agent) => {
        scenarioPersonalities[agent.id] = agent.defaultPersonality;
      });
      setAgentPersonalities(scenarioPersonalities);
    }
  };

  const updateAgentPersonality = (agentId, personality) => {
    setAgentPersonalities((prev) => ({
      ...prev,
      [agentId]: personality
    }));
  };

  const resetAgentPersonalities = () => {
    if (selectedScenario && selectedScenario.agents) {
      const resetMap = {};
      selectedScenario.agents.forEach((agent) => {
        resetMap[agent.id] = agent.defaultPersonality;
      });
      setAgentPersonalities(resetMap);
    }
  };

  const clearSelection = () => {
    setSelectedScenarioId(null);
    setAgentPersonalities({});
  };

  const validateCurrentConfig = () => {
    const scoped = {};
    if (selectedScenario && selectedScenario.agents) {
      selectedScenario.agents.forEach((a) => {
        scoped[a.id] = agentPersonalities[a.id] || a.defaultPersonality;
      });
    }
    return validateNegotiationConfig(selectedScenarioId || selectedScenario, scoped);
  };

  const discardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setLastDraftSaved(null);
    } catch (e) {
      console.warn('Unable to discard draft:', e);
    }
  };

  return (
    <ScenarioContext.Provider
      value={{
        selectedScenarioId,
        selectedScenario,
        agentPersonalities,
        selectScenario,
        updateAgentPersonality,
        resetAgentPersonalities,
        clearSelection,
        validateCurrentConfig,
        lastDraftSaved,
        discardDraft,
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
};

export const useScenario = () => {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error('useScenario must be used within a ScenarioProvider');
  }
  return context;
};

export default ScenarioContext;
