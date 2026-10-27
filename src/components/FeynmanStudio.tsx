import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Brain,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Award,
  FileText,
  Sparkles,
} from 'lucide-react';
import { api } from '../api';
import { FeynmanEvaluation } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FeynmanStudioProps {
  onOpenSocraticWithPrompt?: (prompt: string) => void;
}

export const FeynmanStudio: React.FC<FeynmanStudioProps> = ({
  onOpenSocraticWithPrompt,
}) => {
  const { t, language } = useLanguage();
  const [audience, setAudience] = useState<string>(() => {
    return localStorage.getItem('synapse_feynman_audience') || 'child';
  });
  const [explanation, setExplanation] = useState<string>(() => {
    return localStorage.getItem('synapse_feynman_explanation') || '';
  });
  const [evaluation, setEvaluation] = useState<FeynmanEvaluation | null>(() => {
    const saved = localStorage.getItem('synapse_feynman_evaluation');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('synapse_feynman_audience', audience);
  }, [audience]);

  useEffect(() => {
    localStorage.setItem('synapse_feynman_explanation', explanation);
  }, [explanation]);

  useEffect(() => {
    if (evaluation) {
      localStorage.setItem('synapse_feynman_evaluation', JSON.stringify(evaluation));
    } else {
      localStorage.removeItem('synapse_feynman_evaluation');
    }
  }, [evaluation]);

  const audienceLabelMap: Record<string, string> = {
    child: t.feynman.audienceOptions.child,
    layperson: t.feynman.audienceOptions.layperson,
    beginner: t.feynman.audienceOptions.beginner,
  };

  const handleEvaluate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!explanation.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await api.api['feynman-evaluate'].$post({
        json: {
          explanation,
          targetAudience: audienceLabelMap[audience] || audience,
          language,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || t.feynman.errorFallback);
      }

      const data = await response.json();
      setEvaluation(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.feynman.errorFallback);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const wordCount = explanation.trim().split(/\s+/).filter(Boolean).length;
  const analyzedConcept = evaluation?.topic?.trim() || t.feynman.inferredConceptFallback;

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
      {/* Left Column: Editor Workspace - 5 Columns */}
      <div className="lg:col-span-5 surface-panel rounded-xl overflow-hidden flex flex-col">
        <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#09090b]/60 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75] shrink-0" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-400 truncate">
            {t.feynman.bannerTitle}
          </span>
        </div>

        <form onSubmit={handleEvaluate} className="p-5 sm:p-6 flex-1 flex flex-col gap-5">
          {/* Target Audience Select */}
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 block">
              {t.feynman.audienceLabel}
            </label>
            <Select
              value={audience}
              onValueChange={(val) => {
                if (val) setAudience(val);
              }}
            >
              <SelectTrigger className="w-full h-10 rounded-md surface-recessed px-3.5 text-sm text-zinc-200 hover:border-white/[0.14] focus-visible:ring-0">
                <SelectValue>{audienceLabelMap[audience]}</SelectValue>
              </SelectTrigger>
              <SelectContent
                align="start"
                sideOffset={6}
                alignItemWithTrigger={false}
                className="surface-panel rounded-lg p-1 text-zinc-200 ring-0"
              >
                <SelectItem
                  value="child"
                  className="rounded-md text-sm text-zinc-300 hover:bg-[#16161a] hover:text-zinc-100 focus:bg-[#16161a] focus:text-zinc-100 data-[highlighted]:bg-[#16161a] data-[highlighted]:text-zinc-100 cursor-pointer"
                >
                  {t.feynman.audienceOptions.child}
                </SelectItem>
                <SelectItem
                  value="layperson"
                  className="rounded-md text-sm text-zinc-300 hover:bg-[#16161a] hover:text-zinc-100 focus:bg-[#16161a] focus:text-zinc-100 data-[highlighted]:bg-[#16161a] data-[highlighted]:text-zinc-100 cursor-pointer"
                >
                  {t.feynman.audienceOptions.layperson}
                </SelectItem>
                <SelectItem
                  value="beginner"
                  className="rounded-md text-sm text-zinc-300 hover:bg-[#16161a] hover:text-zinc-100 focus:bg-[#16161a] focus:text-zinc-100 data-[highlighted]:bg-[#16161a] data-[highlighted]:text-zinc-100 cursor-pointer"
                >
                  {t.feynman.audienceOptions.beginner}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Explanation Textarea */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                {t.feynman.yourExplanation}
              </label>
              <span className="font-mono tabular-nums text-[11px] text-zinc-400">
                {wordCount} {t.feynman.words}
              </span>
            </div>

            <Textarea
              rows={9}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder={t.feynman.placeholder}
              className="w-full flex-1 min-h-[260px] surface-recessed rounded-lg p-4 text-[15px] text-zinc-100 placeholder:text-zinc-600 focus-visible:border-white/[0.14] focus-visible:ring-0 leading-relaxed"
            />
          </div>

          <Button
            type="submit"
            disabled={isAnalyzing || !explanation.trim()}
            className="w-full h-10 bg-zinc-100 hover:bg-white disabled:bg-zinc-900 disabled:text-zinc-600 text-zinc-950 font-medium text-sm rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{t.feynman.auditingButton}</span>
              </>
            ) : (
              <>
                <Award className="w-3.5 h-3.5 stroke-[1.75]" />
                <span>{t.feynman.auditButton}</span>
              </>
            )}
          </Button>

          {error && (
            <div className="pt-3 border-t border-white/[0.05] text-sm text-zinc-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{error}</span>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => handleEvaluate()}
                className="h-8 px-3 surface-recessed hover:bg-[#16161a] text-zinc-200 rounded-md text-[13px] font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{t.feynman.retry}</span>
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* Right Column: Continuous Hairline Diagnostic Grid - 7 Columns */}
      <div className="lg:col-span-7 flex flex-col">
        {evaluation ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-white/[0.07] border border-white/[0.07] rounded-xl overflow-hidden animate-fade-in">
            {/* Assessment Summary (8 cols) */}
            <div className="md:col-span-8 bg-[#0f0f12] p-6 space-y-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 block">
                {t.feynman.diagnosisTitle}
              </span>
              <h3 className="text-lg font-semibold text-zinc-100 tracking-tight">
                {t.feynman.evaluationOf} "{analyzedConcept}"
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {evaluation.clarityAssessment}
              </p>
            </div>

            {/* Mastery Score (4 cols) */}
            <div className="md:col-span-4 bg-[#0f0f12] p-6 flex flex-col justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                {t.feynman.mastery}
              </span>
              <div className="flex items-baseline gap-1.5 pt-2">
                <span className="font-mono tabular-nums text-4xl tracking-tighter font-bold text-zinc-100">
                  {evaluation.score}
                </span>
                <span className="font-mono tabular-nums text-xs text-zinc-500">
                  / 100
                </span>
              </div>
            </div>

            {/* Jargon Identified (6 cols) */}
            <div className="md:col-span-6 bg-[#0f0f12] p-6 space-y-3">
              <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
                <span>{t.feynman.jargonTitle}</span>
              </div>
              {(evaluation.jargonIdentified ?? []).length > 0 ? (
                <ul className="divide-y divide-white/[0.05] text-sm text-zinc-300 leading-relaxed">
                  {(evaluation.jargonIdentified ?? []).map((jargon, i) => (
                    <li key={i} className="py-2.5 first:pt-0 last:pb-0">
                      <strong className="text-zinc-100 font-medium">"{jargon}"</strong> —{' '}
                      {t.feynman.jargonItemSuffix}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{t.feynman.noJargon}</span>
                </p>
              )}
            </div>

            {/* Conceptual Gaps (6 cols) */}
            <div className="md:col-span-6 bg-[#0f0f12] p-6 space-y-3">
              <div className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
                <span>{t.feynman.gapsTitle}</span>
              </div>
              {(evaluation.conceptualGaps ?? []).length > 0 ? (
                <ul className="divide-y divide-white/[0.05] text-sm text-zinc-300 leading-relaxed">
                  {(evaluation.conceptualGaps ?? []).map((gap, i) => (
                    <li key={i} className="py-2.5 first:pt-0 last:pb-0">
                      {gap}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{t.feynman.noGaps}</span>
                </p>
              )}
            </div>

            {/* Strengths (12 cols) */}
            <div className="md:col-span-12 bg-[#0f0f12] p-6 space-y-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
                {t.feynman.strengthsTitle}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(evaluation.strengths ?? []).map((str, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md text-[13px] surface-recessed text-zinc-200"
                  >
                    {str}
                  </span>
                ))}
              </div>
            </div>

            {/* Suggested Analogy (6 cols) */}
            <div className="md:col-span-6 bg-[#0f0f12] p-6 space-y-2.5">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
                {t.feynman.analogyTitle}
              </span>
              <p className="text-sm text-zinc-200 leading-relaxed">
                {evaluation.suggestedAnalogy}
              </p>
              <p className="text-sm text-zinc-500 leading-relaxed pt-2.5 border-t border-white/[0.05]">
                {evaluation.analogiesEvaluation}
              </p>
            </div>

            {/* Ideal Feynman Model (6 cols) */}
            <div className="md:col-span-6 bg-[#0f0f12] p-6 space-y-2.5">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
                {t.feynman.feynmanModelTitle}
              </span>
              <p className="text-sm text-zinc-300 leading-relaxed border-l-2 border-zinc-300 pl-3">
                {evaluation.simplifiedAlternative}
              </p>
            </div>

            {/* Follow-up Socratic Challenge (12 cols) */}
            <div className="md:col-span-12 bg-[#0f0f12] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
                  {t.feynman.challengeTitle}
                </span>
                <p className="text-sm font-medium text-zinc-100 leading-relaxed">
                  "{evaluation.followUpQuestion}"
                </p>
              </div>

              {onOpenSocraticWithPrompt && (
                <Button
                  type="button"
                  onClick={() =>
                    onOpenSocraticWithPrompt(
                      `${t.feynman.discussPromptPrefix} ${analyzedConcept} ${t.feynman.discussPromptSuffix} "${evaluation.followUpQuestion}"`
                    )
                  }
                  className="h-9 px-4 rounded-md bg-zinc-100 hover:bg-white text-[13px] font-medium text-zinc-950 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{t.feynman.discussWithTutor}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[1.75]" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Blank State: Feynman Protocol Hairline Bento Grid */
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.07] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="sm:col-span-2 bg-[#0f0f12] p-6 sm:p-8 space-y-2.5">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
                {t.feynman.protocolTitle}
              </span>
              <h3 className="text-lg font-semibold text-zinc-100 tracking-tight">
                {t.feynman.howItWorksTitle}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {t.feynman.howItWorksDesc}
              </p>
            </div>

            <div className="bg-[#0f0f12] p-6 space-y-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-300 block">
                {t.feynman.step1Title.replace(/^\d+\.\s*/, '')}
              </span>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {t.feynman.step1Desc}
              </p>
            </div>

            <div className="bg-[#0f0f12] p-6 space-y-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-300 block">
                {t.feynman.step2Title.replace(/^\d+\.\s*/, '')}
              </span>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {t.feynman.step2Desc}
              </p>
            </div>

            <div className="bg-[#0f0f12] p-6 space-y-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-300 block">
                {t.feynman.step3Title.replace(/^\d+\.\s*/, '')}
              </span>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {t.feynman.step3Desc}
              </p>
            </div>

            <div className="bg-[#0f0f12] p-6 space-y-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-300 block">
                {t.feynman.step4Title.replace(/^\d+\.\s*/, '')}
              </span>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {t.feynman.step4Desc}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
