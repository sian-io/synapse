# 02 — Funcionamento e Necessidade das Configurações e Tooling

Em um projeto simples de Python, muitas vezes basta um arquivo `requirements.txt` (ou um `pyproject.toml`) e um comando `python main.py` para colocar tudo em funcionamento. 

Ao abrir um projeto em TypeScript como o **Synapse**, no entanto, você encontra cinco arquivos de configuração e bloqueio na raiz:
- `package.json`
- `package-lock.json`
- `bun.lock`
- `tsconfig.json`
- `vite.config.ts`

Neste documento dedicado, não faremos uma leitura maçante de cada linha de código. Em vez disso, vamos evidenciar a **necessidade** (por que cada um existe e qual dor resolve) e o **funcionamento** (como eles operam juntos no pipeline de execução do projeto).

---

## 1. Visão Geral: A Especialização de Papéis

Para entender por que existem tantos arquivos, é preciso entender que o ecossistema TypeScript moderno opera por **separação de responsabilidades**:

```
+-------------------------------------------------------------------------+
|                  package.json (O Maestro do Projeto)                    |
|      Declara quem é o projeto, quais bibliotecas usar e quais scripts rodar |
+------------------------------------+------------------------------------+
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
+---------------------+   +---------------------+   +---------------------+
|  Lockfiles (.lock)  |   |    tsconfig.json    |   |   vite.config.ts    |
| (npm / bun locks)   |   | (Auditor de Tipos)  |   | (Motor do Frontend) |
| Congelam versões    |   | Define regras de    |   | Transpila código,   |
| exatas para evitar  |   | checagem estática   |   | gerencia HMR e gera |
| quebras no deploy   |   | e compatibilidade   |   | o bundle de produção|
+---------------------+   +---------------------+   +---------------------+
```

---

## 2. `package.json` — A Âncora e o Orquestrador do Projeto

### Qual é a sua necessidade?
O Node.js, por padrão, não tem como saber o nome do seu projeto, onde começa o código, quais comandos podem ser executados no terminal nem quais bibliotecas de terceiros baixar da internet.

No mundo Python, o `package.json` acumula as responsabilidades que costumam ser divididas entre o `pyproject.toml` (metadados e dependências), o `setup.cfg` e ferramentas de automação como um `Makefile` ou `taskfile`.

### Como ele funciona na prática?

O arquivo atua em três frentes principais:

1. **Definição do Sistema de Módulos (`"type": "module"`)**:
   - Historicamente, o Node.js utilizava o formato **CommonJS** (`require()` e `module.exports`).
   - A especificação moderna do JavaScript utiliza **ESM** (*ECMAScript Modules*, com `import` e `export`), idêntica ao modelo de imports do Python.
   - Definir `"type": "module"` informa ao Node.js que todos os arquivos `.js`/`.ts` do projeto devem seguir o padrão moderno de módulos.

2. **Divisão de Dependências (`dependencies` vs `devDependencies`)**:
   - `dependencies` (ex: `hono`, `react`, `lucide-react`, `react-markdown`): Bibliotecas que o código precisa para funcionar enquanto a aplicação está rodando em produção (incluindo o servidor Hono e o cliente `hono/client` do Hono RPC).
   - `devDependencies` (ex: `typescript`, `vite`, `@hono/vite-dev-server`, `@types/bun`): Ferramentas que só são úteis para quem está programando ou compilando o projeto. Em Python, seria o equivalente às dependências do grupo `[tool.poetry.group.dev]` (como `pytest`, `mypy`, `ruff`).

3. **Central de Automação (`scripts`)**:
   - Mapeia comandos curtos para pipelines de execução:
     - `bun run dev`: Executa `bun --bun vite` (sobe o servidor Vite com `@hono/vite-dev-server` despachando `/api/*` ao Hono).
     - `bun run build`: Executa `vite build` para empacotar os componentes React em arquivos estáticos otimizados em `dist/`.
     - `bun run start`: Executa `bun server.ts` nativamente em produção, servindo a API Hono e os arquivos estáticos de `dist/`.
     - `bun run lint`: Executa `tsc --noEmit` para auditar a tipagem estática (incluindo os contratos Hono RPC entre `server.ts` e `src/api.ts`) sem gerar arquivos.

