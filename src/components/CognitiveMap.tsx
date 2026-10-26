import React, { useState } from 'react';
import {
  Layers,
  AlertTriangle,
  Lightbulb,
  Brain,
  HelpCircle,
  Compass,
  ArrowRight,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import { api } from '../api';
import { ConceptBreakdown } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { Button } from '@/components/ui/button';

interface CognitiveMapProps {
  currentTopic: string;
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
      const response = await api.api['generate-concept-breakdown'].$post({
        json: {
          topic: activeConcept,
          language,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || t.cognitiveMap.errorFallback);
      }

      const data = await response.json();
      setBreakdown(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.cognitiveMap.errorFallback);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 w-full">
      {/* Compact Single-Line Technical Header */}
      <div className="surface-panel rounded-lg px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75] shrink-0" />
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 truncate">
              {t.cognitiveMap.bannerTitle}
            </h2>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-white/[0.08] shrink-0" />

          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-zinc-500 shrink-0">{t.cognitiveMap.conceptToMap}</span>
            <span className="font-medium text-zinc-100 truncate max-w-[420px]">
              {currentTopic || t.feynman.defineConceptPrompt}
            </span>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => handleDeconstruct()}
          disabled={isLoading || !currentTopic.trim()}
          className="h-9 px-4 bg-zinc-100 hover:bg-white disabled:bg-zinc-900 disabled:text-zinc-600 text-zinc-950 font-medium text-[13px] rounded-md transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          {isLoading ? (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>{t.cognitiveMap.mappingButton}</span>
            </>
          ) : (
            <>
              <Compass className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>{t.cognitiveMap.deconstructButton}</span>
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="px-5 py-3.5 rounded-lg surface-panel flex items-center justify-between gap-3 text-sm text-zinc-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => handleDeconstruct()}
            className="h-8 px-3 surface-recessed hover:bg-[#16161a] text-zinc-200 rounded-md text-[13px] font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <RotateCw className="w-3 h-3" />
            <span>{t.cognitiveMap.tryAgain}</span>
          </Button>
        </div>
      )}

      {/* Blank State: Preview of the Deconstruction Structure */}
      {!breakdown && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-px bg-white/[0.07] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="sm:col-span-2 lg:col-span-6 bg-[#0f0f12] p-6 sm:p-8 space-y-3">
            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 tabular-nums flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
              00 // {t.cognitiveMap.emptyTitle}
            </span>
            <p className="text-sm sm:text-[15px] text-zinc-400 leading-relaxed max-w-3xl">
              {t.cognitiveMap.bannerDesc}
            </p>
          </div>

          {[
            { icon: Brain, title: t.cognitiveMap.essentialCore, desc: t.cognitiveMap.previewCoreDesc, span: 'lg:col-span-3' },
            { icon: Lightbulb, title: t.cognitiveMap.physicalAnalogyTitle, desc: t.cognitiveMap.previewAnalogyDesc, span: 'lg:col-span-3' },
            { icon: ShieldCheck, title: t.cognitiveMap.prerequisitesTitle, desc: t.cognitiveMap.previewPrereqDesc, span: 'lg:col-span-2' },
            { icon: AlertTriangle, title: t.cognitiveMap.misconceptionsTitle, desc: t.cognitiveMap.previewTrapsDesc, span: 'lg:col-span-2' },
            { icon: HelpCircle, title: t.cognitiveMap.elaborativeTitle, desc: t.cognitiveMap.previewQuestionsDesc, span: 'sm:col-span-2 lg:col-span-2' },
          ].map((cell, idx) => {
            const Icon = cell.icon;
            return (
              <div key={idx} className={`${cell.span} bg-[#0f0f12] p-6 space-y-2.5`}>
                <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 tabular-nums flex items-start gap-1.5 leading-relaxed">
                  <Icon className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75] shrink-0 mt-0.5" />
                  <span>
                    {String(idx + 1).padStart(2, '0')} // {cell.title.replace(/:\s*$/, '')}
                  </span>
                </span>
                <p className="text-sm text-zinc-400 leading-relaxed">{cell.desc}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Breakdown Display - Single 1px Hairline Bento Grid */}
      {breakdown && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-white/[0.07] border border-white/[0.07] rounded-xl overflow-hidden animate-fade-in">
          {/* Core Overview & Mechanism */}
          <div className="lg:col-span-7 bg-[#0f0f12] p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
                  {t.cognitiveMap.essentialCore}
                </span>
                <span className="font-mono text-[11px] text-zinc-500">
                  {t.cognitiveMap.topicLabel} {breakdown.topic}
                </span>
              </div>

              <p className="text-[15px] text-zinc-300 leading-relaxed">
                {breakdown.overview}
              </p>
            </div>

            <div className="pt-4 border-t border-white/[0.05] space-y-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 block">
                {t.cognitiveMap.coreMechanismTitle}
              </span>
              <p className="border-l-2 border-zinc-200 pl-3.5 py-0.5 text-base sm:text-lg text-zinc-100 font-medium leading-relaxed">
                {breakdown.coreMechanism}
              </p>
            </div>
          </div>

          {/* Dual-Coding Analogy & Overload Rationale */}
          <div className="lg:col-span-5 bg-[#0f0f12] p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
                  {t.cognitiveMap.physicalAnalogyTitle}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                  {t.cognitiveMap.dualCoding}
                </span>
              </div>

              <p className="text-[15px] text-zinc-200 leading-relaxed">
                {breakdown.realWorldAnalogy}
              </p>
            </div>

            <div className="pt-4 border-t border-white/[0.05] space-y-1.5">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 block">
                {t.cognitiveMap.whyOverloadTitle}
              </span>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {breakdown.neuroscienceRationale}
              </p>
            </div>
          </div>

          {/* Prior Schemas / Prerequisites */}
          <div className="lg:col-span-6 bg-[#0f0f12] p-6 space-y-4">
            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
              {t.cognitiveMap.prerequisitesTitle}
            </span>

            <ul className="divide-y divide-white/[0.05] text-sm text-zinc-300">
              {breakdown.prerequisites.map((p, idx) => (
                <li
                  key={idx}
                  className="py-3 first:pt-0 last:pb-0 leading-relaxed"
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Cognitive Traps & Misconceptions */}
          <div className="lg:col-span-6 bg-[#0f0f12] p-6 space-y-4">
            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
              {t.cognitiveMap.misconceptionsTitle}
            </span>

            <ul className="divide-y divide-white/[0.05] text-sm text-zinc-300">
              {breakdown.commonMisconceptions.map((m, idx) => (
                <li
                  key={idx}
                  className="py-3 first:pt-0 last:pb-0 leading-relaxed"
                >
                  {m}
                </li>
              ))}
            </ul>
          </div>

          {/* Elaborative Interrogation Questions */}
          <div className="lg:col-span-12 bg-[#0f0f12] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
                {t.cognitiveMap.elaborativeTitle}
              </span>
              <span className="font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
                {t.cognitiveMap.clickToDebate}
              </span>
            </div>

            <div className="divide-y divide-white/[0.05]">
              {breakdown.elaborativeQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-zinc-200"
                >
                  <span className="leading-relaxed">{q}</span>

                  {onOpenSocraticWithPrompt && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        onOpenSocraticWithPrompt(
                          `${t.cognitiveMap.investigatePromptPrefix} ${breakdown.topic}: "${q}". ${t.cognitiveMap.investigatePromptSuffix}`
                        )
                      }
                      className="h-8 px-3 rounded-md surface-recessed hover:bg-[#16161a] hover:border-white/[0.14] text-zinc-300 hover:text-zinc-100 text-[13px] font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <span>{t.cognitiveMap.investigateButton}</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[1.75]" />
                    </Button>
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
