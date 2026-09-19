import React, { useState, useEffect } from 'react';
import {
  Brain,
  Check,
  X,
  Compass,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface UnifiedConceptBarProps {
  currentTopic: string;
  onTopicChange: (newTopic: string) => void;
  activeTabLabel: string;
}

const PRESET_TOPICS = [
  'Mecanismos de Memória e Neuroplasticidade',
  'Mecânica Quântica e Incerteza',
  'Inflação e Política Monetária',
  'Algoritmo de Dijkstra e Grafos',
  'Fotossíntese e Bioenergética',
];

export const UnifiedConceptBar: React.FC<UnifiedConceptBarProps> = ({
  currentTopic,
  onTopicChange,
  activeTabLabel,
}) => {
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
    <div className="w-full bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md transition-all shadow-sm">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Label & Active Context */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
            <Compass className="w-4 h-4 stroke-[1.75]" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Conceito em Estudo
            </span>
          </div>
        </div>

        {/* Input & Action */}
        <div className="flex-1 flex items-center gap-2.5">
          <div className="relative flex-1">
            <input
              id="unified-concept-input"
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                onTopicChange(e.target.value);
              }}
              onBlur={() => handleApply(inputValue)}
              onKeyDown={handleKeyDown}
              placeholder="Digite o conceito central para estudar (ex: Termodinâmica, Sinapses, Redes Neurais...)"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-500 rounded-xl px-4 py-2.5 text-sm sm:text-base text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700/60 transition-all pr-9 shadow-inner"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => {
                  setInputValue('');
                  onTopicChange('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 cursor-pointer"
                title="Limpar campo"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleApply(inputValue)}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-sm ${
              isSavedRecently
                ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                : 'bg-zinc-100 hover:bg-white text-zinc-950 font-semibold'
            }`}
          >
            {isSavedRecently ? (
              <>
                <Check className="w-4 h-4 text-zinc-300 stroke-[2.5]" />
                <span>Fixado</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 stroke-[1.75]" />
                <span>Fixar Conceito</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Concept Suggestions Chips */}
      <div className="mt-3.5 pt-3 border-t border-zinc-800/60 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-xs text-zinc-400 shrink-0 flex items-center gap-1.5 mr-1 font-medium">
          <Brain className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />
          Sugestões rápidas de temas:
        </span>
        {PRESET_TOPICS.map((preset) => {
          const isSelected = currentTopic.toLowerCase() === preset.toLowerCase();
          return (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setInputValue(preset);
                onTopicChange(preset);
                setIsSavedRecently(true);
                setTimeout(() => setIsSavedRecently(false), 1800);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-600'
                  : 'bg-zinc-950/80 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {preset}
            </button>
          );
        })}
      </div>
    </div>
  );
};
