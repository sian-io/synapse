import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Brain,
  HelpCircle,
  RotateCcw,
  Target,
  ArrowRight,
  ShieldAlert,
  Sliders,
  ChevronDown,
  Info
} from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage, PedagogicalMode } from '../types';

interface SocraticTutorProps {
  currentTopic: string;
  onTopicChange: (topic: string) => void;
  onAddRetrievalCard?: (question: string, answer: string, topic: string) => void;
  onIncrementStats: (type: 'socratic' | 'retrieval' | 'feynman') => void;
  initialPrompt?: string | null;
}

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'msg_welcome',
  role: 'assistant',
  content: `Olá! Eu sou o **Synapse**, seu tutor pedagógico de aprendizagem ativa fundamentado em **Neurociência Cognitiva**.

Diferente de assistentes convencionais que entregam respostas prontas (o que gera a ilusão de fluência e rápido esquecimento), nós priorizamos **Potenciação de Longa Duração (LTP)** e **recuperação ativa**:
- Não entregamos respostas mastigadas.
- Desmontamos problemas complexos via **Método Socrático** e **Interrogação Elaborativa**.
- Você constrói os caminhos neurais através do esforço cognitivo produtivo (*dificuldade desejável*).

**Qual conceito, tema ou matéria você gostaria de dissecar hoje?**`,
  timestamp: Date.now(),
  pedagogicalMeta: {
    cognitivePhase: 'Engajamento Inicial',
    desirableDifficultyNote: 'A ativação consciente do córtex pré-frontal no início de uma sessão prepara receptores dopaminérgicos para foco na novidade.',
    suggestedActions: [
      'Entender Como funciona a Memória de Longo Prazo',
      'Desvendar a Mecânica Quântica sem jargões',
      'Dominar o Algoritmo de Dijkstra e Grafos',
      'Compreender a Inflação e Política Monetária',
    ],
  },
};

