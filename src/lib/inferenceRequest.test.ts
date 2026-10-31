import { describe, expect, test } from 'bun:test';
import {
  buildInferenceRequest,
  isAIConfigValid,
  sanitizeConfigForEndpoint,
} from './inferenceRequest';
import { previewNextInterval } from '../components/ActiveRetrievalLab';
import { assertSafeInferenceUrl, cleanJsonText } from '../../server';
import { generateAnkiTsv, generateFlashcardsCsv } from './anki';
import { translations } from '../i18n/translations';
import type { Flashcard } from '../types';

describe('inferenceRequest & server helpers', () => {
  test('isAIConfigValid validates menu and manual override configs', () => {
    expect(isAIConfigValid(null)).toBe(false);
    expect(
      isAIConfigValid({
        apiStandard: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
      })
    ).toBe(true);
    expect(
      isAIConfigValid({
        apiStandard: 'openai',
        baseUrl: '',
        model: '',
        manualEditEnabled: true,
        customUrlOverride: 'https://api.openai.com/v1/chat/completions',
        customBodyOverride: { model: 'gpt-4o-mini' },
      })
    ).toBe(true);
  });

  test('buildInferenceRequest builds valid requests across all 4 protocols', () => {
    const messages = [{ role: 'user' as const, content: 'Explain LTP' }];

    const openaiComp = buildInferenceRequest(
      { apiStandard: 'openai', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', apiKey: 'sk-1234567890' },
      { messages, jsonMode: true, maskApiKey: true }
    );
    expect(openaiComp.protocol).toBe('openai-completions');
    expect(openaiComp.url).toBe('https://api.openai.com/v1/chat/completions');
    expect(openaiComp.headers.authorization).toBe('Bearer sk-1••••••••90');
    expect(openaiComp.body.response_format).toEqual({ type: 'json_object' });

    const openaiResp = buildInferenceRequest(
      { apiStandard: 'openai', openaiApiType: 'responses', baseUrl: 'https://api.openai.com', model: 'o3-mini' },
      { systemInstruction: 'Be Socratic', messages, jsonMode: true }
    );
    expect(openaiResp.protocol).toBe('openai-responses');
    expect(openaiResp.url).toBe('https://api.openai.com/v1/responses');
    expect(openaiResp.body.text).toEqual({ format: { type: 'json_object' } });

    const anthropic = buildInferenceRequest(
      { apiStandard: 'anthropic', baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-7-sonnet-latest', thinkingBudget: 2048 },
      { messages }
    );
    expect(anthropic.protocol).toBe('anthropic');
    expect(anthropic.body.max_tokens).toBe(3072);
    expect(anthropic.body.thinking).toEqual({ type: 'enabled', budget_tokens: 2048 });

    const google = buildInferenceRequest(
      { apiStandard: 'google', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.5-flash' },
      { messages, jsonMode: true }
    );
    expect(google.protocol).toBe('google');
    expect(google.url).toContain('models/gemini-2.5-flash:generateContent');
  });

  test('sanitizeConfigForEndpoint clamps Anthropic thinkingBudget >= 1024 and maxTokens', () => {
    const cfg = sanitizeConfigForEndpoint({
      apiStandard: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3-7-sonnet-latest',
      thinkingBudget: 512,
    });
    expect(cfg.thinkingBudget).toBe(1024);
    expect(cfg.maxTokens).toBe(2048);
  });

  test('cleanJsonText extracts JSON from fenced blocks with leading prose', () => {
    const raw = 'Here is your evaluation:\n```json\n{"score": 92}\n```\nHope this helps!';
    expect(cleanJsonText(raw)).toBe('{"score": 92}');
    expect(cleanJsonText('Prefix {"ok": true} suffix')).toBe('{"ok": true}');
  });

  test('assertSafeInferenceUrl blocks cloud metadata and non-HTTP schemes', () => {
    expect(() => assertSafeInferenceUrl('http://169.254.169.254/latest/meta-data/')).toThrow();
    expect(() => assertSafeInferenceUrl('http://metadata.google.internal/computeMetadata/v1/')).toThrow();
    expect(() => assertSafeInferenceUrl('file:///etc/passwd')).toThrow();
    expect(() => assertSafeInferenceUrl('https://api.openai.com/v1/chat/completions')).not.toThrow();
  });

  test('previewNextInterval calculates SM-2 intervals accurately', () => {
    const card: Flashcard = {
      id: 'fc_1',
      topic: 'LTP',
      question: 'Q',
      answer: 'A',
      keyConcept: 'K',
      neuroTip: 'N',
      intervalDays: 4,
      repetitions: 2,
      easeFactor: 2.5,
      nextReviewDate: 0,
      masteryLevel: 2,
    };
    expect(previewNextInterval(card, 0)).toBe(1);
    expect(previewNextInterval(card, 1)).toBe(5);
    expect(previewNextInterval(card, 2)).toBe(10);
    expect(previewNextInterval(card, 3)).toBe(13);
  });

  test('generateAnkiTsv formats flashcards correctly for Anki import', () => {
    const cards: Flashcard[] = [
      {
        id: 'fc_1',
        topic: 'Neuroscience & Memory',
        question: 'What triggers LTP?',
        answer: 'High frequency stimulation.',
        keyConcept: 'LTP',
        neuroTip: 'AMPA recruits NMDA',
        intervalDays: 1,
        repetitions: 0,
        easeFactor: 2.5,
        nextReviewDate: 0,
        masteryLevel: 0,
      },
    ];

    const tsv = generateAnkiTsv(cards);
    const parts = tsv.split('\t');
    expect(parts.length).toBe(3);
    expect(parts[0]).toBe('What triggers LTP?');
    expect(parts[1]).toContain('High frequency stimulation.');
    expect(parts[1]).toContain('<b>Concept:</b> LTP');
    expect(parts[1]).toContain('<i>NeuroTip:</i> AMPA recruits NMDA');
    expect(parts[2]).toBe('Neuroscience_&_Memory');
  });

  test('generateFlashcardsCsv formats basic front, back and topic correctly with RFC 4180 escaping', () => {
    const cards: Flashcard[] = [
      {
        id: 'fc_1',
        topic: 'Neuroscience',
        question: 'What is LTP, and how does it work?',
        answer: 'Long-term potentiation,\nstrengthening synapses.',
        keyConcept: 'LTP',
        neuroTip: 'AMPA & NMDA',
        intervalDays: 1,
        repetitions: 0,
        easeFactor: 2.5,
        nextReviewDate: 0,
        masteryLevel: 0,
      },
    ];

    const csvPt = generateFlashcardsCsv(cards, true);
    expect(csvPt).toContain('Pergunta,Resposta,Tópico');
    expect(csvPt).toContain('"What is LTP, and how does it work?"');
    expect(csvPt).toContain('"Long-term potentiation,\nstrengthening synapses."');
    expect(csvPt).toContain('Neuroscience');

    const csvEn = generateFlashcardsCsv(cards, false);
    expect(csvEn).toContain('Question,Answer,Topic');
  });

  test('translations have exact parity between en and pt', () => {
    function getKeys(obj: Record<string, any>, prefix = ''): string[] {
      let keys: string[] = [];
      for (const [k, v] of Object.entries(obj)) {
        const full = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          keys = keys.concat(getKeys(v, full));
        } else {
          keys.push(full);
        }
      }
      return keys.sort();
    }

    const enKeys = getKeys(translations.en);
    const ptKeys = getKeys(translations.pt);
    expect(enKeys).toEqual(ptKeys);
  });
});
