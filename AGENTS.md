# Synapse: Engineering Guide for Agents & Contributors

> **Source-of-truth order: code > this file > `README.md` > `docs/pt-br/`.** If they disagree, trust the code and fix the doc in the same change.

Synapse is a bilingual (en / pt-BR) active-learning tutor: a React 19 SPA plus a Hono API, running on Bun (Vite in dev). It is a **stateless BYOK proxy**: the user's own LLM key lives in their browser and is forwarded on every request; the server stores nothing. The product exists to *prevent* passive study. It must never turn into a "just give me the answer" chatbot.

**Stack:** Bun · Hono + Hono RPC · Vite 6 · React 19 · Tailwind CSS v4 · Base UI (shadcn-style wrappers) · lucide-react · react-markdown · TypeScript 5.8 (check-only via `tsc --noEmit`).
There is no router, no state library, no AI SDK (raw `fetch`), no database. Add a dependency only if the platform or Hono cannot do the job.

---

## 1. Commands & Definition of Done

| Command | What it does | Notes |
| :-- | :-- | :-- |
| `bun install` | Install from `bun.lock` | **Bun only.** Never use npm/yarn/pnpm or commit a `package-lock.json`. The Dockerfile uses `--frozen-lockfile`, so keep `bun.lock` in sync (`bun add` / `bun remove`). |
| `bun run dev` | `bun --bun vite` → http://localhost:3000 | `--bun` is mandatory (Vite's shebang targets Node). HMR on; `/api/*` is dispatched to `server.ts`. |
| `bun run lint` | `tsc --noEmit` | The only static check (no ESLint/Prettier). Also type-checks every Hono RPC call. |
| `bun test` | bun:test | Currently `src/lib/inferenceRequest.test.ts`. |
| `bun run build` | `vite build` → `dist/` | Frontend only. The server is never bundled. |
| `bun run start` | `bun server.ts` | Serves API + `dist/`. Paths are relative to CWD: run from the repo root, after `build`. |
| `bun run clean` | `rm -rf dist` | |

**Environment** (Bun auto-loads `.env`; `.env*` is git- and docker-ignored): `PORT` (default `3000`), `HOST` (default `0.0.0.0`; use `127.0.0.1` for loopback-only), `DISABLE_HMR=true`, `ALLOW_PRIVATE_NETWORKS` (default `false` when `NODE_ENV=production`, `true` otherwise), `RATE_LIMIT_ENABLED` (default `true`; set `false` or `0` to disable), `RATE_LIMIT_MAX` (default `30` requests per window), `RATE_LIMIT_WINDOW_MS` (default `60000`). **No variable is required.** There are no server-side provider credentials (the old `GEMINI_API_KEY` is obsolete).

**Before you finish a task:**
1. `bun run lint` is clean.
2. `bun test` is green.
3. `bun run build` succeeds.
4. UI changes: exercise them in **EN and PT**, at mobile and desktop widths.
5. Contract or behavior changes: update this file, the tests, and the READMEs if they mention it.

Match the surrounding file's style. App code: single quotes, semicolons, named exports (only `App` is a default export). `src/components/ui/*` follows the generated style (double quotes, no semicolons). Git history uses Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`).

---

## 2. Hard Rules

