# Technical Documentation & Engineering Guide: Synapse (v1)

This document outlines the technical architecture, engineering decisions, dependency choices, and internal workings of **Synapse**. Its intended audience includes human engineers and autonomous AI agents tasked with extending, auditing, or maintaining the codebase.

---

## 1. How Synapse Works (Technical Architecture & "The How")

Synapse operates on a unified full-stack TypeScript architecture, where a single Node.js process orchestrates both the REST API backend and the frontend development/serving pipeline via Vite.

```
+-------------------------------------------------------------------------+
|                              Node.js Process                            |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                     Express Server (server.ts)                    |  |
|  |                                                                   |  |
|  |   [Port 3000]                                                     |  |
|  |   ├── /api/health                                                 |  |
|  |   ├── /api/chat                    ──> Gemini SDK / Fallback      |  |
|  |   ├── /api/feynman-evaluate        ──> Gemini SDK (JSON Schema)   |  |
|  |   ├── /api/generate-retrieval-deck ──> Gemini SDK (JSON Schema)   |  |
|  |   └── /api/generate-concept-breakdown ──> Gemini SDK (JSON Schema)|  |
|  |                                                                   |  |
|  |   Vite Middleware (dev) / Express Static Dist (prod)              |  |
|  +---------------------------------+---------------------------------+  |
+------------------------------------|------------------------------------+
                                     │ Serves SPA
                                     v
+-------------------------------------------------------------------------+
|                        Browser Client (React 19)                        |
|                                                                         |
|  App.tsx                                                                |
|  ├── UnifiedConceptBar (Shared Topic State & Synchronization)           |
|  ├── SocraticTutor (Conversational Engine & Metacognitive Certainty)   |
|  ├── FeynmanStudio (Explanation Audit & Jargon Extraction)             |
|  ├── ActiveRetrievalLab (SM-2 Spaced Repetition Engine & Recall)       |
|  ├── CognitiveMap (Sweller / Paivio Structural Deconstruction)         |
|  └── NeuroscienceGuide (Theoretical Foundations)                        |
|                                                                         |
|  Client Storage: localStorage (synapse_chat_history, flashcards, stats) |
+-------------------------------------------------------------------------+
```

### 1.1 Frontend/Backend Unification via Vite Middleware

- In development (`process.env.NODE_ENV !== 'production'`), `server.ts` boots Vite in middleware mode (`createServer({ server: { middlewareMode: true }, appType: 'spa' })`).
- API routes under `/api/*` are handled directly by Express before non-API traffic is delegated to Vite middleware.
- In production, Express serves compiled static files from `dist/` and falls back to `dist/index.html` for client-side routing.
- **Design Rationale**: Eliminates CORS complications, avoids reverse-proxy setups during local development, and allows the entire stack to run with a single command (`npm run dev`).

---

## 2. Tooling and Technology Choices

### 2.1 Backend

- **Node.js + Express 4**: Minimalist HTTP framework with low overhead, asynchronous middleware support, and straightforward bundling via `esbuild`.
- **Google GenAI Official SDK `@google/genai`**: Version 2.4.0+. Connects directly to the latest Gemini models, with native support for structured output (`responseSchema`, `responseMimeType: 'application/json'`) and HTTP header customization.
- **`tsx`**: TypeScript execution engine for Node.js with native ESM support (`"type": "module"`), used for hot execution of `server.ts` without intermediate compilation steps.
- **`esbuild`**: High-performance bundler used in `npm run build` to produce the production CJS bundle (`dist/server.cjs`).

### 2.2 Frontend

- **React 19 `package.json`**: Modern UI library delivering high rendering efficiency and stable state hooks (`useState`, `useEffect`, `useRef`).
- **Tailwind CSS v4 `package.json`**: Configured via `@tailwindcss/vite` in `vite.config.ts`, delivering responsive styling with native CSS variable support.
- **Lucide React `package.json`**: Lightweight vector icon suite providing visual signals for pedagogical states and metadata.
- **`react-markdown` `package.json`**: Markdown parser rendering structured outputs from the Socratic tutor.

---

## 3. Resilience Strategy and Fallbacks

The platform is designed to maintain uninterrupted pedagogical continuity even in cases of API quota exhaustion, network failures, or missing environment variables.

### 3.1 Gemini Model Cascade

The backend implements redundancy across approved models:

```typescript
const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
```

- Each model is attempted up to twice.
- Transient errors (`503`, `UNAVAILABLE`, `429`, or `RESOURCE_EXHAUSTED`) trigger a jittered backoff (`750ms + Math.random() * 500ms`) before retrying or advancing to the next candidate model.

### 3.2 Local Pedagogical Fallbacks

If all upstream calls fail or `GEMINI_API_KEY` is not set, each endpoint executes a deterministic heuristic routine:

- `/api/chat`: Analyzes the student's latest message and returns a Socratic question centered on cause-and-effect mechanisms, keeping the `meta` block intact.
- `/api/feynman-evaluate`: Performs lexical inspection on the explanation, flags abstract terms as potential jargon, computes a score proportional to length, and generates a closing Socratic question.
- `/api/generate-retrieval-deck`: Returns a structured default set of challenging cards covering causal mechanics, boundary perturbations, and frequent misconceptions.
- `/api/generate-concept-breakdown`: Assembles prerequisites, core mechanism, misconceptions, and structural analogies with `isPedagogicalFallback: true`.

