# Technical Documentation & Engineering Guide: Synapse (v1)

This document outlines the technical architecture, engineering decisions, dependency choices, and internal workings of **Synapse**. Its intended audience includes human engineers and autonomous AI agents tasked with extending, auditing, or maintaining the codebase.

---

## 1. How Synapse Works (Technical Architecture & "The How")

Synapse operates on a unified full-stack TypeScript architecture powered by **Bun**, **Hono**, and **Vite**, where a single runtime orchestrates both the Web Standards REST API backend and the React 19 frontend pipeline.

```
+-------------------------------------------------------------------------+
|                               Bun Runtime                               |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |            Hono Server (server.ts -> export type AppType)         |  |
|  |                                                                   |  |
|  |   [Port 3000 - Web Standards Fetch API & Hono RPC]                |  |
|  |   ├── /api/health                   ──> Status & BYOK Proxy Mode  |  |
|  |   ├── /api/chat                     ──> Multi-Provider Proxy      |  |
|  |   ├── /api/feynman-evaluate         ──> Multi-Provider Proxy      |  |
|  |   ├── /api/generate-retrieval-deck  ──> Multi-Provider Proxy      |  |
|  |   └── /api/generate-concept-breakdown ──> Multi-Provider Proxy    |  |
|  |                                                                   |  |
|  |   @hono/vite-dev-server (dev) / Hono Bun serveStatic Dist (prod)  |  |
|  +---------------------------------+---------------------------------+  |
+------------------------------------|------------------------------------+
                                     │ Serves SPA & End-to-End RPC Types
                                     v
+-------------------------------------------------------------------------+
|                        Browser Client (React 19)                        |
|                                                                         |
|  src/api.ts: hc<AppType>('/') (Typed Hono RPC Client with x-ai-config)  |
|  App.tsx                                                                |
|  ├── AIConfigContext (BYOK Management, Storage & Validation)            |
|  ├── UnifiedConceptBar (Shared Topic State & Synchronization)           |
|  ├── SocraticTutor (Conversational Engine & Metacognitive Certainty)   |
|  ├── FeynmanStudio (Explanation Audit & Jargon Extraction)             |
|  ├── ActiveRetrievalLab (SM-2 Spaced Repetition Engine & Recall)       |
|  ├── CognitiveMap (Sweller / Paivio Structural Deconstruction)         |
|  └── NeuroscienceGuide (Theoretical Foundations)                        |
|                                                                         |
|  Client Storage: localStorage (synapse_ai_config, chat, cards, stats)   |
+-------------------------------------------------------------------------+
```

### 1.1 Frontend/Backend Unification via `@hono/vite-dev-server`, Hono RPC & Bun

- In development (`bun run dev`), Vite starts the dev server on port `3000` and uses `@hono/vite-dev-server` to dispatch `/api/*` requests directly to the Hono application (`server.ts`) via standard Web `Request`/`Response` objects while serving the React 19 SPA with HMR.
- In production (`bun run start`, which executes `bun server.ts`), Bun natively runs `server.ts` without any secondary backend bundling step (`esbuild` is eliminated) and serves compiled static assets from `dist/` via `hono/bun`'s `serveStatic`.
- **End-to-End Type Safety via Hono RPC**: Routes in `server.ts` are chained and typed with `hono/validator` (`validator('json', ...)`), exporting `export type AppType = typeof routes`. The frontend (`src/api.ts`) instantiates `hc<AppType>('/')` from `hono/client` with a dynamic headers hook that injects the user's `x-ai-config` from `localStorage` on every request. This gives all React components compile-time verified request payloads, status code narrowing (`res.ok`), and response types with zero extra dependencies or code generation.
- **Design Rationale**: Eliminates Node.js HTTP coupling, `express`, `tsx`, `esbuild`, manual `createViteServer` middleware injection, and untyped `fetch` calls, unifying execution around native TypeScript and open Web Standards.

---

## 2. Tooling and Technology Choices

### 2.1 Backend & Runtime

- **Bun**: All-in-one JavaScript/TypeScript runtime and package manager (`bun.lock`). Executes `server.ts` natively in both development and production, and automatically loads `.env` variables without requiring `dotenv`.
- **Hono & Hono RPC (`hono`, `hono/validator`, `hono/client`)**: Ultrafast, lightweight Web framework built entirely on Web Standards (`Request`, `Response`, `Fetch`), providing built-in end-to-end RPC type inference (`hc<AppType>`) without external schema libraries.
- **`@hono/vite-dev-server`**: Bridges Vite's development server with the Hono application via the Fetch API, preserving single-port HMR without Connect/Express middleware coupling.
- **Native Multi-Provider Inference (`fetch`)**: Zero external AI SDK dependencies. The server implements `runInference` in `server.ts` using native Web `fetch`, communicating directly with OpenAI (Chat Completions and Responses API), Anthropic Messages API, Google Gemini REST API, and local Ollama instances.

