import { AIProviderConfig, APIStandard, OpenAIApiType, ReasoningEffort } from '../types';

export type InferenceProtocol =
  | 'openai-completions'
  | 'openai-responses'
  | 'anthropic'
  | 'google'
  | 'ollama';

export interface EndpointParameterSupport {
  temperature: boolean;
  maxTemperature: number;
  maxTokens: boolean;
  maxTokensRequired: boolean;
  maxTokensKeyLabel: string;
  topP: boolean;
  topK: boolean;
  frequencyPenalty: boolean;
  presencePenalty: boolean;
  reasoningEffort: boolean;
  thinkingBudget: boolean;
  numCtx: boolean;
  repeatPenalty: boolean;
}

export interface BuildInferenceOptions {
  systemInstruction?: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  jsonMode?: boolean;
  maskApiKey?: boolean;
  preserveOverrideMessages?: boolean;
}

export interface BuiltInferenceRequest {
  method: 'POST';
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  protocol: InferenceProtocol;
}

const VALID_REASONING_EFFORTS: ReasoningEffort[] = ['low', 'medium', 'high'];

function isFiniteNum(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val);
}

function isPosInt(val: unknown): val is number {
  return typeof val === 'number' && Number.isInteger(val) && val >= 1;
}

export function isAIConfigValid(cfg: AIProviderConfig | null | undefined): cfg is AIProviderConfig {
  if (!cfg) return false;
  if (cfg.manualEditEnabled) {
    return Boolean(
      typeof cfg.customUrlOverride === 'string' &&
        cfg.customUrlOverride.trim().length > 0 &&
        cfg.customBodyOverride &&
        typeof cfg.customBodyOverride === 'object' &&
        !Array.isArray(cfg.customBodyOverride)
    );
  }
  return Boolean(cfg.apiStandard && cfg.baseUrl?.trim() && cfg.model?.trim());
}

export function getEndpointParameterSupport(
  apiStandard: APIStandard,
  openaiApiType: OpenAIApiType = 'completions'
): EndpointParameterSupport {
  if (apiStandard === 'anthropic') {
    return {
      temperature: true,
      maxTemperature: 1,
      maxTokens: true,
      maxTokensRequired: true,
      maxTokensKeyLabel: 'max_tokens',
      topP: true,
      topK: true,
      frequencyPenalty: false,
      presencePenalty: false,
      reasoningEffort: false,
      thinkingBudget: true,
      numCtx: false,
      repeatPenalty: false,
    };
  }

  if (apiStandard === 'google') {
    return {
      temperature: true,
      maxTemperature: 2,
      maxTokens: true,
      maxTokensRequired: false,
      maxTokensKeyLabel: 'maxOutputTokens',
      topP: true,
      topK: true,
      frequencyPenalty: false,
      presencePenalty: false,
      reasoningEffort: false,
      thinkingBudget: true,
      numCtx: false,
      repeatPenalty: false,
    };
  }

  if (apiStandard === 'ollama') {
    return {
      temperature: true,
      maxTemperature: 2,
      maxTokens: true,
      maxTokensRequired: false,
      maxTokensKeyLabel: 'num_predict',
      topP: true,
      topK: true,
      frequencyPenalty: false,
      presencePenalty: false,
      reasoningEffort: false,
      thinkingBudget: false,
      numCtx: true,
      repeatPenalty: true,
    };
  }

  // OpenAI
  if (openaiApiType === 'responses') {
    return {
      temperature: true,
      maxTemperature: 2,
      maxTokens: true,
      maxTokensRequired: false,
      maxTokensKeyLabel: 'max_output_tokens',
      topP: true,
      topK: false,
      frequencyPenalty: false,
      presencePenalty: false,
      reasoningEffort: true,
      thinkingBudget: false,
      numCtx: false,
      repeatPenalty: false,
    };
  }

  return {
    temperature: true,
    maxTemperature: 2,
    maxTokens: true,
    maxTokensRequired: false,
    maxTokensKeyLabel: 'max_completion_tokens',
    topP: true,
    topK: false,
    frequencyPenalty: true,
    presencePenalty: true,
    reasoningEffort: true,
    thinkingBudget: false,
    numCtx: false,
    repeatPenalty: false,
  };
}

