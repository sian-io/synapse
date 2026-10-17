
import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { GoogleGenAI, Type } from '@google/genai';
import { translateCognitivePhase } from './src/i18n/translations';
import type {
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
  console.error('[Unhandled Server Error]', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// Initialize Gemini SDK with User-Agent as instructed
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Resilient fallback runner across approved Gemini models
async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithFallback(ai: GoogleGenAI, requestPayload: any) {
  // gemini-3.5-flash-lite and gemini-3.8-flash provide high responsiveness with fallback redundancy
  const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...requestPayload,
          model,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED');

        console.warn(`[Gemini Fallback] Model ${model} (attempt ${attempt + 1}) encountered issue:`, errMsg);

        if (isTransient && attempt === 0) {
          // Brief backoff with jitter to allow transient capacity spikes to clear
          await sleep(750 + Math.random() * 500);
          continue;
        }
        break; // Move to next model
      }
    }
  }

  throw lastError;
}

const routes = app
  // Health check
  .get('/api/health', (c) => {
    return c.json(
      {
        status: 'ok',
        hasApiKey: !!process.env.GEMINI_API_KEY,
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
    }>(),
    async (c) => {
      const { messages, mode, currentTopic, studentCalibration, language = 'en' } = c.req.valid('json');
      const isPt = language === 'pt';

  try {
    const ai = getGeminiClient();

    const systemInstruction = `
You are **Synapse**, an Elite Pedagogical AI Agent grounded strictly in **Cognitive Neuroscience** and **Active Learning Methodologies** proven by learning sciences:
1. **Retrieval Practice & Testing Effect (Roediger & Karpicke, 2006)**: Do not give ready-made answers! Force the student to retrieve information from long-term memory (LTP - Long-Term Potentiation).
2. **Socratic Method & Elaborative Interrogation**: Guide the student through insightful questions ("Why does this occur?", "What is the causal link between X and Y?").
3. **Feynman Technique**: When evaluating or asking for explanations, forbid empty jargon; demand simple analogies and expose illusions of explanatory depth.
4. **Cognitive Load Theory (Sweller)**: Deliver short, digestible, precise blocks. Avoid passive text overload.
5. **Desirable Difficulties (Robert Bjork)**: Real learning demands productive struggle. Encourage mistakes as a biological hallmark of neuroplasticity.
6. **Metacognition (Flavell)**: Prompt reflection on the student's own reasoning process and certainty verification.

Current Pedagogical Mode: ${mode || 'socratic'}
Topic of Study: ${currentTopic || (isPt ? 'Geral' : 'General')}
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

    // Map conversation history
    const conversationHistory = (messages || []).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await generateWithFallback(ai, {
      contents: conversationHistory,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      throw new Error('Empty response from inference API.');
    }

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

    // Strip trailing markdown horizontal rules (e.g. ---, ***, ___) left over before the meta block
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
    console.error('Error in /api/chat:', error);
    return c.json(
      {
        error: isPt
          ? 'Não foi possível alcançar a API de inferência para gerar a resposta.'
          : 'Could not reach the inference API to generate a response.',
      },
      503
    );
  }
  })
  // Evaluate Feynman Explanation
  .post(
    '/api/feynman-evaluate',
    jsonBody<{
      topic: string;
      explanation: string;
      targetAudience?: string;
      language?: 'en' | 'pt';
    }>(),
    async (c) => {
      const { topic, explanation, targetAudience = 'a curious 10-year-old child', language = 'en' } = c.req.valid('json');
      const isPt = language === 'pt';

      if (!topic || !explanation) {
        return c.json({ error: isPt ? 'Tópico e explicação são obrigatórios.' : 'Topic and explanation are required.' }, 400);
      }

      try {
        const ai = getGeminiClient();

        const prompt = `
Evaluate the following student explanation using the **Feynman Technique** and neurocognitive principles of deep comprehension:
- Topic: "${topic}"
- Target Audience: "${targetAudience}"
- Student Explanation:
"""${explanation}"""
- Language of Output: ${isPt ? 'Portuguese' : 'English'}

Analyze critically:
1. Clarity and scientific fidelity (no severe distortions).
2. Detection of unexplained technical jargon (pompous terms concealing lack of mechanical understanding).
3. Reasoning gaps missing the "how" or "why".
4. Quality and accuracy of analogies used.
5. A hyper-simplified, elegant alternative explanation.
6. A surgical Socratic question for the student to repair their primary gap.
`.trim();

        const response = await generateWithFallback(ai, {
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                score: {
                  type: Type.INTEGER,
                  description: 'Score from 0 to 100 based on clarity, lack of jargon, and accuracy.',
                },
                clarityAssessment: {
                  type: Type.STRING,
                  description: 'General diagnosis of the demonstrated explanatory clarity.',
                },
                jargonIdentified: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Technical terms or obscure vocabulary used without explanation.',
                },
                conceptualGaps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Logical or mechanical steps omitted from the explanation.',
                },
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Highlights, correct intuitions, and achievements of the explanation.',
                },
                analogiesEvaluation: {
                  type: Type.STRING,
                  description: 'Commentary on analogies used or lack thereof.',
                },
                suggestedAnalogy: {
                  type: Type.STRING,
                  description: 'A vivid, everyday analogy tailored for this concept.',
                },
                simplifiedAlternative: {
                  type: Type.STRING,
                  description: 'How Richard Feynman would explain this concept in 2 or 3 crystal-clear sentences.',
                },
                followUpQuestion: {
                  type: Type.STRING,
                  description: 'Socratic question targeting the weakest point of the explanation.',
                },
              },
              required: [
                'score',
                'clarityAssessment',
                'jargonIdentified',
                'conceptualGaps',
                'strengths',
                'analogiesEvaluation',
                'suggestedAnalogy',
                'simplifiedAlternative',
                'followUpQuestion',
              ],
            },
          },
        });

        const responseText = response.text?.trim();
        if (!responseText) {
          throw new Error('Empty response from inference API.');
        }

        const parsed: FeynmanEvaluation = JSON.parse(responseText);
        return c.json(parsed, 200);
      } catch (error: any) {
        console.error('Error in /api/feynman-evaluate:', error);
        return c.json(
          {
            error: isPt
              ? 'Não foi possível alcançar a API de inferência para avaliar a explicação.'
              : 'Could not reach the inference API to evaluate the explanation.',
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
    }>(),
    async (c) => {
      const { topic, difficulty = 'intermediario', count = 4, language = 'en' } = c.req.valid('json');
      const isPt = language === 'pt';

      if (!topic) {
        return c.json({ error: isPt ? 'Tópico é obrigatório.' : 'Topic is required.' }, 400);
      }

      try {
        const ai = getGeminiClient();

        const prompt = `
Create a set of ${count} **Active Retrieval Practice (Active Recall)** and **Elaborative Interrogation** cards for the topic: "${topic}".
Depth level: ${difficulty}.
Output language: ${isPt ? 'Portuguese' : 'English'}.

STRICT PEDAGOGICAL RULES:
- NEVER create shallow trivia questions (e.g., "In what year was X born?").
- Create mechanism questions ("What would happen if component X failed?", "Why does X produce Y instead of Z?", "What is the essential distinction between A and B?").
- Provide explanatory answers that consolidate the correct mental model.
- Include a mnemonic "neuroTip" or conceptual anchor for each question.
`.trim();

        const response = await generateWithFallback(ai, {
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                cards: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: {
                        type: Type.STRING,
                        description: 'The challenging active retrieval question.',
                      },
                      answer: {
                        type: Type.STRING,
                        description: 'The complete answer with mental model and mechanism.',
                      },
                      keyConcept: {
                        type: Type.STRING,
                        description: 'The nuclear concept being tested.',
                      },
                      neuroTip: {
                        type: Type.STRING,
                        description: 'Neurocognitive tip or mental anchoring model.',
                      },
                    },
                    required: ['question', 'answer', 'keyConcept', 'neuroTip'],
                  },
                },
              },
              required: ['cards'],
            },
          },
        });

        const responseText = response.text?.trim();
        if (!responseText) {
          throw new Error('Empty response from inference API.');
        }

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
        console.error('Error in /api/generate-retrieval-deck:', error);
        return c.json(
          {
            error: isPt
              ? 'Não foi possível alcançar a API de inferência para gerar o baralho.'
              : 'Could not reach the inference API to generate the deck.',
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
    }>(),
    async (c) => {
      const { topic, language = 'en' } = c.req.valid('json');
      const isPt = language === 'pt';

      if (!topic) {
        return c.json({ error: isPt ? 'Tópico é obrigatório.' : 'Topic is required.' }, 400);
      }

      try {
        const ai = getGeminiClient();

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
`.trim();

        const response = await generateWithFallback(ai, {
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                overview: { type: Type.STRING },
                prerequisites: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                coreMechanism: { type: Type.STRING },
                commonMisconceptions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                elaborativeQuestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                realWorldAnalogy: { type: Type.STRING },
                neuroscienceRationale: { type: Type.STRING },
              },
              required: [
                'topic',
                'overview',
                'prerequisites',
                'coreMechanism',
                'commonMisconceptions',
                'elaborativeQuestions',
                'realWorldAnalogy',
                'neuroscienceRationale',
              ],
            },
          },
        });

        const responseText = response.text?.trim();
        if (!responseText) {
          throw new Error('Empty response from inference API.');
        }

        const parsed: ConceptBreakdown = JSON.parse(responseText);
        return c.json(parsed, 200);
      } catch (error: any) {
        console.error('Error in /api/generate-concept-breakdown:', error);
        return c.json(
          {
            error: isPt
              ? 'Não foi possível alcançar a API de inferência para gerar o mapeamento conceitual.'
              : 'Could not reach the inference API to generate the concept breakdown.',
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
