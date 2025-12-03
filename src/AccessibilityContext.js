import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESSIBILITY_SETTINGS_KEY = "accessibility_settings";

const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    largeText: false,
    highContrast: false,
    reduceMotion: false,
    screenReader: false,
    boldText: false,
    colorBlindMode: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(ACCESSIBILITY_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.warn("Erro ao carregar configurações de acessibilidade:", error);
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(ACCESSIBILITY_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.warn("Erro ao salvar configurações de acessibilidade:", error);
    }
  };

  // Funções helper para obter valores baseados nas configurações
  const getFontSize = (baseSize) => {
    if (settings.largeText) {
      return baseSize * 1.3; // 30% maior
    }
    return baseSize;
  };

  const getFontWeight = (baseWeight) => {
    if (settings.boldText) {
      return '700';
    }
    return baseWeight || 'normal';
  };

  const getColors = () => {
    if (settings.highContrast || settings.colorBlindMode) {
      return {
        text: settings.colorBlindMode ? '#0F172A' : '#000000',
        background: settings.colorBlindMode ? '#F8FAFC' : '#FFFFFF',
        primary: settings.colorBlindMode ? '#2563EB' : '#0066CC',
        secondary: '#333333',
        border: settings.colorBlindMode ? '#94A3B8' : '#000000',
        mutedText: settings.colorBlindMode ? '#475569' : '#333333',
      };
    }
    return null; // Usa as cores padrão do tema
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.filter = settings.colorBlindMode ? "invert(0.92) hue-rotate(180deg)" : "";
      document.body.style.backgroundColor = settings.colorBlindMode ? "#111" : "";
    }
  }, [settings.colorBlindMode]);

  const getAnimationDuration = (baseDuration) => {
    if (settings.reduceMotion) {
      return 0; // Remove animações
    }
    return baseDuration;
  };

  const value = {
    settings,
    updateSetting,
    getFontSize,
    getFontWeight,
    getColors,
    getAnimationDuration,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};
