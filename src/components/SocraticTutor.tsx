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
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage, PedagogicalMode } from '../types';

interface SocraticTutorProps {
  currentTopic: string;
  onTopicChange: (topic: string) => void;
  onAddRetrievalCard?: (question: string, answer: string, topic: string) => void;
  onIncrementStats: (type: 'socratic' | 'retrieval' | 'feynman') => void;
}

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'msg_welcome',
  role: 'assistant',
  content: `Olá! Eu sou o **Synapse**, seu tutor pedagógico de aprendizagem ativa fundamentado em **Neurociência Cognitiva**.

Diferente de IAs convencionais que entregam respostas passivas (o que gera a ilusão de fluência e rápido esquecimento), aqui nós praticamos **Potenciação de Longa Duração (LTP)** e **recuperação ativa**:
- Eu não vou te dar as respostas prontas de bandeja.
- Vou desmontar problemas complexos com você através do **Método Socrático** e **Interrogação Elaborativa**.
- Você vai construir os caminhos neurais através do esforço cognitivo produtivo (*dificuldade desejável*).

**Qual conceito, tema ou matéria você quer dominar com profundidade hoje?**`,
  timestamp: Date.now(),
  pedagogicalMeta: {
    cognitivePhase: 'Engajamento Inicial',
    desirableDifficultyNote: 'A ativação consciente do córtex pré-frontal no início de uma sessão prepara os receptores de dopamina para focar na novidade.',
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
  const [showCertaintySlider, setShowCertaintySlider] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        content: `⚠️ Não foi possível conectar ao núcleo neural no momento: ${err.message}. Verifique sua conexão e tente novamente.`,
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
      icon: HelpCircle,
      prompt: 'Faça uma pergunta socrática que me desafie a encontrar o mecanismo central desse tópico.',
    },
    {
      label: 'Desafiar Premissa',
      icon: ShieldAlert,
      prompt: 'Aponte uma contradição ou exceção comum que as pessoas ignoram sobre esse tema e me pergunte como explicá-la.',
    },
    {
      label: 'Interrogação Elaborativa',
      icon: Brain,
      prompt: 'Por que esse mecanismo funciona exatamente dessa forma e não de outra maneira alternativa?',
    },
    {
      label: 'Teste de Recuperação Rápida',
      icon: Target,
      prompt: 'Faça-me uma pergunta de aplicação prática para testar se eu realmente compreendi o modelo mental ou apenas decorei.',
    },
  ];

  return (
    <div className="flex flex-col h-full max-h-[85vh] bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-md overflow-hidden shadow-2xl">
      {/* Top Header of Tutor */}
      <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100 tracking-wide">
                Tutor Socrático & Interrogação Elaborativa
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                LTP Ativado
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Andaimes cognitivos e perguntas norteadoras
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pedagogical focus selector */}
          <select
            value={pedagogicalMode}
            onChange={(e) => setPedagogicalMode(e.target.value as PedagogicalMode)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            title="Alterar postura do tutor pedagógico"
          >
            <option value="socratic">Método Socrático (Andaimes & Perguntas)</option>
            <option value="active_retrieval">Desafio de Recuperação (Active Recall)</option>
            <option value="feynman">Auditoria Feynman (Simplificação & Jargões)</option>
            <option value="metacognition">Auditoria Metacognitiva (Certeza)</option>
          </select>

          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Reiniciar diálogo socrático"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[11px] font-medium text-slate-400">
                  {isUser ? 'Você (Estudante Ativo)' : 'Synapse (Tutor Neurocognitivo)'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 text-sm leading-relaxed shadow-md ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="space-y-4">
                    <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed">
                      <Markdown>{message.content}</Markdown>
                    </div>

                    {/* Pedagogical Metadata Box */}
                    {message.pedagogicalMeta && (
                      <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-700/40">
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            Fase: {message.pedagogicalMeta.cognitivePhase || 'Reflexão Ativa'}
                          </span>
                        </div>

                        {message.pedagogicalMeta.desirableDifficultyNote && (
                          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                            <Brain className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-emerald-400 block mb-0.5">
                                Fundamento Neurocientífico:
                              </span>
                              <span className="text-slate-300">
                                {message.pedagogicalMeta.desirableDifficultyNote}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Suggested Active Next Steps */}
                        {message.pedagogicalMeta.suggestedActions &&
                          message.pedagogicalMeta.suggestedActions.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3 text-indigo-400" />
                                Ações Cognitivas Recomendadas:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {message.pedagogicalMeta.suggestedActions.map((action, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleSendMessage(action)}
                                    className="text-xs text-left px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600/30 text-slate-200 hover:text-indigo-200 border border-slate-700/70 hover:border-indigo-500/50 transition-colors flex items-center gap-1.5"
                                  >
                                    <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
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
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-pulse">
              <Brain className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-slate-400 flex items-center gap-3">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span>Construindo andaime cognitivo e formulando pergunta socrática...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Provocações:
        </span>
        {quickPrompts.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSendMessage(item.prompt)}
              disabled={isLoading}
              className="whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
            >
              <Icon className="w-3 h-3 text-indigo-400" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Input Form & Metacognitive Calibration Bar */}
      <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-3">
        {/* Metacognitive Calibration Toggle */}
        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setShowCertaintySlider(!showCertaintySlider)}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>
              Calibração Metacognitiva:{' '}
              <strong className="text-slate-200">
                {metacognitiveCertainty === 1 && '1/5 (Chute / Muito Inseguro)'}
                {metacognitiveCertainty === 2 && '2/5 (Razoavelmente Inseguro)'}
                {metacognitiveCertainty === 3 && '3/5 (Certeza Moderada)'}
                {metacognitiveCertainty === 4 && '4/5 (Boa Certeza)'}
                {metacognitiveCertainty === 5 && '5/5 (Domínio Pleno / Convicção)'}
              </strong>
            </span>
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showCertaintySlider ? 'rotate-180' : ''}`}
            />
          </button>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Ajusta o scaffolding conforme sua autopercepção
          </span>
        </div>

        {showCertaintySlider && (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>1 - Incerto / Chute</span>
              <span>3 - Raciocínio Parcial</span>
              <span>5 - Certeza Absoluta</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={metacognitiveCertainty}
              onChange={(e) => setMetacognitiveCertainty(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              💡 <em>Combate o Efeito Dunning-Kruger</em>: Reconhecer a própria incerteza estimula a abertura neuroplástica para novos esquemas conceituais.
            </p>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Responda à pergunta do tutor ou proponha sua hipótese de raciocínio..."
            disabled={isLoading}
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20"
            title="Enviar resposta para avaliação socrática"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
