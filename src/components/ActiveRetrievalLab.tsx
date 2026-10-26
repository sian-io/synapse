import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Brain,
  Layers,
  ChevronRight,
  ChevronLeft,
  Eye,
  AlertCircle,
  Bookmark,
  X,
} from 'lucide-react';
import { api } from '../api';
import { Flashcard } from '../types';
import { getInitialPresetFlashcards } from '../data/neurosciencePillars';
import { useLanguage } from '../i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ActiveRetrievalLabProps {
  onIncrementStats: (type: 'socratic' | 'retrieval' | 'feynman') => void;
}

export function previewNextInterval(card: Flashcard, quality: 0 | 1 | 2 | 3): number {
  if (quality === 0) {
    return 1;
  }
  if (quality === 1) {
    return Math.max(1, Math.round(card.intervalDays * 1.2));
  }
  if (quality === 2) {
    return Math.max(2, Math.round(card.intervalDays * card.easeFactor));
  }
  return Math.max(3, Math.round(card.intervalDays * card.easeFactor * 1.3));
}

export const ActiveRetrievalLab: React.FC<ActiveRetrievalLabProps> = ({
  onIncrementStats,
}) => {
  const { t, language } = useLanguage();

  const [cards, setCards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem(`synapse_flashcards_${language}`) || localStorage.getItem('synapse_flashcards');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return getInitialPresetFlashcards(language);
  });

  const [deckTopic, setDeckTopic] = useState<string>(() => {
    return localStorage.getItem('synapse_retrieval_topic') || '';
  });
  const [deckCount, setDeckCount] = useState<string>(() => {
    return localStorage.getItem('synapse_retrieval_count') || '4';
  });
  const [deckDifficulty, setDeckDifficulty] = useState<string>(() => {
    return localStorage.getItem('synapse_retrieval_difficulty') || 'intermediario';
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userDraftAnswer, setUserDraftAnswer] = useState('');
  const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(`synapse_flashcards_${language}`, JSON.stringify(cards));
  }, [cards, language]);

  useEffect(() => {
    localStorage.setItem('synapse_retrieval_topic', deckTopic);
  }, [deckTopic]);

  useEffect(() => {
    localStorage.setItem('synapse_retrieval_count', deckCount);
  }, [deckCount]);

  useEffect(() => {
    localStorage.setItem('synapse_retrieval_difficulty', deckDifficulty);
  }, [deckDifficulty]);

  const currentCard = cards[currentIndex] || null;

  const difficultyLabels: Record<string, string> = {
    fundamentos: t.retrieval.diffFundamentals,
    intermediario: t.retrieval.diffIntermediate,
    avancado: t.retrieval.diffAdvanced,
  };

  const countOptions = ['4', '6', '8'] as const;

  const handleNextCard = () => {
    setIsFlipped(false);
    setUserDraftAnswer('');
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setUserDraftAnswer('');
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleRateCard = (quality: 0 | 1 | 2 | 3) => {
    if (!currentCard) return;

    // Quality: 0 = forgot, 1 = hard, 2 = good, 3 = perfect
    const newInterval = previewNextInterval(currentCard, quality);
    let newRepetitions = currentCard.repetitions;
    let newEase = currentCard.easeFactor;
    let newMastery = currentCard.masteryLevel;

    if (quality === 0) {
      newRepetitions = 0;
      newEase = Math.max(1.3, newEase - 0.2);
      newMastery = 0;
    } else if (quality === 1) {
      newRepetitions += 1;
      newEase = Math.max(1.3, newEase - 0.1);
      newMastery = Math.min(5, newMastery + 1);
    } else if (quality === 2) {
      newRepetitions += 1;
      newMastery = Math.min(5, newMastery + 1);
    } else {
      newRepetitions += 1;
      newEase += 0.15;
      newMastery = Math.min(5, newMastery + 2);
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

  const handleGenerateDeck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const activeConcept = deckTopic.trim();
    if (!activeConcept || isGeneratingDeck) return;

    setIsGeneratingDeck(true);
    setError(null);

    try {
      const response = await api.api['generate-retrieval-deck'].$post({
        json: {
          topic: activeConcept,
          difficulty: deckDifficulty,
          count: Number(deckCount) || 4,
          language,
        },
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || t.retrieval.errorFallback);
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
      setError(err.message || t.retrieval.errorFallback);
    } finally {
      setIsGeneratingDeck(false);
    }
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left Column: Flashcard Experience - 8 Columns */}
      <div className="lg:col-span-8 space-y-3.5">
        {currentCard ? (
          <div className="space-y-3.5">
            {/* Top Status Strip */}
            <div className="surface-panel rounded-lg px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500 tabular-nums">
                <Layers className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
                <span>
                  {t.retrieval.cardCount}{' '}
                  <strong className="text-zinc-100 font-semibold">{currentIndex + 1}</strong>{' '}
                  {t.retrieval.of}{' '}
                  <strong className="text-zinc-100 font-semibold">{cards.length}</strong>
                </span>
              </span>

              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded-md surface-recessed text-[11px] font-mono text-zinc-300 truncate max-w-[200px]">
                  {currentCard.topic}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono tabular-nums">
                  {t.retrieval.nextReview} +{currentCard.intervalDays}d
                </span>
              </div>
            </div>

            {/* Precision Flashcard Surface */}
            <div className="bg-[#0f0f12] border border-white/[0.08] rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] p-6 sm:p-8 relative overflow-hidden transition-all space-y-6">
              {/* Top Indicator & Geometric Mastery Blocks */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/[0.06]">
                <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                  {isFlipped ? t.retrieval.solutionHeader : t.retrieval.challengeHeader}
                </span>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                    {t.retrieval.masteryLevel}
                  </span>
                  <div className="flex items-center gap-1" aria-label={`${currentCard.masteryLevel || 0}/5`}>
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <span
                        key={lvl}
                        className={`w-3 h-1.5 rounded-[1px] transition-colors ${
                          lvl <= (currentCard.masteryLevel || 0)
                            ? 'bg-zinc-100'
                            : 'bg-white/[0.08]'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-mono tabular-nums text-[11px] text-zinc-400">
                    {currentCard.masteryLevel || 0}/5
                  </span>
                </div>
              </div>

              {/* Question Section */}
              <div className="space-y-2.5">
                <h3 className="text-lg sm:text-xl font-semibold text-zinc-100 leading-snug">
                  {currentCard.question}
                </h3>
                <p className="text-[13px] text-zinc-500 font-mono">
                  {t.retrieval.targetConcept}{' '}
                  <span className="text-zinc-300">{currentCard.keyConcept}</span>
                </p>
              </div>

              {/* Draft Answer Area (Generation Effect) */}
              {!isFlipped && (
                <div className="pt-5 border-t border-white/[0.06] space-y-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-mono text-[11px] uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
                      {t.retrieval.forceGeneration}
                    </label>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 hidden sm:inline">
                      {t.retrieval.avoidsHindsight}
                    </span>
                  </div>

                  <Textarea
                    rows={4}
                    value={userDraftAnswer}
                    onChange={(e) => setUserDraftAnswer(e.target.value)}
                    placeholder={t.retrieval.draftPlaceholder}
                    className="w-full min-h-[120px] surface-recessed rounded-lg p-4 text-[15px] text-zinc-100 placeholder:text-zinc-600 focus-visible:border-white/[0.14] focus-visible:ring-0 leading-relaxed"
                  />

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setIsFlipped(true)}
                      className="h-10 px-5 bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-medium rounded-md transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 stroke-[1.75]" />
                      <span>{t.retrieval.checkAnswer}</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Answer Section (When Flipped) */}
              {isFlipped && (
                <div className="pt-5 border-t border-white/[0.06] space-y-5 animate-fade-in">
                  {userDraftAnswer && (
                    <div className="space-y-1.5 pb-4 border-b border-white/[0.05]">
                      <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 block">
                        {t.retrieval.yourAttempt}
                      </span>
                      <p className="text-sm text-zinc-300 border-l-2 border-zinc-600 pl-3 leading-relaxed">
                        {userDraftAnswer}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 block">
                      {t.retrieval.benchmarkAnswer}
                    </span>
                    <p className="text-sm sm:text-base text-zinc-100 leading-relaxed border-l-2 border-zinc-200 pl-3.5">
                      {currentCard.answer}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/[0.05] flex items-start gap-2.5 text-sm">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 shrink-0 mt-0.5">
                      LTP //
                    </span>
                    <div className="space-y-0.5">
                      <span className="font-medium text-zinc-300 block">
                        {t.retrieval.neuroTipHeader}
                      </span>
                      <p className="text-zinc-400 leading-relaxed">
                        {currentCard.neuroTip}
                      </p>
                    </div>
                  </div>

                  {/* SM-2 Rating Buttons */}
                  <div className="pt-4 border-t border-white/[0.06] space-y-3">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 block">
                      {t.retrieval.calibrateRating}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleRateCard(0)}
                        className="p-3 rounded-md surface-recessed hover:bg-[#16161a] hover:border-white/[0.14] text-zinc-300 text-sm font-medium transition-colors flex flex-col items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
                        <span>{t.retrieval.ratingForgot}</span>
                        <span className="text-[11px] text-zinc-500 font-mono tabular-nums">
                          +{previewNextInterval(currentCard, 0)}d
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRateCard(1)}
                        className="p-3 rounded-md surface-recessed hover:bg-[#16161a] hover:border-white/[0.14] text-zinc-300 text-sm font-medium transition-colors flex flex-col items-center gap-1 cursor-pointer"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />
                        <span>{t.retrieval.ratingHard}</span>
                        <span className="text-[11px] text-zinc-500 font-mono tabular-nums">
                          +{previewNextInterval(currentCard, 1)} {t.retrieval.ratingGoodSub}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRateCard(2)}
                        className="p-3 rounded-md surface-recessed hover:bg-[#16161a] hover:border-white/[0.14] text-zinc-200 text-sm font-medium transition-colors flex flex-col items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 stroke-[1.75]" />
                        <span>{t.retrieval.ratingGood}</span>
                        <span className="text-[11px] text-zinc-400 font-mono tabular-nums">
                          +{previewNextInterval(currentCard, 2)} {t.retrieval.ratingGoodSub}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRateCard(3)}
                        className="p-3 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-medium transition-colors flex flex-col items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-zinc-950 stroke-[1.75]" />
                        <span>{t.retrieval.ratingPerfect}</span>
                        <span className="text-[11px] text-zinc-700 font-mono tabular-nums">
                          +{previewNextInterval(currentCard, 3)} {t.retrieval.ratingPerfectSub}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card Prev / Next Bar */}
            <div className="flex justify-between items-center text-sm text-zinc-400 px-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePrevCard}
                className="h-8 px-3 rounded-md text-[13px] text-zinc-400 hover:text-zinc-100 hover:bg-[#16161a] flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{t.retrieval.prevCard.replace(/^←\s*/, '')}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleNextCard}
                className="h-8 px-3 rounded-md text-[13px] text-zinc-400 hover:text-zinc-100 hover:bg-[#16161a] flex items-center gap-1 cursor-pointer"
              >
                <span>{t.retrieval.nextCard}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-xl surface-panel text-zinc-400 text-sm">
            <p>{t.retrieval.noCards}</p>
          </div>
        )}
      </div>

      {/* Right Column: Deck Control & Card Navigation Hairline Bento - 4 Columns */}
      <div className="lg:col-span-4 lg:sticky lg:top-24 grid grid-cols-1 gap-px bg-white/[0.07] border border-white/[0.07] rounded-xl overflow-hidden">
        {/* Cell 1: Deck Synthesizer */}
        <div className="bg-[#0f0f12] p-6 space-y-4">
          <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
            {t.retrieval.synthesizeTitle}
          </span>

          <form onSubmit={handleGenerateDeck} className="space-y-3.5">
            {/* Dedicated Topic Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="retrieval-topic-input"
                className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 block"
              >
                {t.retrieval.targetConceptLabel}
              </label>
              <div className="relative flex items-center">
                <Input
                  id="retrieval-topic-input"
                  type="text"
                  value={deckTopic}
                  onChange={(e) => setDeckTopic(e.target.value)}
                  placeholder={t.retrieval.topicPlaceholder}
                  disabled={isGeneratingDeck}
                  className="h-10 w-full surface-recessed rounded-md px-3.5 pr-8 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:border-white/[0.14] focus-visible:ring-0"
                />
                {deckTopic && !isGeneratingDeck && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setDeckTopic('')}
                    className="absolute right-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-[#16161a] rounded-md cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Card Count Select */}
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 block">
                {t.retrieval.cardCountLabel}
              </label>
              <Select
                value={deckCount}
                onValueChange={(val) => {
                  if (val) setDeckCount(val);
                }}
              >
                <SelectTrigger className="w-full h-10 rounded-md surface-recessed px-3.5 text-sm font-mono tabular-nums text-zinc-200 hover:border-white/[0.14] focus-visible:ring-0">
                  <SelectValue>
                    {deckCount} {t.retrieval.cardsUnit}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  sideOffset={6}
                  alignItemWithTrigger={false}
                  className="surface-panel rounded-lg p-1 text-zinc-200 ring-0"
                >
                  {countOptions.map((cnt) => (
                    <SelectItem
                      key={cnt}
                      value={cnt}
                      className="rounded-md text-sm font-mono tabular-nums text-zinc-300 hover:bg-[#16161a] hover:text-zinc-100 focus:bg-[#16161a] focus:text-zinc-100 data-[highlighted]:bg-[#16161a] data-[highlighted]:text-zinc-100 cursor-pointer"
                    >
                      {cnt} {t.retrieval.cardsUnit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Select */}
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 block">
                {t.retrieval.difficultyLabel}
              </label>
              <Select
                value={deckDifficulty}
                onValueChange={(val) => {
                  if (val) setDeckDifficulty(val);
                }}
              >
                <SelectTrigger className="w-full h-10 rounded-md surface-recessed px-3.5 text-sm text-zinc-200 hover:border-white/[0.14] focus-visible:ring-0">
                  <SelectValue>{difficultyLabels[deckDifficulty]}</SelectValue>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  sideOffset={6}
                  alignItemWithTrigger={false}
                  className="surface-panel rounded-lg p-1 text-zinc-200 ring-0"
                >
                  <SelectItem
                    value="fundamentos"
                    className="rounded-md text-sm text-zinc-300 hover:bg-[#16161a] hover:text-zinc-100 focus:bg-[#16161a] focus:text-zinc-100 data-[highlighted]:bg-[#16161a] data-[highlighted]:text-zinc-100 cursor-pointer"
                  >
                    {t.retrieval.diffFundamentals}
                  </SelectItem>
                  <SelectItem
                    value="intermediario"
                    className="rounded-md text-sm text-zinc-300 hover:bg-[#16161a] hover:text-zinc-100 focus:bg-[#16161a] focus:text-zinc-100 data-[highlighted]:bg-[#16161a] data-[highlighted]:text-zinc-100 cursor-pointer"
                  >
                    {t.retrieval.diffIntermediate}
                  </SelectItem>
                  <SelectItem
                    value="avancado"
                    className="rounded-md text-sm text-zinc-300 hover:bg-[#16161a] hover:text-zinc-100 focus:bg-[#16161a] focus:text-zinc-100 data-[highlighted]:bg-[#16161a] data-[highlighted]:text-zinc-100 cursor-pointer"
                  >
                    {t.retrieval.diffAdvanced}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={isGeneratingDeck || !deckTopic.trim()}
              className="w-full h-10 bg-zinc-100 hover:bg-white disabled:bg-zinc-900 disabled:text-zinc-600 text-zinc-950 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGeneratingDeck ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.retrieval.synthesizing}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 stroke-[1.75]" />
                  <span>{t.retrieval.synthesizeButton}</span>
                </>
              )}
            </Button>

            {error && (
              <div className="pt-3 border-t border-white/[0.05] text-sm text-zinc-300 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="text-[13px]">{error}</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleGenerateDeck()}
                  className="h-7 px-2.5 surface-recessed hover:bg-[#16161a] rounded-md text-xs text-zinc-200 font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>{t.feynman.retry}</span>
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Cell 2: Deck Overview & Question Jump List */}
        <div className="bg-[#0f0f12] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
              {t.retrieval.deckCardsTitle}
            </span>
            <span className="text-[11px] font-mono tabular-nums text-zinc-400">
              {cards.length} {t.retrieval.cardsUnit}
            </span>
          </div>

          <div className="divide-y divide-white/[0.05] -mx-6 border-t border-white/[0.05] max-h-[360px] overflow-y-auto">
            {cards.map((c, idx) => {
              const isSelected = currentIndex === idx;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    setIsFlipped(false);
                    setUserDraftAnswer('');
                  }}
                  className={`w-full text-left px-6 py-3 text-[13px] transition-colors flex items-center justify-between gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#16161a] text-zinc-100 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#16161a]/60'
                  }`}
                >
                  <span className="truncate min-w-0">{c.question}</span>
                  <span className="font-mono text-[11px] text-zinc-500 tabular-nums shrink-0">
                    +{c.intervalDays}d
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
