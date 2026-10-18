# Guia Técnico e Educacional: Synapse & Ecossistema TypeScript

Bem-vindo à documentação técnica do **Synapse**. Este conjunto de documentos foi concebido especificamente para desenvolvedores com sólida experiência em **Python** e familiaridade com a sintaxe básica de **JavaScript**, mas que estão tendo seu primeiro contato aprofundado com o **TypeScript** e com a arquitetura de projetos modernos no ecossistema **Bun + Hono + Vite**.

O objetivo aqui não é apenas mostrar "como usar", mas explicar **como as coisas funcionam sob o capô**, estabelecendo uma **cadeia clara de causalidade**: por que cada ferramenta foi criada, qual problema ela resolve, como o compilador opera sobre o código e como o runtime executa o resultado final.

---

## 🗺️ Trilha de Aprendizado Recomendada

A documentação está dividida de forma modular. Recomendamos a leitura sequencial para construir um modelo mental sólido, partindo dos fundamentos da linguagem até a arquitetura completa da aplicação:

### [1. Fundamentos do TypeScript para Desenvolvedores Python](./01-fundamentos-typescript-para-pythonistas.md)
> **Foco**: O que é o TypeScript fisicamente? A cadeia causal do *Type Erasure* (apagamento de tipos), tempo de compilação versus tempo de execução, e o contraste direto com o modelo de execução e tipagem do Python (`mypy`, `pydantic`, `__annotations__`) e do JavaScript dinâmico.

### [2. Funcionamento e Necessidade das Configurações e Tooling](./02-configuracoes-e-ferramental.md)
> **Foco (Arquivo Dedicado)**: Por que esses arquivos existem e o que fazem? Análise do papel e da necessidade de:
> - `package.json` (manifesto, dependências e automação)
> - `bun.lock` (determinismo de versões no Bun)
> - `tsconfig.json` (regras do verificador estático e a diretiva `"noEmit": true`)
> - `vite.config.ts` (servidor de desenvolvimento com `@hono/vite-dev-server` e plugins)

### [3. Recursos da Linguagem TypeScript no Synapse](./03-recursos-da-linguagem-no-synapse.md)
> **Foco**: Os conceitos de TypeScript aplicados diretamente no código-fonte do Synapse:
> - Modelagem estrutural com `interface` vs `type` (comparado a `TypedDict` e `dataclass`)
> - *Union Types* e strings literais em substituição a Enums pesados
> - Modificadores opcionais (`?`) e o operador de afirmação não-nula (`!`)
> - *Generics* (`<T>`) e inferência de tipos de ponta a ponta com **Hono RPC** (`hc<AppType>`)
> - O ecossistema `@types/*` (`@types/bun`)

### [4. Arquitetura e Fluxo do Synapse](./04-arquitetura-e-fluxo-do-synapse.md)
> **Foco**: Como a aplicação funciona de ponta a ponta:
> - Arquitetura unificada: **Bun + Hono + `@hono/vite-dev-server`** e cliente tipado **Hono RPC** (`src/api.ts`)
> - Pipeline de inteligência artificial com arquitetura BYOK (OpenAI, Anthropic, Google Gemini, Ollama)
> - Gerenciamento de estado no cliente (React 19 + `localStorage`)
> - O algoritmo de repetição espaçada SM-2 implementado no laboratório de recuperação ativa

### [5. De Python para TypeScript: Guia de Referência Rápida](./05-de-python-para-typescript-guia-rapido.md)
> **Foco**: Um dicionário de bolso e tabela de equivalência direta entre conceitos de Python e TypeScript (sintaxe, tipos, pacotes, assincronismo e armadilhas comuns).

---

## 📌 Guia de Atalhos por Interesse

- **Se você quer entender os arquivos da raiz do projeto**: Comece direto pelo documento [02 — Configurações e Tooling](./02-configuracoes-e-ferramental.md).
- **Se você quer entender os arquivos de tipagem (`src/types.ts` e `src/api.ts`)**: Leia o documento [03 — Recursos da Linguagem](./03-recursos-da-linguagem-no-synapse.md).
- **Se você quer entender o servidor backend (`server.ts`), Hono RPC e o React**: Leia o documento [04 — Arquitetura e Fluxo](./04-arquitetura-e-fluxo-do-synapse.md).
- **Se você precisa de uma tradução rápida de uma sintaxe Python para TS**: Consulte a tabela no documento [05 — Guia Rápido](./05-de-python-para-typescript-guia-rapido.md).
