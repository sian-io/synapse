import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Brain,
  HelpCircle,
  CheckCircle2,
  Compass,
  ArrowRight,
  ShieldCheck,
  RotateCw
} from 'lucide-react';
import { ConceptBreakdown } from '../types';

interface CognitiveMapProps {
  currentTopic: string;
  onTopicChange?: (newTopic: string) => void;
  onOpenSocraticWithPrompt?: (prompt: string) => void;
}

export const CognitiveMap: React.FC<CognitiveMapProps> = ({
  currentTopic,
  onTopicChange,
  onOpenSocraticWithPrompt,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<ConceptBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDeconstruct = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const activeConcept = currentTopic.trim();
    if (!activeConcept || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-concept-breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: activeConcept }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || 'Falha ao desconstruir conceito.');
      }

      const data: ConceptBreakdown = await response.json();
      setBreakdown(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro inesperado ao gerar decomposição.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner on Cognitive Load Theory */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-slate-900 to-indigo-950/40 border border-cyan-500/20 text-slate-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-cyan-300">
                Mapeamento & Gestão de Carga Cognitiva
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Teoria de Sweller
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              A memória de trabalho só consegue gerenciar cerca de 4 a 7 elementos simultâneos. Ao desconstruir o tema em
              pré-requisitos, mecanismo nuclear, analogias do mundo físico e armadilhas mentais, eliminamos a carga
              extrínseca e permitimos que o cérebro construa esquemas semânticos duradouros.
            </p>
          </div>
        </div>
      </div>

      {/* Unified Concept Action Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Conceito a ser mapeado:</span>
            <span className="font-semibold text-cyan-300 text-sm truncate max-w-[280px]">
              {currentTopic || 'Defina um conceito no topo'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleDeconstruct()}
            disabled={isLoading || !currentTopic.trim()}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-cyan-600/20"
          >
            {isLoading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Mapeando Esquemas Neurais...</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4" />
                <span>Desconstruir Carga Cognitiva</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-center justify-between gap-3 text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => handleDeconstruct()}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg text-rose-200 font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              Tentar Novamente
            </button>
          </div>
        )}
      </div>

      {/* Breakdown Display */}
      {breakdown && (
        <div className="space-y-5 animate-fade-in">
          {breakdown.isPedagogicalFallback && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs text-amber-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Esquema cognitivo gerado via síntese pedagógica estruturada (tráfego temporariamente intenso nos servidores de IA).
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDeconstruct()}
                disabled={isLoading}
                className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-200 font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar via IA
              </button>
            </div>
          )}

          {/* Core Overview & Mechanism */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Núcleo Essencial (Carga Germana)
              </span>
              <span className="text-xs text-slate-400">Tópico: {breakdown.topic}</span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed">
              {breakdown.overview}
            </p>

            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-1.5">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-cyan-400" />
                O Mecanismo Central em Uma Frase:
              </span>
              <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                "{breakdown.coreMechanism}"
              </p>
            </div>
          </div>

          {/* Grid: Prerequisites vs Misconceptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prerequisites */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Esquemas Prévios Necessários (Andaime Cognitivo):
              </span>
              <ul className="space-y-2 text-xs text-slate-300">
                {breakdown.prerequisites.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-emerald-400 font-bold shrink-0">#{idx + 1}</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Misconceptions */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Armadilhas Cognitivas & Mitos Mais Comuns:
              </span>
              <ul className="space-y-2 text-xs text-slate-300">
                {breakdown.commonMisconceptions.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="text-amber-400 font-bold shrink-0">⚠️</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Real World Analogy (Dual Coding) */}
          <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
            <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Analogia do Mundo Físico (Teoria do Duplo Código de Paivio):
            </span>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {breakdown.realWorldAnalogy}
            </p>
          </div>

          {/* Elaborative Questions */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                Perguntas de Interrogação Elaborativa (Gatilhos de Reflexão):
              </span>
              <span className="text-[11px] text-slate-500">Clique para debater no Tutor</span>
            </div>

            <div className="space-y-2">
              {breakdown.elaborativeQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-200 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span>{q}</span>
                  </div>

                  {onOpenSocraticWithPrompt && (
                    <button
                      onClick={() =>
                        onOpenSocraticWithPrompt(
                          `Estou explorando a pergunta elaborativa sobre ${breakdown.topic}: "${q}". Como podemos destrinchar essa questão socraticamente?`
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-slate-300 text-[11px] font-medium transition-colors flex items-center gap-1 shrink-0"
                    >
                      <span>Investigar</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Neuroscience Rationale */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
            <Brain className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-indigo-300">
                Por que este conceito gera sobrecarga cognitiva:
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                {breakdown.neuroscienceRationale}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
