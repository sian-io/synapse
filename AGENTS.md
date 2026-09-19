## 1. Project Overview & Core Mission

**Synapse** is an elite educational AI agent and web application engineered strictly around **evidence-based cognitive neuroscience** and **active learning methodologies**. Unlike traditional generative AI tutors that produce passive, lengthy essays—which inadvertently induce the *illusion of explanatory depth* and *illusion of fluency*—Synapse acts as a cognitive gym.

### Core Pedagogical Directives

1. **Never Give Answers for Free:** Deconstruct problems, provide scaffolding (*andaimes cognitivos*), and demand active retrieval from the learner.
2. **Promote Long-Term Potentiation (LTP):** Stimulate synaptic consolidation through effortful recall, interrogative elaboration, and structured spacing.
3. **Bust Superficial Fluency:** Use Richard Feynman's principles to detect empty jargon, uncover cognitive blind spots, and demand intuitive physical analogies.
4. **Respect Working Memory Constraints:** Use John Sweller’s Cognitive Load Theory to deliver concise, atomic chunks that minimize extraneous load.
5. **Calibrate Metacognition:** Force learners to explicitly estimate their confidence to combat the Dunning-Kruger effect.

---

## 2. Theoretical Pillars (Cognitive Neuroscience)

Any iteration or harness rebuilding Synapse must adhere to these 6 foundational pillars:

| Pillar | Pioneer / Literature | Neurobiological Basis | Agent Implementation |
| :--- | :--- | :--- | :--- |
| **Active Retrieval Practice** | Roediger & Karpicke (2006) | Prefrontal cortex & hippocampal activation triggers LTP; increases synaptic AMPA/NMDA receptor density. | Flashcards with "Generation Effect" (drafting mandatory before revealing); challenging retrieval quizzes. |
| **Feynman Technique** | Richard Feynman / Rozenblit & Keil | Eliminates the "Illusion of Explanatory Depth" by forcing translation of abstract tokens into somatic/concrete networks. | Automated audit for ungrounded jargon, identification of logical breaks, and generation of everyday analogies. |
| **Socratic Inquiry & Elaboration** | Socrates / Pressley et al. (1992) | Stimulates semantic neocortical integration via causal linking (*"Why does this hold?"*, *"What triggers Y?"*). | Dialogical tutor that never answers directly; uses incremental hints and concludes each turn with a single guiding question. |
| **Cognitive Load Theory (CLT)** | John Sweller (1988) | Working memory holds only 4–7 elements. High extraneous load halts schema construction. | Deconstructs concepts into prerequisites, core mechanisms, common traps, and physical analogies. |
| **Desirable Difficulties** | Robert & Elizabeth Bjork (2011) | Productive struggle in retrieval triggers durable neuroplastic changes; effortless study produces fragile memories. | High cognitive friction prompts, edge-case perturbations, and validation of mistakes as biological signals. |
| **Metacognitive Calibration** | John Flavell (1979) / Kruger & Dunning | Dorsolateral prefrontal cortex self-monitoring; mitigates confirmation bias and overconfidence. | Explicit 1–5 confidence ratings prior to revealing answers, dynamically tuning the scaffolding level. |

---

## 3. Technology Stack & Environment

When rebuilding from scratch with an AI harness, use the following configuration:

