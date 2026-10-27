import React, { useState, useMemo } from 'react';
import {
  Settings,
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
  RotateCcw,
  Info,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { AIProviderConfig, APIStandard, OpenAIApiType, ReasoningEffort } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { isAIConfigValid } from '../lib/inferenceRequest';
import {
  buildInferenceRequest,
  getEndpointParameterSupport,
  sanitizeConfigForEndpoint,
} from '../lib/inferenceRequest';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const EMPTY_FORM_DRAFT: AIProviderConfig = {
  apiStandard: 'openai',
  openaiApiType: 'completions',
  maxTokens: undefined,
  apiKey: '',
  baseUrl: '',
  model: '',
};

const PROVIDER_DEFAULTS: Record<APIStandard, { baseUrl: string; model: string; modelHint: string }> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    modelHint: 'gpt-4o-mini, gpt-4.1, o3-mini...',
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-7-sonnet-latest',
    modelHint: 'claude-3-7-sonnet-latest, claude-3-5-haiku-latest...',
  },
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.5-flash',
    modelHint: 'gemini-2.5-flash, gemini-2.5-pro...',
  },
  ollama: {
    baseUrl: 'http://localhost:11434/api/chat',
    model: 'llama3.2',
    modelHint: 'llama3.2, qwen2.5, deepseek-r1...',
  },
};

function parseOptionalNumber(val: string): number | undefined {
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : undefined;
}

function parseOptionalInt(val: string): number | undefined {
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  const num = Number(trimmed);
  return Number.isFinite(num) ? Math.round(num) : undefined;
}

function getInitialManualBodyText(initial: AIProviderConfig): string {
  if (!initial.manualEditEnabled || !initial.customBodyOverride) return '';
  if (initial.customUrlOverride) {
    return JSON.stringify(
      {
        url: initial.customUrlOverride,
        headers: initial.customHeadersOverride || {},
        body: initial.customBodyOverride,
      },
      null,
      2
    );
  }
  const defaults = PROVIDER_DEFAULTS[initial.apiStandard];
  const fallbackReq = buildInferenceRequest(
    {
      ...initial,
      baseUrl: initial.baseUrl?.trim() || defaults.baseUrl,
      model: initial.model?.trim() || defaults.model,
      manualEditEnabled: false,
    },
    {
      messages: [],
      maskApiKey: false,
    }
  );
  return JSON.stringify(
    {
      url: fallbackReq.url,
      headers: fallbackReq.headers,
      body: initial.customBodyOverride,
    },
    null,
    2
  );
}

interface AIConfigModalProps {
  config: AIProviderConfig | null;
  onSaveConfig: (next: AIProviderConfig) => void;
  onClose: () => void;
}

