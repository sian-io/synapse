import { createContext, useContext } from 'react';
import type { AIProviderConfig } from '../types';
import { isAIConfigValid } from '../lib/inferenceRequest';

export { isAIConfigValid };

export interface AIConfigContextType {
  config: AIProviderConfig | null;
  setConfig: (config: AIProviderConfig | null) => void;
  isConfigured: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export const useAIConfig = (): AIConfigContextType => {
  const ctx = useContext(AIConfigContext);
  if (!ctx) throw new Error('useAIConfig must be used within AIConfigProvider');
  return ctx;
};
