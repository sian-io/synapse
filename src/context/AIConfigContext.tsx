import React, { useState, useEffect } from 'react';
import { AIProviderConfig } from '../types';
import { AI_CONFIG_STORAGE_KEY } from '../api';
import { AIConfigContext, isAIConfigValid } from './useAIConfig';
import { AIConfigModal } from '../components/AIConfigModal';

export const AIConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AIProviderConfig | null>(() => {
    try {
      const saved = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (config && isAIConfigValid(config)) {
      localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } else if (!config) {
      localStorage.removeItem(AI_CONFIG_STORAGE_KEY);
    }
  }, [config]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const isConfigured = isAIConfigValid(config);

  return (
    <AIConfigContext.Provider
      value={{ config, setConfig, isConfigured, isModalOpen, openModal, closeModal }}
    >
      {children}
      {isModalOpen && (
        <AIConfigModal config={config} onSaveConfig={setConfig} onClose={closeModal} />
      )}
    </AIConfigContext.Provider>
  );
};
