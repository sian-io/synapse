## 1. Corrigir primeiro (bugs reais, esforço baixo)

- **Gerar baralho apaga o progresso.** `handleGenerateDeck` faz `setCards(data.flashcards)`, substituindo o baralho inteiro e destruindo o histórico SM-2. Fazer mesclar/anexar, idealmente com baralhos por tópico.
- **Sem backup.** Todos os dados estão no `localStorage`, então limpar o navegador apaga tudo. Exportar e importar JSON é barato, e um export TSV para Anki daria portabilidade.
- **A mensagem de boas-vindas vai para o provedor** como primeira mensagem do assistente. Filtrar `msg_welcome` antes de enviar resolve, e vale limitar também a janela do histórico, que hoje cresce sem limite.
- **Sem timeout nem cancelamento.** O `fetch` do servidor não tem `AbortSignal.timeout`, e o cliente não tem `AbortController`. Um provedor travado deixa a UI girando para sempre.
- **Pequenos defeitos:**
  - `consolidationSteps.map` em `NeuroscienceGuide` está sem `key`.
  - O `score` do Feynman não é limitado a 0–100.
  - JSON inválido do modelo chega ao usuário como "Unexpected token…" num 503. Uma mensagem amigável e um retry resolveriam.

## 2. Antes de expor publicamente

- **SSRF.** O servidor chama qualquer URL que o cliente mandar, aceita localhost/LAN e segue redirects. Criar uma flag de ambiente, bloqueada por padrão em produção, para upstreams privados. Também usaria `redirect: 'manual'`.
- **Cabeçalhos e limites.** `hono/secure-headers` (com CSP), `hono/body-limit` e rate limit custam pouco. A chave fica em texto puro no `localStorage`, então reduzir o impacto de um XSS importa.
- **Opção de sessão.** Um toggle "lembrar chave" (`localStorage`) versus apenas na sessão (`sessionStorage`).

## 3. Camada de IA

- **Saída estruturada nativa** (`json_schema`, `responseSchema`, tool use) no lugar de `json_object` + `cleanJsonText`.
- **Um schema como fonte única** (Valibot ou Zod): ele daria tipos, validação de request e validação da saída do LLM. Hoje `server.ts` e `types.ts` duplicam contratos, e `jsonBody<T>()` não valida nada.
- **`strict: true`** no `tsconfig`, em PR separado. O Hono RPC espera isso.
- **Organização do código.** Quebrar `server.ts` com `app.route()`, que mantém a tipagem RPC, e extrair os prompts para funções puras testáveis.
- **Streaming (SSE)** no chat socrático melhoraria muito a experiência.

## 4. Onde está o maior ganho de produto

- **Fechar o ciclo entre as abas.** Hoje as abas só conversam com o Tutor. Uma lacuna do Feynman ou uma pergunta do Mapa Cognitivo deveria virar flashcard com um clique, e um tópico compartilhado as conectaria.
- **Fila por vencimento.** `nextReviewDate` é gravado, mas a UI percorre os cartões em sequência. Sem "o que vence hoje" a repetição espaçada perde o sentido. Considerar `ts-fsrs` no lugar do SM-2 adaptado, e um painel simples com cartões vencidos, sequência de dias e evolução do score do Feynman. O README promete essas métricas, mas elas não existem.
- **Calibração metacognitiva de verdade.** Perguntar "quão seguro você está?" antes de virar o cartão e comparar com a autoavaliação depois. Hoje o 1–5 do tutor só é enviado ao prompt e nunca confrontado com resultado, e essa comparação seria um diferencial real.
- **Escada de dicas no Socrático.** Um tutor que só pergunta pode frustrar. Um botão "estou travado" que libera dicas progressivas preserva a filosofia sem o beco sem saída.
- **Cartões editáveis** (criar, editar, excluir) e **geração a partir do material do aluno** (colar notas), que reduz alucinação em relação ao que o modelo "lembra".
- **Revisar as afirmações científicas.** Não foi possível conciliar o "3x superior" com o que o claude sabe de Roediger & Karpicke (2006), em que a vantagem após uma semana foi bem menor; vale conferir na fonte. As explicações de "síntese de proteínas" e "densidade de receptores AMPA/NMDA" também são extrapolações, não achados desse tipo de estudo.

## 5. Qualidade, acessibilidade e infraestrutura

- **Modal de configuração** (`AIConfigModal`): ele usa um overlay próprio, sem Esc, sem focus trap e sem `role="dialog"`. Trocar pelo `Dialog` que você já tem resolve.
- **Contraste.** `text-zinc-500` sobre `#0f0f12` dá cerca de 4:1, abaixo do AA para texto pequeno, e os placeholders em `zinc-600` ficam ainda piores. As abas também não têm semântica de `tab`.
- **Lint e testes.** Biome ou ESLint com regras de hooks (há `useEffect` com dependências faltando). Testes de rota com `app.request` e `fetch` mockado, mais um teste de paridade en/pt. Um workflow de CI com `lint && test && build` seria o primeiro passo.
- **Dockerfile.** Copiar `src/` inteiro elimina a armadilha da lista de `COPY`. Também usaria `USER bun`, dependências só de produção e `HEALTHCHECK` em `/api/health`.
- **Fonte local.** O Geist já é hospedado localmente, mas o JetBrains Mono vem do Google Fonts. Trocar por `@fontsource-variable/jetbrains-mono` deixa o self-host totalmente offline.
- **Higiene e documentação.** `name: "react-example"` e `metadata.json` são sobras do template. Os READMEs e o guia `guia-ts/04` precisam acompanhar o código.