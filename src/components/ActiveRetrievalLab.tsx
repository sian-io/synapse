import React, { useState, useEffect } from 'react';
import {
  Zap,
  RotateCw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Brain,
  Layers,
  ChevronRight,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Flashcard } from '../types';
import { INITIAL_PRESET_FLASHCARDS } from '../data/neurosciencePillars';

interface ActiveRetrievalLabProps {
  currentTopic: string;
  onTopicChange?: (newTopic: string) => void;
  onIncrementStats: (type: 'socratic' | 'retrieval' | 'feynman') => void;
}

export const ActiveRetrievalLab: React.FC<ActiveRetrievalLabProps> = ({
  currentTopic,
  onTopicChange,
  onIncrementStats,
}) => {
  const [cards, setCards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem('synapse_flashcards');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_PRESET_FLASHCARDS;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userDraftAnswer, setUserDraftAnswer] = useState('');
  const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
  const [deckDifficulty, setDeckDifficulty] = useState('intermediario');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('synapse_flashcards', JSON.stringify(cards));
  }, [cards]);

  const activeCards = cards;
  const currentCard = activeCards[currentIndex] || null;

  const handleNextCard = () => {
    setIsFlipped(false);
    setUserDraftAnswer('');
    setCurrentIndex((prev) => (prev + 1) % activeCards.length);
  };

  const handleRateCard = (quality: 0 | 1 | 2 | 3) => {
    if (!currentCard) return;

    // Quality: 0 = esqueceu, 1 = difícil, 2 = bom, 3 = perfeito
    let newInterval = currentCard.intervalDays;
    let newRepetitions = currentCard.repetitions;
    let newEase = currentCard.easeFactor;
    let newMastery = currentCard.masteryLevel;

    if (quality === 0) {
      newInterval = 1;
      newRepetitions = 0;
      newEase = Math.max(1.3, newEase - 0.2);
      newMastery = 0;
    } else if (quality === 1) {
      newInterval = Math.max(1, Math.round(newInterval * 1.2));
      newRepetitions += 1;
      newEase = Math.max(1.3, newEase - 0.1);
      newMastery = Math.min(5, (newMastery + 1) as any);
    } else if (quality === 2) {
      newInterval = Math.max(2, Math.round(newInterval * newEase));
      newRepetitions += 1;
      newMastery = Math.min(5, (newMastery + 1) as any);
    } else {
      newInterval = Math.max(3, Math.round(newInterval * newEase * 1.3));
      newRepetitions += 1;
      newEase += 0.15;
      newMastery = Math.min(5, (newMastery + 2) as any);
    }

    const updatedCards = cards.map((c) =>
      c.id === currentCard.id
        ? {
            ...c,
            intervalDays: newInterval,
            repetitions: newRepetitions,
            easeFactor: newEase,
            lastReviewed: Date.now(),
            nextReviewDate: Date.now() + newInterval * 86400000,
            masteryLevel: newMastery,
          }
        : c
    );

    setCards(updatedCards);
    onIncrementStats('retrieval');
    handleNextCard();
  };

  const handleGenerateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeConcept = currentTopic.trim();
    if (!activeConcept || isGeneratingDeck) return;

    setIsGeneratingDeck(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-retrieval-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: activeConcept,
          difficulty: deckDifficulty,
          count: 4,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || 'Falha ao gerar cartões de recuperação.');
      }

      const data = await response.json();
      if (data.flashcards && data.flashcards.length > 0) {
        setCards((prev) => [...data.flashcards, ...prev]);
        setCurrentIndex(0);
        setIsFlipped(false);
        setUserDraftAnswer('');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao conectar à API de geração.');
    } finally {
      setIsGeneratingDeck(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner on Active Recall */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-slate-900 to-indigo-950/40 border border-emerald-500/20 text-slate-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-emerald-300">
                Laboratório de Recuperação Ativa (Active Recall)
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Curva de Ebbinghaus
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Regra de Ouro da Neurociência (Roediger & Karpicke)</strong>: A evocação forçada da memória a partir
              do zero consolida as sinapses 3x mais rápido do que a releitura. Não vire o cartão antes de formular sua
              resposta em mente ou por escrito.
            </p>
          </div>
        </div>
      </div>

      {/* Generator Accordion / Form */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
        <form onSubmit={handleGenerateDeck} className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Gerar para o conceito:</span>
              <span className="font-semibold text-emerald-300 text-sm truncate max-w-[260px]">
                {currentTopic || 'Defina um conceito no topo'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={deckDifficulty}
                onChange={(e) => setDeckDifficulty(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="fundamentos">Fundamentos</option>
                <option value="intermediario">Intermediário</option>
                <option value="avancado">Avançado</option>
              </select>

              <button
                type="submit"
                disabled={isGeneratingDeck || !currentTopic.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {isGeneratingDeck ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Gerando Desafios...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Sintetizar Baralho</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={(e) => handleGenerateDeck(e as any)}
                className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg text-rose-200 font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <RotateCw className="w-3 h-3" />
                Tentar Novamente
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Active Card Container */}
      {currentCard ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              Cartão <strong>{currentIndex + 1}</strong> de <strong>{activeCards.length}</strong>
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-slate-300">
                {currentCard.topic}
              </span>
              <span className="text-[11px] text-emerald-400">
                Próxima revisão em: {currentCard.intervalDays} dia(s)
              </span>
            </div>
          </div>

          {/* Flashcard Body */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden transition-all">
            {/* Top Indicator */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold tracking-wider text-emerald-400 uppercase">
                {isFlipped ? '🧠 Modelo Mental & Solução' : '⚡ Desafio de Recuperação Ativa'}
              </span>
              <span className="text-xs text-slate-500">
                Nível de Domínio: {'★'.repeat(currentCard.masteryLevel || 0)}{'☆'.repeat(5 - (currentCard.masteryLevel || 0))}
              </span>
            </div>

            {/* Question Section */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
                {currentCard.question}
              </h3>
              <p className="text-xs text-slate-400">
                Conceito-Chave Alvo: <span className="text-slate-200 font-medium">{currentCard.keyConcept}</span>
              </p>
            </div>

            {/* Draft Answer Area (Generation Effect) */}
            {!isFlipped && (
              <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-indigo-400" />
                    Forçar a Geração (Escreva sua dedução antes de ver a resposta):
                  </label>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    (Evita o viés retrospectivo)
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={userDraftAnswer}
                  onChange={(e) => setUserDraftAnswer(e.target.value)}
                  placeholder="Escreva em 1 ou 2 frases o que você lembra ou deduz sobre esse mecanismo..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsFlipped(true)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Conferir Modelo Mental & Resposta</span>
                  </button>
                </div>
              </div>
            )}

            {/* Answer Section (When Flipped) */}
            {isFlipped && (
              <div className="mt-6 pt-6 border-t border-slate-800 space-y-5 animate-fade-in">
                {userDraftAnswer && (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400">Sua tentativa inicial formulada:</span>
                    <p className="text-xs text-slate-300 italic">"{userDraftAnswer}"</p>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
                  <span className="text-xs font-bold text-indigo-300 block">
                    Gabarito Explicativo & Mecanismo Causal:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {currentCard.answer}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-2.5">
                  <Brain className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-semibold text-emerald-400 block mb-0.5">
                      Âncora Mnemônica / NeuroDica:
                    </span>
                    <span className="text-slate-300 leading-relaxed">
                      {currentCard.neuroTip}
                    </span>
                  </div>
                </div>

                {/* Rating Buttons */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-slate-400 block text-center">
                    Calibre o esforço de recuperação (Algoritmo de Espaçamento):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleRateCard(0)}
                      className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Errei / Branco</span>
                      <span className="text-[10px] text-rose-400/80">Rever hoje</span>
                    </button>

                    <button
                      onClick={() => handleRateCard(1)}
                      className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span>Muito Difícil</span>
                      <span className="text-[10px] text-amber-400/80">+1 dia</span>
                    </button>

                    <button
                      onClick={() => handleRateCard(2)}
                      className="p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      <span>Bom Esforço</span>
                      <span className="text-[10px] text-indigo-400/80">+{currentCard.intervalDays * 2} dias</span>
                    </button>

                    <button
                      onClick={() => handleRateCard(3)}
                      className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all flex flex-col items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Perfeito / Fácil</span>
                      <span className="text-[10px] text-emerald-400/80">+{Math.round(currentCard.intervalDays * 2.5)} dias</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500">
            <button
              onClick={() => {
                setIsFlipped(false);
                setUserDraftAnswer('');
                setCurrentIndex((prev) => (prev - 1 + activeCards.length) % activeCards.length);
              }}
              className="hover:text-slate-300 transition-colors"
            >
              ← Cartão Anterior
            </button>
            <button
              onClick={handleNextCard}
              className="hover:text-slate-300 transition-colors flex items-center gap-1"
            >
              <span>Pular / Próximo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
          <p>Nenhum cartão cadastrado no momento. Digite um tema acima para gerar seus desafios!</p>
        </div>
      )}
    </div>
  );
};
