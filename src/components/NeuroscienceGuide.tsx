import React from 'react';
import {
  Brain,
  Zap,
  Sparkles,
  Flame,
  Layers,
  Target,
  CheckCircle2,
  XCircle,
  Activity,
  Award,
  BookOpen,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { getNeurosciencePillars } from '../data/neurosciencePillars';
import { useLanguage } from '../i18n/LanguageContext';

interface NeuroscienceGuideProps {
  onSelectAction?: (mode: 'socratic' | 'feynman' | 'retrieval' | 'cognitive_map') => void;
}

export const NeuroscienceGuide: React.FC<NeuroscienceGuideProps> = () => {
  const { t, language } = useLanguage();
  const pillars = getNeurosciencePillars(language);

  const iconMap: Record<string, any> = {
    Zap,
    Sparkles,
    MessageSquareText: BookOpen,
    Layers,
    Flame,
    Target,
  };

  return (
    <div className="space-y-8 w-full">
      {/* Intro Header - Expansive Banner */}
      <div className="p-6 sm:p-8 lg:p-10 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-3.5">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-zinc-100 tracking-tight leading-tight">
              {t.neuroscience.heroTitle}
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-3xl">
              {t.neuroscience.heroDesc}
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400">{t.neuroscience.metricRetentionTitle}</span>
                <TrendingUp className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-100">{t.neuroscience.metricRetentionValue}</div>
              <p className="text-xs text-zinc-400">
                {t.neuroscience.metricRetentionDesc}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400">{t.neuroscience.metricJargonTitle}</span>
                <ShieldAlert className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-100">{t.neuroscience.metricJargonValue}</div>
              <p className="text-xs text-zinc-400">
                {t.neuroscience.metricJargonDesc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison: Passive vs Active Learning */}
      <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 space-y-5">
        <h3 className="text-xs sm:text-sm font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
          {t.neuroscience.comparisonTitle}
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs sm:text-sm">
          {/* Passive column */}
          <div className="p-5 sm:p-6 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-4">
            <span className="font-semibold text-zinc-200 flex items-center gap-2 text-sm sm:text-base">
              <XCircle className="w-4.5 h-4.5 text-zinc-500 stroke-[1.75]" />
              {t.neuroscience.passiveTitle}
            </span>
            <ul className="space-y-3 text-zinc-400 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-zinc-600 font-mono font-bold">•</span>
                <span><strong className="text-zinc-200 font-medium">{t.neuroscience.passivePoint1Title}</strong> {t.neuroscience.passivePoint1Desc}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-zinc-600 font-mono font-bold">•</span>
                <span><strong className="text-zinc-200 font-medium">{t.neuroscience.passivePoint2Title}</strong> {t.neuroscience.passivePoint2Desc}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-zinc-600 font-mono font-bold">•</span>
                <span><strong className="text-zinc-200 font-medium">{t.neuroscience.passivePoint3Title}</strong> {t.neuroscience.passivePoint3Desc}</span>
              </li>
            </ul>
          </div>

          {/* Active column */}
          <div className="p-5 sm:p-6 rounded-xl bg-zinc-950/70 border border-zinc-700/80 space-y-4">
            <span className="font-semibold text-zinc-100 flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle2 className="w-4.5 h-4.5 text-zinc-300 stroke-[1.75]" />
              {t.neuroscience.activeTitle}
            </span>
            <ul className="space-y-3 text-zinc-400 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-zinc-400 font-mono font-bold">•</span>
                <span><strong className="text-zinc-100 font-medium">{t.neuroscience.activePoint1Title}</strong> {t.neuroscience.activePoint1Desc}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-zinc-400 font-mono font-bold">•</span>
                <span><strong className="text-zinc-100 font-medium">{t.neuroscience.activePoint2Title}</strong> {t.neuroscience.activePoint2Desc}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-zinc-400 font-mono font-bold">•</span>
                <span><strong className="text-zinc-100 font-medium">{t.neuroscience.activePoint3Title}</strong> {t.neuroscience.activePoint3Desc}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Scientific Pillars Cards - 3 Column Wide Grid on Desktop */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
            {t.neuroscience.pillarsTitle}
          </h3>
          <span className="text-xs text-zinc-400 font-mono hidden sm:inline">{t.neuroscience.pillarsCount}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
          {pillars.map((pillar) => {
            const Icon = iconMap[pillar.iconName] || Brain;
            return (
              <div
                key={pillar.id}
                className="p-5 sm:p-6 rounded-xl bg-zinc-900/30 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-zinc-200">
                        <Icon className="w-4.5 h-4.5 stroke-[1.75]" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-semibold text-zinc-100">{pillar.name}</h4>
                        <span className="text-xs text-zinc-400 font-mono">{pillar.scientist}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider block">
                      {t.neuroscience.neuroBasisLabel}
                    </span>
                    <p className="text-zinc-300 leading-relaxed bg-zinc-950/70 p-3 rounded-lg border border-zinc-800/70 text-xs sm:text-sm">
                      {pillar.neuroBasis}
                    </p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider block">
                      {t.neuroscience.practicalActionLabel}
                    </span>
                    <p className="text-zinc-400 leading-relaxed text-xs sm:text-sm">
                      {pillar.practicalAction}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Memory Consolidation Cycle Infographic - 4 Columns */}
      <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 space-y-5">
        <h3 className="text-xs sm:text-sm font-semibold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-2">
          <Award className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
          {t.neuroscience.cycleTitle}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="p-5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2.5">
            <span className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono font-semibold flex items-center justify-center text-xs">
              1
            </span>
            <span className="font-semibold text-zinc-200 block text-sm">{t.neuroscience.step1Name}</span>
            <p className="text-zinc-400 leading-relaxed text-xs sm:text-sm">
              {t.neuroscience.step1Desc}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2.5">
            <span className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono font-semibold flex items-center justify-center text-xs">
              2
            </span>
            <span className="font-semibold text-zinc-200 block text-sm">{t.neuroscience.step2Name}</span>
            <p className="text-zinc-400 leading-relaxed text-xs sm:text-sm">
              {t.neuroscience.step2Desc}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2.5">
            <span className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono font-semibold flex items-center justify-center text-xs">
              3
            </span>
            <span className="font-semibold text-zinc-200 block text-sm">{t.neuroscience.step3Name}</span>
            <p className="text-zinc-400 leading-relaxed text-xs sm:text-sm">
              {t.neuroscience.step3Desc}
            </p>
          </div>

          <div className="p-5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2.5">
            <span className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono font-semibold flex items-center justify-center text-xs">
              4
            </span>
            <span className="font-semibold text-zinc-200 block text-sm">{t.neuroscience.step4Name}</span>
            <p className="text-zinc-400 leading-relaxed text-xs sm:text-sm">
              {t.neuroscience.step4Desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
