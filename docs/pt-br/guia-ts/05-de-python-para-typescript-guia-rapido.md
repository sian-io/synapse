# 05 — De Python para TypeScript: Guia de Referência Rápida

Este documento foi projetado como um guia de consulta ágil para quem pensa e programa em **Python**, servindo como uma "tabela de tradução mental" para o **TypeScript** e o ecossistema Node.js.

---

## 1. Tabela de Equivalência de Conceitos e Ferramentas

| Conceito / Necessidade | No Ecossistema Python | No Ecossistema TypeScript / Node.js | Detalhes & Nuances |
| :--- | :--- | :--- | :--- |
| **Manifesto de Dependências** | `pyproject.toml` ou `requirements.txt` | `package.json` | Contém metadados, dependências e scripts de automação. |
| **Congelamento de Versões** | `poetry.lock`, `uv.lock`, `Pipfile.lock` | `package-lock.json` ou `bun.lock` | Garante instalações determinísticas com hashes criptográficos. |
| **Ambiente Virtual Isolado** | `.venv/` (ativado com `source .venv/bin/activate`) | `node_modules/` (local ao projeto) | No Node.js **não se ativa ambiente**. Os comandos usam os pacotes da pasta local automaticamente. |
| **Verificador Estático de Tipos** | `mypy .` ou `pyright` | `tsc --noEmit` | Analisa a coerência de tipos estática sem gerar código executável. |
| **Executor em Tempo Real** | `python script.py` | `bun script.ts` | O Bun transpila o TypeScript nativamente em memória e executa direto. |
| **Framework Web & RPC** | `FastAPI` ou `Flask` | `Hono` + `Hono RPC` (`hc<AppType>`) | Roteamento Web Standards (`Request`/`Response`) e cliente RPC tipado de ponta a ponta. |
| **Modelo de Dados Estruturado** | `TypedDict` ou `@dataclass` | `interface` ou `type` | No Python permanece em runtime; no TS é apagado pelo compilador. |
| **Validação Estrita de JSON** | Modelos `pydantic.BaseModel` | `interface` + `hono/validator` / JSON Schema | O TypeScript estático combina-se ao `validator('json')` do Hono e ao `responseSchema` do Gemini. |
| **Ausência de Valor** | `None` | `null` ou `undefined` | O JS/TS possui dois conceitos para representar valores ausentes. |
| **Lista Homogênea** | `list[str]` | `string[]` ou `Array<string>` | Sintaxe idêntica de coleções dinâmicas indexadas. |
| **Dicionário Tipado** | `dict[str, int]` | `Record<string, number>` | Mapeamento estruturado de chaves para valores. |
| **Conjunto Finito de Opções** | `Literal["a", "b"]` | `'a' \| 'b'` (Union Type) | Checagem estática de opções exatas em tempo de edição. |
| **Código Assíncrono** | `async def` / `await` com `asyncio` | `async function` / `await` com `Promise` | Ambos baseiam-se em um loop de eventos de thread única (Event Loop). |

---

## 2. As 5 Maiores Armadilhas para Quem Vem do Python

### 1. A Verdade e a Falsidade (*Truthy* vs *Falsy*)
Em Python, listas e dicionários vazios são avaliados como falsos em blocos condicionais:
```python
# Em Python:
lista = []
if not lista:
    print("Vazio!") # Isso será impresso em Python!
```

Em JavaScript e TypeScript, **objetos e arrays vazios são SEMPRE verdadeiros (`truthy`)**:
```typescript
// Em TypeScript:
const lista: string[] = [];
if (lista) {
  console.log("Isso SEMPRE é executado!"); // Cuidado!
}

// A forma correta de checar se está vazio em TS:
if (lista.length === 0) {
  console.log("Agora sim, está vazio!");
}
```

---

### 2. A Duplicidade de Ausência: `null` vs `undefined`
Enquanto o Python possui apenas o singleton `None`, o JavaScript/TypeScript possui dois valores distintos:

- **`undefined`**: A variável foi declarada, mas ainda não recebeu nenhum valor (ou a propriedade não existe no objeto). É o padrão retornado pelo próprio motor JavaScript.
- **`null`**: Representa a ausência deliberada e intencional de um valor, atribuída explicitamente pelo programador.

```typescript
let valorSemAtribuir: number | undefined; // undefined por padrão
let semValorDeProposito: number | null = null;
```

---

### 3. Tipagem Estrutural (*Duck Typing Estático*)
Em Python, classes seguem tipagem nominal (uma instância de `Gato` só é `Gato` se herdar de `Gato`):
```python
class Pato:
    def grasnar(self): pass

class Pessoa:
    def grasnar(self): pass

# Em Python com type hints estritos:
def fazer_barulho(ave: Pato):
    ave.grasnar()

p = Pessoa()
# mypy alertará se você passar 'p' aqui!
```

No TypeScript, a tipagem é **puramente estrutural**:
```typescript
interface Pato {
  grasnar(): void;
}

const pessoa = {
  grasnar: () => console.log("Quack!"),
  nome: "Guilherme"
};

function fazerBarulho(ave: Pato) {
  ave.grasnar();
}

// Válido! 'pessoa' possui o método 'grasnar()', logo satisfaz a interface Pato.
fazerBarulho(pessoa);
```

---

### 4. Onde Ficam os Pacotes? (Sem Necessidade de Ativar Virtualenv)
No Python, você precisa explicitamente criar um ambiente (`python -m venv .venv`) e ativá-lo no terminal (`source .venv/bin/activate`). Se esquecer de ativar, o `pip` tentará instalar na pasta global do sistema operacional.

No Bun / Node.js:
- Não existe conceito de "ativar ambiente".
- Toda execução de `bun install` baixa os arquivos diretamente para a subpasta local [`node_modules/`](file:///home/gui/Projects/synapse/node_modules) do seu projeto.
- Quando você executa `bun run dev` ou qualquer script, o runtime busca as dependências automaticamente subindo a árvore de diretórios a partir do seu arquivo.

---

### 5. O Modelo Assíncrono: Promises vs Coroutines
Em Python, invocar uma função assíncrona sem `await` retorna um objeto de coroutine não executado:
```python
# Python
async def buscar(): pass
coro = buscar() # Nada acontece até que você faça 'await coro' ou passe para o asyncio loop
```

Em JavaScript/TypeScript, invocar uma função `async` **inicia a execução imediatamente** e retorna uma **`Promise`**:
```typescript
// TypeScript
async function buscar() { /* roda imediatamente até o primeiro await */ }
const promessa = buscar(); // A operação já está em andamento no Event Loop!
```

---

## 3. Resumo Prático para o Dia a Dia no Synapse

1. **Para checar erros de tipo antes de rodar**:
   Execute `bun run lint` no terminal. Se o comando terminar em silêncio, seu código (incluindo os contratos Hono RPC) está 100% aderente aos tipos.
2. **Para rodar o projeto localmente com recarga automática**:
   Execute `bun run dev` e abra `http://localhost:3000`.
3. **Para testar o empacotamento completo de produção**:
   Execute `bun run build` e `bun run start`.
