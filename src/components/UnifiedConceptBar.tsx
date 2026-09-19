import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Check,
  X,
  Compass,
  Layers,
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
    <div className="w-full bg-slate-900/90 border border-indigo-500/25 rounded-2xl p-3 sm:p-3.5 shadow-xl backdrop-blur-md transition-all">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Label & Active Context */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-indigo-500/20">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Conceito em Estudo
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium">
              Sincronizado
            </span>
          </div>
        </div>

        {/* Input & Action */}
        <div className="flex-1 flex items-center gap-2">
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
              placeholder="Digite o conceito central (ex: Termodinâmica, Sinapses, Criptografia RSA...)"
              className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-indigo-400 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all pr-8 shadow-inner"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => {
                  setInputValue('');
                  onTopicChange('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-0.5 cursor-pointer"
                title="Limpar campo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleApply(inputValue)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-md ${
              isSavedRecently
                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            {isSavedRecently ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Fixado</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fixar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Concept Suggestions Chips */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
        <span className="text-[11px] text-slate-500 shrink-0 flex items-center gap-1">
          <Brain className="w-3 h-3 text-slate-400" />
          Sugestões rápidas:
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
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
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