export function sanitizeConfigForEndpoint(cfg: AIProviderConfig): AIProviderConfig {
  const openaiApiType: OpenAIApiType = cfg.openaiApiType || 'completions';
  const support = getEndpointParameterSupport(cfg.apiStandard, openaiApiType);

  const sanitized: AIProviderConfig = {
    apiStandard: cfg.apiStandard,
    ...(cfg.apiStandard === 'openai' ? { openaiApiType } : {}),
    apiKey: cfg.apiStandard === 'ollama' ? '' : cfg.apiKey?.trim() || '',
    baseUrl: cfg.baseUrl?.trim() || '',
    model: cfg.model?.trim() || '',
  };

  if (support.maxTokens) {
    if (support.maxTokensRequired) {
      sanitized.maxTokens = isPosInt(cfg.maxTokens) ? cfg.maxTokens : 2048;
    } else if (isPosInt(cfg.maxTokens)) {
      sanitized.maxTokens = cfg.maxTokens;
    }
  }

  if (support.temperature && isFiniteNum(cfg.temperature)) {
    const clamped = Math.max(0, Math.min(support.maxTemperature, cfg.temperature));
    sanitized.temperature = Number(clamped.toFixed(2));
  }

  if (support.topP && isFiniteNum(cfg.topP)) {
    const clamped = Math.max(0, Math.min(1, cfg.topP));
    sanitized.topP = Number(clamped.toFixed(2));
  }

  if (support.topK && isPosInt(cfg.topK)) {
    sanitized.topK = cfg.topK;
  }

  if (support.frequencyPenalty && isFiniteNum(cfg.frequencyPenalty)) {
    const clamped = Math.max(-2, Math.min(2, cfg.frequencyPenalty));
    sanitized.frequencyPenalty = Number(clamped.toFixed(2));
  }

  if (support.presencePenalty && isFiniteNum(cfg.presencePenalty)) {
    const clamped = Math.max(-2, Math.min(2, cfg.presencePenalty));
    sanitized.presencePenalty = Number(clamped.toFixed(2));
  }

  if (
    support.reasoningEffort &&
    cfg.reasoningEffort &&
    VALID_REASONING_EFFORTS.includes(cfg.reasoningEffort)
  ) {
    sanitized.reasoningEffort = cfg.reasoningEffort;
  }

  if (support.thinkingBudget && isFiniteNum(cfg.thinkingBudget) && cfg.thinkingBudget >= 0) {
    if (cfg.apiStandard === 'anthropic') {
      if (cfg.thinkingBudget >= 1) {
        sanitized.thinkingBudget = Math.max(1024, Math.round(cfg.thinkingBudget));
        sanitized.maxTokens = Math.max(sanitized.maxTokens ?? 2048, sanitized.thinkingBudget + 1024);
      }
    } else {
      sanitized.thinkingBudget = Math.round(cfg.thinkingBudget);
    }
  }

  if (support.numCtx && isPosInt(cfg.numCtx)) {
    sanitized.numCtx = cfg.numCtx;
  }

  if (support.repeatPenalty && isFiniteNum(cfg.repeatPenalty)) {
    sanitized.repeatPenalty = Number(cfg.repeatPenalty.toFixed(2));
  }

  if (
    cfg.manualEditEnabled &&
    cfg.customBodyOverride &&
    typeof cfg.customBodyOverride === 'object' &&
    !Array.isArray(cfg.customBodyOverride)
  ) {
    sanitized.manualEditEnabled = true;
    if (typeof cfg.customUrlOverride === 'string' && cfg.customUrlOverride.trim()) {
      sanitized.customUrlOverride = cfg.customUrlOverride.trim();
    }
    if (
      cfg.customHeadersOverride &&
      typeof cfg.customHeadersOverride === 'object' &&
      !Array.isArray(cfg.customHeadersOverride)
    ) {
      const cleanHeaders: Record<string, string> = {};
      for (const [k, v] of Object.entries(cfg.customHeadersOverride)) {
        if (v !== undefined && v !== null) {
          cleanHeaders[k] = String(v);
        }
      }
      sanitized.customHeadersOverride = cleanHeaders;
    }
    sanitized.customBodyOverride = cfg.customBodyOverride;
  }

  return sanitized;
}

