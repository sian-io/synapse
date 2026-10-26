import { Hono, Context } from 'hono';
import { validator } from 'hono/validator';
import { translateCognitivePhase } from './src/i18n/translations';
import { buildInferenceRequest } from './src/lib/inferenceRequest';
import type {
  AIProviderConfig,
  ChatMessage,
  ConceptBreakdown,
  FeynmanEvaluation,
  Flashcard,
  PedagogicalMode,
} from './src/types';

const app = new Hono();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const jsonBody = <T>() =>
  validator('json', (_v: T, c) => c.req.json() as Promise<T>);

// Global error handler mapping syntax/JSON parse errors to 400
app.onError((err, c) => {
  if (err instanceof SyntaxError || err.name === 'SyntaxError' || err.message?.includes('JSON')) {
    return c.json({ error: 'Malformed JSON payload.' }, 400);
  }
  console.error('[Unhandled Server Error]', err.message);
  return c.json({ error: 'Internal Server Error' }, 500);
});

function resolveAIConfig(c: Context, bodyConfig?: AIProviderConfig, isPt = false): AIProviderConfig {
  let cfg = bodyConfig;
  if (!cfg) {
    const rawHeader = c.req.header('x-ai-config');
    if (rawHeader) {
      try {
        cfg = JSON.parse(rawHeader);
      } catch {
        // ignore invalid header JSON
      }
    }
  }

  if (!cfg || !cfg.apiStandard || !cfg.baseUrl?.trim() || !cfg.model?.trim()) {
    throw new Error(
      isPt
        ? 'Configure sua API nas Configurações de IA (ícone de engrenagem no topo).'
        : 'Configure your API in AI Settings (gear icon at the top).'
    );
  }

  return cfg;
}

