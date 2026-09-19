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
  Award
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner explaining Feynman & Neuroscience */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-950/40 border border-amber-500/20 text-slate-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-amber-300">
              Estúdio de Desconstrução de Feynman
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              <em>"Se você não consegue explicar algo em termos simples, você não compreendeu o mecanismo."</em> —{' '}
              <strong>Fundamento Neurocientífico</strong>: Esta prática combate a{' '}
              <span className="text-amber-200 font-medium">ilusão de profundidade explicativa</span>, forçando o cérebro
              a desarticular jargões decorados e ancorar representações lógicas na memória semântica.
            </p>
          </div>
        </div>
      </div>

      {/* Main Input Form */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
        <form onSubmit={handleEvaluate} className="space-y-4">
          {/* Active Context & Audience Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Explicando o conceito:</span>
              <span className="font-semibold text-amber-300 text-sm truncate max-w-[280px]">
                {currentTopic || 'Defina um conceito no topo'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 shrink-0">
                Público-Alvo:
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60"
              >
                <option value="uma criança de 10 anos curiosa">Criança de 10 anos (Simplicidade máxima)</option>
                <option value="um leigo inteligente e cético">Leigo Inteligente (Sem jargões)</option>
                <option value="um estudante iniciante no assunto">Estudante Iniciante (Elos causais)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Sua Explicação Ativa (Escreva com suas próprias palavras):
              </label>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{explanation.trim().split(/\s+/).filter(Boolean).length} palavras</span>
                <span className="text-slate-600">|</span>
                <div className="flex items-center gap-1 text-[11px] text-amber-400/90">
                  <span>Exemplos:</span>
                  {sampleExplanations.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => loadSample(s)}
                      className="underline hover:text-amber-300"
                    >
                      {s.topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <textarea
              rows={5}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explique o fenômeno passo a passo. Descreva o 'porquê' e o 'como'. Evite nomes complicados sem explicar o que eles fazem no mundo real..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400 hidden sm:inline">
              ⚡ Dica: Se você usou uma palavra de 4 sílabas, tente substituí-la por uma analogia física.
            </span>
            <button
              type="submit"
              disabled={isAnalyzing || !currentTopic.trim() || !explanation.trim()}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Auditando Ilusões de Compreensão...</span>
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  <span>Auditar com Técnica de Feynman</span>
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => handleEvaluate()}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg text-rose-200 font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Tentar Novamente
            </button>
          </div>
        )}
      </div>

      {/* Evaluation Results Card */}
      {evaluation && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl animate-fade-in">
          {/* Header Score & Diagnosis */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div>
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Diagnóstico de Feynman
              </span>
              <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                Avaliação da Explicação de: "{currentTopic}"
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {evaluation.clarityAssessment}
              </p>
            </div>

            {/* Score Ring / Pill */}
            <div className="flex items-center gap-3 bg-slate-950 px-4 py-3 rounded-2xl border border-slate-800 shrink-0">
              <div
                className={`text-3xl font-extrabold ${
                  evaluation.score >= 80
                    ? 'text-emerald-400'
                    : evaluation.score >= 60
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {evaluation.score}
              </div>
              <div className="text-xs text-slate-400 leading-tight">
                <span className="block font-semibold text-slate-200">/ 100</span>
                <span>Índice de Domínio</span>
              </div>
            </div>
          </div>

          {/* Jargon vs Gaps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Jargons Identified */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Jargões Detectados (Muletas Vocabulares):</span>
              </div>
              {evaluation.jargonIdentified.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {evaluation.jargonIdentified.map((jargon, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>
                        <strong className="text-rose-300">"{jargon}"</strong> — Termo técnico usado sem explicitação de como ele opera.
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Excelente! Nenhum jargão vazio foi detectado.
                </p>
              )}
            </div>

            {/* Conceptual Gaps */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <Brain className="w-4 h-4" />
                <span>Lacunas Mecânicas no Raciocínio:</span>
              </div>
              {evaluation.conceptualGaps.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {evaluation.conceptualGaps.map((gap, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Continuidade lógica impecável, sem saltos não explicados.
                </p>
              )}
            </div>
          </div>

          {/* Strengths */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              Pontos Fortes da sua Explicação:
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {evaluation.strengths.map((str, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs bg-emerald-500/10 text-emerald-200 border border-emerald-500/30"
                >
                  {str}
                </span>
              ))}
            </div>
          </div>

          {/* Suggested Analogy & Benchmark */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
              <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Analogia Vívida Recomendada:
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {evaluation.suggestedAnalogy}
              </p>
              <p className="text-[11px] text-slate-400 italic">
                {evaluation.analogiesEvaluation}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Modelo Ideal Feynman (Cristalino):
              </span>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "{evaluation.simplifiedAlternative}"
              </p>
            </div>
          </div>

          {/* Follow up Socratic Question */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900/40 to-slate-900 border border-indigo-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Desafio para Fechar a Lacuna:
              </span>
              <p className="text-xs font-medium text-slate-100">
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
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shrink-0 flex items-center gap-1.5 shadow-lg"
              >
                <span>Debater no Tutor Socrático</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
