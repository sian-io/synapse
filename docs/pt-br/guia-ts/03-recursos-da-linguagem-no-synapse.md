# 03 — Recursos da Linguagem TypeScript no Synapse

Para um desenvolvedor acostumado com a flexibilidade do **Python** e do **JavaScript**, as anotações do TypeScript podem inicialmente parecer uma sobrecarga de sintaxe. No entanto, quando você compreende o mecanismo por trás de cada recurso, percebe que elas funcionam como **contratos de segurança em tempo de edição**.

Neste documento, vamos analisar os recursos do TypeScript que estruturam o código real do **Synapse**, comparando cada um com seus equivalentes conceituais no Python.

---

## 1. Modelagem de Estruturas: `interface` vs `type`

Abra o arquivo [`src/types.ts`](file:///C:/Projetos/synapse/src/types.ts). Você notará dois operadores fundamentais: `type` e `interface`.

### O que é uma `interface`?
Uma `interface` define o formato exato que um objeto JavaScript deve ter em sua estrutura:

```typescript
// src/types.ts
export interface Flashcard {
  id: string;
  topic: string;
  question: string;
  answer: string;
  keyConcept: string;
  neuroTip: string;
  intervalDays: number;
  repetitions: number;
  easeFactor: number;
  lastReviewed?: number;
  nextReviewDate: number;
  masteryLevel: number;
}
```

#### Comparação com Python:
No Python moderno, você modelaria isso como uma `@dataclass` ou um `TypedDict`:

```python
# Equivalente conceitual em Python
from typing import TypedDict, Optional

class Flashcard(TypedDict):
    id: str
    topic: str
    question: str
    answer: str
    intervalDays: int
    lastReviewed: Optional[int]
```

**A diferença causal crucial**:
- No Python, a classe `Flashcard` permanece em memória em tempo de execução e pode ser inspecionada via `isinstance()`.
- No TypeScript, a `interface Flashcard` é **completamente eliminada na compilação** (*Type Erasure*). Se você passar um objeto JavaScript que contenha todas as propriedades exigidas, o TypeScript aceitará o objeto mesmo que ele nunca tenha sido explicitamente instanciado como "um Flashcard" (princípio da **Tipagem Estrutural** ou *Duck Typing estático*).

---

## 2. Tipos de União (*Union Types*) e *String Literals*

Ainda em [`src/types.ts`](file:///C:/Projetos/synapse/src/types.ts), veja a definição do modo pedagógico:

```typescript
export type PedagogicalMode = 
  | 'socratic'          // Método Socrático & Interrogação Elaborativa
  | 'feynman'           // Técnica de Feynman (Explicar para Aprender)
  | 'active_retrieval'  // Prática de Recuperação Ativa & Desafio
  | 'concept_breakdown' // Decomposição & Redução de Carga Cognitiva
  | 'metacognition';    // Calibração Metacognitiva & Reflexão
```

### Por que usar essa sintaxe em vez de um `Enum`?
Em linguagens tradicionais (e até no módulo `enum` do Python), usa-se uma classe de Enum:
```python
# Python
from enum import Enum
class PedagogicalMode(Enum):
    SOCRATIC = "socratic"
    FEYNMAN = "feynman"
```

No TypeScript, criar um `enum` clássico gera código JavaScript extra no bundle final. Em contraste, os **Union Types com String Literals** (`'socratic' | 'feynman'`):
1. Têm custo zero em runtime (são strings puras no JavaScript).
2. Impedem que qualquer valor diferente dessas 5 strings seja aceito:
   ```typescript
   let modo: PedagogicalMode = 'socratic'; // ✅ Válido
   modo = 'outro_modo';                   // ❌ Erro de compilação imediato!
   ```
3. No Python, o equivalente exato é o `Literal["socratic", "feynman", ...]` do módulo `typing`.

---

## 3. Propriedades Opcionais (`?`) e Nulabilidade

Na interface `Flashcard`, temos a propriedade:
```typescript
lastReviewed?: number;
```

A interrogação (`?`) sinaliza que a propriedade é **opcional**. Isso significa que o valor pode ser do tipo `number` ou pode simplesmente não existir no objeto (`undefined`).

### Comparação com Python:
No Python, você escreveria:
```python
lastReviewed: Optional[int] = None
# ou no Python 3.10+:
lastReviewed: int | None = None
```

### O Operador de Afirmação Não-Nula (*Non-null Assertion Operator* `!`)

Veja a inicialização do React em [`src/main.tsx`](file:///C:/Projetos/synapse/src/main.tsx):

```typescript
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Repare no ponto de exclamação no final de `document.getElementById('root')!`.

#### Por que ele existe?
A assinatura nativa do método `getElementById` no navegador diz ao TypeScript que o retorno é:
```typescript
HTMLElement | null
```
(Afinal, se não houver nenhuma tag `<div id="root">` no HTML, a função retornará `null`).

O método `createRoot()` do React, por sua vez, exige estritamente um `HTMLElement` e rejeita `null`.
Ao colocar o caractere `!`, você diz ao compilador:
> *"Eu, desenvolvedor, garanto que o arquivo index.html possui a div com id 'root'. Não me avise sobre o risco de ser null."*

**No Python**, o análogo direto seria um `assert`:
```python
root = document.get_element_by_id('root')
assert root is not None, "Elemento root não encontrado"
```
A diferença é que no Python o `assert` executa uma checagem em tempo real, enquanto o `!` do TypeScript simplesmente silencia o verificador estático.

---

## 4. Tipos Genéricos (*Generics* `<T>`)

Generics permitem escrever código que opera de forma idêntica sobre diferentes tipos, sem perder a segurança estática.

Pense neles como **parâmetros de função, mas que recebem tipos em vez de valores**.

### Exemplo 1: O hook `useState` do React
No arquivo [`src/App.tsx`](file:///C:/Projetos/synapse/src/App.tsx), você verá:
```typescript
const [activeTab, setActiveTab] = useState<PedagogicalMode>('socratic');
```
O `<PedagogicalMode>` passa o tipo como parâmetro para o hook `useState`. O TypeScript agora sabe que a variável `activeTab` só pode assumir um dos cinco modos válidos, e que a função `setActiveTab` rejeitará qualquer outra string.

### Exemplo 2: Cliente Hono RPC Tipado com `hc<AppType>`
No arquivo [`src/api.ts`](file:///home/gui/Projects/synapse/src/api.ts), o cliente HTTP é instanciado passando o tipo `AppType` exportado pelo servidor como parâmetro genérico:
```typescript
import { hc } from 'hono/client';
import type { AppType } from '../server';

export const api = hc<AppType>('/');
```
Graças ao `typeof routes` exportado em `server.ts` (`export type AppType = typeof routes`), o TypeScript infere automaticamente todas as rotas (`/api/chat`, `/api/feynman-evaluate`, etc.), os payloads esperados em `{ json: ... }` e o formato exato de `await response.json()` em cada status HTTP (`200` vs `400`).

---

## 5. Afunilamento de Tipos (*Type Narrowing*)

No JavaScript dinâmico e no Python, é muito comum inspecionar o tipo de uma variável com condicionais (`isinstance()` no Python ou `typeof` no JS).

O TypeScript entende o fluxo do código através dessas condicionais e refina (*narrows*) o tipo da variável dentro do bloco `if`.

Com o **Hono RPC**, a propriedade `response.ok` funciona como uma união discriminada pelo status HTTP (`200` tem `ok: true`, `400` tem `ok: false`):
```typescript
const response = await api.api['feynman-evaluate'].$post({
  json: { topic: activeConcept, explanation, targetAudience, language },
});

if (!response.ok) {
  // Aqui o TypeScript sabe que o status é 400 e errData é { error: string }
  const errData = await response.json().catch(() => null);
  throw new Error(errData?.error || t.feynman.errorFallback);
}

// Aqui o TypeScript estreita automaticamente o retorno para FeynmanEvaluation
const data = await response.json();
```

---

## 6. O Ecossistema de Tipos Externos (`@types/*`)

Se você abrir a seção `devDependencies` no [`package.json`](file:///home/gui/Projects/synapse/package.json), verá o pacote:
```json
"@types/bun": "^1.2.4"
```

### Qual é a necessidade desse pacote?
Enquanto bibliotecas modernas escritas diretamente em TypeScript (como o **Hono** e o `@google/genai`) já trazem seus próprios arquivos de definição (`.d.ts`) embutidos, as APIs nativas do runtime (como o objeto global `Bun` utilizado em `server.ts`) precisam ser declaradas para o compilador.

O pacote `@types/bun` fornece apenas arquivos de declaração (`.d.ts`):
- Não contém lógica nem código executável em runtime.
- Contém apenas as assinaturas de tipo para que o TypeScript reconheça APIs globais do Bun, `process.env` e Web Standards no seu editor.

No próximo documento ([04 — Arquitetura e Fluxo do Synapse](./04-arquitetura-e-fluxo-do-synapse.md)), veremos como todas essas peças se combinam para criar a arquitetura completa do servidor e do cliente da aplicação.