export const SocraticTutor: React.FC<SocraticTutorProps> = ({
  currentTopic,
  onTopicChange,
  onIncrementStats,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('synapse_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [DEFAULT_WELCOME_MESSAGE];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pedagogicalMode, setPedagogicalMode] = useState<PedagogicalMode>('socratic');
  const [metacognitiveCertainty, setMetacognitiveCertainty] = useState<number>(3);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt.trim());
    }
  }, [initialPrompt]);

  useEffect(() => {
    localStorage.setItem('synapse_chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          mode: pedagogicalMode,
          currentTopic: currentTopic || 'Aprendizado Ativo',
          studentCalibration: metacognitiveCertainty,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor.');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.content,
        timestamp: Date.now(),
        pedagogicalMeta: data.meta,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onIncrementStats('socratic');
    } catch (err: any) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Não foi possível conectar ao núcleo neural no momento: ${err.message}. Verifique a conexão e tente novamente.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Deseja reiniciar a sessão socrática? O histórico atual será limpo.')) {
      setMessages([DEFAULT_WELCOME_MESSAGE]);
      localStorage.removeItem('synapse_chat_history');
    }
  };

  const quickPrompts = [
    {
      label: 'Pergunta Socrática',
      desc: 'Desafia a encontrar o mecanismo central',
      icon: HelpCircle,
      prompt: 'Faça uma pergunta socrática que me desafie a encontrar o mecanismo nuclear desse tópico.',
    },
    {
      label: 'Desafiar Premissa',
      desc: 'Contradições e exceções esquecidas',
      icon: ShieldAlert,
      prompt: 'Aponte uma contradição ou exceção comum que as pessoas ignoram sobre esse tema e me pergunte como explicá-la.',
    },
    {
      label: 'Interrogação Elaborativa',
      desc: 'Por que opera dessa forma e não de outra?',
      icon: Brain,
      prompt: 'Por que esse mecanismo funciona exatamente dessa forma e não de outra maneira alternativa?',
    },
    {
      label: 'Teste de Recuperação Rápida',
      desc: 'Aplicação prática para testar compreensão',
      icon: Target,
      prompt: 'Faça-me uma pergunta de aplicação prática para testar se eu realmente compreendi o modelo mental ou apenas decorei.',
    },
  ];

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Conversation Stream - 8 Columns */}
      <div className="lg:col-span-8 flex flex-col h-[76vh] bg-zinc-900/30 rounded-2xl border border-zinc-800/80 backdrop-blur-md overflow-hidden shadow-sm">
        {/* Top Header of Tutor */}
        <div className="px-6 py-3.5 border-b border-zinc-800/80 bg-zinc-950/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
              <Brain className="w-4 h-4 stroke-[1.75]" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-zinc-200 tracking-wide uppercase">
                Tutor Socrático &amp; Interrogação Elaborativa
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={pedagogicalMode}
              onChange={(e) => setPedagogicalMode(e.target.value as PedagogicalMode)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-zinc-600 transition-colors"
              title="Alterar postura do tutor pedagógico"
            >
              <option value="socratic">Método Socrático (Andaimes &amp; Perguntas)</option>
              <option value="active_retrieval">Desafio de Recuperação (Active Recall)</option>
              <option value="feynman">Auditoria Feynman (Simplificação &amp; Jargões)</option>
              <option value="metacognition">Auditoria Metacognitiva (Certeza)</option>
            </select>

            <button
              onClick={handleClearHistory}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70 transition-colors cursor-pointer"
              title="Reiniciar diálogo socrático"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <span className="text-xs font-mono font-medium text-zinc-400">
                    {isUser ? 'Você' : 'Synapse'}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`max-w-[94%] sm:max-w-[88%] rounded-2xl p-5 sm:p-6 text-sm sm:text-base leading-relaxed ${
                    isUser
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 rounded-tr-sm'
                      : 'bg-zinc-900/70 border border-zinc-800/80 text-zinc-200 rounded-tl-sm'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-zinc-200 leading-relaxed prose-headings:text-zinc-100 prose-headings:font-semibold prose-strong:text-zinc-100 prose-code:text-zinc-200 prose-code:bg-zinc-950 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:border prose-code:border-zinc-800">
                        <Markdown>{message.content}</Markdown>
                      </div>

                      {/* Pedagogical Metadata Box */}
                      {message.pedagogicalMeta && (
                        <div className="mt-5 pt-4 border-t border-zinc-800/80 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-zinc-950 text-zinc-300 border border-zinc-800">
                              <Sparkles className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />
                              Fase: {message.pedagogicalMeta.cognitivePhase || 'Reflexão Ativa'}
                            </span>
                          </div>

                          {message.pedagogicalMeta.desirableDifficultyNote && (
                            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs sm:text-sm text-zinc-300 flex items-start gap-3">
                              <Brain className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5 stroke-[1.75]" />
                              <div>
                                <span className="font-medium text-zinc-200 block mb-0.5">
                                  Fundamento Neurocientífico:
                                </span>
                                <span className="text-zinc-400 leading-relaxed">
                                  {message.pedagogicalMeta.desirableDifficultyNote}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Suggested Active Next Steps */}
                          {message.pedagogicalMeta.suggestedActions &&
                            message.pedagogicalMeta.suggestedActions.length > 0 && (
                              <div className="space-y-2 pt-1">
                                <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />
                                  Ações Cognitivas Recomendadas:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {message.pedagogicalMeta.suggestedActions.map((action, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleSendMessage(action)}
                                      className="text-xs text-left px-3 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 border border-zinc-800/80 hover:border-zinc-700 transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-zinc-400 shrink-0 stroke-[1.75]" />
                                      <span>{action}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <Brain className="w-4 h-4 animate-pulse stroke-[1.75]" />
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl rounded-tl-sm p-4 text-xs text-zinc-400 flex items-center gap-3">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400"></span>
                </span>
                <span>Construindo andaime cognitivo e formulando pergunta socrática...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Bar */}
        <div className="p-4 sm:p-5 bg-zinc-950/80 border-t border-zinc-800/80 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Responda ao tutor ou proponha sua hipótese de raciocínio..."
              disabled={isLoading}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-700/60 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-5 py-3 bg-zinc-100 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
              title="Enviar resposta para avaliação socrática"
            >
              <span>Enviar</span>
              <Send className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          </form>
        </div>
      </div>

      {/* Metacognitive Inspector & Provocations Sidebar - 4 Columns */}
      <div className="lg:col-span-4 space-y-4">
        {/* Metacognitive Certainty Card */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />
              Calibração Metacognitiva
            </span>
            <span className="text-xs font-mono font-bold text-zinc-100 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
              {metacognitiveCertainty}/5
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={metacognitiveCertainty}
              onChange={(e) => setMetacognitiveCertainty(Number(e.target.value))}
              className="w-full accent-zinc-200 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
              <span>1 - Chute</span>
              <span>3 - Parcial</span>
              <span>5 - Convicção</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs text-zinc-400 leading-relaxed">
            <strong className="text-zinc-300 font-medium block mb-1">Combate ao Dunning-Kruger:</strong>
            Informar sua autopercepção calibra a profundidade das perguntas do tutor, aumentando o rigor se houver excesso de confiança ou oferecendo andaimes graduais se houver dúvida.
          </div>
        </div>

        {/* Quick Provocations Cards */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            Provocações Socráticas Rápidas
          </span>
          <p className="text-xs text-zinc-500">
            Dispare um desafio conceitual com um clique para aprofundar seu modelo mental:
          </p>

          <div className="space-y-2">
            {quickPrompts.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.prompt)}
                  disabled={isLoading}
                  className="w-full text-left p-3 rounded-xl bg-zinc-950/70 hover:bg-zinc-800/80 text-zinc-300 hover:text-zinc-100 border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-start gap-3 cursor-pointer group disabled:opacity-40"
                >
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 stroke-[1.75]" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-zinc-400 leading-snug">
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Neuroscientific Scaffolding Card */}
        <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 uppercase font-mono">
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            <span>Por que o Método Socrático?</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Quando o cérebro recebe uma resposta pronta, a carga cognitiva germana é quase nula. Quando estimulado por perguntas guiadas, o hipocampo realiza buscas semânticas profundas, selando a memória na rede neural definitiva.
          </p>
        </div>
      </div>
    </div>
  );
};