function formatDisplayApiKey(rawKey: string, mask?: boolean): string {
  if (!rawKey) return '<YOUR_API_KEY>';
  if (!mask) return rawKey;
  if (rawKey.length <= 8) return '••••••••';
  return `${rawKey.slice(0, 4)}••••••••${rawKey.slice(-2)}`;
}

export function detectManualProtocol(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>
): InferenceProtocol {
  const lowerUrl = url.toLowerCase().trim();
  const lowerHeaderKeys = Object.keys(headers).map((k) => k.toLowerCase());

  if (
    lowerUrl.includes(':generatecontent') ||
    lowerUrl.includes('generativelanguage.googleapis.com') ||
    lowerHeaderKeys.includes('x-goog-api-key') ||
    'contents' in body ||
    'systemInstruction' in body ||
    'generationConfig' in body
  ) {
    return 'google';
  }

  if (
    lowerUrl.includes('anthropic.com') ||
    lowerUrl.endsWith('/messages') ||
    lowerHeaderKeys.includes('anthropic-version') ||
    lowerHeaderKeys.includes('x-api-key') ||
    ('system' in body && typeof body.system === 'string')
  ) {
    return 'anthropic';
  }

  if (
    lowerUrl.endsWith('/responses') ||
    lowerUrl.includes('/v1/responses') ||
    'input' in body ||
    'instructions' in body ||
    'max_output_tokens' in body
  ) {
    return 'openai-responses';
  }

  if (
    lowerUrl.endsWith('/api/chat') ||
    lowerUrl.includes(':11434') ||
    ('options' in body && typeof body.options === 'object' && body.options !== null) ||
    'num_ctx' in body ||
    'format' in body
  ) {
    return 'ollama';
  }

  return 'openai-completions';
}

function buildManualRequest(
  cfg: AIProviderConfig,
  options: BuildInferenceOptions,
  systemPrompt: string
): BuiltInferenceRequest {
  const url = (cfg.customUrlOverride || '').trim();
  const headers: Record<string, string> = { ...(cfg.customHeadersOverride || {}) };
  const rawBody: Record<string, unknown> = { ...(cfg.customBodyOverride || {}) };
  const protocol = detectManualProtocol(url, headers, rawBody);

  if (options.preserveOverrideMessages) {
    return {
      method: 'POST',
      url,
      headers,
      body: rawBody,
      protocol,
    };
  }

  const body: Record<string, unknown> = { ...rawBody };

  if (protocol === 'anthropic') {
    if (systemPrompt) {
      if (typeof body.system === 'string' && body.system.trim()) {
        body.system = `${body.system.trim()}\n\n${systemPrompt}`;
      } else {
        body.system = systemPrompt;
      }
    }
    body.messages = options.messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));
  } else if (protocol === 'google') {
    if (systemPrompt) {
      if (body.systemInstruction === undefined) {
        body.systemInstruction = { parts: [{ text: systemPrompt }] };
      }
    }
    body.contents = options.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    if (options.jsonMode) {
      const existingGenCfg =
        body.generationConfig &&
        typeof body.generationConfig === 'object' &&
        !Array.isArray(body.generationConfig)
          ? (body.generationConfig as Record<string, unknown>)
          : {};
      if (existingGenCfg.responseMimeType === undefined) {
        body.generationConfig = {
          ...existingGenCfg,
          responseMimeType: 'application/json',
        };
      }
    }
  } else if (protocol === 'openai-responses') {
    if (systemPrompt) {
      if (typeof body.instructions === 'string' && body.instructions.trim()) {
        body.instructions = `${body.instructions.trim()}\n\n${systemPrompt}`;
      } else {
        body.instructions = systemPrompt;
      }
    }
    body.input = options.messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));
    if (options.jsonMode) {
      const existingText =
        body.text && typeof body.text === 'object' && !Array.isArray(body.text)
          ? (body.text as Record<string, unknown>)
          : {};
      if (existingText.format === undefined) {
        body.text = {
          ...existingText,
          format: { type: 'json_object' },
        };
      }
    }
  } else if (protocol === 'ollama') {
    body.messages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...options.messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];
    if (options.jsonMode && body.format === undefined) {
      body.format = 'json';
    }
  } else {
    // openai-completions
    body.messages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...options.messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];
    if (options.jsonMode && body.response_format === undefined) {
      body.response_format = { type: 'json_object' };
    }
  }

  return {
    method: 'POST',
    url,
    headers,
    body,
    protocol,
  };
}

