# Documentação Técnica e Guia de Engenharia: Synapse (v1)

Este documento descreve a arquitetura técnica, decisões de engenharia, escolhas de dependências e funcionamento interno do **Synapse**. Seu público-alvo são desenvolvedores humanos e agentes autônomos de IA que precisam estender, auditar ou manter o código-fonte.

---

## 1. Como o Synapse Funciona? (Arquitetura Técnica & "O Como")

O Synapse opera sob uma arquitetura full-stack unificada em TypeScript, onde um único processo Node.js orquestra simultaneamente o backend da API REST e o servidor de desenvolvimento/serviço do frontend via Vite.

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
|  ├── UnifiedConceptBar (Shared Topic State & Sincronização)            |
|  ├── SocraticTutor (Conversational Engine & Metacognitive Certainty)   |
|  ├── FeynmanStudio (Explanation Audit & Jargon Extraction)             |
|  ├── ActiveRetrievalLab (SM-2 Spaced Repetition Engine & Recall)       |
|  ├── CognitiveMap (Sweller / Paivio Structural Deconstruction)         |
|  └── NeuroscienceGuide (Theoretical Foundations)                        |
|                                                                         |
|  Client Storage: localStorage (synapse_chat_history, flashcards, stats) |
+-------------------------------------------------------------------------+
```

### 1.1 Unificação Frontend/Backend via Vite Middleware

- Em desenvolvimento (`process.env.NODE_ENV !== 'production'`), o `server.ts` inicializa o Vite em modo middleware (`createServer({ server: { middlewareMode: true }, appType: 'spa' })`).
- As rotas da API em `/api/*` são tratadas nativamente pelas rotas do Express antes que o tráfego restante seja repassado aos middlewares do Vite.
- Em produção, o Express atende os arquivos estáticos compilados em `dist/` e aplica fallback para `dist/index.html` em requisições de página.
- **Racional de Design**: Elimina problemas de CORS, dispensa configuração de proxy reverso em desenvolvimento e viabiliza a execução de todo o sistema com um comando único (`npm run dev`).

---

## 2. Escolha de Ferramentas e Tecnologias

### 2.1 Backend

- **Node.js + Express 4**: Framework HTTP minimalista com baixa sobrecarga, compatível com middlewares assíncronos e fácil empacotamento via `esbuild`.
- **SDK Oficial Google GenAI `@google/genai`**: Versão 2.4.0+. Utilizada para conexão direta com os modelos Gemini mais recentes, suporte a chamadas com parâmetros estruturados (`responseSchema`, `responseMimeType: 'application/json'`) e controle de cabeçalhos HTTP.
- **`tsx`**: Executor TypeScript para Node.js com suporte nativo a ESM (`"type": "module"`), utilizado para rodar `server.ts` em tempo real sem etapas intermediárias de compilação.
- **`esbuild`**: Compilador de alta velocidade empregado no script `npm run build` para gerar o bundle CJS de produção (`dist/server.cjs`).

### 2.2 Frontend

- **React 19 `package.json`**: Framework de UI moderno, garantindo renderização eficiente e estabilidade de estado com hooks padrão (`useState`, `useEffect`, `useRef`).
- **Tailwind CSS v4 `package.json`**: Configurado via plugin `@tailwindcss/vite` `vite.config.ts`, fornecendo estilização rápida, responsiva e com suporte a variáveis CSS nativas.
- **Lucide React `package.json`**: Conjunto consistente de ícones vetoriais leves para sinalização de estados pedagógicos e metadados.
- **`react-markdown` `package.json`**: Renderizador de markdown para exibição formatada das respostas do tutor socrático.

---

## 3. Estratégia de Resiliência e Fallbacks

A plataforma foi projetada para garantir continuidade pedagógica ininterrupta mesmo diante de esgotamento de cotas de API, falhas de rede ou ausência de chaves de ambiente.

### 3.1 Cascata de Modelos Gemini

O backend implementa redundância com múltiplos modelos aprovados:

```typescript
const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
```

- Cada modelo recebe até duas tentativas de execução.
- Erros transitórios com códigos `503`, `UNAVAILABLE`, `429` ou `RESOURCE_EXHAUSTED` ativam um mecanismo de espera com jitter aleatório (`750ms + Math.random() * 500ms`) antes de tentar novamente ou passar para o próximo modelo da lista.

### 3.2 Fallbacks Pedagógicos Locais

Se todas as chamadas upstream falharem ou a variável `GEMINI_API_KEY` estiver ausente, cada endpoint aciona uma rotina heurística determinística:

- `/api/chat`: Analisa a última mensagem do usuário e devolve uma pergunta socrática sobre relação causa-efeito, mantendo o bloco `meta` intacto.
- `/api/feynman-evaluate`: Executa análise léxica da explicação, detecta palavras conceituais abstratas como potenciais jargões, calcula uma nota proporcional à extensão do texto e formula uma pergunta socrática de fechamento.
- `/api/generate-retrieval-deck`: Retorna uma estrutura padrão de três cartões desafiadores sobre mecânica causal, perturbação de limites e equívocos frequentes.
- `/api/generate-concept-breakdown`: Monta a desconstrução em pré-requisitos, mecanismo nuclear, mitos e analogias estruturais com a flag `isPedagogicalFallback: true`.

---

## 4. Engenharia de Prompts e Contratos de API

### 4.1 Chat Socrático: `POST /api/chat`

- **Instrução de Sistema**. Proíbe respostas diretas e exige o encerramento com uma única pergunta instigante.
- **Extração de Metadados**: O modelo inclui ao final da resposta um bloco delimitado:

  ```
  ```meta
  CognitivePhase: [Fase]
  NeuroTip: [Explicação neurobiológica]
  SuggestedNextSteps: [Ação 1 | Ação 2]
  ```

  ```
  O servidor processa essa string via Expressão Regular `server.ts` e entrega o texto limpo em `content` e os metadados em `meta`.

### 4.2 Avaliação Feynman: `POST /api/feynman-evaluate`

- Utiliza **Structured Outputs** da API Gemini com `responseMimeType: 'application/json'` e schema estrito definido via enum `Type`.
- Contrato de saída em `FeynmanEvaluation`:
  - `score` (inteiro 0-100)
  - `clarityAssessment` (string)
  - `jargonIdentified` (array de strings)
  - `conceptualGaps` (array de strings)
  - `strengths` (array de strings)
  - `analogiesEvaluation` (string)
  - `suggestedAnalogy` (string)
  - `simplifiedAlternative` (string)
  - `followUpQuestion` (string)

### 4.3 Geração de Baralhos: `POST /api/generate-retrieval-deck`

- Schema JSON forçado com lista de objetos `cards` contendo:
  - `question` (pergunta de mecanismo, não de decoreba)
  - `answer` (modelo mental completo)
  - `keyConcept` (conceito nuclear)
  - `neuroTip` (âncora mnemônica)
- O backend normaliza os cartões gerados para o formato `Flashcard`, inicializando os parâmetros de repetição espaçada (`intervalDays: 1`, `repetitions: 0`, `easeFactor: 2.5`, `masteryLevel: 0`).

### 4.4 Decomposição Conceitual: `POST /api/generate-concept-breakdown`

- Schema JSON com `ConceptBreakdown`:
  - `topic`, `overview`, `prerequisites`, `coreMechanism`, `commonMisconceptions`, `elaborativeQuestions`, `realWorldAnalogy`, `neuroscienceRationale`.

---

## 5. Algoritmo de Repetição Espaçada no Cliente

No componente `ActiveRetrievalLab.tsx`, a função `handleRateCard` implementa uma adaptação do algoritmo **SM-2**:

```typescript
// Quality: 0 = Esqueceu / Branco, 1 = Difícil, 2 = Bom, 3 = Perfeito
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

A data da próxima revisão é calculada somando `newInterval * 86400000` milissegundos ao timestamp atual.

---

## 6. Gerenciamento de Estado e Ciclo de Dados

### 6.1 Estado Global e Persistência

O componente raiz `App.tsx` mantém os estados centrais sincronizados via `localStorage`:

- `synapse_current_topic`: Conceito ativo selecionado pelo usuário.
- `synapse_stats`: Objeto `CognitiveStats` rastreando tentativas de recuperação, explicações Feynman, perguntas socráticas respondidas, dias de estímulo contínuo e tempo ativo.
- `synapse_chat_history`: Histórico de mensagens do chat socrático.
- `synapse_flashcards`: Baralho de cartões ativos.

### 6.2 Comunicação Cruzada entre Ferramentas

- O estado `currentTopic` é propagado para todos os componentes.
- A função `handleOpenSocraticWithPrompt` em `App.tsx` permite que botões dentro do `FeynmanStudio` e do `CognitiveMap` definam um prompt pré-formatado, alternem automaticamente a aba ativa para `socratic` e iniciem imediatamente a investigação socrática com o tutor.

---

## 7. Diretrizes para Modificações e Extensões

### 7.1 Regras para Agentes de IA

1. **Preservar a Postura Pedagógica**: O modelo do agente de IA jamais deve ser instruído a responder perguntas conceituais de forma expositiva direta. Quaisquer alterações em prompts devem manter a regra de não entregar respostas prontas.
2. **Respeitar Contratos de Tipagem**: Todas as interfaces em `src/types.ts` devem corresponder estritamente aos esquemas definidos no `server.ts`.
3. **Manter Fallbacks Heurísticos**: Ao adicionar novos endpoints ou atualizar os existentes, sempre implemente uma resposta de contingência determinística para garantir que a aplicação permaneça funcional offline.
