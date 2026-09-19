import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Brain,
  HelpCircle,
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
    <div className="space-y-6 w-full">
      {/* Top Banner on Cognitive Load Theory */}
      <div className="p-6 sm:p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-zinc-200">
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-zinc-200 shrink-0">
            <Layers className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
                Mapeamento &amp; Gestão de Carga Cognitiva
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-4xl">
              A memória de trabalho gerencia apenas 4 a 7 elementos simultâneos. Ao desconstruir o tema em pré-requisitos, mecanismo nuclear, analogias do mundo físico e armadilhas mentais, eliminamos a carga extrínseca para construir esquemas duradouros no córtex.
            </p>
          </div>
        </div>
      </div>

      {/* Unified Concept Action Bar */}
      <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <span className="text-zinc-400 font-medium">Conceito a ser mapeado:</span>
            <span className="font-semibold text-zinc-100 text-sm sm:text-base truncate max-w-[340px]">
              {currentTopic || 'Defina um conceito no topo'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleDeconstruct()}
            disabled={isLoading || !currentTopic.trim()}
            className="px-5 py-2.5 bg-zinc-100 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm"
          >
            {isLoading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Mapeando Esquemas Neurais...</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4 stroke-[1.75]" />
                <span>Desconstruir Carga Cognitiva</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3.5 p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => handleDeconstruct()}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              Tentar Novamente
            </button>
          </div>
        )}
      </div>

      {/* Breakdown Display */}
      {breakdown && (
        <div className="space-y-6 animate-fade-in">
          {breakdown.isPedagogicalFallback && (
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-3 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>
                  Esquema cognitivo sintetizado estruturalmente.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDeconstruct()}
                disabled={isLoading}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md text-zinc-200 font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar via IA
              </button>
            </div>
          )}

          {/* Core Overview & Mechanism - Full Width Banner */}
          <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">
                Núcleo Essencial (Carga Germana)
              </span>
              <span className="text-xs text-zinc-400 font-mono">Tópico: {breakdown.topic}</span>
            </div>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-5xl">
              {breakdown.overview}
            </p>

            <div className="p-4 sm:p-5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Brain className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                O Mecanismo Central em Uma Frase:
              </span>
              <p className="text-sm sm:text-base text-zinc-100 font-medium leading-relaxed">
                "{breakdown.coreMechanism}"
              </p>
            </div>
          </div>

          {/* 3 Column Desktop Grid: Prerequisites, Analogy, Misconceptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Column 1: Prerequisites */}
            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 space-y-4">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2 font-mono uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                Esquemas Prévios (Andaime):
              </span>
              <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-300">
                {breakdown.prerequisites.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/70">
                    <span className="text-zinc-500 font-mono font-semibold shrink-0">#{idx + 1}</span>
                    <span className="leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Dual Coding Analogy & Rationale */}
            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 space-y-4">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                Analogia do Mundo Físico:
              </span>
              <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/70 space-y-2">
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                  {breakdown.realWorldAnalogy}
                </p>
                <span className="text-[11px] text-zinc-500 block font-mono">
                  Teoria do Duplo Código de Paivio
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80 text-xs text-zinc-400 leading-relaxed">
                <strong className="text-zinc-300 font-medium block mb-1">Por que gera sobrecarga:</strong>
                {breakdown.neuroscienceRationale}
              </div>
            </div>

            {/* Column 3: Misconceptions */}
            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 space-y-4">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2 font-mono uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                Armadilhas Cognitivas &amp; Mitos:
              </span>
              <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-300">
                {breakdown.commonMisconceptions.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/70">
                    <span className="text-zinc-500 shrink-0 font-mono font-bold">!</span>
                    <span className="leading-relaxed">{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Elaborative Questions - 2 Column Grid */}
          <div className="p-6 sm:p-7 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2 font-mono uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                Perguntas de Interrogação Elaborativa (Gatilhos de Reflexão):
              </span>
              <span className="text-xs text-zinc-500 font-mono">Clique para debater no Tutor</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {breakdown.elaborativeQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between gap-3 text-xs sm:text-sm text-zinc-200 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center font-mono text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{q}</span>
                  </div>

                  {onOpenSocraticWithPrompt && (
                    <button
                      onClick={() =>
                        onOpenSocraticWithPrompt(
                          `Estou explorando a pergunta elaborativa sobre ${breakdown.topic}: "${q}". Como podemos destrinchar essa questão socraticamente?`
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 border border-zinc-800 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <span>Investigar</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
