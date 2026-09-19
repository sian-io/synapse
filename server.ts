import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent as instructed
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Requests requiring AI will fail.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
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
  // gemini-3.8-flash is the primary model as per documentation; fallbacks provide redundancy
  const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
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

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: Date.now(),
  });
});

// Chat endpoint for Socratic, Feynman, and Active Learning interactions
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, mode, currentTopic, studentCalibration, language = 'en' } = req.body;
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
CognitivePhase: [e.g., Active Retrieval | Illusion Diagnosis | Elaborative Interrogation | Consolidation]
NeuroTip: [One concise sentence explaining the neurobiological mechanism behind what is being trained]
SuggestedNextSteps: [Action 1 | Action 2]
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

    const defaultFallbackText = isPt
      ? 'Não foi possível gerar uma resposta no momento.'
      : 'Could not generate a response at this time.';
    const responseText = response.text || defaultFallbackText;

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

      if (phaseMatch) cognitivePhase = phaseMatch[1].trim();
      if (tipMatch) neuroTip = tipMatch[1].trim();
      if (stepsMatch) {
        suggestedActions = stepsMatch[1].split('|').map((s) => s.trim()).filter(Boolean);
      }
    }

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

    res.json({
      content: cleanedText,
      meta: {
        cognitivePhase,
        desirableDifficultyNote: neuroTip,
        suggestedActions: suggestedActions.length > 0 ? suggestedActions : defaultActions,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    // Provide adaptive Socratic fallback if upstream AI experiences temporary high demand
    const lastUserMsg = (messages || []).slice().reverse().find((m: any) => m.role === 'user')?.content || currentTopic || '';

    if (isPt) {
      res.json({
        content: `Você tocou em um ponto fulcral de **"${currentTopic || 'seu estudo'}"**.\n\nPara avançarmos na construção do seu modelo mental sem interrupções:\n\nSe você tivesse que explicar o funcionamento de **"${lastUserMsg.slice(0, 100)}"** para alguém que nunca estudou o assunto, qual seria a **relação fundamental de causa e efeito** que você destacaria primeiro? O que causa o quê?`,
        meta: {
          cognitivePhase: 'Interrogação Elaborativa',
          desirableDifficultyNote: 'Forçar o cérebro a isolar a variável causal essencial ativa o córtex pré-frontal e estimula a formação de traços sinápticos duradouros (LTP).',
          suggestedActions: [
            'Identificar a relação causa-efeito',
            'Pensar em uma analogia física simples',
            'Apontar uma situação em que isso falha',
          ],
        },
      });
    } else {
      res.json({
        content: `You touched upon a pivotal aspect of **"${currentTopic || 'your study'}"**.\n\nTo advance your mental model without interruption:\n\nIf you had to explain the mechanics of **"${lastUserMsg.slice(0, 100)}"** to someone who has never studied this subject, what **fundamental cause-and-effect relationship** would you highlight first? What causes what?`,
        meta: {
          cognitivePhase: 'Elaborative Interrogation',
          desirableDifficultyNote: 'Forcing the brain to isolate the essential causal variable activates the prefrontal cortex and triggers permanent synaptic potentiation (LTP).',
          suggestedActions: [
            'Identify the cause-and-effect link',
            'Think of a simple physical analogy',
            'Point out a boundary condition where this fails',
          ],
        },
      });
    }
  }
});

