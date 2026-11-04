import React from 'react';
import {
  Brain,
  Zap,
  Sparkles,
  Flame,
  Layers,
  Target,
  Award,
  BookOpen,
} from 'lucide-react';
import { getNeurosciencePillars } from '../data/neurosciencePillars';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NeuroscienceGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NeuroscienceGuide: React.FC<NeuroscienceGuideProps> = ({ open, onOpenChange }) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="surface-panel rounded-xl text-zinc-100 ring-0 p-5 sm:p-6 gap-5 sm:max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg font-semibold text-zinc-100 tracking-tight">
            {t.neuroscience.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-400 leading-relaxed max-w-3xl">
            {t.neuroscience.heroDesc}
          </DialogDescription>
        </DialogHeader>

        {/* The 6 Pedagogical Pillars - Hairline Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-white/[0.07] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="md:col-span-2 xl:col-span-3 bg-[#0f0f12] px-6 py-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
              <span>{t.neuroscience.pillarsTitle}</span>
            </h3>
          </div>

          {pillars.map((pillar) => {
            const Icon = iconMap[pillar.iconName] || Brain;
            return (
              <div
                key={pillar.id}
                className="bg-[#0f0f12] p-6 flex flex-col justify-between space-y-4 hover:bg-[#16161a]/50 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="text-base font-semibold text-zinc-100 tracking-tight">
                        {pillar.name}
                      </h4>
                      <span className="font-mono text-[11px] text-zinc-500 block">
                        {pillar.scientist}
                      </span>
                    </div>
                    <Icon className="w-4 h-4 text-zinc-400 stroke-[1.75] shrink-0 mt-1" />
                  </div>

                  <p className="text-zinc-300 leading-relaxed text-sm pt-2 border-t border-white/[0.05]">
                    {pillar.neuroBasis}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.05]">
                  <p className="text-zinc-400 leading-relaxed text-sm">
                    {pillar.practicalAction}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Memory Consolidation Cycle - Hairline Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.07] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="sm:col-span-2 lg:col-span-4 bg-[#0f0f12] px-6 py-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-2.5">
              <Award className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
              <span>{t.neuroscience.cycleTitle}</span>
            </h3>
          </div>

          {consolidationSteps.map((step) => (
            <div key={step.name} className="bg-[#0f0f12] p-6 space-y-2">
              <h4 className="font-semibold text-zinc-100 text-base tracking-tight">
                {step.name}
              </h4>
              <p className="text-zinc-400 leading-relaxed text-sm">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
