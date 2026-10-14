import React, { createContext, useContext, useState, useEffect } from 'react';
import { getScenarioById } from '../data/scenarios';

const STORAGE_KEY = 'mans_selected_scenario_id';

const ScenarioContext = createContext(null);

export const ScenarioProvider = ({ children }) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (selectedScenarioId) {
        sessionStorage.setItem(STORAGE_KEY, selectedScenarioId);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Unable to persist scenario selection to sessionStorage:', e);
    }
  }, [selectedScenarioId]);

  const selectScenario = (id) => {
    setSelectedScenarioId(id);
  };

  const clearSelection = () => {
    setSelectedScenarioId(null);
  };

  const selectedScenario = selectedScenarioId ? getScenarioById(selectedScenarioId) : null;

  return (
    <ScenarioContext.Provider
      value={{
        selectedScenarioId,
        selectedScenario,
        selectScenario,
        clearSelection
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
