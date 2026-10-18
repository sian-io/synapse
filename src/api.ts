import { hc } from 'hono/client';
import type { AppType } from '../server';

export const AI_CONFIG_STORAGE_KEY = 'synapse_ai_config';

export const api = hc<AppType>('/', {
  headers: () => {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(AI_CONFIG_STORAGE_KEY) : null;
    return raw ? { 'x-ai-config': raw } : ({} as Record<string, string>);
  },
});

