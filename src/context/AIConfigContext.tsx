import React, { createContext, useContext, useState, useEffect } from 'react';
import { Settings, X, Eye, EyeOff } from 'lucide-react';
import { AIProviderConfig, APIStandard, OpenAIApiType } from '../types';
import { AI_CONFIG_STORAGE_KEY } from '../api';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  const apiStandardLabels: Record<APIStandard, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic (/v1/messages)',
    google: 'Google (/v1beta/models/{model}:generateContent)',
    ollama: 'Ollama (/api/chat)',
  };

  const openaiEndpointLabels: Record<OpenAIApiType, string> = {
    completions: '/v1/chat/completions',
    responses: '/v1/responses',
  };

  return (
    <AIConfigContext.Provider value={{ config, setConfig, isConfigured, isModalOpen, openModal, closeModal }}>
      {children}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-xl surface-panel p-6 space-y-5 text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3.5">
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />
                <h2 className="font-mono text-[11px] uppercase tracking-widest text-zinc-300">
                  {isPt ? 'Configurações de IA' : 'AI Configuration'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-[#16161a] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                  {isPt ? 'Padrão de API' : 'API Standard'}
                </label>
                <Select
                  value={draft.apiStandard}
                  onValueChange={(val) => {
                    if (val) {
                      setDraft({
                        ...draft,
                        apiStandard: val as APIStandard,
                        openaiApiType: draft.openaiApiType || 'completions',
                        maxTokens: draft.maxTokens || 2048,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-9 surface-recessed rounded-md px-3 text-xs text-zinc-100 hover:border-white/[0.14] focus-visible:ring-0">
                    <SelectValue>{apiStandardLabels[draft.apiStandard]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    sideOffset={6}
                    alignItemWithTrigger={false}
                    className="surface-panel rounded-lg p-1 text-zinc-200 ring-0"
                  >
                    <SelectItem value="openai" className="rounded-md text-xs text-zinc-300 hover:bg-[#16161a] hover:text-zinc-100 focus:bg-[#16161a] focus:text-zinc-100 data-[highlighted]:bg-[#16161a] data-[highlighted]:text-zinc-100 cursor-pointer">
                      OpenAI
                    </SelectItem>
                    <SelectItem value="anthropic" className="rounded-md text-xs text-zinc-300 hover:bg-[#16161a] hover:text-zinc-100 focus:bg-[#16161a] focus:text-zinc-100 data-[highlighted]:bg-[#16161a] data-[highlighted]:text-zinc-100 cursor-pointer">
                      Anthropic (/v1/messages)
                    </SelectItem>
                    <SelectItem value="google" className="rounded-md text-xs text-zinc-300 hover:bg-[#16161a] hover:text-zinc-100 focus:bg-[#16161a] focus:text-zinc-100 data-[highlighted]:bg-[#16161a] data-[highlighted]:text-zinc-100 cursor-pointer">
                      Google (/v1beta/models/{'{model}'}:generateContent)
                    </SelectItem>
                    <SelectItem value="ollama" className="rounded-md text-xs text-zinc-300 hover:bg-[#16161a] hover:text-zinc-100 focus:bg-[#16161a] focus:text-zinc-100 data-[highlighted]:bg-[#16161a] data-[highlighted]:text-zinc-100 cursor-pointer">
                      Ollama (/api/chat)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {draft.apiStandard === 'openai' && (
                <div className="space-y-1.5">
                  <label className="block font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                    {isPt ? 'Endpoint OpenAI' : 'OpenAI Endpoint'}
                  </label>
                  <Select
                    value={draft.openaiApiType || 'completions'}
                    onValueChange={(val) => {
                      if (val) setDraft({ ...draft, openaiApiType: val as OpenAIApiType });
                    }}
                  >
                    <SelectTrigger className="w-full h-9 surface-recessed rounded-md px-3 text-xs text-zinc-100 hover:border-white/[0.14] focus-visible:ring-0">
                      <SelectValue>{openaiEndpointLabels[draft.openaiApiType || 'completions']}</SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      align="start"
                      sideOffset={6}
                      alignItemWithTrigger={false}
                      className="surface-panel rounded-lg p-1 text-zinc-200 ring-0"
                    >
                      <SelectItem value="completions" className="rounded-md text-xs text-zinc-300 hover:bg-[#16161a] hover:text-zinc-100 focus:bg-[#16161a] focus:text-zinc-100 data-[highlighted]:bg-[#16161a] data-[highlighted]:text-zinc-100 cursor-pointer">
                        /v1/chat/completions
                      </SelectItem>
                      <SelectItem value="responses" className="rounded-md text-xs text-zinc-300 hover:bg-[#16161a] hover:text-zinc-100 focus:bg-[#16161a] focus:text-zinc-100 data-[highlighted]:bg-[#16161a] data-[highlighted]:text-zinc-100 cursor-pointer">
                        /v1/responses
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {draft.apiStandard === 'anthropic' && (
                <div className="space-y-1.5">
                  <label className="block font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                    max_tokens
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={draft.maxTokens ?? 2048}
                    onChange={(e) => setDraft({ ...draft, maxTokens: Number(e.target.value) })}
                    required
                    className="w-full surface-recessed rounded-md px-3 py-2 text-zinc-100 font-mono tabular-nums focus:outline-none focus:border-white/[0.14]"
                  />
                </div>
              )}

              {draft.apiStandard !== 'ollama' && (
                <div className="space-y-1.5">
                  <label className="block font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                    API Key
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={draft.apiKey || ''}
                      onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
                      placeholder={isPt ? 'Insira sua chave de API...' : 'Enter your API key...'}
                      className="w-full surface-recessed rounded-md pl-3 pr-9 py-2 text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none focus:border-white/[0.14]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2 p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                  {isPt ? 'URL Base' : 'Base URL'}
                </label>
                <input
                  type="text"
                  value={draft.baseUrl}
                  onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
                  required
                  placeholder="https://api.openai.com/v1"
                  className="w-full surface-recessed rounded-md px-3 py-2 text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none focus:border-white/[0.14]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                  {isPt ? 'Nome do Modelo' : 'Model Name'}
                </label>
                <input
                  type="text"
                  value={draft.model}
                  onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                  required
                  placeholder="gpt-4o-mini, claude-3-5-haiku-latest, gemini-2.5-flash, llama3.2..."
                  className="w-full surface-recessed rounded-md px-3 py-2 text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none focus:border-white/[0.14]"
                />
              </div>

              <p className="text-[11px] text-zinc-500 leading-relaxed">
                {isPt
                  ? 'Suas credenciais ficam salvas apenas no navegador (localStorage) e trafegam via proxy stateless sem registro em disco.'
                  : 'Your credentials are stored only in your browser (localStorage) and proxied statelessly without disk logging.'}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3.5 py-1.5 rounded-md surface-recessed text-zinc-300 hover:bg-[#16161a] transition-colors cursor-pointer"
                >
                  {isPt ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-medium transition-colors cursor-pointer"
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