### 2.2 Frontend

- **React 19 `package.json`**: Modern UI library delivering high rendering efficiency and stable state hooks (`useState`, `useEffect`, `useRef`).
- **AI Configuration Context (`src/context/AIConfigContext.tsx`)**: Manages the BYOK lifecycle, credential drafts, validation (`isAIConfigValid`), password visibility toggles, and persistence to `localStorage` under `synapse_ai_config`.
- **Hono Client (`hono/client`)**: Consumes `AppType` from `server.ts` in `src/api.ts` (`export const api = hc<AppType>('/')`) for type-safe RPC calls (`api.api.chat.$post`, `api.api['feynman-evaluate'].$post`, etc.).
- **Tailwind CSS v4 `package.json`**: Configured via `@tailwindcss/vite` in `vite.config.ts`, delivering responsive styling with native CSS variable support.
- **Lucide React `package.json`**: Lightweight vector icon suite providing visual signals for pedagogical states and metadata.
- **`react-markdown` `package.json`**: Markdown parser rendering structured outputs from the Socratic tutor.

---

## 3. Bring Your Own Key (BYOK) Architecture & Multi-Provider Inference

Synapse uses a **Bring Your Own Key (BYOK)** stateless proxy architecture. The backend server does not store, log, or persist provider credentials to disk or databases; API keys reside exclusively in the client's browser `localStorage` and are transmitted per request.

### 3.1 Configuration Resolution & Header Injection

On each client request, the typed Hono RPC client (`src/api.ts`) automatically extracts the saved configuration from `localStorage` under `synapse_ai_config` and attaches it via the `x-ai-config` HTTP header:

```typescript
export const api = hc<AppType>('/', {
  headers: () => {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(AI_CONFIG_STORAGE_KEY) : null;
    return raw ? { 'x-ai-config': raw } : ({} as Record<string, string>);
  },
});
```

On the server, `resolveAIConfig(c, bodyConfig, isPt)` extracts the configuration from either the request body (`aiConfig`) or the `x-ai-config` header. If missing or invalid (missing `apiStandard`, `baseUrl`, or `model`), it throws an error prompting the user to configure their API credentials via the UI gear button.

### 3.2 Supported Providers & Standards

The inference function `runInference` in `server.ts` standardizes requests across four major API protocols using Web Standards `fetch`:

1. **OpenAI (`openai`)**:
   - Supports Chat Completions (`/chat/completions` or `/v1/chat/completions`) and the Responses API (`/responses` or `/v1/responses`), selectable via `openaiApiType: 'completions' | 'responses'`.
   - Passes `response_format: { type: 'json_object' }` (or `text: { format: { type: 'json_object' } }`) when `jsonMode: true`.
   - Authenticates via `Authorization: Bearer <apiKey>`.

2. **Anthropic (`anthropic`)**:
   - Calls the Messages API (`/messages` or `/v1/messages`).
   - Supports configurable `maxTokens` (defaults to `2048`).
   - Sets headers `x-api-key: <apiKey>` and `anthropic-version: 2023-06-01`.
   - Maps the system prompt to the top-level `system` property and conversation messages to `{ role: 'user' | 'assistant', content }`.

3. **Google Gemini (`google`)**:
   - Calls the direct REST endpoint (`/v1beta/models/{model}:generateContent`).
   - Passes API key via `x-goog-api-key` header.
   - Maps system instructions to `systemInstruction.parts` and conversational history to `contents` (`role: 'user' | 'model'`).
   - Passes `generationConfig: { responseMimeType: 'application/json' }` when `jsonMode: true`.

4. **Ollama (`ollama`)**:
   - Connects to local or self-hosted Ollama instances (`/api/chat` or `/chat`).
   - No API key required (passes optional `Authorization: Bearer` if specified).
   - Maps system prompt into the messages array and sets `stream: false` and `format: 'json'` when `jsonMode: true`.

### 3.3 Structured JSON Processing & Error Handling

- **`cleanJsonText`**: Strips markdown code fences (````json ...````) before executing `JSON.parse` to avoid parsing failures across varied LLM providers.
- **Transparent Error Propagation**: Upstream inference errors (such as 401 Unauthorized, 429 Quota Exceeded, or 503 Provider Unavailable) are caught and surfaced as HTTP 503/400 with descriptive localized messages in the student's selected language (`en` or `pt`). Silent mock responses that disguise inference failures are removed to ensure transparency.

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

  The server parses this block via regular expressions in `server.ts`, maps cognitive phase names via `translateCognitivePhase` for consistency in English or Portuguese, and returns clean text in `content` and structured data in `meta`.