export function buildInferenceRequest(
  rawCfg: AIProviderConfig,
  options: BuildInferenceOptions
): BuiltInferenceRequest {
  const cfg = sanitizeConfigForEndpoint(rawCfg);

  const systemPrompt = [
    options.systemInstruction || '',
    options.jsonMode ? 'You MUST respond ONLY with a valid JSON object.' : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  // When Manual Edit is enabled, ignore all left-hand form fields and build directly from the manual override
  if (
    cfg.manualEditEnabled &&
    cfg.customUrlOverride &&
    cfg.customBodyOverride &&
    typeof cfg.customBodyOverride === 'object' &&
    !Array.isArray(cfg.customBodyOverride)
  ) {
    return buildManualRequest(cfg, options, systemPrompt);
  }

  const baseUrl = (cfg.baseUrl || 'https://api.openai.com/v1').trim().replace(/\/+$/, '');
  const model = (cfg.model || 'gpt-4o-mini').trim();
  const rawApiKey = cfg.apiKey?.trim() || '';
  const displayKey = formatDisplayApiKey(rawApiKey, options.maskApiKey);

  if (cfg.apiStandard === 'anthropic') {
    const url = baseUrl.endsWith('/messages')
      ? baseUrl
      : baseUrl.endsWith('/v1')
        ? `${baseUrl}/messages`
        : `${baseUrl}/v1/messages`;

    const thinkingBudget = isPosInt(cfg.thinkingBudget) ? Math.max(1024, cfg.thinkingBudget) : undefined;
    const maxTokens = Math.max(
      isPosInt(cfg.maxTokens) ? cfg.maxTokens : 2048,
      thinkingBudget ? thinkingBudget + 1024 : 0
    );

    const baseBody: Record<string, unknown> = {
      model,
      max_tokens: maxTokens,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      ...(isFiniteNum(cfg.temperature) ? { temperature: cfg.temperature } : {}),
      ...(isFiniteNum(cfg.topP) ? { top_p: cfg.topP } : {}),
      ...(isPosInt(cfg.topK) ? { top_k: cfg.topK } : {}),
      ...(thinkingBudget
        ? { thinking: { type: 'enabled', budget_tokens: thinkingBudget } }
        : {}),
      messages: options.messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    };

    return {
      method: 'POST',
      url,
      headers: {
        'content-type': 'application/json',
        'x-api-key': displayKey,
        'anthropic-version': '2023-06-01',
      },
      body: baseBody,
      protocol: 'anthropic',
    };
  }

  if (cfg.apiStandard === 'google') {
    const modelPath = model.startsWith('models/') ? model : `models/${model}`;
    const url = baseUrl.includes(':generateContent')
      ? baseUrl
      : baseUrl.match(/\/v1(?:beta)?$/)
        ? `${baseUrl}/${modelPath}:generateContent`
        : `${baseUrl}/v1beta/${modelPath}:generateContent`;

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-goog-api-key': displayKey,
    };

    const generationConfig: Record<string, unknown> = {
      ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
      ...(isFiniteNum(cfg.temperature) ? { temperature: cfg.temperature } : {}),
      ...(isPosInt(cfg.maxTokens) ? { maxOutputTokens: cfg.maxTokens } : {}),
      ...(isFiniteNum(cfg.topP) ? { topP: cfg.topP } : {}),
      ...(isPosInt(cfg.topK) ? { topK: cfg.topK } : {}),
      ...(isFiniteNum(cfg.thinkingBudget) && cfg.thinkingBudget >= 0
        ? { thinkingConfig: { thinkingBudget: cfg.thinkingBudget } }
        : {}),
    };

    const baseBody: Record<string, unknown> = {
      ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
      contents: options.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      ...(Object.keys(generationConfig).length > 0 ? { generationConfig } : {}),
    };

    return {
      method: 'POST',
      url,
      headers,
      body: baseBody,
      protocol: 'google',
    };
  }

  if (cfg.apiStandard === 'ollama') {
    const url = baseUrl.endsWith('/api/chat')
      ? baseUrl
      : baseUrl.endsWith('/api')
        ? `${baseUrl}/chat`
        : `${baseUrl.replace(/\/v1$/, '')}/api/chat`;

    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (rawApiKey) {
      headers['authorization'] = `Bearer ${displayKey}`;
    }

    const chatMessages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...options.messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const ollamaOptions: Record<string, unknown> = {
      ...(isFiniteNum(cfg.temperature) ? { temperature: cfg.temperature } : {}),
      ...(isPosInt(cfg.maxTokens) ? { num_predict: cfg.maxTokens } : {}),
      ...(isFiniteNum(cfg.topP) ? { top_p: cfg.topP } : {}),
      ...(isPosInt(cfg.topK) ? { top_k: cfg.topK } : {}),
      ...(isPosInt(cfg.numCtx) ? { num_ctx: cfg.numCtx } : {}),
      ...(isFiniteNum(cfg.repeatPenalty) ? { repeat_penalty: cfg.repeatPenalty } : {}),
    };

    const baseBody: Record<string, unknown> = {
      model,
      messages: chatMessages,
      stream: false,
      ...(options.jsonMode ? { format: 'json' } : {}),
      ...(Object.keys(ollamaOptions).length > 0 ? { options: ollamaOptions } : {}),
    };

    return {
      method: 'POST',
      url,
      headers,
      body: baseBody,
      protocol: 'ollama',
    };
  }

  // OpenAI standard (Chat Completions or Responses API)
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    authorization: `Bearer ${displayKey}`,
  };

  if (cfg.openaiApiType === 'responses') {
    const url = baseUrl.endsWith('/responses')
      ? baseUrl
      : baseUrl.endsWith('/v1')
        ? `${baseUrl}/responses`
        : `${baseUrl}/v1/responses`;

    const baseBody: Record<string, unknown> = {
      model,
      ...(systemPrompt ? { instructions: systemPrompt } : {}),
      input: options.messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      ...(isFiniteNum(cfg.temperature) ? { temperature: cfg.temperature } : {}),
      ...(isPosInt(cfg.maxTokens) ? { max_output_tokens: cfg.maxTokens } : {}),
      ...(isFiniteNum(cfg.topP) ? { top_p: cfg.topP } : {}),
      ...(cfg.reasoningEffort ? { reasoning: { effort: cfg.reasoningEffort } } : {}),
      ...(options.jsonMode ? { text: { format: { type: 'json_object' } } } : {}),
    };

    return {
      method: 'POST',
      url,
      headers,
      body: baseBody,
      protocol: 'openai-responses',
    };
  }

  const url = baseUrl.endsWith('/chat/completions')
    ? baseUrl
    : baseUrl.endsWith('/v1')
      ? `${baseUrl}/chat/completions`
      : `${baseUrl}/v1/chat/completions`;

  const chatMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...options.messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
  ];

  const baseBody: Record<string, unknown> = {
    model,
    messages: chatMessages,
    ...(isFiniteNum(cfg.temperature) ? { temperature: cfg.temperature } : {}),
    ...(isPosInt(cfg.maxTokens) ? { max_completion_tokens: cfg.maxTokens } : {}),
    ...(isFiniteNum(cfg.topP) ? { top_p: cfg.topP } : {}),
    ...(isFiniteNum(cfg.frequencyPenalty) ? { frequency_penalty: cfg.frequencyPenalty } : {}),
    ...(isFiniteNum(cfg.presencePenalty) ? { presence_penalty: cfg.presencePenalty } : {}),
    ...(cfg.reasoningEffort ? { reasoning_effort: cfg.reasoningEffort } : {}),
    ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
  };

  return {
    method: 'POST',
    url,
    headers,
    body: baseBody,
    protocol: 'openai-completions',
  };
}
