import { createContext, useContext } from 'react';
import type { AIProviderConfig } from '../types';

export interface AIConfigContextType {
  config: AIProviderConfig | null;
  setConfig: (config: AIProviderConfig | null) => void;
  isConfigured: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export function isAIConfigValid(cfg: AIProviderConfig | null): boolean {
  if (!cfg) return false;
  return Boolean(cfg.apiStandard && cfg.baseUrl?.trim() && cfg.model?.trim());
}

export const useAIConfig = (): AIConfigContextType => {
  const ctx = useContext(AIConfigContext);
  if (!ctx) throw new Error('useAIConfig must be used within AIConfigProvider');
  return ctx;
};