export const AIConfigModal: React.FC<AIConfigModalProps> = ({
  config,
  onSaveConfig,
  onClose,
}) => {
  const { language } = useLanguage();
  const isPt = language === 'pt';

  const initialDraft = config ? { ...EMPTY_FORM_DRAFT, ...config } : EMPTY_FORM_DRAFT;
  const [draft, setDraft] = useState<AIProviderConfig>(initialDraft);
  const [showKey, setShowKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualBodyText, setManualBodyText] = useState<string>(() => getInitialManualBodyText(initialDraft));
  const [manualJsonError, setManualJsonError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const previewConfig = useMemo<AIProviderConfig>(() => {
    const defaults = PROVIDER_DEFAULTS[draft.apiStandard];
    return {
      ...draft,
      baseUrl: draft.baseUrl?.trim() || defaults.baseUrl,
      model: draft.model?.trim() || defaults.model,
    };
  }, [draft]);

  const activePreviewRequest = useMemo(
    () =>
      buildInferenceRequest(
        {
          ...previewConfig,
          manualEditEnabled: false,
          customUrlOverride: undefined,
          customHeadersOverride: undefined,
          customBodyOverride: undefined,
        },
        {
          messages: [],
          maskApiKey: !showKey,
        }
      ),
    [previewConfig, showKey]
  );

  const activeUnmaskedPayload = useMemo(() => {
    const unmaskedReq = buildInferenceRequest(
      {
        ...previewConfig,
        manualEditEnabled: false,
        customUrlOverride: undefined,
        customHeadersOverride: undefined,
        customBodyOverride: undefined,
      },
      {
        messages: [],
        maskApiKey: false,
      }
    );
    return {
      url: unmaskedReq.url,
      headers: unmaskedReq.headers,
      body: unmaskedReq.body,
    };
  }, [previewConfig]);

  const activePreviewPayload = useMemo(
    () => ({
      url: activePreviewRequest.url,
      headers: activePreviewRequest.headers,
      body: activePreviewRequest.body,
    }),
    [activePreviewRequest]
  );

  const updateDraftFromMenu = (updater: (prev: AIProviderConfig) => AIProviderConfig) => {
    setDraft((prev) => updater(prev));
  };

  const handleToggleManualEdit = (enabled: boolean) => {
    if (enabled) {
      const defaults = PROVIDER_DEFAULTS[draft.apiStandard];
      const unmaskedReq = buildInferenceRequest(
        {
          ...draft,
          baseUrl: draft.baseUrl?.trim() || defaults.baseUrl,
          model: draft.model?.trim() || defaults.model,
          manualEditEnabled: false,
          customUrlOverride: undefined,
          customHeadersOverride: undefined,
          customBodyOverride: undefined,
        },
        {
          messages: [],
          maskApiKey: false,
        }
      );
      const initialPayload = {
        url: unmaskedReq.url,
        headers: unmaskedReq.headers,
        body: unmaskedReq.body,
      };
      setManualBodyText(JSON.stringify(initialPayload, null, 2));
      setManualJsonError(null);
      setDraft((prev) => ({
        ...prev,
        manualEditEnabled: true,
        customUrlOverride: unmaskedReq.url,
        customHeadersOverride: unmaskedReq.headers,
        customBodyOverride: unmaskedReq.body,
      }));
    } else {
      setManualBodyText('');
      setManualJsonError(null);
      setDraft((prev) => {
        const cleaned: AIProviderConfig = {
          ...prev,
          manualEditEnabled: false,
          customUrlOverride: undefined,
          customHeadersOverride: undefined,
          customBodyOverride: undefined,
        };
        return sanitizeConfigForEndpoint(cleaned);
      });
    }
  };

  const handleManualBodyChange = (rawText: string) => {
    setManualBodyText(rawText);
    try {
      const parsed = JSON.parse(rawText);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setManualJsonError(
          isPt
            ? 'O payload deve ser um objeto JSON válido contendo { "url", "headers", "body" }.'
            : 'Payload must be a valid JSON object containing { "url", "headers", "body" }.'
        );
        return;
      }

      const rawUrl = typeof parsed.url === 'string' ? parsed.url.trim() : '';
      if (!rawUrl) {
        setManualJsonError(
          isPt
            ? 'O JSON deve conter uma propriedade "url" (string não vazia).'
            : 'JSON must include a non-empty "url" string.'
        );
        return;
      }

      if (
        parsed.headers !== undefined &&
        (!parsed.headers || typeof parsed.headers !== 'object' || Array.isArray(parsed.headers))
      ) {
        setManualJsonError(
          isPt
            ? 'A propriedade "headers" deve ser um objeto JSON válido.'
            : 'The "headers" property must be a valid JSON object.'
        );
        return;
      }

      if (!parsed.body || typeof parsed.body !== 'object' || Array.isArray(parsed.body)) {
        setManualJsonError(
          isPt
            ? 'O JSON deve conter uma propriedade "body" (objeto JSON).'
            : 'JSON must include a valid "body" JSON object.'
        );
        return;
      }

      const normalizedHeaders: Record<string, string> = {};
      if (parsed.headers) {
        for (const [k, v] of Object.entries(parsed.headers as Record<string, unknown>)) {
          if (v !== undefined && v !== null) {
            normalizedHeaders[k] = String(v);
          }
        }
      }

      setManualJsonError(null);
      setDraft((prev) => ({
        ...prev,
        manualEditEnabled: true,
        customUrlOverride: rawUrl,
        customHeadersOverride: normalizedHeaders,
        customBodyOverride: parsed.body as Record<string, unknown>,
      }));
    } catch {
      setManualJsonError(
        isPt ? 'JSON inválido: corrija a sintaxe para aplicar.' : 'Invalid JSON: fix syntax to apply.'
      );
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      let inserted = false;
      try {
        inserted = Boolean(document.execCommand && document.execCommand('insertText', false, '\t'));
      } catch {
        inserted = false;
      }

      if (inserted) {
        if (textarea.value !== manualBodyText) {
          handleManualBodyChange(textarea.value);
        }
      } else {
        const val = textarea.value;
        const nextValue = val.substring(0, start) + '\t' + val.substring(end);
        handleManualBodyChange(nextValue);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
        });
      }
    }
  };

  const handleResetParameters = () => {
    updateDraftFromMenu((prev) => ({
      apiStandard: prev.apiStandard,
      openaiApiType: prev.openaiApiType || 'completions',
      apiKey: prev.apiKey,
      baseUrl: prev.baseUrl,
      model: prev.model,
      maxTokens: prev.apiStandard === 'anthropic' ? 2048 : undefined,
      manualEditEnabled: prev.manualEditEnabled,
      customUrlOverride: prev.customUrlOverride,
      customHeadersOverride: prev.customHeadersOverride,
      customBodyOverride: prev.customBodyOverride,
    }));
  };

  const handleCopyPreview = async () => {
    const textToCopy = draft.manualEditEnabled
      ? manualBodyText
      : JSON.stringify(activeUnmaskedPayload, null, 2);

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.manualEditEnabled && manualJsonError) return;
    const next = sanitizeConfigForEndpoint(draft);
    if (!isAIConfigValid(next)) return;
    onSaveConfig(next);
    onClose();
  };

  const support = getEndpointParameterSupport(
    draft.apiStandard,
    draft.openaiApiType || 'completions'
  );
  const providerDefaults = PROVIDER_DEFAULTS[draft.apiStandard];

  const apiStandardLabels: Record<APIStandard, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    ollama: 'Ollama',
  };

  const openaiEndpointLabels: Record<OpenAIApiType, string> = {
    completions: '/v1/chat/completions',
    responses: '/v1/responses',
  };

  const reasoningEffortLabels: Record<string, string> = {
    default: isPt ? 'Padrão' : 'Default',
    low: 'low',
    medium: 'medium',
    high: 'high',
  };

  const hasCustomParameters = Boolean(
    draft.temperature !== undefined ||
      (draft.apiStandard !== 'anthropic' && draft.maxTokens !== undefined) ||
      (draft.apiStandard === 'anthropic' && draft.maxTokens !== undefined && draft.maxTokens !== 2048) ||
      draft.topP !== undefined ||
      draft.topK !== undefined ||
      draft.frequencyPenalty !== undefined ||
      draft.presencePenalty !== undefined ||
      draft.reasoningEffort !== undefined ||
      draft.thinkingBudget !== undefined ||
      draft.numCtx !== undefined ||
      draft.repeatPenalty !== undefined
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-xl surface-panel text-zinc-100 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 bg-[#0f0f12]">
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight truncate">
              {isPt ? 'Configurações de IA & Inspetor de Payload' : 'AI Configuration & Payload Inspector'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isPt ? 'Fechar modal' : 'Close modal'}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-[#16161a] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave}>
          {/* 1px Hairline Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-white/[0.07]">
            {/* Left Column: Connection & Endpoint-Specific Generation Parameters */}
            <fieldset
              disabled={Boolean(draft.manualEditEnabled)}
              className={`lg:col-span-7 bg-[#0f0f12] p-5 sm:p-6 space-y-5 text-sm lg:h-[520px] overflow-y-auto transition-opacity duration-200 ${
                draft.manualEditEnabled ? 'opacity-35 pointer-events-none select-none' : ''
              }`}
            >
              {/* Section 01: Core Connection */}
              <div className="space-y-3.5">
                <div className="h-6 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">
                    {isPt ? 'Conexão & Modelo' : 'Connection & Model'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-400">
                      {isPt ? 'Padrão de API' : 'API Standard'}
                    </label>
                    <Select
                      value={draft.apiStandard}
                      onValueChange={(val) => {
                        if (val) {
                          const nextStandard = val as APIStandard;
                          updateDraftFromMenu((prev) =>
                            sanitizeConfigForEndpoint({
                              ...prev,
                              apiStandard: nextStandard,
                              openaiApiType: prev.openaiApiType || 'completions',
                              maxTokens:
                                nextStandard === 'anthropic'
                                  ? prev.maxTokens || 2048
                                  : prev.maxTokens,
                            })
                          );
                        }
                      }}
                    >
                      <SelectTrigger className="w-full h-10 surface-recessed rounded-md px-3.5 text-sm text-zinc-100 hover:border-white/[0.14] focus-visible:ring-0">
                        <SelectValue>{apiStandardLabels[draft.apiStandard]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        align="start"
                        sideOffset={6}
                        alignItemWithTrigger={false}
                        className="surface-panel rounded-lg p-1 text-zinc-200 ring-0"
                      >
                        <SelectItem value="openai" className="rounded-md text-sm cursor-pointer">
                          OpenAI
                        </SelectItem>
                        <SelectItem value="anthropic" className="rounded-md text-sm cursor-pointer">
                          Anthropic
                        </SelectItem>
                        <SelectItem value="google" className="rounded-md text-sm cursor-pointer">
                          Google
                        </SelectItem>
                        <SelectItem value="ollama" className="rounded-md text-sm cursor-pointer">
                          Ollama
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {draft.apiStandard === 'openai' ? (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-400">
                        {isPt ? 'Endpoint OpenAI' : 'OpenAI Endpoint'}
                      </label>
                      <Select
                        value={draft.openaiApiType || 'completions'}
                        onValueChange={(val) => {
                          if (val) {
                            updateDraftFromMenu((prev) =>
                              sanitizeConfigForEndpoint({
                                ...prev,
                                openaiApiType: val as OpenAIApiType,
                              })
                            );
                          }
                        }}
                      >
                        <SelectTrigger className="w-full h-10 surface-recessed rounded-md px-3.5 text-sm text-zinc-100 hover:border-white/[0.14] focus-visible:ring-0">
                          <SelectValue>
                            {openaiEndpointLabels[draft.openaiApiType || 'completions']}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent
                          align="start"
                          sideOffset={6}
                          alignItemWithTrigger={false}
                          className="surface-panel rounded-lg p-1 text-zinc-200 ring-0"
                        >
                          <SelectItem value="completions" className="rounded-md text-sm cursor-pointer">
                            /v1/chat/completions
                          </SelectItem>
                          <SelectItem value="responses" className="rounded-md text-sm cursor-pointer">
                            /v1/responses
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-zinc-400">
                        Endpoint
                      </label>
                      <div className="h-10 surface-recessed rounded-md px-3.5 flex items-center font-mono text-xs text-zinc-400 truncate">
                        {draft.apiStandard === 'anthropic' && '/v1/messages'}
                        {draft.apiStandard === 'google' && '/v1beta/models/{model}:generateContent'}
                        {draft.apiStandard === 'ollama' && '/api/chat'}
                      </div>
                    </div>
                  )}
                </div>

                {draft.apiStandard !== 'ollama' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-400">
                      API Key
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={draft.apiKey || ''}
                        onChange={(e) =>
                          updateDraftFromMenu((prev) => ({ ...prev, apiKey: e.target.value }))
                        }
                        placeholder={isPt ? 'Insira sua chave de API...' : 'Enter your API key...'}
                        className="w-full h-10 surface-recessed rounded-md pl-3.5 pr-10 text-sm text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none focus:border-white/[0.14]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        aria-label={showKey ? 'Hide API Key' : 'Show API Key'}
                        className="absolute right-2 p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                      >
                        {showKey ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-400">
                      {isPt ? 'URL Base' : 'Base URL'}
                    </label>
                    <input
                      type="text"
                      value={draft.baseUrl}
                      onChange={(e) =>
                        updateDraftFromMenu((prev) => ({ ...prev, baseUrl: e.target.value }))
                      }
                      required={!draft.manualEditEnabled}
                      placeholder={providerDefaults.baseUrl}
                      className="w-full h-10 surface-recessed rounded-md px-3.5 text-sm text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none focus:border-white/[0.14]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-400">
                      {isPt ? 'Nome do Modelo' : 'Model Name'}
                    </label>
                    <input
                      type="text"
                      value={draft.model}
                      onChange={(e) =>
                        updateDraftFromMenu((prev) => ({ ...prev, model: e.target.value }))
                      }
                      required={!draft.manualEditEnabled}
                      placeholder={providerDefaults.modelHint}
                      className="w-full h-10 surface-recessed rounded-md px-3.5 text-sm text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none focus:border-white/[0.14]"
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/[0.07]" />

              {/* Section 02: Strict Endpoint-Compatible Parameters */}
              <div className="space-y-3.5">
                <div className="h-6 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced((prev) => !prev)}
                    aria-expanded={showAdvanced}
                    className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    {showAdvanced ? (
                      <ChevronDown className="w-4 h-4 stroke-[1.75]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 stroke-[1.75]" />
                    )}
                    <span>{isPt ? 'Configurações Avançadas' : 'Advanced Settings'}</span>
                  </button>
                  {showAdvanced && hasCustomParameters && (
                    <button
                      type="button"
                      onClick={handleResetParameters}
                      className="h-6 px-2 rounded-md surface-recessed text-[11px] font-mono text-zinc-400 hover:text-zinc-100 hover:bg-[#16161a] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{isPt ? 'Resetar' : 'Reset'}</span>
                    </button>
                  )}
                </div>

                {showAdvanced && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {support.temperature && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="font-mono text-[11px] text-zinc-400">
                            temperature
                          </label>
                          <span className="font-mono text-[10px] text-zinc-600 tabular-nums">
                            0.0 – {support.maxTemperature.toFixed(1)}
                          </span>
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={support.maxTemperature}
                          step={0.1}
                          value={draft.temperature ?? ''}
                          onChange={(e) =>
                            updateDraftFromMenu((prev) => ({
                              ...prev,
                              temperature: parseOptionalNumber(e.target.value),
                            }))
                          }
                          placeholder={isPt ? 'Padrão' : 'Default'}
                          className="w-full h-10 surface-recessed rounded-md px-3.5 text-sm text-zinc-100 placeholder-zinc-600 font-mono tabular-nums focus:outline-none focus:border-white/[0.14]"
                        />
                      </div>
                    )}

                    {support.maxTokens && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="font-mono text-[11px] text-zinc-400 truncate">
                            {support.maxTokensKeyLabel}
                          </label>
                          <span className="font-mono text-[10px] text-zinc-600 tabular-nums">
                            {support.maxTokensRequired
                              ? isPt
                                ? 'obrigatório'
                                : 'required'
                              : '≥ 1'}
                          </span>
                        </div>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          required={!draft.manualEditEnabled && support.maxTokensRequired}
                          value={
                            support.maxTokensRequired
                              ? (draft.maxTokens ?? 2048)
                              : (draft.maxTokens ?? '')
                          }
                          onChange={(e) =>
                            updateDraftFromMenu((prev) => ({
                              ...prev,
                              maxTokens: parseOptionalInt(e.target.value),
                            }))
                          }
                          placeholder={support.maxTokensRequired ? '2048' : isPt ? 'Padrão' : 'Default'}
                          className="w-full h-10 surface-recessed rounded-md px-3.5 text-sm text-zinc-100 placeholder-zinc-600 font-mono tabular-nums focus:outline-none focus:border-white/[0.14]"
                        />
                      </div>
                    )}

                    {support.topP && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="font-mono text-[11px] text-zinc-400">
                            {draft.apiStandard === 'google' ? 'topP' : 'top_p'}
                          </label>
                          <span className="font-mono text-[10px] text-zinc-600 tabular-nums">
                            0.0 – 1.0
                          </span>
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={0.05}
                          value={draft.topP ?? ''}
                          onChange={(e) =>
                            updateDraftFromMenu((prev) => ({
                              ...prev,
                              topP: parseOptionalNumber(e.target.value),
                            }))
                          }
                          placeholder={isPt ? 'Padrão' : 'Default'}
                          className="w-full h-10 surface-recessed rounded-md px-3.5 text-sm text-zinc-100 placeholder-zinc-600 font-mono tabular-nums focus:outline-none focus:border-white/[0.14]"
                        />
                      </div>
                    )}

                    {support.topK && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="font-mono text-[11px] text-zinc-400">
                            {draft.apiStandard === 'google' ? 'topK' : 'top_k'}
                          </label>
                          <span className="font-mono text-[10px] text-zinc-600 tabular-nums">
                            ≥ 1
                          </span>
                        </div>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={draft.topK ?? ''}
                          onChange={(e) =>
                            updateDraftFromMenu((prev) => ({
                              ...prev,
                              topK: parseOptionalInt(e.target.value),
                            }))
                          }
                          placeholder={isPt ? 'Padrão' : 'Default'}
                          className="w-full h-10 surface-recessed rounded-md px-3.5 text-sm text-zinc-100 placeholder-zinc-600 font-mono tabular-nums focus:outline-none focus:border-white/[0.14]"
                        />
                      </div>
                    )}

                    {support.frequencyPenalty && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="font-mono text-[11px] text-zinc-400">
                            frequency_penalty
                          </label>
                          <span className="font-mono text-[10px] text-zinc-600 tabular-nums">
                            -2.0 – 2.0
                          </span>
                        </div>
                        <input
                          type="number"
                          min={-2}
                          max={2}
                          step={0.1}
                          value={draft.frequencyPenalty ?? ''}
                          onChange={(e) =>
                            updateDraftFromMenu((prev) => ({
                              ...prev,
                              frequencyPenalty: parseOptionalNumber(e.target.value),
                            }))
                          }
                          placeholder={isPt ? 'Padrão' : 'Default'}
                          className="w-full h-10 surface-recessed rounded-md px-3.5 text-sm text-zinc-100 placeholder-zinc-600 font-mono tabular-nums focus:outline-none focus:border-white/[0.14]"
                        />
                      </div>
                    )}

                    {support.presencePenalty && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="font-mono text-[11px] text-zinc-400">
                            presence_penalty
                          </label>
                          <span className="font-mono text-[10px] text-zinc-600 tabular-nums">
                            -2.0 – 2.0
                          </span>
                        </div>
                        <input
                          type="number"
                          min={-2}
                          max={2}
                          step={0.1}
                          value={draft.presencePenalty ?? ''}
                          onChange={(e) =>
                            updateDraftFromMenu((prev) => ({
                              ...prev,
                              presencePenalty: parseOptionalNumber(e.target.value),
                            }))
                          }
                          placeholder={isPt ? 'Padrão' : 'Default'}
                          className="w-full h-10 surface-recessed rounded-md px-3.5 text-sm text-zinc-100 placeholder-zinc-600 font-mono tabular-nums focus:outline-none focus:border-white/[0.14]"
                        />
                      </div>
                    )}

                    {support.reasoningEffort && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="font-mono text-[11px] text-zinc-400">
                            {draft.openaiApiType === 'responses'
                              ? 'reasoning.effort'
                              : 'reasoning_effort'}
                          </label>
                          <span className="font-mono text-[10px] text-zinc-600">o1/o3/gpt-5</span>
                        </div>
                        <Select
                          value={draft.reasoningEffort || 'default'}
                          onValueChange={(val) => {
                            updateDraftFromMenu((prev) => ({
                              ...prev,
                              reasoningEffort:
                                !val || val === 'default'
                                  ? undefined
                                  : (val as ReasoningEffort),
                            }));
                          }}
                        >
                          <SelectTrigger className="w-full h-10 surface-recessed rounded-md px-3.5 text-sm text-zinc-100 font-mono hover:border-white/[0.14] focus-visible:ring-0">
                            <SelectValue>
                              {reasoningEffortLabels[draft.reasoningEffort || 'default']}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent
                            align="start"
                            sideOffset={6}
                            alignItemWithTrigger={false}
                            className="surface-panel rounded-lg p-1 text-zinc-200 ring-0"
                          >
                            <SelectItem value="default" className="rounded-md text-xs font-mono cursor-pointer">
                              {reasoningEffortLabels.default}
                            </SelectItem>
                            <SelectItem value="low" className="rounded-md text-xs font-mono cursor-pointer">
                              low
                            </SelectItem>
                            <SelectItem value="medium" className="rounded-md text-xs font-mono cursor-pointer">
                              medium
                            </SelectItem>
                            <SelectItem value="high" className="rounded-md text-xs font-mono cursor-pointer">
                              high
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {support.thinkingBudget && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="font-mono text-[11px] text-zinc-400">
                            {draft.apiStandard === 'anthropic'
                              ? 'thinking.budget_tokens'
                              : 'thinkingBudget'}
                          </label>
                          <span className="font-mono text-[10px] text-zinc-600 tabular-nums">
                            {draft.apiStandard === 'anthropic' ? '≥ 1024' : '≥ 0'}
                          </span>
                        </div>
                        <input
                          type="number"
                          min={draft.apiStandard === 'anthropic' ? 1024 : 0}
                          step={256}
                          value={draft.thinkingBudget ?? ''}
                          onChange={(e) =>
                            updateDraftFromMenu((prev) => ({
                              ...prev,
                              thinkingBudget: parseOptionalInt(e.target.value),
                            }))
                          }
                          placeholder={isPt ? 'Padrão' : 'Default'}
                          className="w-full h-10 surface-recessed rounded-md px-3.5 text-sm text-zinc-100 placeholder-zinc-600 font-mono tabular-nums focus:outline-none focus:border-white/[0.14]"
                        />
                      </div>
                    )}

                    {support.numCtx && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="font-mono text-[11px] text-zinc-400">
                            num_ctx
                          </label>
                          <span className="font-mono text-[10px] text-zinc-600 tabular-nums">
                            ≥ 256
                          </span>
                        </div>
                        <input
                          type="number"
                          min={256}
                          step={512}
                          value={draft.numCtx ?? ''}
                          onChange={(e) =>
                            updateDraftFromMenu((prev) => ({
                              ...prev,
                              numCtx: parseOptionalInt(e.target.value),
                            }))
                          }
                          placeholder="4096"
                          className="w-full h-10 surface-recessed rounded-md px-3.5 text-sm text-zinc-100 placeholder-zinc-600 font-mono tabular-nums focus:outline-none focus:border-white/[0.14]"
                        />
                      </div>
                    )}

                    {support.repeatPenalty && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="font-mono text-[11px] text-zinc-400">
                            repeat_penalty
                          </label>
                          <span className="font-mono text-[10px] text-zinc-600 tabular-nums">
                            0.0 – 2.0
                          </span>
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={2}
                          step={0.05}
                          value={draft.repeatPenalty ?? ''}
                          onChange={(e) =>
                            updateDraftFromMenu((prev) => ({
                              ...prev,
                              repeatPenalty: parseOptionalNumber(e.target.value),
                            }))
                          }
                          placeholder="1.1"
                          className="w-full h-10 surface-recessed rounded-md px-3.5 text-sm text-zinc-100 placeholder-zinc-600 font-mono tabular-nums focus:outline-none focus:border-white/[0.14]"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </fieldset>

            {/* Right Column: Live Request Preview & Manual Override */}
            <div className="lg:col-span-5 bg-[#0f0f12] p-5 sm:p-6 flex flex-col justify-between gap-3.5 lg:h-[520px] overflow-hidden">
              <div className="space-y-3.5 flex-1 flex flex-col min-h-0">
                <div className="h-6 flex items-center justify-between gap-2 shrink-0">
                  <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">
                    {isPt ? 'Preview da Requisição' : 'Request Preview'}
                  </h3>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      onClick={() => handleToggleManualEdit(!draft.manualEditEnabled)}
                      className="font-mono text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer select-none"
                    >
                      {isPt ? 'Edição Manual' : 'Manual Edit'}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(draft.manualEditEnabled)}
                      aria-label={isPt ? 'Edição Manual' : 'Manual Edit'}
                      onClick={() => handleToggleManualEdit(!draft.manualEditEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                        draft.manualEditEnabled
                          ? 'bg-zinc-100'
                          : 'bg-zinc-800 border border-white/[0.1]'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform ${
                          draft.manualEditEnabled
                            ? 'translate-x-4 bg-zinc-950'
                            : 'translate-x-0.5 bg-zinc-400'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Unified JSON Request Surface */}
                <div className="flex-1 min-h-[300px] lg:min-h-0 surface-recessed rounded-lg font-mono text-[11px] leading-relaxed flex flex-col overflow-hidden">
                  <div className="h-7 shrink-0 flex items-center justify-end px-1">
                    <button
                      type="button"
                      onClick={handleCopyPreview}
                      title={isPt ? 'Copiar JSON' : 'Copy JSON'}
                      aria-label={isPt ? 'Copiar JSON' : 'Copy JSON'}
                      className="h-6 w-6 rounded-md text-zinc-500 hover:text-zinc-100 hover:bg-[#16161a] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-zinc-100" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex-1 min-h-0 px-3.5 pb-3.5 overflow-x-auto overflow-y-auto flex flex-col gap-1.5">
                    {draft.manualEditEnabled ? (
                      <textarea
                        value={manualBodyText}
                        onChange={(e) => handleManualBodyChange(e.target.value)}
                        onKeyDown={handleTextareaKeyDown}
                        spellCheck={false}
                        wrap="off"
                        className="flex-1 w-full bg-transparent text-zinc-100 font-mono text-[11px] leading-relaxed resize-none focus:outline-none whitespace-pre overflow-x-auto [tab-size:2]"
                      />
                    ) : (
                      <pre className="text-zinc-200 whitespace-pre select-all">
                        {JSON.stringify(activePreviewPayload, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>

                {draft.manualEditEnabled && manualJsonError && (
                  <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-md bg-red-950/40 border border-red-500/30 text-red-400 font-mono text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400 stroke-[1.75]" />
                    <span className="truncate">{manualJsonError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] px-5 py-3.5 bg-[#0f0f12] text-xs">
            <TooltipProvider delay={100}>
              <Tooltip>
                <TooltipTrigger
                  type="button"
                  aria-label={isPt ? 'Informação de privacidade das credenciais' : 'Credentials privacy information'}
                  className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-[#16161a] transition-colors cursor-default flex items-center justify-center"
                >
                  <Info className="w-4 h-4 stroke-[1.75]" />
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  sideOffset={8}
                  className="max-w-sm font-mono text-[11px] leading-relaxed"
                >
                  {isPt
                    ? 'Suas credenciais ficam salvas apenas no navegador (localStorage) e trafegam via proxy stateless sem registro em disco.'
                    : 'Your credentials are stored only in your browser (localStorage) and proxied statelessly without disk logging.'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-md surface-recessed text-zinc-300 hover:bg-[#16161a] text-[13px] font-medium transition-colors cursor-pointer"
              >
                {isPt ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={Boolean(draft.manualEditEnabled && manualJsonError)}
                className="h-9 px-4 rounded-md bg-zinc-100 hover:bg-white disabled:opacity-40 disabled:pointer-events-none text-zinc-950 text-[13px] font-medium transition-colors cursor-pointer"
              >
                {isPt ? 'Salvar Configuração' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