1. **Pedagogy first.** The tutor never delivers expository answers. It decomposes, questions, and ends `socratic` turns with exactly ONE thought-provoking question. Any prompt edit must preserve this (Retrieval Practice, Socratic/Elaborative Interrogation, Feynman, Cognitive Load, Desirable Difficulties, Metacognition).
2. **Stateless BYOK.** Never persist, log, echo, or cache user credentials server-side. Do not log request headers or bodies (`x-ai-config` contains the API key). Upstream error text sent to the client stays truncated (`slice(0, 200)`). All LLM calls go through `resolveAIConfig` → `runInference`.
3. **Transparent failures.** Inference failures surface as HTTP 503 with a localized message. Do **not** reintroduce mock or fallback content that disguises an upstream error.
4. **Keep the type chain intact.** Every route lives in the single chained expression assigned to `routes` in `server.ts`, with explicit literal status codes (`200`, `400`, `503`). The client only does `import type { AppType } from '../server'`. A value import would drag Bun-only code into the browser bundle.
5. **The shared layer is isomorphic.** `src/lib/*` and `src/types.ts` run in both the browser (the modal's request preview) and the server. No Bun/Node APIs, no DOM APIs, no React. `server.ts` and the shared layer use **relative imports** (no `@/`).
6. **Docker allow-list.** The runtime image copies only `package.json`, `node_modules`, `dist`, `server.ts`, `src/types.ts`, `src/i18n`, `src/lib`. If `server.ts` (or anything it imports) starts importing from another `src/` path, **update the Dockerfile `COPY` lines**, or production breaks while dev works.
7. **All new routes start with `/api/`.** The Vite dev bridge excludes every non-`/api/` path from Hono (`/^\/(?!api\/).*/`), so other paths work in prod but 404 in dev.
8. **Every user-visible string is bilingual** (see §8). The server also localizes errors and model output via the `language` param.
9. **Security.** Never render LLM output as raw HTML (no `rehype-raw`, no `dangerouslySetInnerHTML`): the API key sits in `localStorage` and any XSS exposes it. Never weaken `assertSafeInferenceUrl` (§6).
10. **UI constraints** in §9 are mandatory, not suggestions.

---

## 3. Architecture

```
Browser (React 19 SPA)                         Server (Bun + Hono)                         Provider
──────────────────────                         ───────────────────                         ────────
component
  └─ api.api.<route>.$post({ json })           POST /api/<route>
       hc<AppType>('/')  ────────────────────▶   jsonBody<T>()      (type-only, NO runtime validation)
       header x-ai-config:                        resolveAIConfig()  (body.aiConfig ▸ header)
       encodeURIComponent(JSON(config))           runInference()
                                                    ├ buildInferenceRequest()   (src/lib, shared with modal preview)
                                                    ├ assertSafeInferenceUrl()
                                                    └ fetch ───────────────────────────▶  OpenAI / Anthropic / Gemini / custom
       ◀──────── c.json(data, 200 | 400 | 503) ◀── parse + normalize LLM output
```

| | Development | Production |
| :-- | :-- | :-- |
| Entry | `bun --bun vite` (port `PORT`/3000) | `bun server.ts` |
| API | `@hono/vite-dev-server` loads `server.ts`, forwards **only `/api/*`**, and uses its `fetch` | `export default { port, hostname, fetch }` → Bun serves HTTP |
| Frontend | Vite (HMR, Tailwind plugin) | `serveStatic` from `hono/bun` over `./dist`, SPA fallback to `dist/index.html` |

`hono/bun` is **dynamically imported** behind `typeof Bun !== 'undefined'`. A static import crashes Vite when it loads `server.ts` under Node (`Bun is not defined`). The guard is also true under `bun --bun vite`, but the dev `exclude` regex keeps non-API traffic away from those handlers.

---

## 4. Repository Map

```
server.ts                  Hono app, 5 chained routes, runInference, resolveAIConfig, cleanJsonText,
                           assertSafeInferenceUrl, global onError; exports `app`, `AppType`, default {port,hostname,fetch}
vite.config.ts             react + tailwind + devServer bridge; alias @ → src; PORT/HOST/DISABLE_HMR
tsconfig.json              check-only (noEmit); paths @/* → src/*; NOTE: `strict` is not enabled (see §13)
Dockerfile / .dockerignore Two-stage Bun build; see rule 6
src/main.tsx               React root (StrictMode)
src/App.tsx                Tab state (default tab: `cognitive_map`), header, language switch, settings button,
                           cross-tab handoff `handleOpenSocraticWithPrompt`
src/api.ts                 `hc<AppType>('/')` + `AI_CONFIG_STORAGE_KEY` + header injection
src/types.ts               Shared contracts (must mirror server.ts payloads)
src/lib/inferenceRequest.ts  Provider request builder, param support matrix, sanitizer, validity check (+ .test.ts)
src/context/               AIConfigContext.tsx (provider + modal host), useAIConfig.ts (context + hook)
src/i18n/                  LanguageContext.tsx (detection/persistence), translations.ts (en + pt)
src/data/neurosciencePillars.ts   Pillar copy + demo flashcards, per language (`getX(language)`)
src/components/            SocraticTutor, FeynmanStudio, ActiveRetrievalLab, CognitiveMap,
                           AIConfigModal; NeuroscienceGuide is a Dialog opened by the header About (?) button, not a tab
src/components/ui/         Base UI wrappers: button, dialog, input, popover, select, textarea, tooltip
src/index.css              Tailwind v4 entry, theme tokens, `surface-panel`/`surface-recessed`, custom variants
docs/pt-br/                pt-BR README, TS guide for Python devs (guia-ts/), REFACTOR.md (point-in-time report)
```

---

## 5. API Contracts

All routes are `/api/*`. Error shape is always `{ error: string }`.

| Route | Request (client sends) | 200 response | Other statuses |
| :-- | :-- | :-- | :-- |
| `GET /api/health` | none | `{ status: 'ok', mode: 'byok-stateless-proxy', timestamp }` | none |
| `POST /api/chat` | `{ messages, mode: 'socratic', studentCalibration (1-5), language }` (server also accepts `currentTopic`, `aiConfig`) | `{ content }` (Markdown; the server strips any ` ```meta ` fence and trailing `---` rules) | 503 |
| `POST /api/feynman-evaluate` | `{ explanation, targetAudience, language }` (the client never sends `topic`; the model infers it) | `FeynmanEvaluation` | 400 empty `explanation`; 503 |
| `POST /api/generate-retrieval-deck` | `{ topic, difficulty, count, language }` | `{ flashcards, cards }` (same array twice; the client reads `flashcards`) | 400 missing `topic`; 503 |
| `POST /api/evaluate-retrieval-answer` | `{ question, answer, userAnswer, language }` | `RetrievalEvaluation` (`{ rating: 'correct' \| 'partial' \| 'incorrect', feedback }`) | 400 missing fields; 503 |
| `POST /api/generate-concept-breakdown` | `{ topic, language }` | `ConceptBreakdown` | 400 missing `topic`; 503 |

- **Global `app.onError`:** `SyntaxError` (or a message containing `JSON`) → `400 { error: 'Malformed JSON payload.' }`; anything else → `500 { error: 'Internal Server Error' }`.
- **Security headers, body limit & rate limiting:** `secureHeaders` (from `hono/secure-headers`) applies CSP (`default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, `font-src 'self' https://fonts.gstatic.com data:`, `connect-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`) across all responses. `bodyLimit` (from `hono/body-limit`) caps `/api/*` request bodies at `MAX_API_BODY_BYTES` (256 KB), returning `413 { error: 'Payload too large. Maximum allowed request body is 256 KB.' }`. `createRateLimiter()` enforces an in-memory per-IP rate limit on `/api/*` (exempting `/api/health`, default 30 req / 60s, configurable via `RATE_LIMIT_ENABLED`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`), returning `429 { error: 'Too many requests. Please wait a moment before trying again.' }` with `Retry-After`.
- **Missing or invalid AI config** is thrown inside each route's `try`, so it surfaces as **503** with "Configure your API in AI Settings…", not 401/400.
- **`jsonBody<T>()` is a type annotation, not validation.** It casts `c.req.json()`. Validate required fields by hand and **coerce LLM output defensively** (`String(...)`, `toStringArray`, finite-number check), as the Feynman and breakdown routes do. The deck route only maps fields through, so a malformed card can reach the UI.
- **Deck normalization:** `id: fc_${now}_${index}`, `topic`, `question`, `answer`.
- **Prompts live in `server.ts`**, are written in English, and carry an `Output language:` directive. JSON keys are part of the contract.
- **Client call pattern** (keep it uniform):
  ```ts
  const response = await api.api['feynman-evaluate'].$post({ json: { ... } });
  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new Error(errData?.error || t.feynman.errorFallback);
  }
  const data = await response.json();
  ```
  Errors are shown inline (grayscale `AlertTriangle` + message + Retry button), never via `alert()`.

---

## 6. Inference Layer (`src/lib/inferenceRequest.ts` + `runInference`)

`buildInferenceRequest(cfg, { systemInstruction?, messages, jsonMode?, maskApiKey? })` returns `{ method, url, headers, body, protocol }`. **One builder drives both the modal's live preview (`maskApiKey: true`) and the server's real call.** Config is run through `sanitizeConfigForEndpoint` first.

| Protocol | URL (base trimmed of trailing `/`) | Auth | Notes |
| :-- | :-- | :-- | :-- |
| `openai-completions` | base ends `/chat/completions` → as is; ends `/v1` → `+/chat/completions`; else `+/v1/chat/completions` | `Authorization: Bearer` | `max_completion_tokens`, `response_format: json_object`, penalties, `reasoning_effort` |
| `openai-responses` | same logic with `/responses` | `Authorization: Bearer` | `instructions` + `input`, `max_output_tokens`, `reasoning.effort`, `text.format` |
| `anthropic` | ends `/messages` → as is; ends `/v1` → `+/messages`; else `+/v1/messages` | `x-api-key`, `anthropic-version: 2023-06-01` | `max_tokens` **required** (default 2048); `thinking.budget_tokens` ≥ 1024 and `max_tokens ≥ budget + 1024`; temperature ≤ 1; **no native JSON mode** |
| `google` | `…/v1beta/models/{model}:generateContent` (a `models/` prefix and a base already ending `/v1` or `/v1beta` are handled) | `x-goog-api-key` | `systemInstruction`, `contents` (roles `user`/`model`), `generationConfig` (`responseMimeType`, `maxOutputTokens`, `topP`, `topK`, `thinkingConfig`) |

- **`jsonMode`:** native flag where one exists, plus an appended system sentence ("You MUST respond ONLY with a valid JSON object."). The response then passes through `cleanJsonText` (strips code fences or extracts the outermost JSON).
- **Roles:** builders only distinguish `assistant` from everything else, so a `system` message becomes `user`. System prompts must go through `systemInstruction`.
- **Response extraction:** Anthropic → first `text` block; Google → first non-`thought` text part; OpenAI Responses → `output_text` ▸ `output[].content[].text` ▸ `choices` fallback; Completions → `choices[0].message.content`.
- **Manual Edit mode** (`manualEditEnabled` + `customUrlOverride` + `customBodyOverride` + optional `customHeadersOverride`) bypasses the form fields. `detectManualProtocol` infers the protocol from URL, headers, and body keys, then injects messages, system prompt, and JSON mode unless `preserveOverrideMessages` is set. `isAIConfigValid` has separate rules for manual and menu configs.
- **Empty API key** renders as the literal `<YOUR_API_KEY>` when unmasked. Keep this in mind for key-less local endpoints.
- **`PROVIDER_DEFAULTS`** (in `AIConfigModal.tsx`) are placeholder/hint values only; the form requires `baseUrl` and `model`. Keep them current when touching the file.
- **SSRF guard (`assertSafeInferenceUrl`):** only `http:`/`https:`; always blocks cloud-metadata hosts and IPs (`metadata.google.internal`, `169.254.*`, `100.100.100.200`, `fd00:ec2::254`, `fe80:`). Loopback (`localhost`, `127.0.0.0/8`, `::1`, `0.0.0.0`) and private/LAN IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `100.64.0.0/10`, `fc00::/7`) are blocked in production (`NODE_ENV=production`) unless `ALLOW_PRIVATE_NETWORKS=true` (enabled by default in development so local models like Ollama and LM Studio work). Inference `fetch` calls use `redirect: 'manual'` and reject `3xx` redirects.

---

## 7. Client State & Persistence

`App.tsx` renders **only the active tab**, so tab components **unmount on switch**. State survives only because each component initializes from `localStorage` (inside `try/catch`) and writes back in `useEffect`. A new stateful tab must do the same. In-flight requests are not preserved across tab switches.

| Key | Owner | Content |
| :-- | :-- | :-- |
| `synapse_ai_config` | `AIConfigContext` / `api.ts` | `AIProviderConfig` JSON, **API key in plaintext** (written only when valid; removed when `null`) |
| `synapse_language` | `LanguageContext` | `'en'` \| `'pt'` |
| `synapse_chat_history` | `SocraticTutor` | `ChatMessage[]`. Legacy `…_en`/`…_pt` read as fallback and cleared on reset; ids starting `err_` filtered on load |
| `synapse_flashcards` | `ActiveRetrievalLab` | `Flashcard[]` (legacy `…_<lang>` fallback) |
| `synapse_retrieval_topic` / `_count` / `_difficulty` | `ActiveRetrievalLab` | form state. Difficulty is one of `fundamentos` \| `intermediario` \| `avancado` |
| `synapse_cognitive_map_topic` / `_breakdown` | `CognitiveMap` | string / `ConceptBreakdown` |
| `synapse_feynman_audience` / `_explanation` / `_evaluation` | `FeynmanStudio` | `child` \| `layperson` \| `beginner` / text / `FeynmanEvaluation` |

- **Don't rename or reshape keys or enum values without a tolerant migration.** The difficulty values are Portuguese on purpose: they are persisted *and* interpolated into the prompt.
- **StrictMode** double-invokes effects in dev. Effects that trigger API calls must be idempotent (see `isSendingRef` and `lastHandledPromptRef` in `SocraticTutor`).
- **Cross-tab handoff:** Feynman/CognitiveMap call `onOpenSocraticWithPrompt(prompt)` → `App` stores the prompt and switches tabs → `SocraticTutor` sends it once, then calls `onClearInitialPrompt`. Prompt prefixes and suffixes come from `translations`.
- **Empty initial state:** `ActiveRetrievalLab` starts with an empty deck (`[]`) until cards are synthesized with AI or imported.

---

## 8. Internationalization (en / pt-BR)

- `Language = 'en' | 'pt'`. Use `const { t, language } = useLanguage()`. Detection order: saved `synapse_language` → `navigator.languages` starting with `pt` → Brazilian/Portuguese time zones → `'en'`. The provider also sets `<html lang>` and `document.title`.
- **Add every new key to BOTH `translations.en` and `translations.pt`, with identical structure.** There is **no compile-time parity check**: `t` is cast through `unknown` to `typeof translations.en`, so a key missing in `pt` is `undefined` at runtime.
- New strings go in `translations.ts`, **not** inline `isPt ? '…' : '…'` ternaries. Those exist in `App.tsx`, the `SocraticTutor` dialog, and `AIConfigModal`; treat them as legacy and don't add more.
- Some existing keys carry a trailing `:` or a leading `←` that components strip (`.replace(/:\s*$/, '')`). Write new keys clean.
- Pillar copy and demo flashcards come from `getNeurosciencePillars(language)` / `getInitialPresetFlashcards(language)`.
- The server is **binary** (`isPt`). Adding a third language requires `Language`, `translations`, the data files, and refactoring `server.ts` prompts and error messages away from the boolean.

---

## 9. UI System ("Monochrome Precision")

Dark-only (`<html class="dark">`). Pure grayscale. Prefer the utilities in `index.css` over repeating hex values.

| Token | Value / class |
| :-- | :-- |
| Canvas | `#09090b` (`bg-[#09090b]`) |
| Panel | `#0f0f12`, utility `surface-panel` (bg + 1px hairline + inset top highlight), or `bg-[#0f0f12]` for bento cells |
| Recessed (inputs, code, segmented controls) | `#050507`, utility `surface-recessed` |
| Hover / elevated | `#16161a` |
| Borders | `border-white/[0.07]`; hover `border-white/[0.14]` |
| Text | primary `zinc-100`; body `zinc-300/400`; meta `zinc-500` |
| Primary CTA | `bg-zinc-100 hover:bg-white text-zinc-950 font-medium` + `disabled:bg-zinc-900 disabled:text-zinc-600` |
| Fonts | Geist Variable (`font-sans`); JetBrains Mono (`font-mono`, loaded from Google Fonts in `index.html`) |

**Structure**
- Group content in **1px hairline bento grids**: `grid gap-px bg-white/[0.07] border border-white/[0.07] rounded-xl overflow-hidden`, with cells `bg-[#0f0f12]` and no borders of their own. **Never nest a bordered, padded card inside another.**
- Radii: outer `rounded-xl` / `rounded-lg`; inner controls `rounded-md`. **Forbidden:** `rounded-2xl`, `rounded-3xl`, `shadow-lg`, `shadow-xl`, decorative explanatory banners atop tabs.
- Controls are `h-10` (compact `h-8`). Add `cursor-pointer` explicitly on clickable elements (Tailwind v4 does not).
- Icons: lucide, `w-4 h-4 stroke-[1.75] text-zinc-400`.
- Meta labels: `font-mono text-[13px] uppercase tracking-widest text-zinc-500` (use `text-[11px]` only for compact chips and hints). **Every numeric metric** (scores, intervals, counts, timestamps) uses `font-mono tabular-nums`.
- Motion: only `animate-fade-in` and functional spinners/pings.

**Primitives are Base UI, not Radix.** Use `@/components/ui/*` and follow the existing patterns:
- Composition uses the **`render` prop** (`<DialogTrigger render={<Button … />}>`), not `asChild`.
- `Select` `onValueChange` can receive `null`; guard with `if (val)`.
- `index.css` defines custom variants (`data-open`, `data-closed`, `data-checked`, …) that bridge Base UI's data attributes to the animation classes. Don't remove them.
- Callers override the default popover/dialog styling with `surface-panel … ring-0`.
- **Forbidden:** native `<select>`, `<input type="range">`, `window.confirm()` (use `Dialog`).
- `cn` is imported from the **`cn` npm package** (`import { cn } from "cn"`), **not** `@/lib/utils`.
- `components.json` is git-ignored, so the shadcn CLI has no project config. Hand-write new primitives modeled on the existing files.
- The only non-grayscale styling in the app is the red manual-JSON error banner in `AIConfigModal`. Don't copy it.

---

## 10. Active Retrieval Practice (`ActiveRetrievalLab.tsx`)

Implements active retrieval practice and elaborative interrogation with qualitative AI feedback. Ratings (`RetrievalRating`): `'correct'`, `'partial'`, `'incorrect'`.

- **AI-driven evaluation:** When the student submits their written attempt (`userDraftAnswer`), `POST /api/evaluate-retrieval-answer` evaluates conceptual accuracy and causal mechanism comprehension against the benchmark answer and returns `{ rating: 'correct' | 'partial' | 'incorrect', feedback }`. The client also provides an "I Forgot / Blank" shortcut that directly applies `'incorrect'` without an LLM call.
- **Card model:** Flashcards maintain essential content (`id`, `topic`, `question`, `answer`) without scheduled interval projections.

---

## 11. Recipes

**Add an endpoint**
1. Append `.post('/api/<name>', jsonBody<{ …; language?: 'en' | 'pt'; aiConfig?: AIProviderConfig }>(), handler)` **inside the existing `routes` chain**. A separate `app.post(…)` silently drops the route from `AppType`.
2. Handler skeleton:
   ```ts
   async (c) => {
     const { topic, language = 'en', aiConfig } = c.req.valid('json');
     const isPt = language === 'pt';
     if (!topic) return c.json({ error: isPt ? 'Tópico é obrigatório.' : 'Topic is required.' }, 400);
     try {
       const cfg = resolveAIConfig(c, aiConfig, isPt);
       const text = await runInference(cfg, { messages: [{ role: 'user', content: prompt }], jsonMode: true });
       return c.json(normalize(JSON.parse(text)), 200);
     } catch (error: any) {
       console.error('Error in /api/<name>:', error.message);
       return c.json({ error: error.message || (isPt ? '…' : '…') }, 503);
     }
   }
   ```
3. Add the response interface to `src/types.ts`; normalize LLM output defensively.
4. Call it from the client via `api.api['<name>'].$post` using the pattern in §5, and add `errorFallback` strings in both languages.
5. If `server.ts` now imports a new `src/` path, update the Dockerfile.
6. Update §5 of this file and add tests for any pure helper.

**Change a JSON contract** (prompt keys): update the server prompt → the normalizer → `src/types.ts` → consuming components → this file's §5. Persisted shapes (`synapse_*_evaluation`, `_breakdown`, `synapse_flashcards`) must still load old data (the components already guard with `?? []`).

**Add a provider / protocol:** `APIStandard` and `InferenceProtocol` in types/lib → `getEndpointParameterSupport` → `sanitizeConfigForEndpoint` → `buildInferenceRequest` → `detectManualProtocol` → response parsing in `runInference` → labels and `PROVIDER_DEFAULTS` in `AIConfigModal` → tests.

**Add a tab:** extend `ActiveTab` and `navItems` in `App.tsx`; add `app.nav.<id>` in both languages; persist the tab's state (§7); follow §9.

**Add a language:** see §8.

---

## 12. Testing

- Runner: `bun test` (`bun:test`). There is no DOM test environment (no jsdom/testing-library). Test logic as **pure functions**. The precedent is exporting `previewNextInterval` from the component file.
- Covered today: `isAIConfigValid`, `buildInferenceRequest` across the 4 protocols, Anthropic thinking-budget clamping, `cleanJsonText`, `assertSafeInferenceUrl`, `previewNextInterval`.
- Worth adding when you touch the area: en/pt translation key parity, `detectManualProtocol`, `resolveAIConfig` header decoding (raw JSON vs URI-encoded), route-level tests via `app.request(...)` (`app` is exported).

---

## 13. Known Gaps & Traps

| Area | Fact | Guidance |
| :-- | :-- | :-- |
| Type strictness | `tsconfig.json` does **not** enable `strict`; Hono's RPC docs expect it. `any` is common (`catch (e: any)`, provider payloads). | A clean `lint` ≠ strict safety. Enabling `strict` is its own change; don't mix it into feature work. |
| Request validation | `jsonBody<T>()` doesn't validate. | Validate by hand (§5). |
| SSRF | Private/loopback ranges blocked in production (`ALLOW_PRIVATE_NETWORKS=true` overrides); `redirect: 'manual'` (§6). | Resolve DNS prior to connecting if defending against DNS rebinding in public multi-tenant setups. |
| i18n parity | No compile-time check (§8). | Add a parity test if you touch translations. |
| Chat history | The assistant welcome message (`msg_welcome`) and any leading assistant turns are filtered out before sending to the provider, ensuring the conversation begins with a user turn and context is capped at the last 20 messages. | Preserved across Socratic sessions; sanitized client- and server-side. |
| Chat modes | The UI only sends `mode: 'socratic'`. `PedagogicalMode` includes `concept_breakdown`, which has no guideline in the system prompt. | Don't assume the other modes are exercised. |
| Spaced repetition | `nextReviewDate` is stored but the UI cycles cards sequentially (no due-date queue); `easeFactor` has no upper bound. | Keep in mind when "fixing" scheduling. |
| Tab switching | In-flight results are lost on unmount (§7). | Persist or lift state if it matters. |
| Credentials at rest | API key is plaintext in `localStorage` (by design, disclosed in the settings modal). | See rule 9. |
| Docs drift | `README.md`, `docs/pt-br/README.md`, and `guia-ts/04` still mention things that no longer exist: `UnifiedConceptBar`, `synapse_current_topic`, `synapse_stats`, a pedagogical-mode selector, "Recommended Cognitive Actions", Gemini-only fallbacks, a "slider" for calibration (it's a popover of 1-5 buttons). `docs/pt-br/REFACTOR.md` is a point-in-time report for commit `9a8e646`, not a living doc. | Don't treat them as truth. Fix them when you touch the related area. |

---

## 14. Keeping Docs Honest

When behavior changes, update in the same PR: this file → `README.md` (English) → `docs/pt-br/README.md` (Portuguese) if user-facing flow changed. `docs/pt-br/guia-ts/*` are educational and should stay consistent with `server.ts` / `src/api.ts` snippets. Keep this file dense and factual: commands, contracts, constraints, and traps. Put narrative and onboarding material in the READMEs.