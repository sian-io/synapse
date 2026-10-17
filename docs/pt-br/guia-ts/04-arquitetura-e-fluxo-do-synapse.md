# 04 — Arquitetura e Fluxo de Execução do Synapse

Compreendidos os fundamentos do TypeScript e o papel de suas ferramentas, podemos agora analisar **como o Synapse funciona como um sistema completo**.

O Synapse combina um backend em **Express** e um frontend em **React 19** dentro de um **único processo Node.js**, integrando-se à API do Google Gemini com resiliência pedagógica e gerenciamento de estado no cliente.

---

## 1. Arquitetura de Processo Único: Express + Vite Middleware

Em muitas aplicações web convencionais, o frontend e o backend rodam em servidores separados durante o desenvolvimento (por exemplo: backend na porta 8000 e frontend na porta 5173). Isso geralmente exige a configuração de regras de CORS (*Cross-Origin Resource Sharing*) ou proxies reversos complexos.

O Synapse adota uma abordagem unificada elegante no arquivo [`server.ts`](file:///C:/Projetos/synapse/server.ts):

```
+-------------------------------------------------------------------------+
|                  Processo Único Node.js (Porta 3000)                    |
|                                                                         |
|  Express Server (server.ts)                                             |
|  ├── /api/health                                                        |
|  ├── /api/chat                    ───> Google Gemini SDK / Fallback     |
|  ├── /api/feynman-evaluate        ───> Google Gemini SDK (JSON Schema)  |
|  ├── /api/generate-retrieval-deck ───> Google Gemini SDK (JSON Schema)  |
|  └── /api/generate-concept-breakdown ─> Google Gemini SDK (JSON Schema)  |
|                                                                         |
|  [Filtro de Rotas: se a rota NÃO começar com /api]                      |
|  ├── Em Desenvolvimento (NODE_ENV !== 'production'):                    |
|  │     Delegado para o Vite Middleware (compila TSX/Tailwind a quente)  |
|  └── Em Produção:                                                       |
|        Serve arquivos estáticos pré-compilados da pasta dist/           |
+------------------------------------+------------------------------------+
                                     │
                                     ▼ (Entrega SPA via HTTP)
+-------------------------------------------------------------------------+
|                         Navegador do Usuário                            |
|  Aplicação React 19 (App.tsx)                                           |
|  ├── Sincronização de Tópico Global (UnifiedConceptBar)                 |
|  ├── Laboratório Socrático (SocraticTutor)                              |
|  ├── Estúdio Feynman (FeynmanStudio)                                    |
|  ├── Laboratório de Recuperação Ativa com SM-2 (ActiveRetrievalLab)     |
|  └── Mapa Cognitivo (CognitiveMap)                                      |
+-------------------------------------------------------------------------+
```

### Como isso é implementado no código?
No final do arquivo [`server.ts`](file:///C:/Projetos/synapse/server.ts):
```typescript
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Modo de Desenvolvimento: O Express hospeda o servidor Vite em memória
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Modo de Produção: Serve os arquivos estáticos gerados pelo comando build
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
```

**Causa e Efeito**:
- Toda a aplicação pode ser iniciada com um único comando: `npm run dev`.
- As chamadas de API do React são feitas para URLs relativas simples (como `fetch('/api/chat')`), eliminando qualquer complicação com CORS ou portas diferentes.

---

## 2. O Pipeline de Inteligência Artificial e Resiliência

O Synapse se conecta aos modelos de inteligência artificial generativa do Google utilizando o pacote oficial `@google/genai`.

### 1. Respostas Estruturadas via JSON Schema
Para ferramentas como o **Estúdio Feynman** e a **Geração de Flashcards**, respostas em texto livre são inadequadas porque o frontend precisa renderizar notas numéricas, listas de termos identificados e perguntas específicas.

No [`server.ts`](file:///C:/Projetos/synapse/server.ts), os endpoints utilizam o recurso de **Structured Outputs** da API Gemini:
```typescript
const response = await generateWithFallback(ai, {
  contents: prompt,
  config: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER },
        clarityAssessment: { type: Type.STRING },
        jargonIdentified: { type: Type.ARRAY, items: { type: Type.STRING } },
        conceptualGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
        // ...
      },
      required: ['score', 'clarityAssessment', 'jargonIdentified'],
    },
  },
});
```
Isso força a rede neural a responder com uma garantia sintática estrita que mapeia diretamente para a interface TypeScript [`FeynmanEvaluation`](file:///C:/Projetos/synapse/src/types.ts).

### 2. A Cascata de Modelos com Jitter e Backoff
APIs em nuvem podem sofrer flutuações temporárias de capacidade (erros `503`, `UNAVAILABLE` ou `429`). Para que a experiência de estudo do aluno nunca seja interrompida, a função `generateWithFallback` implementa uma cascata de redundância:

```typescript
const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
```
- Tenta o modelo principal (`gemini-3.8-flash`).
- Em caso de indisponibilidade transitória, aplica uma pausa calculada com variação aleatória (*jitter*):
  ```typescript
  await sleep(750 + Math.random() * 500);
  ```
- Se o erro persistir, avança automaticamente para o próximo modelo da lista.

### 3. Fallbacks Pedagógicos Locais (Modo Offline)
Se a variável de ambiente `GEMINI_API_KEY` não estiver definida ou a internet cair completamente, os endpoints do Synapse não quebram com um erro 500 genérico. Cada endpoint possui uma rotina determinística heurística de fallback que analisa a entrada do usuário e retorna respostas pedagógicas estruturadas com a flag `isPedagogicalFallback: true`.

---

## 3. O Ciclo de Dados no Cliente (React 19)

No frontend, a aplicação é estruturada em torno de princípios cognitivos que exigem que o contexto de aprendizagem seja compartilhado entre ferramentas distintas.

### 1. Estado Centralizado e Sincronização via `localStorage`
No arquivo raiz [`src/App.tsx`](file:///C:/Projetos/synapse/src/App.tsx), os estados principais são persistidos no navegador:
- `synapse_current_topic`: O tema de estudo atual (ex: *"Termodinâmica"*, *"Redes Neurais"*).
- `synapse_stats`: Estatísticas cognitivas (taxa de retenção, explicações de Feynman realizadas, calibração média).
- `synapse_chat_history`: Histórico de mensagens do tutor socrático.
- `synapse_flashcards`: Baralho de repetição espaçada.

### 2. Comunicação Cruzada entre Ferramentas
A barra superior [`UnifiedConceptBar.tsx`](file:///C:/Projetos/synapse/src/components/UnifiedConceptBar.tsx) mantém o tópico atual sempre visível e sincronizado. 

Quando o usuário está no **Estúdio Feynman** ou no **Mapa Cognitivo** e identifica uma lacuna em seu entendimento, a interface disponibiliza botões de ação imediata que chamam a função `handleOpenSocraticWithPrompt()` em `App.tsx`:
1. Preenche uma pergunta investigativa pré-formatada.
2. Altera a aba ativa para o `SocraticTutor`.
3. Inicia imediatamente uma sessão socrática para investigar aquela lacuna específica.

### 3. O Algoritmo de Repetição Espaçada SM-2
No componente [`ActiveRetrievalLab.tsx`](file:///C:/Projetos/synapse/src/components/ActiveRetrievalLab.tsx), o método `handleRateCard` implementa uma adaptação direta do clássico algoritmo **SM-2** (desenvolvido por Piotr Woźniak):

```typescript
// Avaliação da lembrança pelo estudante:
// 0 = Esqueceu / Em Branco | 1 = Difícil | 2 = Bom | 3 = Perfeito

if (quality === 0) {
  newInterval = 1;                                      // Reinicia intervalo para amanhã
  newRepetitions = 0;                                   // Zera contagem de repetições
  newEase = Math.max(1.3, currentCard.easeFactor - 0.2); // Reduz fator de facilidade
  newMastery = 0;
} else if (quality === 1) {
  newInterval = Math.max(1, Math.round(currentCard.intervalDays * 1.2));
  newRepetitions += 1;
  newEase = Math.max(1.3, currentCard.easeFactor - 0.1);
} else if (quality === 2) {
  newInterval = Math.max(2, Math.round(currentCard.intervalDays * currentCard.easeFactor));
  newRepetitions += 1;
} else {
  newInterval = Math.max(3, Math.round(currentCard.intervalDays * currentCard.easeFactor * 1.3));
  newRepetitions += 1;
  newEase = currentCard.easeFactor + 0.15;              // Aumenta facilidade da matéria
}
```
A próxima data de revisão é gravada como um carimbo de tempo (*timestamp*):
```typescript
nextReviewDate = Date.now() + newInterval * 86400000; // 86400000 ms = 24 horas
```

---

## 4. O Ciclo de Vida dos Comandos de Build e Execução

Para consolidar a cadeia de eventos, veja o que acontece em cada comando configurado no [`package.json`](file:///C:/Projetos/synapse/package.json):

### `npm run dev`
1. O comando executa `tsx server.ts`.
2. O `tsx` transpila o `server.ts` na memória usando `esbuild` e o entrega para o Node.js.
3. O servidor sobe na porta 3000 e inicializa o Vite em modo middleware.
4. Quando o navegador acessa `http://localhost:3000`, o Vite compila sob demanda os arquivos `App.tsx`, CSS e ícones, injetando o script de HMR.

### `npm run build`
1. Executa `vite build`: o Vite analisa a árvore de importações a partir de `index.html`, compila todo o TypeScript/React, processa o Tailwind CSS e gera pacotes estáticos minificados na pasta `dist/`.
2. Executa `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`: o `esbuild` empacota o servidor Express em um único arquivo CommonJS otimizado para produção (`dist/server.cjs`), deixando pacotes nativos como dependências externas.

### `npm run start`
1. Executa `node dist/server.cjs`.
2. O Node.js executa diretamente o JavaScript compilado em produção, servindo a aplicação sem nenhuma sobrecarga de compiladores ou ferramentas de desenvolvimento.

---

No próximo documento ([05 — De Python para TypeScript: Guia Rápido](./05-de-python-para-typescript-guia-rapido.md)), você encontrará uma tabela prática de tradução mental entre a sintaxe do Python e a do TypeScript.
