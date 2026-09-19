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
import { useLanguage } from '../i18n/LanguageContext';

interface CognitiveMapProps {
  currentTopic: string;
  onTopicChange?: (newTopic: string) => void;
  onOpenSocraticWithPrompt?: (prompt: string) => void;
}

export const CognitiveMap: React.FC<CognitiveMapProps> = ({
  currentTopic,
  onOpenSocraticWithPrompt,
}) => {
  const { t, language } = useLanguage();
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
        body: JSON.stringify({
          topic: activeConcept,
          language,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || t.cognitiveMap.errorFallback);
      }

      const data: ConceptBreakdown = await response.json();
      setBreakdown(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.cognitiveMap.errorFallback);
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
                {t.cognitiveMap.bannerTitle}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-4xl">
              {t.cognitiveMap.bannerDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Unified Concept Action Bar */}
      <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <span className="text-zinc-400 font-medium">{t.cognitiveMap.conceptToMap}</span>
            <span className="font-semibold text-zinc-100 text-sm sm:text-base truncate max-w-[340px]">
              {currentTopic || t.feynman.defineConceptPrompt}
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
                <span>{t.cognitiveMap.mappingButton}</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4 stroke-[1.75]" />
                <span>{t.cognitiveMap.deconstructButton}</span>
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
              {t.cognitiveMap.tryAgain}
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
                  {t.cognitiveMap.synthesizedNotice}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDeconstruct()}
                disabled={isLoading}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md text-zinc-200 font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                {t.cognitiveMap.updateAI}
              </button>
            </div>
          )}

          {/* Core Overview & Mechanism - Full Width Banner */}
          <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">
                {t.cognitiveMap.essentialCore}
              </span>
              <span className="text-xs text-zinc-400 font-mono">{t.cognitiveMap.topicLabel} {breakdown.topic}</span>
            </div>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-5xl">
              {breakdown.overview}
            </p>

            <div className="p-4 sm:p-5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Brain className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                {t.cognitiveMap.coreMechanismTitle}
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
                {t.cognitiveMap.prerequisitesTitle}
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
                {t.cognitiveMap.physicalAnalogyTitle}
              </span>
              <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/70 space-y-2">
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                  {breakdown.realWorldAnalogy}
                </p>
                <span className="text-[11px] text-zinc-500 block font-mono">
                  {t.cognitiveMap.dualCoding}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80 text-xs text-zinc-400 leading-relaxed">
                <strong className="text-zinc-300 font-medium block mb-1">{t.cognitiveMap.whyOverloadTitle}</strong>
                {breakdown.neuroscienceRationale}
              </div>
            </div>

            {/* Column 3: Misconceptions */}
            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 space-y-4">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2 font-mono uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                {t.cognitiveMap.misconceptionsTitle}
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
                {t.cognitiveMap.elaborativeTitle}
              </span>
              <span className="text-xs text-zinc-500 font-mono">{t.cognitiveMap.clickToDebate}</span>
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
                          `${t.cognitiveMap.investigatePromptPrefix} ${breakdown.topic}: "${q}". ${t.cognitiveMap.investigatePromptSuffix}`
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 border border-zinc-800 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <span>{t.cognitiveMap.investigateButton}</span>
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
