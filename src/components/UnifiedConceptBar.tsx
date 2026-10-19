import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  Compass,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface UnifiedConceptBarProps {
  currentTopic: string;
  onTopicChange: (newTopic: string) => void;
}

export const UnifiedConceptBar: React.FC<UnifiedConceptBarProps> = ({
  currentTopic,
  onTopicChange,
}) => {
  const { t } = useLanguage();

  const [inputValue, setInputValue] = useState(currentTopic);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Sync internal input if currentTopic changes from external action
  useEffect(() => {
    setInputValue(currentTopic);
  }, [currentTopic]);

  const handleApply = (newVal: string) => {
    const trimmed = newVal.trim();
    if (!trimmed) return;
    onTopicChange(trimmed);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 1800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply(inputValue);
    }
  };

  return (
    <div className="w-full surface-panel rounded-lg px-3 py-1.5 flex items-center gap-2.5 transition-colors focus-within:border-white/[0.14]">
      {/* Label & Active Context */}
      <div className="flex items-center gap-2 shrink-0">
        <Compass className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
        <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 tabular-nums hidden sm:inline">
          {t.conceptBar.label}
        </span>
      </div>

      <Separator orientation="vertical" className="h-4 bg-white/[0.08] hidden sm:block" />

      {/* Command Input */}
      <div className="relative flex-1 flex items-center min-w-0">
        <Input
          id="unified-concept-input"
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onTopicChange(e.target.value);
          }}
          onBlur={() => handleApply(inputValue)}
          onKeyDown={handleKeyDown}
          placeholder={t.conceptBar.placeholder}
          className="h-7 w-full border-0 bg-transparent px-1.5 py-0 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:border-transparent dark:bg-transparent pr-7"
        />
        {inputValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              setInputValue('');
              onTopicChange('');
            }}
            className="absolute right-0.5 text-zinc-500 hover:text-zinc-200 hover:bg-[#16161a] rounded-md cursor-pointer"
            title={t.conceptBar.clearTooltip}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <Separator orientation="vertical" className="h-4 bg-white/[0.08]" />

      {/* Action Controls: Pin CTA */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          type="button"
          size="sm"
          onClick={() => handleApply(inputValue)}
          className={`h-7 px-3 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
            isSavedRecently
              ? 'surface-recessed text-zinc-200 hover:bg-[#16161a]'
              : 'bg-zinc-100 hover:bg-white text-zinc-950 font-medium'
          }`}
        >
          {isSavedRecently ? (
            <>
              <Check className="w-3.5 h-3.5 text-zinc-200 stroke-[2]" />
              <span>{t.conceptBar.pinned}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>{t.conceptBar.pin}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