function cleanJsonText(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

async function runInference(
  cfg: AIProviderConfig,
  options: {
    systemInstruction?: string;
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
    jsonMode?: boolean;
  }
): Promise<string> {
  const req = buildInferenceRequest(cfg, options);

  const res = await fetch(req.url, {
    method: req.method,
    headers: req.headers,
    body: JSON.stringify(req.body),
  });

  if (cfg.apiStandard === 'anthropic') {
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Anthropic API error (${res.status}): ${errBody.slice(0, 200)}`);
    }

    const data: any = await res.json();
    const text = data?.content?.find((b: any) => b?.type === 'text')?.text?.trim() ?? data?.content?.[0]?.text?.trim();
    if (!text) throw new Error('Empty response from Anthropic API.');
    return options.jsonMode ? cleanJsonText(text) : text;
  }

  if (cfg.apiStandard === 'google') {
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Google API error (${res.status}): ${errBody.slice(0, 200)}`);
    }

    const data: any = await res.json();
    const parts: any[] = data?.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find((p: any) => typeof p?.text === 'string' && !p?.thought) ?? parts[0];
    const text = textPart?.text?.trim();
    if (!text) throw new Error('Empty response from Google API.');
    return options.jsonMode ? cleanJsonText(text) : text;
  }

  if (cfg.apiStandard === 'ollama') {
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Ollama API error (${res.status}): ${errBody.slice(0, 200)}`);
    }

    const data: any = await res.json();
    const text = (data?.message?.content ?? data?.choices?.[0]?.message?.content)?.trim();
    if (!text) throw new Error('Empty response from Ollama API.');
    return options.jsonMode ? cleanJsonText(text) : text;
  }

  if (cfg.openaiApiType === 'responses') {
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`OpenAI Responses API error (${res.status}): ${errBody.slice(0, 200)}`);
    }

    const data: any = await res.json();
    const text = (
      data?.output_text ??
      data?.output
        ?.flatMap((item: any) => item?.content || [])
        ?.find((c: any) => typeof c?.text === 'string')?.text ??
      data?.choices?.[0]?.message?.content
    )?.trim();
    if (!text) throw new Error('Empty response from OpenAI Responses API.');
    return options.jsonMode ? cleanJsonText(text) : text;
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`OpenAI API error (${res.status}): ${errBody.slice(0, 200)}`);
  }

  const data: any = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty response from OpenAI API.');
  return options.jsonMode ? cleanJsonText(text) : text;
}

const routes = app
  // Health check
  .get('/api/health', (c) => {
    return c.json(
      {
        status: 'ok',
        mode: 'byok-stateless-proxy',
        timestamp: Date.now(),
      },
      200
    );
  })
  // Chat endpoint for Socratic, Feynman, and Active Learning interactions
  .post(
    '/api/chat',
    jsonBody<{
      messages?: { role: ChatMessage['role']; content: string }[];
      mode?: PedagogicalMode;
      currentTopic?: string;
      studentCalibration?: number;
      language?: 'en' | 'pt';
      aiConfig?: AIProviderConfig;
    }>(),
    async (c) => {
      const { messages, mode, currentTopic, studentCalibration, language = 'en', aiConfig } = c.req.valid('json');
      const isPt = language === 'pt';

      try {
        const cfg = resolveAIConfig(c, aiConfig, isPt);

        const systemInstruction = `
You are **Synapse**, an Elite Pedagogical AI Agent grounded strictly in **Cognitive Neuroscience** and **Active Learning Methodologies** proven by learning sciences:
1. **Retrieval Practice & Testing Effect (Roediger & Karpicke, 2006)**: Do not give ready-made answers! Force the student to retrieve information from long-term memory (LTP - Long-Term Potentiation).
2. **Socratic Method & Elaborative Interrogation**: Guide the student through insightful questions ("Why does this occur?", "What is the causal link between X and Y?").
3. **Feynman Technique**: When evaluating or asking for explanations, forbid empty jargon; demand simple analogies and expose illusions of explanatory depth.
4. **Cognitive Load Theory (Sweller)**: Deliver short, digestible, precise blocks. Avoid passive text overload.
5. **Desirable Difficulties (Robert Bjork)**: Real learning demands productive struggle. Encourage mistakes as a biological hallmark of neuroplasticity.
6. **Metacognition (Flavell)**: Prompt reflection on the student's own reasoning process and certainty verification.

Current Pedagogical Mode: ${mode || 'socratic'}
${currentTopic ? `Topic of Study: ${currentTopic}` : `Topic of Study: Inferred organically from the student's conversation`}
${studentCalibration ? `Student Metacognitive Certainty Level: ${studentCalibration}/5` : ''}
Output Language: ${isPt ? 'Portuguese (pt-BR)' : 'English (en)'}

Specific Mode Guidelines:
- **socratic**: Ask questions that decompose the problem. Provide gradual scaffolding, but lead the student to conclude the reasoning. Conclude with ONE thought-provoking question.
- **feynman**: Act as an incisive evaluator. Highlight technical terms that need unpacking, praise apt analogies, and request simplification of vague steps.
- **active_retrieval**: Challenge the student with a practical scenario or deep conceptual retrieval question (not trivia). Critically assess their answer.
- **metacognition**: Challenge the student to audit how they reached their conclusion, which premises they assumed, and where they feel their grasp is most fragile.

Format your response in clean, direct, empathetic Markdown focused on student action.
Always conclude your response with a special section formatted as:
\`\`\`meta
CognitivePhase: [${isPt ? 'em português, ex: Recuperação Ativa | Diagnóstico de Ilusão | Interrogação Elaborativa | Consolidação' : 'in English, e.g., Active Retrieval | Illusion Diagnosis | Elaborative Interrogation | Consolidation'}]
NeuroTip: [${isPt ? 'Uma frase concisa em português explicando o mecanismo neurobiológico' : 'One concise sentence explaining the neurobiological mechanism behind what is being trained'}]
SuggestedNextSteps: [${isPt ? 'Ação 1 | Ação 2' : 'Action 1 | Action 2'}]
\`\`\`
`.trim();

        const responseText = await runInference(cfg, {
          systemInstruction,
          messages: messages || [],
        });

        // Extract meta block if present
        let cleanedText = responseText;
        let cognitivePhase = isPt ? 'Recuperação Ativa' : 'Active Retrieval';
        let neuroTip = isPt
          ? 'A recuperação ativa estimula a síntese de proteínas sinápticas, consolidando memórias duradouras.'
          : 'Active retrieval stimulates synaptic protein synthesis, consolidating durable memories.';
        let suggestedActions: string[] = [];

        const metaMatch = responseText.match(/```meta\s*([\s\S]*?)\s*```/);
        if (metaMatch) {
          cleanedText = responseText.replace(/```meta\s*[\s\S]*?\s*```/, '').trim();
          const metaContent = metaMatch[1];
          const phaseMatch = metaContent.match(/CognitivePhase:\s*(.*)/i);
          const tipMatch = metaContent.match(/NeuroTip:\s*(.*)/i);
          const stepsMatch = metaContent.match(/SuggestedNextSteps:\s*(.*)/i);

          if (phaseMatch) {
            cognitivePhase = translateCognitivePhase(phaseMatch[1].trim(), isPt ? 'pt' : 'en');
          }
          if (tipMatch) neuroTip = tipMatch[1].trim();
          if (stepsMatch) {
            suggestedActions = stepsMatch[1].split('|').map((s) => s.trim()).filter(Boolean);
          }
        }

        cleanedText = cleanedText.replace(/(?:[\r\n]+\s*(?:[-*_]\s*){3,})+$/, '').trim();

        const defaultActions = isPt
          ? [
              'Tentar explicar com uma analogia simples',
              'Identificar a premissa mais frágil do raciocínio',
              'Pedir um contra-exemplo desafiador',
            ]
          : [
              'Try explaining with a simple analogy',
              'Identify the weakest premise of this reasoning',
              'Ask for a challenging counterexample',
            ];

        return c.json(
          {
            content: cleanedText,
            meta: {
              cognitivePhase,
              desirableDifficultyNote: neuroTip,
              suggestedActions: suggestedActions.length > 0 ? suggestedActions : defaultActions,
            },
          },
          200
        );
      } catch (error: any) {
        console.error('Error in /api/chat:', error.message);
        return c.json(
          {
            error:
              error.message ||
              (isPt
                ? 'Não foi possível alcançar a API de inferência para gerar a resposta.'
                : 'Could not reach the inference API to generate a response.'),
          },
          503
        );
      }
    }
  )
  // Evaluate Feynman Explanation
  .post(
    '/api/feynman-evaluate',
    jsonBody<{
      topic?: string;
      explanation: string;
      targetAudience?: string;
      language?: 'en' | 'pt';
      aiConfig?: AIProviderConfig;
    }>(),
    async (c) => {
      const { topic, explanation, targetAudience = 'a curious 10-year-old child', language = 'en', aiConfig } = c.req.valid('json');
      const isPt = language === 'pt';

      if (!explanation?.trim()) {
        return c.json({ error: isPt ? 'A explicação é obrigatória.' : 'Explanation is required.' }, 400);
      }

      try {
        const cfg = resolveAIConfig(c, aiConfig, isPt);

        const prompt = `
Evaluate the following student explanation using the **Feynman Technique** and neurocognitive principles of deep comprehension:
${topic?.trim() ? `- Topic: "${topic.trim()}"` : `- Topic: Infer the central concept, phenomenon, or mechanism being explained directly from the student's text (concise title, 2-6 words).`}
- Target Audience: "${targetAudience}"
- Student Explanation:
"""${explanation}"""
- Language of Output: ${isPt ? 'Portuguese' : 'English'}

Analyze critically:
1. Identify the central concept/topic being explained ("topic").
2. Clarity and scientific fidelity (no severe distortions).
3. Detection of unexplained technical jargon (pompous terms concealing lack of mechanical understanding).
4. Reasoning gaps missing the "how" or "why".
5. Quality and accuracy of analogies used.
6. A hyper-simplified, elegant alternative explanation.
7. A surgical Socratic question for the student to repair their primary gap.

Return JSON with keys: topic (string, the inferred or provided concept name), score (0-100 integer), clarityAssessment (string), jargonIdentified (string[]), conceptualGaps (string[]), strengths (string[]), analogiesEvaluation (string), suggestedAnalogy (string), simplifiedAlternative (string), followUpQuestion (string).
`.trim();

        const responseText = await runInference(cfg, {
          messages: [{ role: 'user', content: prompt }],
          jsonMode: true,
        });

        const parsed: FeynmanEvaluation = JSON.parse(responseText);
        if (topic?.trim() && !parsed.topic) {
          parsed.topic = topic.trim();
        }
        return c.json(parsed, 200);
      } catch (error: any) {
        console.error('Error in /api/feynman-evaluate:', error.message);
        return c.json(
          {
            error:
              error.message ||
              (isPt
                ? 'Não foi possível alcançar a API de inferência para avaliar a explicação.'
                : 'Could not reach the inference API to evaluate the explanation.'),
          },
          503
        );
      }
    }
  )
  // Generate Active Retrieval Deck (Spaced Flashcards)
  .post(
    '/api/generate-retrieval-deck',
    jsonBody<{
      topic: string;
      difficulty?: string;
      count?: number;
      language?: 'en' | 'pt';
      aiConfig?: AIProviderConfig;
    }>(),
    async (c) => {
      const { topic, difficulty = 'intermediario', count = 4, language = 'en', aiConfig } = c.req.valid('json');
      const isPt = language === 'pt';

      if (!topic) {
        return c.json({ error: isPt ? 'Tópico é obrigatório.' : 'Topic is required.' }, 400);
      }

      try {
        const cfg = resolveAIConfig(c, aiConfig, isPt);

        const prompt = `
Create a set of ${count} **Active Retrieval Practice (Active Recall)** and **Elaborative Interrogation** cards for the topic: "${topic}".
Depth level: ${difficulty}.
Output language: ${isPt ? 'Portuguese' : 'English'}.

STRICT PEDAGOGICAL RULES:
- NEVER create shallow trivia questions (e.g., "In what year was X born?").
- Create mechanism questions ("What would happen if component X failed?", "Why does X produce Y instead of Z?", "What is the essential distinction between A and B?").
- Provide explanatory answers that consolidate the correct mental model.
- Include a mnemonic "neuroTip" or conceptual anchor for each question.

Return JSON with key "cards", an array of objects each with keys: question (string), answer (string), keyConcept (string), neuroTip (string).
`.trim();

        const responseText = await runInference(cfg, {
          messages: [{ role: 'user', content: prompt }],
          jsonMode: true,
        });

        const parsed = JSON.parse(responseText);
        const rawCards = Array.isArray(parsed) ? parsed : (parsed.cards || parsed.flashcards || []);
        const now = Date.now();
        const flashcards: Flashcard[] = rawCards.map((c: any, index: number) => ({
          id: `fc_${now}_${index}`,
          topic,
          question: c.question,
          answer: c.answer,
          keyConcept: c.keyConcept,
          neuroTip: c.neuroTip,
          intervalDays: 1,
          repetitions: 0,
          easeFactor: 2.5,
          nextReviewDate: now,
          masteryLevel: 0,
        }));

        return c.json({ flashcards, cards: flashcards }, 200);
      } catch (error: any) {
        console.error('Error in /api/generate-retrieval-deck:', error.message);
        return c.json(
          {
            error:
              error.message ||
              (isPt
                ? 'Não foi possível alcançar a API de inferência para gerar o baralho.'
                : 'Could not reach the inference API to generate the deck.'),
          },
          503
        );
      }
    }
  )
  // Generate Concept Breakdown (Cognitive Load Scaffolding)
  .post(
    '/api/generate-concept-breakdown',
    jsonBody<{
      topic: string;
      language?: 'en' | 'pt';
      aiConfig?: AIProviderConfig;
    }>(),
    async (c) => {
      const { topic, language = 'en', aiConfig } = c.req.valid('json');
      const isPt = language === 'pt';

      if (!topic) {
        return c.json({ error: isPt ? 'Tópico é obrigatório.' : 'Topic is required.' }, 400);
      }

      try {
        const cfg = resolveAIConfig(c, aiConfig, isPt);

        const prompt = `
Perform a high-efficiency pedagogical breakdown based on **Sweller's Cognitive Load Theory** and **Paivio's Dual-Coding Theory** for the topic: "${topic}".
Output language: ${isPt ? 'Portuguese' : 'English'}.

Structure:
1. Concise overview (minimizing extraneous load).
2. Essential prerequisites (prior neural schemas required for anchoring).
3. The core mechanism in essence (the foundational engine).
4. The 3 most common intuitive traps/misconceptions made by learners.
5. 3 deep elaborative questions ("Why...?", "How...?", "What is the consequence of...?").
6. A concrete physical/everyday world analogy.
7. The neuroscientific rationale for why this topic is typically difficult and how the brain should process it.

Return JSON with keys: topic (string), overview (string), prerequisites (string[]), coreMechanism (string), commonMisconceptions (string[]), elaborativeQuestions (string[]), realWorldAnalogy (string), neuroscienceRationale (string).
`.trim();

        const responseText = await runInference(cfg, {
          messages: [{ role: 'user', content: prompt }],
          jsonMode: true,
        });

        const parsed: ConceptBreakdown = JSON.parse(responseText);
        return c.json(parsed, 200);
      } catch (error: any) {
        console.error('Error in /api/generate-concept-breakdown:', error.message);
        return c.json(
          {
            error:
              error.message ||
              (isPt
                ? 'Não foi possível alcançar a API de inferência para gerar o mapeamento conceitual.'
                : 'Could not reach the inference API to generate the concept breakdown.'),
          },
          503
        );
      }
    }
  );

export type AppType = typeof routes;

// Production Static Serving & SPA Fallback (in dev, @hono/vite-dev-server handles non-/api routes directly via Vite)
if (typeof Bun !== 'undefined') {
  const { serveStatic } = await import('hono/bun');
  app.use('/*', serveStatic({ root: './dist' }));
  app.get('*', serveStatic({ path: './dist/index.html' }));
}

export { app };

export default {
  port: PORT,
  hostname: HOST,
  fetch: app.fetch,
};
