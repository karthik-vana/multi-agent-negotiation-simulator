import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation } from '../utils/translations';

export const STORAGE_KEY = 'negotiator_settings';
export const PROFILE_KEY = 'negotiator_profile';

export const DEFAULT_SETTINGS = {
  preferences: {
    rememberWorkspace: true, // Remembers last selected scenario & agent configuration
    autoSaveDrafts: true,    // Saves incomplete negotiation configurations locally
  },
  appearance: {
    theme: 'light', // 'light' | 'dark' | 'system'
  },
  language: 'en', // 'en' | 'hi' | 'bn' | 'te' | 'ta' | 'mr'
};

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  // Load saved settings from localStorage, merging with defaults
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          preferences: {
            rememberWorkspace: parsed.preferences?.rememberWorkspace !== undefined
              ? parsed.preferences.rememberWorkspace
              : DEFAULT_SETTINGS.preferences.rememberWorkspace,
            autoSaveDrafts: parsed.preferences?.autoSaveDrafts !== undefined
              ? parsed.preferences.autoSaveDrafts
              : DEFAULT_SETTINGS.preferences.autoSaveDrafts,
          },
          appearance: {
            theme: parsed.appearance?.theme || DEFAULT_SETTINGS.appearance.theme,
          },
          language: parsed.language || DEFAULT_SETTINGS.language,
        };
      }
      // If legacy 'theme' key exists in localStorage, honor it
      const legacyTheme = localStorage.getItem('theme');
      if (legacyTheme && ['light', 'dark', 'system'].includes(legacyTheme)) {
        return {
          ...DEFAULT_SETTINGS,
          appearance: { theme: legacyTheme },
        };
      }
    } catch (e) {
      console.warn('Failed to parse negotiator_settings from localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Apply Theme to document.documentElement
  useEffect(() => {
    const applyTheme = () => {
      const themePref = settings.appearance?.theme || 'light';
      let effectiveTheme = themePref;

      if (themePref === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        effectiveTheme = prefersDark ? 'dark' : 'light';
      }

      document.documentElement.setAttribute('data-theme', effectiveTheme);
      localStorage.setItem('theme', effectiveTheme);
    };

    applyTheme();

    if (settings.appearance?.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.appearance?.theme]);

  // Sync lang attribute on html tag
  useEffect(() => {
    document.documentElement.setAttribute('lang', settings.language || 'en');
  }, [settings.language]);

  // Save updated settings to state and localStorage
  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  // Reset to default settings
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
  };

  // Translation helper function
  const t = (key) => getTranslation(settings.language, key);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        saveSettings,
        resetSettings,
        DEFAULT_SETTINGS,
        t,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