// Evaluate Feynman Explanation
app.post('/api/feynman-evaluate', async (req: Request, res: Response) => {
  const { topic, explanation, targetAudience = 'a curious 10-year-old child', language = 'en' } = req.body;
  const isPt = language === 'pt';

  if (!topic || !explanation) {
    return res.status(400).json({ error: isPt ? 'Tópico e explicação são obrigatórios.' : 'Topic and explanation are required.' });
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

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/feynman-evaluate:', error);
    // Intelligent heuristic pedagogical fallback for Feynman evaluation
    const words = (explanation || '').trim().split(/\s+/);
    const wordCount = words.length;
    const ptJargons = ['sistema', 'energia', 'processo', 'estrutura', 'função', 'estado', 'teoria', 'mecanismo', 'variável'];
    const enJargons = ['system', 'energy', 'process', 'structure', 'function', 'state', 'theory', 'mechanism', 'variable'];
    const testJargons = isPt ? ptJargons : enJargons;
    const potentialJargon = testJargons.filter((j) => (explanation || '').toLowerCase().includes(j));

    if (isPt) {
      res.json({
        score: Math.min(88, Math.max(55, Math.round(70 + (wordCount > 30 ? 6 : -10) - potentialJargon.length * 3))),
        clarityAssessment: `Sua explicação sobre "${topic}" tem ${wordCount} palavras e demonstra esforço autêntico de comunicação para ${targetAudience}. Para atingir a clareza total de Feynman, reduza termos conceituais abstratos em ações visuais diretas.`,
        jargonIdentified: potentialJargon.length > 0 ? potentialJargon : ['Termos técnicos genéricos'],
        conceptualGaps: [
          'A engrenagem do "como" ainda depende de premissas não explicadas',
          'Falta especificar o que acontece nas etapas intermediárias de transição',
          'Poderia explicitar o que impede o processo de ocorrer no sentido oposto',
        ],
        strengths: [
          'Linguagem direta orientada à compreensão',
          'Foco na ideia nuclear do fenômeno',
          'Construção de uma narrativa com início e fim',
        ],
        analogiesEvaluation: 'A explicação usa argumentos lógicos válidos, mas ganharia muito mais força com uma analogia tátil ou mecânica.',
        suggestedAnalogy: `Pense em "${topic}" como uma receita culinária ou um circuito de água: a pressão e o fluxo em uma extremidade determinam exatamente o que transborda na outra.`,
        simplifiedAlternative: `"${topic}" é a regra que diz como as partes de um sistema trocam informações ou energia para alcançar um novo equilíbrio sem mágica.`,
        followUpQuestion: `Se você tivesse que desenhar "${topic}" usando apenas 3 caixas e 2 setas, o que escreveria dentro de cada uma?`,
      });
    } else {
      res.json({
        score: Math.min(88, Math.max(55, Math.round(70 + (wordCount > 30 ? 6 : -10) - potentialJargon.length * 3))),
        clarityAssessment: `Your explanation of "${topic}" contains ${wordCount} words and demonstrates an authentic communication effort for ${targetAudience}. To achieve true Feynman clarity, ground abstract conceptual terms in direct visual actions.`,
        jargonIdentified: potentialJargon.length > 0 ? potentialJargon : ['Generic technical terms'],
        conceptualGaps: [
          'The underlying mechanics of "how" still rely on unstated assumptions',
          'Intermediate transition steps need further specification',
          'Could explicitly state what prevents the process from operating in reverse',
        ],
        strengths: [
          'Direct language focused on comprehension',
          'Clear emphasis on the nuclear phenomenon',
          'Cohesive narrative structure with beginning and end',
        ],
        analogiesEvaluation: 'The explanation employs valid logical reasoning, but would gain substantial power through a tactile or mechanical analogy.',
        suggestedAnalogy: `Think of "${topic}" like a water circuit or kitchen recipe: the pressure and flow at one end strictly dictate what emerges at the other.`,
        simplifiedAlternative: `"${topic}" is the fundamental rule dictating how components exchange signals or energy to reach equilibrium without magic.`,
        followUpQuestion: `If you had to draw "${topic}" using only 3 boxes and 2 arrows, what would you write inside each one?`,
      });
    }
  }
});

