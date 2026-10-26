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
  ShieldAlert,
} from 'lucide-react';
import { getNeurosciencePillars } from '../data/neurosciencePillars';
import { useLanguage } from '../i18n/LanguageContext';

export const NeuroscienceGuide: React.FC = () => {
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

  const consolidationSteps = [
    { name: t.neuroscience.step1Name, desc: t.neuroscience.step1Desc },
    { name: t.neuroscience.step2Name, desc: t.neuroscience.step2Desc },
    { name: t.neuroscience.step3Name, desc: t.neuroscience.step3Desc },
    { name: t.neuroscience.step4Name, desc: t.neuroscience.step4Desc },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Matrix 1: Hero & Key Metrics - Hairline Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-white/[0.07] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="lg:col-span-8 bg-[#0f0f12] p-6 sm:p-8 flex flex-col justify-center space-y-3">
          <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            SYNAPSE ARCHITECTURE
          </span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-zinc-100 tracking-tight leading-snug">
            {t.neuroscience.heroTitle}
          </h2>
          <p className="text-[15px] text-zinc-400 leading-relaxed max-w-3xl">
            {t.neuroscience.heroDesc}
          </p>
        </div>

        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-px bg-white/[0.07]">
          <div className="bg-[#0f0f12] p-6 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                {t.neuroscience.metricRetentionTitle}
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
            </div>
            <div className="text-3xl font-bold font-mono tabular-nums tracking-tight text-zinc-100">
              {t.neuroscience.metricRetentionValue}
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {t.neuroscience.metricRetentionDesc}
            </p>
          </div>

          <div className="bg-[#0f0f12] p-6 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                {t.neuroscience.metricJargonTitle}
              </span>
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
            </div>
            <div className="text-3xl font-bold font-mono tabular-nums tracking-tight text-zinc-100">
              {t.neuroscience.metricJargonValue}
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {t.neuroscience.metricJargonDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Matrix 2: Comparison (Passive vs Active Learning) - Hairline Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/[0.07] border border-white/[0.07] rounded-xl overflow-hidden">
        {/* Header Row */}
        <div className="lg:col-span-2 bg-[#0f0f12] px-6 py-3.5 flex items-center justify-between">
          <h3 className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
            {t.neuroscience.comparisonTitle}
          </h3>
        </div>

        {/* Passive Column */}
        <div className="bg-[#0f0f12] p-6 space-y-4">
          <div className="flex items-center gap-2 text-[15px] font-semibold text-zinc-300">
            <XCircle className="w-4 h-4 text-zinc-500 stroke-[1.75] shrink-0" />
            <span>{t.neuroscience.passiveTitle}</span>
          </div>
          <ul className="divide-y divide-white/[0.05] text-sm text-zinc-400 leading-relaxed">
            <li className="py-3 first:pt-0 last:pb-0">
              <strong className="text-zinc-200 font-medium">{t.neuroscience.passivePoint1Title}</strong>{' '}
              {t.neuroscience.passivePoint1Desc}
            </li>
            <li className="py-3 first:pt-0 last:pb-0">
              <strong className="text-zinc-200 font-medium">{t.neuroscience.passivePoint2Title}</strong>{' '}
              {t.neuroscience.passivePoint2Desc}
            </li>
            <li className="py-3 first:pt-0 last:pb-0">
              <strong className="text-zinc-200 font-medium">{t.neuroscience.passivePoint3Title}</strong>{' '}
              {t.neuroscience.passivePoint3Desc}
            </li>
          </ul>
        </div>

        {/* Active Column */}
        <div className="bg-[#0f0f12] p-6 space-y-4">
          <div className="flex items-center gap-2 text-[15px] font-semibold text-zinc-100">
            <CheckCircle2 className="w-4 h-4 text-zinc-200 stroke-[1.75] shrink-0" />
            <span>{t.neuroscience.activeTitle}</span>
          </div>
          <ul className="divide-y divide-white/[0.05] text-sm text-zinc-400 leading-relaxed">
            <li className="py-3 first:pt-0 last:pb-0">
              <strong className="text-zinc-100 font-medium">{t.neuroscience.activePoint1Title}</strong>{' '}
              {t.neuroscience.activePoint1Desc}
            </li>
            <li className="py-3 first:pt-0 last:pb-0">
              <strong className="text-zinc-100 font-medium">{t.neuroscience.activePoint2Title}</strong>{' '}
              {t.neuroscience.activePoint2Desc}
            </li>
            <li className="py-3 first:pt-0 last:pb-0">
              <strong className="text-zinc-100 font-medium">{t.neuroscience.activePoint3Title}</strong>{' '}
              {t.neuroscience.activePoint3Desc}
            </li>
          </ul>
        </div>
      </div>

      {/* Matrix 3: The 6 Pedagogical Pillars - Hairline Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-white/[0.07] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="md:col-span-2 xl:col-span-3 bg-[#0f0f12] px-6 py-3.5 flex items-center justify-between">
          <h3 className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
            {t.neuroscience.pillarsTitle}
          </h3>
          <span className="font-mono text-[11px] text-zinc-500 tabular-nums hidden sm:inline">
            {t.neuroscience.pillarsCount}
          </span>
        </div>

        {pillars.map((pillar) => {
          const Icon = iconMap[pillar.iconName] || Brain;
          return (
            <div
              key={pillar.id}
              className="bg-[#0f0f12] p-6 flex flex-col justify-between space-y-4 hover:bg-[#16161a]/50 transition-colors"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 block">
                      {pillar.scientist}
                    </span>
                    <h4 className="text-base font-semibold text-zinc-100">
                      {pillar.name}
                    </h4>
                  </div>
                  <Icon className="w-4 h-4 text-zinc-500 stroke-[1.75] shrink-0 mt-0.5" />
                </div>

                <div className="pt-3 border-t border-white/[0.05] space-y-1">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 block">
                    {t.neuroscience.neuroBasisLabel}
                  </span>
                  <p className="text-zinc-300 leading-relaxed text-sm">
                    {pillar.neuroBasis}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.05] space-y-1">
                <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 block">
                  {t.neuroscience.practicalActionLabel}
                </span>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  {pillar.practicalAction}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Matrix 4: Memory Consolidation Cycle - Hairline Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.07] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="sm:col-span-2 lg:col-span-4 bg-[#0f0f12] px-6 py-3.5 flex items-center justify-between">
          <h3 className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
            {t.neuroscience.cycleTitle}
          </h3>
        </div>

        {consolidationSteps.map((step, idx) => (
          <div key={idx} className="bg-[#0f0f12] p-6 space-y-2">
            <span className="font-semibold text-zinc-100 block text-[15px]">
              {step.name.replace(/^\d+\.\s*/, '')}
            </span>
            <p className="text-zinc-400 leading-relaxed text-sm">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
