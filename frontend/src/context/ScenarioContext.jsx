import React, { createContext, useContext, useState, useEffect } from 'react';
import { getScenarioById } from '../data/scenarios';
import { validateNegotiationConfig } from '../utils/configurationValidator';

const SCENARIO_STORAGE_KEY = 'mans_selected_scenario_id';
const PERSONALITIES_STORAGE_KEY = 'mans_agent_personalities';

const ScenarioContext = createContext(null);

export const ScenarioProvider = ({ children }) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState(() => {
    try {
      return sessionStorage.getItem(SCENARIO_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const [agentPersonalities, setAgentPersonalities] = useState(() => {
    try {
      const saved = sessionStorage.getItem(PERSONALITIES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const selectedScenario = selectedScenarioId ? getScenarioById(selectedScenarioId) : null;

  // Sync selectedScenarioId with sessionStorage
  useEffect(() => {
    try {
      if (selectedScenarioId) {
        sessionStorage.setItem(SCENARIO_STORAGE_KEY, selectedScenarioId);
      } else {
        sessionStorage.removeItem(SCENARIO_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Unable to persist scenario selection to sessionStorage:', e);
    }
  }, [selectedScenarioId]);

  // Sync agentPersonalities with sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(PERSONALITIES_STORAGE_KEY, JSON.stringify(agentPersonalities));
    } catch (e) {
      console.warn('Unable to persist agent personalities to sessionStorage:', e);
    }
  }, [agentPersonalities]);

  // Initialize or re-align personalities when scenario changes
  const selectScenario = (id) => {
    setSelectedScenarioId(id);
    const scenario = getScenarioById(id);
    if (scenario && scenario.agents) {
      const initialPersonalities = {};
      scenario.agents.forEach((agent) => {
        initialPersonalities[agent.id] =
          agentPersonalities[agent.id] || agent.defaultPersonality;
      });
      setAgentPersonalities((prev) => ({ ...prev, ...initialPersonalities }));
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
      setAgentPersonalities((prev) => ({ ...prev, ...resetMap }));
    }
  };

  const clearSelection = () => {
    setSelectedScenarioId(null);
    setAgentPersonalities({});
  };

  const validateCurrentConfig = () => {
    return validateNegotiationConfig(selectedScenarioId || selectedScenario, agentPersonalities);
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
        validateCurrentConfig
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
