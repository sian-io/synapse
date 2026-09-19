import React, { useState, useEffect } from 'react';
import {
  Zap,
  RotateCw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Brain,
  Layers,
  ChevronRight,
  Eye,
  AlertCircle,
  Bookmark,
  TrendingUp,
  BarChart3
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
        setCards(data.flashcards);
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
    <div className="space-y-6 w-full">
      {/* Header Banner on Active Recall */}
      <div className="p-6 sm:p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-zinc-200">
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-zinc-200 shrink-0">
            <Zap className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
                Laboratório de Recuperação Ativa &amp; Repetição Espaçada
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-4xl">
              <strong className="text-zinc-300 font-medium">Roediger &amp; Karpicke (2006)</strong>: A evocação deliberada da memória a partir do zero consolida sinapses até 3x mais rápido do que a releitura. Não vire o cartão antes de formular ativamente a resposta na sua mente ou por escrito.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid - 12 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Flashcard Experience - 8 Columns */}
        <div className="lg:col-span-8 space-y-4">
          {currentCard ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                <span className="flex items-center gap-2 font-mono">
                  <Layers className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                  Cartão <strong className="text-zinc-100 font-semibold">{currentIndex + 1}</strong> de <strong className="text-zinc-100 font-semibold">{activeCards.length}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
                    {currentCard.topic}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    Próxima revisão: +{currentCard.intervalDays}d
                  </span>
                </div>
              </div>

              {/* Flashcard Body */}
              <div className="p-7 sm:p-9 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 shadow-sm relative overflow-hidden transition-all">
                {/* Top Indicator */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-mono font-medium tracking-wider text-zinc-400 uppercase">
                    {isFlipped ? 'Modelo Mental & Solução' : 'Desafio de Recuperação Ativa'}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    Domínio: {'★'.repeat(currentCard.masteryLevel || 0)}{'☆'.repeat(5 - (currentCard.masteryLevel || 0))}
                  </span>
                </div>

                {/* Question Section */}
                <div className="space-y-3">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-zinc-100 leading-snug">
                    {currentCard.question}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    Conceito-Chave Alvo: <span className="text-zinc-200 font-mono font-medium">{currentCard.keyConcept}</span>
                  </p>
                </div>

                {/* Draft Answer Area (Generation Effect) */}
                {!isFlipped && (
                  <div className="mt-8 pt-6 border-t border-zinc-800/80 space-y-4">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <label className="text-zinc-200 font-medium flex items-center gap-2">
                        <Brain className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                        Forçar a Geração (Escreva sua dedução antes de conferir):
                      </label>
                      <span className="text-xs text-zinc-500 hidden sm:inline">
                        Evita o viés retrospectivo
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={userDraftAnswer}
                      onChange={(e) => setUserDraftAnswer(e.target.value)}
                      placeholder="Escreva em 1 ou 2 frases o que você deduz ou se lembra sobre esse mecanismo..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-700/60 leading-relaxed shadow-inner"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => setIsFlipped(true)}
                        className="px-6 py-3 bg-zinc-100 hover:bg-white text-zinc-950 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Eye className="w-4 h-4 stroke-[1.75]" />
                        <span>Conferir Modelo Mental &amp; Resposta</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Answer Section (When Flipped) */}
                {isFlipped && (
                  <div className="mt-8 pt-6 border-t border-zinc-800/80 space-y-5 animate-fade-in">
                    {userDraftAnswer && (
                      <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1">
                        <span className="text-xs font-mono text-zinc-400">Sua tentativa formulada:</span>
                        <p className="text-xs sm:text-sm text-zinc-300 italic leading-relaxed">"{userDraftAnswer}"</p>
                      </div>
                    )}

                    <div className="p-5 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-2">
                      <span className="text-xs font-semibold text-zinc-200 block uppercase tracking-wider font-mono">
                        Gabarito Explicativo &amp; Mecanismo Causal:
                      </span>
                      <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
                        {currentCard.answer}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-start gap-3">
                      <Brain className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5 stroke-[1.75]" />
                      <div className="text-xs sm:text-sm">
                        <span className="font-semibold text-zinc-200 block mb-0.5">
                          Âncora Mnemônica / NeuroDica:
                        </span>
                        <span className="text-zinc-400 leading-relaxed">
                          {currentCard.neuroTip}
                        </span>
                      </div>
                    </div>

                    {/* Rating Buttons */}
                    <div className="space-y-3 pt-3">
                      <span className="text-xs text-zinc-400 block text-center font-medium">
                        Calibre o esforço de evocação para o algoritmo de repetição espaçada:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <button
                          onClick={() => handleRateCard(0)}
                          className="p-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-medium transition-all flex flex-col items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                          <span>Errei / Branco</span>
                          <span className="text-[10px] text-zinc-500 font-mono">Rever hoje</span>
                        </button>

                        <button
                          onClick={() => handleRateCard(1)}
                          className="p-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-medium transition-all flex flex-col items-center gap-1 cursor-pointer"
                        >
                          <AlertCircle className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                          <span>Muito Difícil</span>
                          <span className="text-[10px] text-zinc-500 font-mono">+1 dia</span>
                        </button>

                        <button
                          onClick={() => handleRateCard(2)}
                          className="p-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-medium transition-all flex flex-col items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 text-zinc-300 stroke-[1.75]" />
                          <span>Bom Esforço</span>
                          <span className="text-[10px] text-zinc-500 font-mono">+{currentCard.intervalDays * 2} dias</span>
                        </button>

                        <button
                          onClick={() => handleRateCard(3)}
                          className="p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-700 text-zinc-100 text-xs font-medium transition-all flex flex-col items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <Sparkles className="w-4 h-4 text-zinc-200 stroke-[1.75]" />
                          <span>Perfeito / Fácil</span>
                          <span className="text-[10px] text-zinc-400 font-mono">+{Math.round(currentCard.intervalDays * 2.5)} dias</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-xs sm:text-sm text-zinc-400 px-1 pt-1">
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setUserDraftAnswer('');
                    setCurrentIndex((prev) => (prev - 1 + activeCards.length) % activeCards.length);
                  }}
                  className="hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  ← Cartão Anterior
                </button>
                <button
                  onClick={handleNextCard}
                  className="hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Próximo Cartão</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-zinc-900/30 border border-zinc-800 text-zinc-400">
              <p>Nenhum cartão cadastrado no momento. Digite um tema acima para gerar seus desafios!</p>
            </div>
          )}
        </div>

        {/* Right Column: Deck Control & Card Navigation - 4 Columns */}
        <div className="lg:col-span-4 space-y-4">
          {/* Deck Generator Card */}
          <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 space-y-4">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-400" />
              Sintetizar Baralho com IA
            </span>

            <form onSubmit={handleGenerateDeck} className="space-y-3">
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs space-y-1">
                <span className="text-zinc-500">Conceito Alvo:</span>
                <p className="font-semibold text-zinc-200 text-xs sm:text-sm truncate">
                  {currentTopic || 'Defina um conceito no topo'}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400 block font-medium">Nível de Dificuldade:</label>
                <select
                  value={deckDifficulty}
                  onChange={(e) => setDeckDifficulty(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors"
                >
                  <option value="fundamentos">Fundamentos (Conceitos Essenciais)</option>
                  <option value="intermediario">Intermediário (Elos Causais)</option>
                  <option value="avancado">Avançado (Cenários &amp; Exceções)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isGeneratingDeck || !currentTopic.trim()}
                className="w-full py-2.5 bg-zinc-100 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isGeneratingDeck ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Gerando Desafios...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 stroke-[1.75]" />
                    <span>Sintetizar Novo Baralho</span>
                  </>
                )}
              </button>

              {error && (
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="text-[11px]">{error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleGenerateDeck(e as any)}
                    className="text-[11px] underline text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    Tentar
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Deck Overview & Question Jump List */}
          <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-zinc-400" />
                Cartões do Baralho
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {activeCards.length} cartões
              </span>
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {activeCards.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setIsFlipped(false);
                    setUserDraftAnswer('');
                  }}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-start gap-2 border cursor-pointer ${
                    currentIndex === idx
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                      : 'bg-zinc-950/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-zinc-800/80'
                  }`}
                >
                  <span className="font-mono text-[10px] text-zinc-500 shrink-0 mt-0.5">#{idx + 1}</span>
                  <span className="truncate flex-1">{c.question}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