- **Runtime / Language:** Node.js (v20+) or Bun with TypeScript (`~5.8.2`).
- **Server:** Express (`^4.21.2`) wrapped with `tsx` for TypeScript execution.
- **Frontend:** React 19 (`^19.0.1`), React DOM 19, Vite 6 (`^6.2.3`).
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite` & `tailwindcss@4`).
- **Icons & UI:** `lucide-react`, `motion` (Framer Motion v12), `react-markdown`.
- **LLM SDK:** `@google/genai` (`^2.4.0`) accessing Gemini Flash models (`gemini-3.8-flash`, `gemini-flash-latest`, `gemini-3.1-flash-lite`).
- **Environment Variables:**
  - `GEMINI_API_KEY`: Google Gemini API key.
  - `APP_URL`: Hosting deployment URL (optional for cloud runtime).
  - `PORT`: Default `3000`.

---

## 4. System Architecture

Synapse uses a **unified full-stack single-port pattern**:

- In **development**, Express serves as the primary HTTP server and injects Vite via middleware mode (`createViteServer({ server: { middlewareMode: true }, appType: 'spa' })`).
- In **production**, `vite build` creates static assets in `dist/`, and `esbuild server.ts --bundle --platform=node` generates `dist/server.cjs`. Express serves `dist/` statically with SPA fallback.

```
┌────────────────────────────────────────────────────────┐
│                   React 19 Frontend                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ UnifiedConceptBar (Syncs currentTopic globally)  │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Tabs: Socratic | Feynman | Retrieval | CLT | Doc │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────────────▲────────────────────────────┘
                            │ JSON API (/api/*)
┌───────────────────────────▼────────────────────────────┐
│                  Express Backend                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Fallback Runner (gemini-3.8-flash -> lite -> etc)│  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Resilient Fallback Heuristics (Offline-ready)    │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Vite Middleware / Static Production File Server  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 5. Agent Specifications, Prompts & API Contracts

### 5.1. Common Resilience Protocol (Fallback Strategy)

AI harnesses must implement the `generateWithFallback` pattern to guarantee continuous pedagogy even during upstream API limits or network transients:

```typescript
// Model Fallback Hierarchy
const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

// Exponential Jitter Backoff on 429 / 503 / RESOURCE_EXHAUSTED
// Heuristic Fallback Responses if all LLM attempts fail.
```

---

### 5.2. Endpoint 1: Socratic Tutor & Active Dialogue

- **Path:** `POST /api/chat`
- **Purpose:** Conduct iterative Socratic dialogue with scaffolding, cognitive phase tracking, and neurobiological anchors.
- **Request Body:**

  ```json
  {
    "messages": [
      { "role": "user", "content": "Por que a inflação aumenta quando o governo imprime dinheiro?" }
    ],
    "mode": "socratic",
    "currentTopic": "Inflação e Moeda",
    "studentCalibration": 3
  }
  ```

- **System Instruction (Exact Prompt):**

  ```text
  Você é o **Synapse**, um Agente de IA Pedagógico de Elite fundamentado estritamente em **Neurociência Cognitiva** e **Metodologias de Aprendizado Ativo** comprovadas pela ciência da aprendizagem:
  1. **Prática de Recuperação & Efeito de Testagem (Roediger & Karpicke, 2006)**: Não entregue respostas prontas! Force o aluno a recuperar a informação da memória de longo prazo (LTP - Potenciação de Longa Duração).
  2. **Método Socrático & Interrogação Elaborativa**: Guie o aluno por meio de perguntas perspicazes ("Por que isso ocorre?", "Qual é o elo causal entre X e Y?").
  3. **Técnica de Feynman**: Ao avaliar ou pedir explicações, proíba jargões vazios; exija analogias simples e cheque lacunas de profundidade ilusória.
  4. **Teoria da Carga Cognitiva (Sweller)**: Entregue blocos curtos, digeríveis e precisos. Evite "overload" de texto passivo.
  5. **Dificuldade Desejável (Robert Bjork)**: O aprendizado real exige esforço produtivo. Incentive o erro como sinal biológico de neuroplasticidade.
  6. **Metacognição (Flavell)**: Provoque reflexão sobre o próprio processo de raciocínio e verificação de certeza.

  Modo Pedagógico Atual: ${mode || 'socratic'}
  Tópico em Estudo: ${currentTopic || 'Geral'}
  ${studentCalibration ? `Nível de Certeza Metacognitiva do Estudante: ${studentCalibration}/5` : ''}

  Diretrizes Específicas por Modo:
  - socratic: Faça perguntas que decomponham o problema. Dê pistas graduais (scaffolding/andaime), mas faça o aluno concluir o raciocínio. Termine com UMA pergunta instigante.
  - feynman: Aja como um avaliador perspicaz. Aponte termos técnicos que precisam ser desempacotados, elogie boas analogias e peça uma simplificação ainda maior de partes vagas.
  - active_retrieval: Desafie o estudante com um problema prático ou pergunta de recuperação conceitual profunda (não decoreba). Avalie a resposta dele criticamente.
  - metacognition: Desafie o estudante a auditar como ele chegou a uma conclusão, quais premissas ele adotou e onde ele sente que sua compreensão é mais frágil.

  Formate sua resposta em Markdown limpo, direto, empático e focado na ação do estudante. No final da resposta, inclua sempre uma seção especial chamada:
  ```meta
  CognitivePhase: [ex: Recuperação Ativa | Diagnóstico de Ilusão | Interrogação Elaborativa | Consolidação Sináptica]
  NeuroTip: [Uma frase rápida explicando o mecanismo neurobiológico do que está sendo treinado]
  SuggestedNextSteps: [Ação 1 | Ação 2]
  ```

  ```

- **Metadata Parsing Logic:**
  Backend extracts content within the ` ```meta ... ``` ` block using regex:
  - `CognitivePhase:` $\to$ `meta.cognitivePhase`
  - `NeuroTip:` $\to$ `meta.desirableDifficultyNote`
  - `SuggestedNextSteps:` (split by `|`) $\to$ `meta.suggestedActions`
  - Remaining text is stripped and rendered cleanly in markdown.

- **Response Body:**

  ```json
  {
    "content": "Imagine que em uma ilha isolada existam apenas 10 maçãs e 10 moedas de ouro...\n\nSe de repente cada habitante encontrar mais 10 moedas na praia, a quantidade de maçãs aumentou?",
    "meta": {
      "cognitivePhase": "Interrogação Elaborativa",
      "desirableDifficultyNote": "Construir modelos causais simples estimula a rede neuronal default a criar âncoras lógicas duradouras.",
      "suggestedActions": [
        "Responder o que acontece com o preço de cada maçã",
        "Pensar em como a velocidade de circulação afeta isso",
        "Explicar com outra analogia física"
      ]
    }
  }
  ```

---

### 5.3. Endpoint 2: Feynman Studio Auditor

- **Path:** `POST /api/feynman-evaluate`
- **Purpose:** Audit a student's explanation against a target audience, detecting unexplained jargon, logical gaps, and generating analogies.
- **Request Body:**

  ```json
  {
    "topic": "Fotossíntese",
    "explanation": "As plantas usam a energia fotônica para excitar elétrons na clorofila e produzir ATP e NADPH que fixam o CO2.",
    "targetAudience": "uma criança de 10 anos curiosa"
  }
  ```

- **Structured Output Schema (`responseSchema`):**

  ```typescript
  {
    score: number;                   // 0 to 100 based on clarity & lack of jargon
    clarityAssessment: string;       // Pedagogical critique
    jargonIdentified: string[];      // Detected jargon words (e.g. "fotônica", "NADPH")
    conceptualGaps: string[];        // Missing causal steps ("de onde vem a água?", etc.)
    strengths: string[];             // What the learner explained well
    analogiesEvaluation: string;     // Critique of analogies provided
    suggestedAnalogy: string;        // Vivid real-world analogy
    simplifiedAlternative: string;   // How Feynman would explain in 2-3 lines
    followUpQuestion: string;        // Socratic question targeted at the biggest gap
  }
  ```

- **Prompt Construction:**

  ```text
  Avalie a seguinte explicação de um estudante utilizando a **Técnica de Feynman** e princípios neurocognitivos de compreensão profunda:
  - Tópico: "${topic}"
  - Público-alvo pretendido: "${targetAudience}"
  - Explicação do estudante: """${explanation}"""

  Analise criticamente:
  1. Clareza e fidelidade científica (sem distorções graves).
  2. Detecção de jargões técnicos não explicados (palavras pomposas que escondem falta de compreensão mecânica).
  3. Lacunas de raciocínio onde falta o "como" ou "por que".
  4. Qualidade e precisão das analogias utilizadas.
  5. Uma alternativa hiper-simplificada e elegante.
  6. Uma pergunta socrática cirúrgica para que o estudante conserte sua maior lacuna.
  ```

---

### 5.4. Endpoint 3: Active Retrieval Deck Synthesizer

- **Path:** `POST /api/generate-retrieval-deck`
- **Purpose:** Generate mechanism-focused flashcards (avoiding trivial rote memorization) incorporating Spaced Repetition (SM-2 parameters).
- **Request Body:**

  ```json
  {
    "topic": "Neuroplasticidade",
    "difficulty": "intermediario",
    "count": 4
  }
  ```

- **Structured Output Schema (`responseSchema`):**

  ```typescript
  {
    cards: Array<{
      question: string;     // Mechanism-driven inquiry ("O que ocorre se X falhar?")
      answer: string;       // Mental model explanation
      keyConcept: string;   // Core node tested
      neuroTip: string;     // Mnemonic anchor / neuroscience hint
    }>
  }
  ```

- **Server-Side Card Enrichment:**
  Before returning to the frontend, each card is hydrated with SM-2 spaced repetition defaults:

  ```typescript
  {
    id: `fc_${Date.now()}_${index}`,
    topic,
    question: c.question,
    answer: c.answer,
    keyConcept: c.keyConcept,
    neuroTip: c.neuroTip,
    intervalDays: 1,
    repetitions: 0,
    easeFactor: 2.5,
    nextReviewDate: Date.now(),
    masteryLevel: 0 // Range 0 (new) to 5 (consolidated)
  }
  ```

---

### 5.5. Endpoint 4: Cognitive Load & Schema Breakdown (Sweller)

- **Path:** `POST /api/generate-concept-breakdown`
- **Purpose:** Break complex topics into atomic components to eliminate extraneous cognitive load.
- **Request Body:**

  ```json
  { "topic": "Mecânica Quântica e Princípio da Incerteza" }
  ```

- **Structured Output Schema (`responseSchema`):**

  ```typescript
  {
    topic: string;
    overview: string;                 // Low extraneous load overview
    prerequisites: string[];          // Prior neural schemas required
    coreMechanism: string;            // The fundamental engine in 1 sentence
    commonMisconceptions: string[];   // 3 intuitive traps
    elaborativeQuestions: string[];   // 3 deep questions ("Why?", "What if?")
    realWorldAnalogy: string;         // Dual coding physical analogy
    neuroscienceRationale: string;    // Why working memory overloads on this concept
  }
  ```

---

## 6. Mathematical & Algorithmic Foundations

### 6.1. Spaced Repetition Algorithm (Modified SuperMemo-2 / SM-2)

Each retrieval card in Synapse tracks retention with an adapted SM-2 decay model:

Let $q \in \{0, 1, 2, 3\}$ be the student's self-assessed recall quality:

- $0$: **Forgot / Blank** (*Errei / Branco*)
- $1$: **Difficult Recall** (*Muito Difícil*)
- $2$: **Good Recall** (*Bom Esforço*)
- $3$: **Perfect Recall** (*Perfeito / Fácil*)

#### State Transition Equations

1. **Ease Factor Update ($EF'$):**
   $$EF' = \max\left(1.3, \; EF + \Delta EF\right)$$
   Where:
   $$\Delta EF = \begin{cases}
   -0.20 & \text{if } q = 0 \\
   -0.10 & \text{if } q = 1 \\
   0.00 & \text{if } q = 2 \\
   +0.15 & \text{if } q = 3
   \end{cases}$$

2. **Interval Days Update ($I'$):**
   $$I' = \begin{cases}
   1 & \text{if } q = 0 \\
   \max(1, \lfloor I \times 1.2 \rfloor) & \text{if } q = 1 \\
   \max(2, \lfloor I \times EF \rfloor) & \text{if } q = 2 \\
   \max(3, \lfloor I \times EF \times 1.3 \rfloor) & \text{if } q = 3
   \end{cases}$$

3. **Mastery Level ($M \in [0, 5]$):**
   $$M' = \begin{cases}
   0 & \text{if } q = 0 \\
   \min(5, M + 1) & \text{if } q \in \{1, 2\} \\
   \min(5, M + 2) & \text{if } q = 3
   \end{cases}$$

4. **Next Scheduled Review Timestamp:**
   $$T_{\text{next}} = T_{\text{now}} + (I' \times 86,400,000 \text{ ms})$$

---

### 6.2. Metacognitive Calibration Metric

The learner inputs their confidence level $C \in \{1, 2, 3, 4, 5\}$ before answering. In future iterations, actual correctness $P \in \{0, 1\}$ can be compared against $C$ to compute the **Brier Calibration Score**:

$$B = \frac{1}{N} \sum_{i=1}^{N} \left( \frac{C_i}{5} - P_i \right)^2$$

A lower Brier score denotes superior metacognitive calibration (reduced Dunning-Kruger gap).

---

## 7. Frontend Structure & User Flows

The application UI is divided into 5 cohesive views synchronized by a persistent concept bar:

```
App.tsx (Main Coordinator & LocalStorage Sync)
 ├── UnifiedConceptBar (Syncs currentTopic, quick concept suggestions)
 ├── Tab 1: SocraticTutor
 │    ├── Mode Selector (socratic | feynman | active_retrieval | metacognition)
 │    ├── Chat Stream (Markdown, Phase Badges, NeuroTips, Next Action Buttons)
 │    ├── Quick Socratic Prompts (Premise Challenger, Elaborative Question)
 │    └── Metacognitive Certainty Slider (1 to 5)
 ├── Tab 2: FeynmanStudio
 │    ├── Target Audience Selector (10yo child | Intelligent Layperson | Beginner)
 │    ├── Active Explanation Textarea with live word counter & samples
 │    └── Evaluation Card (Score ring, Jargon list, Conceptual Gaps, Feynman Ideal)
 ├── Tab 3: ActiveRetrievalLab
 │    ├── Generator Bar (Topic & Difficulty selector)
 │    └── Flashcard Viewer (Drafting box for "Generation Effect", Flipper, SM-2 buttons)
 ├── Tab 4: CognitiveMap
 │    └── Sweller CLT Schema (Prerequisites, Core Mechanism, Traps, Analogies)
 └── Tab 5: NeuroscienceGuide
      ├── Passive vs Active Comparison Matrix
      ├── 6 Pedagogical Pillars Detailed Cards
      └── Memory Consolidation Infographic (Encoding -> Feynman -> LTP -> Sleep)
```

### Data Storage Contracts (Local-First)

- `synapse_current_topic`: Current string active across all tools.
- `synapse_chat_history`: Array of `ChatMessage`.
- `synapse_flashcards`: Array of `Flashcard` objects.
- `synapse_stats`: Object tracking streaks, active minutes, and counts (`CognitiveStats`).

---

## 8. Harness Rebuilding Guide (Zero-to-Hero)

Follow this recipe when directing an autonomous coding agent to spin up a new iteration from scratch:

### Step 1: Initialize Project & Install Packages

```bash
# 1. Initialize package
npm init -y

# 2. Install production dependencies
npm install @google/genai @tailwindcss/vite @vitejs/plugin-react dotenv express lucide-react motion react react-dom react-markdown vite

# 3. Install developer dependencies
npm install -D @types/express @types/node autoprefixer esbuild tailwindcss tsx typescript
```

### Step 2: Configure TypeScript (`tsconfig.json`)

Set `"target": "ES2022"`, `"moduleResolution": "bundler"`, `"jsx": "react-jsx"`, `"paths": { "@/*": ["./*"] }`, and `"allowImportingTsExtensions": true`.

### Step 3: Configure Tailwind v4 & Vite (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

### Step 4: Implement Express Server (`server.ts`)

- Instantiate `GoogleGenAI` with `process.env.GEMINI_API_KEY`.
- Implement `generateWithFallback(ai, payload)` with exponential backoff on transient errors (`429`, `503`, `RESOURCE_EXHAUSTED`).
- Register endpoints:
  - `POST /api/chat`
  - `POST /api/feynman-evaluate`
  - `POST /api/generate-retrieval-deck`
  - `POST /api/generate-concept-breakdown`
- Mount Vite in middleware mode if `NODE_ENV !== 'production'`.

### Step 5: Implement React State & Views (`src/`)

- Ensure `UnifiedConceptBar` writes to `localStorage` and updates parent state so switching between Socratic, Feynman, and Retrieval maintains context.
- Implement the "Generation Effect" textarea in `ActiveRetrievalLab.tsx` so users must type an answer before checking it.

---

## 9. Verification & Quality Acceptance Criteria

An automated test or harness validation run must check off the following criteria:

- [ ] **No Direct Answers:** Socratic queries like *"O que é fotossíntese?"* must yield an everyday analogy or leading question, NOT an encyclopedia definition.
- [ ] **Jargon Detection:** Submitting an explanation with ungrounded terms like *"ATP synthase"* or *"mitocôndria"* to `FeynmanStudio` must flag them in `jargonIdentified`.
- [ ] **SM-2 State Integrity:** Rating a flashcard as `0` resets `intervalDays` to 1 and `repetitions` to 0. Rating `3` increments `easeFactor` and extends intervals.
- [ ] **Resilience:** The backend must return valid, pedagogically structured heuristic fallback JSON even when `GEMINI_API_KEY` is missing or upstream is rate-limited.
- [ ] **Single Port Access:** Web app and API endpoints must both resolve through port `3000`.
