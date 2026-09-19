import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Brain,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Award,
  FileText
} from 'lucide-react';
import { FeynmanEvaluation } from '../types';

interface FeynmanStudioProps {
  currentTopic: string;
  onTopicChange?: (newTopic: string) => void;
  onIncrementStats: (type: 'socratic' | 'retrieval' | 'feynman') => void;
  onOpenSocraticWithPrompt?: (prompt: string) => void;
}

export const FeynmanStudio: React.FC<FeynmanStudioProps> = ({
  currentTopic,
  onTopicChange,
  onIncrementStats,
  onOpenSocraticWithPrompt,
}) => {
  const [audience, setAudience] = useState('uma criança de 10 anos curiosa');
  const [explanation, setExplanation] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [evaluation, setEvaluation] = useState<FeynmanEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleExplanations = [
    {
      topic: 'Fotossíntese',
      text: 'As plantas têm pequenas cozinhas nas folhas chamadas cloroplastos. Elas pegam a luz do sol como fogão, o ar que respiramos (gás carbônico) e a água do solo como ingredientes, e cozinham seu próprio alimento que é um açúcar, soltando oxigênio limpinho para a gente respirar.',
    },
    {
      topic: 'Inflação Econômica',
      text: 'Imagine que você e seus amigos estão jogando banco imobiliário e todo mundo ganha de repente 10 vezes mais dinheiro. A quantidade de casinhas no tabuleiro continua a mesma. Então, para conseguir comprar uma casinha, todo mundo começa a oferecer mais dinheiro por ela. O preço sobe não porque a casa vale mais, mas porque há papel demais perseguindo poucas coisas.',
    },
  ];

  const handleEvaluate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const activeConcept = currentTopic.trim();
    if (!activeConcept || !explanation.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/feynman-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: activeConcept,
          explanation,
          targetAudience: audience,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || 'Falha ao avaliar explicação.');
      }

      const data: FeynmanEvaluation = await response.json();
      setEvaluation(data);
      onIncrementStats('feynman');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro inesperado na análise Feynman.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadSample = (sample: { topic: string; text: string }) => {
    onTopicChange?.(sample.topic);
    setExplanation(sample.text);
    setEvaluation(null);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner explaining Feynman & Neuroscience */}
      <div className="p-6 sm:p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-zinc-200">
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-zinc-200 shrink-0">
            <Sparkles className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
              Estúdio de Desconstrução de Feynman
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-4xl">
              <em>"Se você não consegue explicar algo em termos simples, você não compreendeu o mecanismo."</em> —{' '}
              <strong className="text-zinc-300 font-medium">Fundamento Neurocientífico</strong>: Combate a{' '}
              <span className="text-zinc-200 font-medium">ilusão de profundidade explicativa</span>, forçando o cérebro a desmontar jargões decorados e ancorar representações lógicas na memória semântica duradoura.
            </p>
          </div>
        </div>
      </div>

      {/* Main Studio Grid - 12 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor Workspace - 5 Columns */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 space-y-4">
            <form onSubmit={handleEvaluate} className="space-y-4">
              {/* Concept & Audience Controls */}
              <div className="space-y-3 p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Conceito ativo:</span>
                  <span className="font-semibold text-zinc-100 text-xs sm:text-sm truncate max-w-[220px]">
                    {currentTopic || 'Defina um conceito no topo'}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 block font-medium">
                    Público-Alvo da Explicação:
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors"
                  >
                    <option value="uma criança de 10 anos curiosa">Criança de 10 anos (Simplicidade máxima, zero jargão)</option>
                    <option value="um leigo inteligente e cético">Leigo Inteligente (Lógica clara, sem termos ocos)</option>
                    <option value="um estudante iniciante no assunto">Estudante Iniciante (Elos causais completos)</option>
                  </select>
                </div>
              </div>

              {/* Textarea Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300">
                    Sua Explicação Ativa:
                  </label>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="font-mono">{explanation.trim().split(/\s+/).filter(Boolean).length} palavras</span>
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explique o fenômeno passo a passo. Descreva o 'porquê' e o 'como'. Evite nomes complicados sem explicar o que eles fazem no mundo real..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-700/60 leading-relaxed shadow-inner"
                />

                {/* Sample Topics Quick Load */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-zinc-500 text-[11px]">Carregar exemplo:</span>
                  <div className="flex items-center gap-2">
                    {sampleExplanations.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => loadSample(s)}
                        className="text-[11px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                      >
                        {s.topic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAnalyzing || !currentTopic.trim() || !explanation.trim()}
                className="w-full py-3 bg-zinc-100 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Auditando Ilusões de Compreensão...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4 stroke-[2]" />
                    <span>Auditar com Técnica de Feynman</span>
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleEvaluate()}
                  className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Tentar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Diagnostic & Results - 7 Columns */}
        <div className="lg:col-span-7">
          {evaluation ? (
            <div className="p-6 sm:p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-6 shadow-sm animate-fade-in">
              {/* Header Score & Diagnosis */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
                <div>
                  <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">
                    Diagnóstico de Feynman
                  </span>
                  <h3 className="text-lg font-semibold text-zinc-100 mt-0.5">
                    Avaliação da Explicação de: "{currentTopic}"
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">
                    {evaluation.clarityAssessment}
                  </p>
                </div>

                {/* Score Ring / Pill */}
                <div className="flex items-center gap-3 bg-zinc-950 px-5 py-3 rounded-2xl border border-zinc-800 shrink-0">
                  <div className="text-4xl font-bold font-mono text-zinc-100">
                    {evaluation.score}
                  </div>
                  <div className="text-xs text-zinc-500 leading-tight font-mono">
                    <span className="block font-semibold text-zinc-300">/ 100</span>
                    <span>Domínio</span>
                  </div>
                </div>
              </div>

              {/* Jargon vs Gaps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Jargons Identified */}
                <div className="p-4 sm:p-5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold uppercase tracking-wider font-mono">
                    <AlertTriangle className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                    <span>Jargões Detectados:</span>
                  </div>
                  {evaluation.jargonIdentified.length > 0 ? (
                    <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                      {evaluation.jargonIdentified.map((jargon, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-zinc-500 font-bold">•</span>
                          <span>
                            <strong className="text-zinc-100">"{jargon}"</strong> — Termo técnico usado sem explicitação de mecanismo causal.
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-zinc-400" />
                      Nenhum jargão vazio foi detectado. Explicação pura e direta.
                    </p>
                  )}
                </div>

                {/* Conceptual Gaps */}
                <div className="p-4 sm:p-5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold uppercase tracking-wider font-mono">
                    <Brain className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                    <span>Lacunas no Raciocínio:</span>
                  </div>
                  {evaluation.conceptualGaps.length > 0 ? (
                    <ul className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                      {evaluation.conceptualGaps.map((gap, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-zinc-500 font-bold">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-zinc-400" />
                      Continuidade lógica consistente, sem saltos inexplicados.
                    </p>
                  )}
                </div>
              </div>

              {/* Strengths */}
              <div className="p-4 sm:p-5 rounded-xl bg-zinc-950/50 border border-zinc-800/80 space-y-2.5">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                  Pontos Fortes da sua Explicação:
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {evaluation.strengths.map((str, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-900 text-zinc-200 border border-zinc-800"
                    >
                      {str}
                    </span>
                  ))}
                </div>
              </div>

              {/* Suggested Analogy & Benchmark */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 sm:p-5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2.5">
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                    Analogia Vívida Sugerida:
                  </span>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    {evaluation.suggestedAnalogy}
                  </p>
                  <p className="text-xs text-zinc-500 italic">
                    {evaluation.analogiesEvaluation}
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2.5">
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                    Modelo Ideal Feynman (Cristalino):
                  </span>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed italic">
                    "{evaluation.simplifiedAlternative}"
                  </p>
                </div>
              </div>

              {/* Follow up Socratic Question */}
              <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Desafio para Fechar a Lacuna Identificada:
                  </span>
                  <p className="text-xs sm:text-sm font-medium text-zinc-200">
                    "{evaluation.followUpQuestion}"
                  </p>
                </div>

                {onOpenSocraticWithPrompt && (
                  <button
                    onClick={() =>
                      onOpenSocraticWithPrompt(
                        `Estou estudando ${currentTopic} pela técnica de Feynman. Ajude-me a responder a esta pergunta para consertar minha lacuna: "${evaluation.followUpQuestion}"`
                      )
                    }
                    className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-xs font-semibold text-zinc-950 transition-colors shrink-0 flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Debater no Tutor</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Blank state showing Feynman Protocol guide */
            <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-400" />
                  Protocolo de Auditoria Cognitiva
                </span>
                <h3 className="text-lg font-semibold text-zinc-100">
                  Como Funciona o Diagnóstico Feynman
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Escreva no painel ao lado sua explicação do conceito sem consultar livros ou anotações. Nossa IA pedagógica atuará como um avaliador cético para identificar:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1.5">
                  <span className="font-semibold text-zinc-200 block">1. Jargões Vazios</span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Identifica termos técnicos usados como escudo para mascarar a ausência de um modelo causal claro.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1.5">
                  <span className="font-semibold text-zinc-200 block">2. Lacunas no Raciocínio</span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Mapeia saltos lógicos onde a explicação assume etapas que você não explicitou como funcionam.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1.5">
                  <span className="font-semibold text-zinc-200 block">3. Analogias do Mundo Físico</span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Gera metáforas tangíveis para ancorar o conceito abstrato na Teoria do Duplo Código de Paivio.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1.5">
                  <span className="font-semibold text-zinc-200 block">4. Provocação de Fechamento</span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Entrega uma pergunta cirúrgica pronta para ser debatida com o Tutor Socrático para sanar a dúvida.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