### 4.2 Feynman Evaluation: `POST /api/feynman-evaluate`

- Uses `runInference` with `jsonMode: true` and prompt engineering mandating a strict JSON structure.
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

- Executes `runInference` with `jsonMode: true` producing a `cards` array containing:
  - `question` (causal mechanism question, not trivia)
  - `answer` (complete mental model)
  - `keyConcept` (tested core concept)
  - `neuroTip` (mnemonic anchor)
- The backend normalizes generated cards to the `Flashcard` contract, initializing spaced repetition parameters (`intervalDays: 1`, `repetitions: 0`, `easeFactor: 2.5`, `masteryLevel: 0`), and returns `{ flashcards, cards }`.

### 4.4 Conceptual Breakdown: `POST /api/generate-concept-breakdown`

- Executes `runInference` with `jsonMode: true` returning `ConceptBreakdown`:
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

- `synapse_ai_config`: Active AI provider credentials and model configuration (API standard, base URL, model name, API key, endpoint type, max tokens).
- `synapse_current_topic`: Active concept entered by the user.
- `synapse_stats`: `CognitiveStats` object tracking retrieval attempts, Feynman explanations, Socratic questions answered, retention streak days, and total active minutes.
- `synapse_chat_history`: Message history for the Socratic tutor.
- `synapse_flashcards`: Active flashcard deck.

### 6.2 Cross-Tool Communication

- The `currentTopic` state is passed down to all views.
- The `handleOpenSocraticWithPrompt` callback in `App.tsx` allows buttons inside `FeynmanStudio` and `CognitiveMap` to set a pre-formatted prompt, switch the active tab to `socratic`, and immediately begin guided inquiry.

---

## 7. Guidelines for Modifications and Extensions

### 7.1 General Rules for AI Agents

1. **Preserve Pedagogical Stance**: The agent must never be instructed to answer conceptual questions directly in an expository manner. Any prompt modifications must uphold the policy of guiding students to deduce answers themselves.
2. **Adhere to Type Contracts & Hono RPC**: All TypeScript interfaces in `src/types.ts` must strictly mirror the schemas defined in `server.ts`. Keep API routes chained on `const routes = app...` in `server.ts` with `jsonBody<...>()` and explicit status codes (`200`, `400`) so `export type AppType = typeof routes` and `src/api.ts` (`hc<AppType>('/')`) remain end-to-end type-safe.
3. **Maintain Stateless BYOK Architecture**: All LLM interactions must flow through `resolveAIConfig` and `runInference`. Do not persist user API keys on the server or reintroduce silent mock answers that disguise inference failures.

### 7.2 UI & Aesthetic Rules (Monochrome Precision)

All frontend components in `src/` MUST strictly obey these architectural and aesthetic constraints:

1. **Color & Luminance Hierarchy (Pure Grayscale)**:
   - Canvas Background: `#09090b` (`bg-[#09090b]`)
   - Primary Surface / Panels: `#0f0f12` (`bg-[#0f0f12]`)
   - Recessed Surface (Inputs, Code, Textareas): `#050507` (`bg-[#050507]`)
   - Interactive / Elevated Hover: `#16161a` (`bg-[#16161a]`)
   - Borders: 1px solid low-contrast hairline (`border-white/[0.07]`), hover state (`border-white/[0.14]`).
   - Primary CTA: High-contrast monochrome (`bg-zinc-100 text-zinc-950 hover:bg-white font-medium`).

2. **Structural Geometry (Anti-AI-Slop)**:
   - **FORBIDDEN**: `rounded-2xl`, `rounded-3xl`, `shadow-lg`, `shadow-xl`, or decorative top explanatory banners on every tab.
   - **FORBIDDEN**: "Boxes inside boxes" (never put a bordered card with padding inside another bordered card). Use **1px Hairline Bento Grids** (`grid gap-px bg-white/[0.07] border border-white/[0.07] rounded-xl overflow-hidden`) where inner cells have `bg-[#0f0f12]` and no individual borders.
   - Outer containers use `rounded-xl` (12px) or `rounded-lg` (8px). Inner interactive controls use `rounded-md` (6px).

3. **Typography & Scannability**:
   - Section headers and metadata must use `font-mono text-[11px] uppercase tracking-widest text-zinc-500 tabular-nums` (e.g., `01 // CORE MECHANISM`).
   - All numeric metrics (scores, intervals, streaks, word counts) MUST include `font-mono tabular-nums`.

4. **Component Primitives**:
   - **FORBIDDEN**: Native `<select>`, `<input type="range">`, or `window.confirm()`. Always use shadcn/Radix primitives from `@/components/ui/*`.
