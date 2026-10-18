import React, { createContext, useContext, useState, useEffect } from 'react';
import { Settings, X, Eye, EyeOff } from 'lucide-react';
import { AIProviderConfig, APIStandard, OpenAIApiType } from '../types';
import { AI_CONFIG_STORAGE_KEY } from '../api';
import { useLanguage } from '../i18n/LanguageContext';

const EMPTY_FORM_DRAFT: AIProviderConfig = {
  apiStandard: 'openai',
  openaiApiType: 'completions',
  maxTokens: 2048,
  apiKey: '',
  baseUrl: '',
  model: '',
};

interface AIConfigContextType {
  config: AIProviderConfig | null;
  setConfig: (config: AIProviderConfig | null) => void;
  isConfigured: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

export function isAIConfigValid(cfg: AIProviderConfig | null): boolean {
  if (!cfg) return false;
  return Boolean(cfg.apiStandard && cfg.baseUrl?.trim() && cfg.model?.trim());
}

export const AIConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const isPt = language === 'pt';

  const [config, setConfigState] = useState<AIProviderConfig | null>(() => {
    try {
      const saved = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<AIProviderConfig>(() =>
    config ? { ...EMPTY_FORM_DRAFT, ...config } : EMPTY_FORM_DRAFT
  );
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (config && isAIConfigValid(config)) {
      localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } else if (!config) {
      localStorage.removeItem(AI_CONFIG_STORAGE_KEY);
    }
  }, [config]);

  const setConfig = (next: AIProviderConfig | null) => {
    setConfigState(next);
  };

  const openModal = () => {
    setDraft(config ? { ...EMPTY_FORM_DRAFT, ...config } : EMPTY_FORM_DRAFT);
    setShowKey(false);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMaxTokens = Number(draft.maxTokens);
    const next: AIProviderConfig = {
      apiStandard: draft.apiStandard,
      ...(draft.apiStandard === 'openai'
        ? { openaiApiType: draft.openaiApiType || 'completions' }
        : {}),
      ...(draft.apiStandard === 'anthropic'
        ? { maxTokens: Number.isInteger(parsedMaxTokens) && parsedMaxTokens >= 1 ? parsedMaxTokens : 2048 }
        : {}),
      apiKey: draft.apiStandard === 'ollama' ? '' : draft.apiKey?.trim() || '',
      baseUrl: draft.baseUrl.trim(),
      model: draft.model.trim(),
    };
    if (!isAIConfigValid(next)) return;
    setConfig(next);
    setIsModalOpen(false);
  };

  const isConfigured = isAIConfigValid(config);

  return (
    <AIConfigContext.Provider value={{ config, setConfig, isConfigured, isModalOpen, openModal, closeModal }}>
      {children}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-5 text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm font-semibold tracking-wide uppercase font-mono">
                  {isPt ? 'Configurações de IA' : 'AI Configuration'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium text-zinc-300">
                  {isPt ? 'Padrão de API' : 'API Standard'}
                </label>
                <select
                  value={draft.apiStandard}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      apiStandard: e.target.value as APIStandard,
                      openaiApiType: draft.openaiApiType || 'completions',
                      maxTokens: draft.maxTokens || 2048,
                    })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-zinc-500"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic (/v1/messages)</option>
                  <option value="google">Google (/v1beta/models/{'{model}'}:generateContent)</option>
                  <option value="ollama">Ollama (/api/chat)</option>
                </select>
              </div>

              {draft.apiStandard === 'openai' && (
                <div className="space-y-1.5">
                  <label className="block font-medium text-zinc-300">
                    {isPt ? 'Endpoint OpenAI' : 'OpenAI Endpoint'}
                  </label>
                  <select
                    value={draft.openaiApiType || 'completions'}
                    onChange={(e) => setDraft({ ...draft, openaiApiType: e.target.value as OpenAIApiType })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-zinc-500"
                  >
                    <option value="completions">/v1/chat/completions</option>
                    <option value="responses">/v1/responses</option>
                  </select>
                </div>
              )}

              {draft.apiStandard === 'anthropic' && (
                <div className="space-y-1.5">
                  <label className="block font-medium text-zinc-300">
                    max_tokens
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={draft.maxTokens ?? 2048}
                    onChange={(e) => setDraft({ ...draft, maxTokens: Number(e.target.value) })}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono focus:outline-none focus:border-zinc-500"
                  />
                </div>
              )}

              {draft.apiStandard !== 'ollama' && (
                <div className="space-y-1.5">
                  <label className="block font-medium text-zinc-300">
                    API Key
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={draft.apiKey || ''}
                      onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
                      placeholder={isPt ? 'Insira sua chave de API...' : 'Enter your API key...'}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-3.5 pr-10 py-2.5 text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none focus:border-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block font-medium text-zinc-300">
                  {isPt ? 'URL Base' : 'Base URL'}
                </label>
                <input
                  type="text"
                  value={draft.baseUrl}
                  onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
                  required
                  placeholder="https://api.openai.com/v1"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-zinc-300">
                  {isPt ? 'Nome do Modelo' : 'Model Name'}
                </label>
                <input
                  type="text"
                  value={draft.model}
                  onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                  required
                  placeholder="gpt-4o-mini, claude-3-5-haiku-latest, gemini-2.5-flash, llama3.2..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none focus:border-zinc-500"
                />
              </div>

              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {isPt
                  ? 'Suas credenciais ficam salvas apenas no navegador (localStorage) e trafegam via proxy stateless sem registro em disco.'
                  : 'Your credentials are stored only in your browser (localStorage) and proxied statelessly without disk logging.'}
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {isPt ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold transition-colors cursor-pointer"
                >
                  {isPt ? 'Salvar' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AIConfigContext.Provider>
  );
};

export const useAIConfig = (): AIConfigContextType => {
  const ctx = useContext(AIConfigContext);
  if (!ctx) throw new Error('useAIConfig must be used within AIConfigProvider');
  return ctx;
};