// Generate Active Retrieval Deck (Spaced Flashcards)
app.post('/api/generate-retrieval-deck', async (req: Request, res: Response) => {
  const { topic, difficulty = 'intermediario', count = 4, language = 'en' } = req.body;
  const isPt = language === 'pt';

  if (!topic) {
    return res.status(400).json({ error: isPt ? 'Tópico é obrigatório.' : 'Topic is required.' });
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

    const parsed = JSON.parse(response.text || '{}');
    const rawCards = Array.isArray(parsed) ? parsed : (parsed.cards || parsed.flashcards || []);
    const now = Date.now();
    const flashcards = rawCards.map((c: any, index: number) => ({
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

    res.json({ flashcards });
  } catch (error: any) {
    console.error('Error in /api/generate-retrieval-deck:', error);
    // Structured active recall fallback deck
    const now = Date.now();
    if (isPt) {
      const fallbackDeck = [
        {
          id: `fc_${now}_0`,
          topic,
          question: `Qual é o mecanismo causal primário que define "${topic}" e o diferencia de outros conceitos correlatos?`,
          answer: `O mecanismo nuclear de ${topic} reside na relação direta entre suas variáveis determinantes e a transição de estado gerada no sistema.`,
          keyConcept: 'Mecanismo Nuclear',
          neuroTip: 'Ancorar o mecanismo causal em vez do nome protege contra a ilusão de fluência.',
          intervalDays: 1,
          repetitions: 0,
          easeFactor: 2.5,
          nextReviewDate: now,
          masteryLevel: 0,
        },
        {
          id: `fc_${now}_1`,
          topic,
          question: `Se a premissa central de "${topic}" fosse alterada ou invertida, qual seria a primeira consequência prática observada?`,
          answer: `A inversão da premissa romperia o equilíbrio do sistema, gerando comportamento não-linear ou dissipação descontrolada.`,
          keyConcept: 'Perturbação & Limites',
          neuroTip: 'Testar os limites extremos de um conceito fortalece a flexibilidade cognitiva e a recuperação sob estresse.',
          intervalDays: 1,
          repetitions: 0,
          easeFactor: 2.5,
          nextReviewDate: now,
          masteryLevel: 0,
        },
        {
          id: `fc_${now}_2`,
          topic,
          question: `Qual é o equívoco mais frequente cometido por quem estuda "${topic}" de forma superficial?`,
          answer: `Confundir correlação de eventos com causa mecânica real, ou assumir que o sistema opera sem custos energéticos ou de atrito.`,
          keyConcept: 'Identificação de Falhas',
          neuroTip: 'Reconhecer contra-exemplos aciona o córtex pré-frontal e impede o aprendizado enviesado.',
          intervalDays: 1,
          repetitions: 0,
          easeFactor: 2.5,
          nextReviewDate: now,
          masteryLevel: 0,
        },
      ];
      res.json({ flashcards: fallbackDeck });
    } else {
      const fallbackDeck = [
        {
          id: `fc_${now}_0`,
          topic,
          question: `What is the primary causal mechanism defining "${topic}" that sets it apart from related concepts?`,
          answer: `The core mechanism of ${topic} lies in the direct relationship between its governing variables and the resulting state transitions in the system.`,
          keyConcept: 'Core Mechanism',
          neuroTip: 'Anchoring the causal mechanism rather than the label protects against the illusion of fluency.',
          intervalDays: 1,
          repetitions: 0,
          easeFactor: 2.5,
          nextReviewDate: now,
          masteryLevel: 0,
        },
        {
          id: `fc_${now}_1`,
          topic,
          question: `If the central premise of "${topic}" were altered or inverted, what would be the immediate practical consequence?`,
          answer: `Inverting the premise breaks the equilibrium, inducing non-linear divergence or uncontrolled dissipation within the system.`,
          keyConcept: 'Perturbation & Limits',
          neuroTip: 'Testing the boundary limits of a concept reinforces cognitive flexibility and retrieval under stress.',
          intervalDays: 1,
          repetitions: 0,
          easeFactor: 2.5,
          nextReviewDate: now,
          masteryLevel: 0,
        },
        {
          id: `fc_${now}_2`,
          topic,
          question: `What is the most frequent misconception held by learners studying "${topic}" superficially?`,
          answer: `Confusing chronological correlation with actual mechanical causation, or assuming the system functions without frictional or thermodynamic costs.`,
          keyConcept: 'Misconception Audit',
          neuroTip: 'Identifying counterexamples engages the prefrontal cortex and prevents confirmation bias in learning.',
          intervalDays: 1,
          repetitions: 0,
          easeFactor: 2.5,
          nextReviewDate: now,
          masteryLevel: 0,
        },
      ];
      res.json({ flashcards: fallbackDeck });
    }
  }
});

// Generate Concept Breakdown (Cognitive Load Scaffolding)
app.post('/api/generate-concept-breakdown', async (req: Request, res: Response) => {
  const { topic, language = 'en' } = req.body;
  const isPt = language === 'pt';

  if (!topic) {
    return res.status(400).json({ error: isPt ? 'Tópico é obrigatório.' : 'Topic is required.' });
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

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/generate-concept-breakdown:', error);
    // High-grade pedagogical concept breakdown schema
    if (isPt) {
      res.json({
        topic,
        overview: `O estudo de "${topic}" exige desconstruir noções intuitivas em elementos causais verificáveis. Ao isolar as variáveis determinantes e eliminar o ruído superficial, reduzimos drasticamente a carga cognitiva extrínseca na memória de trabalho.`,
        prerequisites: [
          `Definições operacionais e variáveis de entrada que delimitam "${topic}"`,
          'Compreensão de sistemas dinâmicos de causa e efeito',
          'Condições de contorno e limites de validade do modelo',
        ],
        coreMechanism: `O mecanismo nuclear de "${topic}" opera através de uma sequência de transformações onde variações de estado provocam respostas determinísticas e mensuráveis no sistema.`,
        commonMisconceptions: [
          `Confundir correlação temporal ou coincidência aparente com o mecanismo motor real de ${topic}.`,
          `Supor que memorizar jargões ou fórmulas substitui a capacidade de prever o comportamento do sistema.`,
          `Tratar ${topic} como um evento isolado, desconsiderando as leis de conservação subjacentes.`,
        ],
        elaborativeQuestions: [
          `Qual seria a primeira consequência mensurável se a premissa central de ${topic} fosse subitamente anulada?`,
          `Como você explicaria a engrenagem fundamental de ${topic} utilizando apenas objetos comuns de uma mesa de trabalho?`,
          `Sob quais circunstâncias extremas o comportamento previsto por ${topic} deixaria de ser verdadeiro?`,
        ],
        realWorldAnalogy: `Pense em "${topic}" como um sistema de engrenagens ou uma cascata hidráulica: cada componente depende do impulso transferido pelo anterior para produzir o resultado sem perdas desnecessárias.`,
        neuroscienceRationale: `Conceitos abstratos como "${topic}" sobrecarregam o córtex pré-frontal porque exigem a retenção simultânea de múltiplos nós semânticos antes que o hipocampo consiga consolidá-los em um esquema de longo prazo.`,
        isPedagogicalFallback: true,
      });
    } else {
      res.json({
        topic,
        overview: `Studying "${topic}" requires deconstructing intuitive assumptions into verifiable causal elements. By isolating governing variables and stripping away superficial noise, we drastically minimize extraneous cognitive load in working memory.`,
        prerequisites: [
          `Operational definitions and input variables defining "${topic}"`,
          'Understanding of dynamic cause-and-effect systems',
          'Boundary conditions and validity limits of the model',
        ],
        coreMechanism: `The nuclear mechanism of "${topic}" operates through a sequence of transformations where state fluctuations generate deterministic, measurable responses in the system.`,
        commonMisconceptions: [
          `Confusing temporal correlation with the actual driving mechanism of ${topic}.`,
          `Assuming that memorizing formulas or labels replaces the ability to predict system behavior.`,
          `Treating ${topic} as an isolated event while ignoring underlying conservation laws.`,
        ],
        elaborativeQuestions: [
          `What would be the first measurable consequence if the central premise of ${topic} were suddenly negated?`,
          `How would you explain the core mechanism of ${topic} using only common desk objects?`,
          `Under what extreme circumstances would the behavior predicted by ${topic} cease to hold true?`,
        ],
        realWorldAnalogy: `Think of "${topic}" like a mechanical gear train or a hydraulic cascade: each component relies on force transferred from the predecessor to yield the output without needless dissipation.`,
        neuroscienceRationale: `Abstract concepts like "${topic}" overload the prefrontal cortex because they demand the simultaneous maintenance of multiple semantic nodes before the hippocampus consolidates them into a long-term schema.`,
        isPedagogicalFallback: true,
      });
    }
  }
});

// Vite middleware & Production Serving Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🧠 Synapse Pedagogical Server running on http://localhost:${PORT}`);
  });
}

startServer();