---

## 4. Prompt Engineering and API Contracts

### 4.1 Socratic Chat: `POST /api/chat`

- **System Instruction**: Strictly forbids direct explanatory answers and mandates concluding with a single thought-provoking question.
- **Metadata Extraction**: The model appends a delimited metadata block at the end of the text:

  ```
  ```meta
  CognitivePhase: [Phase]
  NeuroTip: [Neurobiological explanation]
  SuggestedNextSteps: [Action 1 | Action 2]
  ```
  ```

  The server parses this block via regular expressions in `server.ts` and returns clean text in `content` and structured data in `meta`.

### 4.2 Feynman Evaluation: `POST /api/feynman-evaluate`

- Uses **Structured Outputs** from the Gemini API with `responseMimeType: 'application/json'` and a strict schema defined via enum `Type`.
- Output Contract (`FeynmanEvaluation`):
  - `score` (integer 0-100)
  - `clarityAssessment` (string)
  - `jargonIdentified` (array of strings)
  - `conceptualGaps` (array of strings)
  - `strengths` (array of strings)
  - `analogiesEvaluation` (string)
  - `suggestedAnalogy` (string)
  - `simplifiedAlternative` (string)
  - `followUpQuestion` (string)

### 4.3 Deck Generation: `POST /api/generate-retrieval-deck`

- Structured JSON schema producing a `cards` array containing:
  - `question` (causal mechanism question, not trivia)
  - `answer` (complete mental model)
  - `keyConcept` (tested core concept)
  - `neuroTip` (mnemonic anchor)
- The backend normalizes generated cards to the `Flashcard` contract, initializing spaced repetition parameters (`intervalDays: 1`, `repetitions: 0`, `easeFactor: 2.5`, `masteryLevel: 0`).

### 4.4 Conceptual Breakdown: `POST /api/generate-concept-breakdown`

- JSON schema returning `ConceptBreakdown`:
  - `topic`, `overview`, `prerequisites`, `coreMechanism`, `commonMisconceptions`, `elaborativeQuestions`, `realWorldAnalogy`, `neuroscienceRationale`.

---

## 5. Client-Side Spaced Repetition Algorithm

In `ActiveRetrievalLab.tsx`, the `handleRateCard` function implements an adaptation of the **SM-2** algorithm:

```typescript
// Quality: 0 = Forgot / Blank, 1 = Hard, 2 = Good, 3 = Perfect
if (quality === 0) {
  newInterval = 1;
  newRepetitions = 0;
  newEase = Math.max(1.3, currentCard.easeFactor - 0.2);
  newMastery = 0;
} else if (quality === 1) {
  newInterval = Math.max(1, Math.round(currentCard.intervalDays * 1.2));
  newRepetitions += 1;
  newEase = Math.max(1.3, currentCard.easeFactor - 0.1);
  newMastery = Math.min(5, currentCard.masteryLevel + 1);
} else if (quality === 2) {
  newInterval = Math.max(2, Math.round(currentCard.intervalDays * currentCard.easeFactor));
  newRepetitions += 1;
  newMastery = Math.min(5, currentCard.masteryLevel + 1);
} else {
  newInterval = Math.max(3, Math.round(currentCard.intervalDays * currentCard.easeFactor * 1.3));
  newRepetitions += 1;
  newEase = currentCard.easeFactor + 0.15;
  newMastery = Math.min(5, currentCard.masteryLevel + 2);
}
```

The next review timestamp is calculated by adding `newInterval * 86400000` milliseconds to the current time.

---

## 6. State Management and Data Lifecycle

### 6.1 Global State and Persistence

The root component `App.tsx` keeps primary state synchronized via `localStorage`:

- `synapse_current_topic`: Active concept entered by the user.
- `synapse_stats`: `CognitiveStats` object tracking retrieval attempts, Feynman explanations, Socratic questions answered, retention streak days, and total active minutes.
- `synapse_chat_history`: Message history for the Socratic tutor.
- `synapse_flashcards`: Active flashcard deck.

### 6.2 Cross-Tool Communication

- The `currentTopic` state is passed down to all views.
- The `handleOpenSocraticWithPrompt` callback in `App.tsx` allows buttons inside `FeynmanStudio` and `CognitiveMap` to set a pre-formatted prompt, switch the active tab to `socratic`, and immediately begin guided inquiry.

---

## 7. Guidelines for Modifications and Extensions

### 7.1 Rules for AI Agents

1. **Preserve Pedagogical Stance**: The agent must never be instructed to answer conceptual questions directly in an expository manner. Any prompt modifications must uphold the policy of guiding students to deduce answers themselves.
2. **Adhere to Type Contracts**: All TypeScript interfaces in `src/types.ts` must strictly mirror the schemas defined in `server.ts`.
3. **Maintain Heuristic Fallbacks**: When introducing or modifying endpoints, always provide deterministic offline fallbacks to ensure application resilience.