---

## 3. `bun.lock` — O Determinismo do Lockfile

### Qual é a sua necessidade?
No `package.json`, as versões das dependências geralmente usam caracteres como `^` ou `~` (por exemplo: `"hono": "^4.7.4"`). O símbolo `^` significa: *"instale a versão 4.7.4 ou qualquer versão compatível mais recente que for lançada"*.

Isso gera um problema crítico de causalidade conhecido como **efeito "na minha máquina funciona"**:
- O Desenvolvedor A instala hoje e recebe a versão 4.7.4.
- O Desenvolvedor B baixa o projeto três meses depois; uma versão mais nova foi lançada com uma mudança interna que quebra o código.

**A solução**: O arquivo `bun.lock` registra a árvore exata de dependências instaladas pelo **Bun**, descendo recursivamente até as dependências transitivas e associando cada pacote a um hash criptográfico para garantir instalações idênticas. No Python, o lockfile é o análogo exato de um `uv.lock` ou `poetry.lock`.

---

## 4. `tsconfig.json` — As Regras do Verificador de Tipos

### Qual é a sua necessidade?
Como o compilador do TypeScript (`tsc`) precisa analisar o código antes de qualquer execução, ele precisa de instruções claras sobre o ambiente e o sistema de módulos. O `tsconfig.json` configura o Language Server da IDE e o verificador estático.

### Decisões Cruciais e Funcionamento:

1. **A Diretiva Vital: `"noEmit": true`**:
   - O **TypeScript** faz apenas o que ele faz melhor: auditar a coerência lógica dos tipos (`noEmit: true`), inclusive validando se as chamadas do cliente Hono RPC (`src/api.ts`) correspondem às rotas exportadas por `server.ts` (`AppType`).
   - O **Bun** (no servidor) e o **Vite** (no frontend) cuidam da transpilação e execução.

2. **Compatibilidade de Ambiente (`target`, `lib` e `moduleResolution: "bundler"`)**:
   - `"target": "ES2022"` e `"lib": ["ES2022", "DOM", "DOM.Iterable"]`: Definem suporte ao JavaScript moderno e às APIs globais da Web (`fetch`, `Request`, `Response`, DOM).
   - `"moduleResolution": "bundler"`: Permite resolver subcaminhos modernos exportados por pacotes como `hono/client` e `hono/validator`.

3. **Tratamento de JSX (`jsx: "react-jsx"`)**:
   - Informa ao TypeScript como interpretar tags HTML escritas dentro de arquivos `.tsx` sem exigir a importação manual de `React` no topo de cada arquivo.

---

## 5. `vite.config.ts` — O Motor do Servidor de Desenvolvimento e Empacotamento

### Qual é a sua necessidade?
Navegadores não compreendem arquivos `.tsx` diretamente. O **Vite** atua como servidor de desenvolvimento com HMR e empacotador de produção.

### Como ele funciona no Synapse?

1. **Hot Module Replacement (HMR) Instantâneo**:
   - Enquanto você programa, o Vite substitui apenas o componente alterado em memória no navegador, mantendo o estado da aplicação intacto.

2. **Cadeia de Plugins Integrados**:
   - `@vitejs/plugin-react`: Transforma a sintaxe JSX/TSX do React.
   - `@tailwindcss/vite`: Compila as classes do Tailwind CSS v4 diretamente no pipeline do Vite.
   - `@hono/vite-dev-server`: Conecta o servidor de desenvolvimento do Vite diretamente à aplicação Hono em `server.ts` na mesma porta (`3000`):
     ```typescript
     devServer({
       entry: 'server.ts',
       exclude: [
         ...defaultOptions.exclude,
         /^\/(?!api\/).*/,
       ],
     })
     ```
   - Qualquer requisição para `/api/*` é despachada via Web Standards Fetch API para o Hono, enquanto as demais rotas são servidas pelo Vite para a SPA React.

---

No próximo documento ([03 — Recursos da Linguagem no Synapse](./03-recursos-da-linguagem-no-synapse.md)), entraremos no código-fonte para analisar como os recursos de tipagem do TypeScript e o Hono RPC são aplicados na prática.
