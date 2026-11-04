import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Sparkles,
  CheckCircle2,
  XCircle,
  CircleMinus,
  Layers,
  ChevronRight,
  ChevronLeft,
  Eye,
  AlertCircle,
  Bookmark,
  X,
  Download,
  Upload,
  Trash2,
  Square,
  Pencil,
} from 'lucide-react';
import { api } from '../api';
import { Flashcard, RetrievalRating } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { generateAnkiTsv, generateFlashcardsCsv, parseFlashcardsImport } from '../lib/anki';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AppliedEvaluation {
  rating: RetrievalRating;
  feedback: string;
}

export const ActiveRetrievalLab: React.FC = () => {
  const { t, language } = useLanguage();

  const [cards, setCards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem('synapse_flashcards') || localStorage.getItem(`synapse_flashcards_${language}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((c: any) => ({
            id: String(c.id || ''),
            topic: String(c.topic || ''),
            question: String(c.question || ''),
            answer: String(c.answer || ''),
            userAnswer: typeof c.userAnswer === 'string' ? c.userAnswer : undefined,
            rating: c.rating === 'correct' || c.rating === 'partial' || c.rating === 'incorrect' ? c.rating : undefined,
            feedback: typeof c.feedback === 'string' ? c.feedback : undefined,
            reviewedAt: typeof c.reviewedAt === 'number' ? c.reviewedAt : undefined,
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }
    return [];
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
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userDraftAnswer, setUserDraftAnswer] = useState('');
  const [isEvaluatingAnswer, setIsEvaluatingAnswer] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [lastEvaluation, setLastEvaluation] = useState<AppliedEvaluation | null>(null);
  const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const abortControllerRef = React.useRef<AbortController | null>(null);
  const evalAbortControllerRef = React.useRef<AbortController | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      evalAbortControllerRef.current?.abort();
    };
  }, []);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGeneratingDeck(false);
  };

  const handleCancelEvaluation = () => {
    if (evalAbortControllerRef.current) {
      evalAbortControllerRef.current.abort();
      evalAbortControllerRef.current = null;
    }
    setIsEvaluatingAnswer(false);
  };

  useEffect(() => {
    localStorage.setItem('synapse_flashcards', JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem('synapse_retrieval_topic', deckTopic);
  }, [deckTopic]);

  useEffect(() => {
    localStorage.setItem('synapse_retrieval_count', deckCount);
  }, [deckCount]);

  useEffect(() => {
    localStorage.setItem('synapse_retrieval_difficulty', deckDifficulty);
  }, [deckDifficulty]);

  const availableTopics = Array.from(new Set(cards.map((c) => c.topic).filter(Boolean)));
  const displayCards = topicFilter === 'all' ? cards : cards.filter((c) => c.topic === topicFilter);
  const safeIndex = displayCards.length > 0 ? Math.min(currentIndex, displayCards.length - 1) : 0;
  const currentCard = displayCards[safeIndex] || null;

  const difficultyLabels: Record<string, string> = {
    fundamentos: t.retrieval.diffFundamentals,
    intermediario: t.retrieval.diffIntermediate,
    avancado: t.retrieval.diffAdvanced,
  };

  const ratingLabels: Record<RetrievalRating, string> = {
    correct: t.retrieval.ratingCorrect,
    partial: t.retrieval.ratingPartial,
    incorrect: t.retrieval.ratingIncorrect,
  };

  const countOptions = ['4', '6', '8'] as const;

  const syncStateForCard = (card: Flashcard | null) => {
    evalAbortControllerRef.current?.abort();
    evalAbortControllerRef.current = null;
    setIsEvaluatingAnswer(false);
    setEvalError(null);
    if (card?.rating && card?.feedback) {
      setLastEvaluation({
        rating: card.rating,
        feedback: card.feedback,
      });
      setUserDraftAnswer(card.userAnswer || '');
      setIsFlipped(true);
    } else {
      setLastEvaluation(null);
      setUserDraftAnswer('');
      setIsFlipped(false);
    }
  };

  const currentCardId = currentCard?.id;
  const prevCardIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (currentCardId !== prevCardIdRef.current) {
      prevCardIdRef.current = currentCardId ?? null;
      syncStateForCard(currentCard);
    }
  }, [currentCardId]);

  const handleNextCard = () => {
    if (displayCards.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % displayCards.length);
    }
  };

  const handlePrevCard = () => {
    if (displayCards.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + displayCards.length) % displayCards.length);
    }
  };

  const handleCancelEdit = () => {
    if (currentCard?.rating && currentCard?.feedback) {
      setUserDraftAnswer(currentCard.userAnswer || '');
      setLastEvaluation({
        rating: currentCard.rating,
        feedback: currentCard.feedback,
      });
      setIsFlipped(true);
    }
  };

  const applyEvaluationAndFlip = (rating: RetrievalRating, feedback: string) => {
    if (!currentCard) return;

    const answerAttempt = userDraftAnswer.trim();
    const updatedCards = cards.map((c) =>
      c.id === currentCard.id
        ? {
            ...c,
            userAnswer: answerAttempt,
            rating,
            feedback,
            reviewedAt: Date.now(),
          }
        : c
    );

    setCards(updatedCards);
    setLastEvaluation({
      rating,
      feedback,
    });
    setIsFlipped(true);
  };

  const handleForgotShortcut = () => {
    if (!currentCard || isEvaluatingAnswer) return;
    setEvalError(null);
    applyEvaluationAndFlip('incorrect', t.retrieval.forgotFeedback);
  };

  const handleEvaluateAnswer = async () => {
    if (!currentCard || !userDraftAnswer.trim() || isEvaluatingAnswer) return;

    setIsEvaluatingAnswer(true);
    setEvalError(null);

    evalAbortControllerRef.current?.abort();
    const controller = new AbortController();
    evalAbortControllerRef.current = controller;

    try {
      const response = await api.api['evaluate-retrieval-answer'].$post(
        {
          json: {
            question: currentCard.question,
            answer: currentCard.answer,
            userAnswer: userDraftAnswer.trim(),
            language,
          },
        },
        {
          init: {
            signal: controller.signal,
          },
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || t.retrieval.evaluationErrorFallback);
      }

      const data = await response.json();
      applyEvaluationAndFlip(data.rating, data.feedback);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return;
      }
      console.error(err);
      setEvalError(err.message || t.retrieval.evaluationErrorFallback);
    } finally {
      setIsEvaluatingAnswer(false);
      evalAbortControllerRef.current = null;
    }
  };

  const handleGenerateDeck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const activeConcept = deckTopic.trim();
    if (!activeConcept || isGeneratingDeck) return;

    setIsGeneratingDeck(true);
    setError(null);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await api.api['generate-retrieval-deck'].$post(
        {
          json: {
            topic: activeConcept,
            difficulty: deckDifficulty,
            count: Number(deckCount) || 4,
            language,
          },
        },
        {
          init: {
            signal: controller.signal,
          },
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || t.retrieval.errorFallback);
      }

      const data = await response.json();
      if (data.flashcards && data.flashcards.length > 0) {
        setCards((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const newCards = data.flashcards.filter((c: Flashcard) => !existingIds.has(c.id));
          return [...prev, ...newCards];
        });

        setTopicFilter('all');
        const nextIdx = cards.length;
        setCurrentIndex(nextIdx);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return;
      }
      console.error(err);
      setError(err.message || t.retrieval.errorFallback);
    } finally {
      setIsGeneratingDeck(false);
      abortControllerRef.current = null;
    }
  };

  const handleDeleteCard = (cardId: string) => {
    const isDeletingCurrent = currentCard?.id === cardId;
    const nextCards = cards.filter((c) => c.id !== cardId);
    setCards(nextCards);

    if (topicFilter !== 'all' && !nextCards.some((c) => c.topic === topicFilter)) {
      setTopicFilter('all');
      setCurrentIndex(0);
    } else {
      const remainingFiltered =
        topicFilter === 'all' ? nextCards : nextCards.filter((c) => c.topic === topicFilter);
      if (safeIndex >= remainingFiltered.length) {
        setCurrentIndex(Math.max(0, remainingFiltered.length - 1));
      }
    }

    if (isDeletingCurrent && nextCards.length === 0) {
      syncStateForCard(null);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImportError(null);
    try {
      const text = await file.text();
      const imported = parseFlashcardsImport(text, file.name);
      if (imported.length === 0) {
        setImportError(t.retrieval.importErrorEmpty);
        return;
      }

      const nextIdx = cards.length;
      setCards((prev) => [...prev, ...imported]);
      setTopicFilter('all');
      setCurrentIndex(nextIdx);
    } catch (err) {
      console.error(err);
      setImportError(t.retrieval.importErrorEmpty);
    }
  };

  const handleExportCsv = () => {
    if (cards.length === 0) return;
    const cardsToExport = topicFilter === 'all' ? cards : displayCards;
    const csv = generateFlashcardsCsv(cardsToExport, language === 'pt');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const topicSlug = topicFilter === 'all' ? 'synapse' : topicFilter.toLowerCase().replace(/[\s\t]+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `synapse-flashcards-${topicSlug}-${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAnki = () => {
    if (cards.length === 0) return;
    const cardsToExport = topicFilter === 'all' ? cards : displayCards;
    const tsv = generateAnkiTsv(cardsToExport);
    const blob = new Blob([tsv], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const topicSlug = topicFilter === 'all' ? 'synapse' : topicFilter.toLowerCase().replace(/[\s\t]+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `synapse-anki-${topicSlug}-${dateStr}.tsv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left Column: Flashcard Experience - 8 Columns */}
      <div className="lg:col-span-8 space-y-3.5">
        {currentCard ? (
          <div className="space-y-3.5">
            {/* Precision Flashcard Surface */}
            <div className="bg-[#0f0f12] border border-white/[0.08] rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] p-6 sm:p-8 relative overflow-hidden transition-all space-y-6">
              {/* Unified Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="flex items-center gap-2 font-mono text-[13px] uppercase tracking-widest text-zinc-500 tabular-nums">
                    <Layers className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
                    <span>
                      {t.retrieval.cardCount}{' '}
                      <strong className="text-zinc-100 font-semibold">{safeIndex + 1}</strong>{' '}
                      {t.retrieval.of}{' '}
                      <strong className="text-zinc-100 font-semibold">{displayCards.length}</strong>
                    </span>
                  </span>

                  <span className="px-2.5 py-1 rounded-md surface-recessed border border-white/[0.08] text-[13px] font-mono font-medium text-zinc-100 truncate max-w-[600px]">
                    {currentCard.topic}
                  </span>

                  {currentCard.rating && (
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-mono tabular-nums flex items-center gap-1.5 ${
                        currentCard.rating === 'correct'
                          ? 'bg-zinc-100 text-zinc-950 font-medium'
                          : 'surface-recessed text-zinc-300'
                      }`}
                    >
                      {currentCard.rating === 'correct' && <CheckCircle2 className="w-3 h-3 text-zinc-950 stroke-[2]" />}
                      {currentCard.rating === 'partial' && <CircleMinus className="w-3 h-3 text-zinc-400 stroke-[2]" />}
                      {currentCard.rating === 'incorrect' && <XCircle className="w-3 h-3 text-zinc-400 stroke-[2]" />}
                      <span>{ratingLabels[currentCard.rating]}</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleDeleteCard(currentCard.id)}
                    title={t.retrieval.deleteCard}
                    aria-label={t.retrieval.deleteCard}
                    className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-[#16161a] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[1.75]" />
                  </button>
                </div>
              </div>

              {/* Question Section */}
              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight leading-snug">
                  {currentCard.question}
                </h2>
              </div>

              {/* Draft Answer Area (Generation Effect) */}
              {!isFlipped && (
                <div className="pt-5 border-t border-white/[0.06] space-y-3.5">
                  <Textarea
                    rows={4}
                    value={userDraftAnswer}
                    onChange={(e) => setUserDraftAnswer(e.target.value)}
                    disabled={isEvaluatingAnswer}
                    placeholder={t.retrieval.draftPlaceholder}
                    aria-label={t.retrieval.forceGeneration}
                    className="w-full min-h-[120px] surface-recessed rounded-lg p-4 text-[15px] text-zinc-100 placeholder:text-zinc-600 focus-visible:border-white/[0.14] focus-visible:ring-0 leading-relaxed"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isEvaluatingAnswer}
                        onClick={handleForgotShortcut}
                        className="h-10 px-4 surface-recessed hover:bg-[#16161a] hover:border-white/[0.14] text-zinc-300 hover:text-zinc-100 text-sm font-medium rounded-md transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 text-zinc-500 stroke-[1.75]" />
                        <span>{t.retrieval.forgotShortcut}</span>
                      </Button>

                      {currentCard?.rating && (
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isEvaluatingAnswer}
                          onClick={handleCancelEdit}
                          className="h-10 px-3 surface-recessed hover:bg-[#16161a] hover:border-white/[0.14] text-zinc-400 hover:text-zinc-200 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{t.retrieval.cancelEdit}</span>
                        </Button>
                      )}
                    </div>

                    {isEvaluatingAnswer ? (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          disabled
                          className="h-10 px-5 bg-zinc-900 text-zinc-400 text-sm font-medium rounded-md flex items-center gap-2"
                        >
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{t.retrieval.evaluatingAnswer}</span>
                        </Button>
                        <Button
                          type="button"
                          onClick={handleCancelEvaluation}
                          className="h-10 px-3 surface-recessed hover:bg-[#16161a] hover:border-white/[0.14] text-zinc-200 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                          title={t.retrieval.cancel}
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>{t.retrieval.cancel}</span>
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        disabled={!userDraftAnswer.trim()}
                        onClick={handleEvaluateAnswer}
                        className="h-10 px-5 bg-zinc-100 hover:bg-white disabled:bg-zinc-900 disabled:text-zinc-600 text-zinc-950 text-sm font-medium rounded-md transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 stroke-[1.75]" />
                        <span>
                          {currentCard?.rating
                            ? t.retrieval.getNewFeedback
                            : t.retrieval.checkAnswer}
                        </span>
                      </Button>
                    )}
                  </div>

                  {evalError && (
                    <div className="pt-3 border-t border-white/[0.05] text-sm text-zinc-300 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="text-[13px]">{evalError}</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleEvaluateAnswer}
                        className="h-7 px-2.5 surface-recessed hover:bg-[#16161a] rounded-md text-xs text-zinc-200 font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>{t.feynman.retry}</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Answer Section (When Flipped) */}
              {isFlipped && (
                <div className="pt-5 border-t border-white/[0.06] space-y-5 animate-fade-in">
                  <div className="space-y-1.5 pb-4 border-b border-white/[0.05]">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-zinc-300">
                        {t.retrieval.yourAttempt.replace(/:\s*$/, '')}
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFlipped(false)}
                        className="h-7 px-2.5 surface-recessed hover:bg-[#16161a] hover:border-white/[0.14] text-xs text-zinc-300 hover:text-zinc-100 font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3 text-zinc-400" />
                        <span>{t.retrieval.editAnswer}</span>
                      </Button>
                    </div>
                    {userDraftAnswer ? (
                      <p className="text-sm text-zinc-300 border-l-2 border-zinc-600 pl-3 leading-relaxed">
                        {userDraftAnswer}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-500 italic pl-3 border-l-2 border-zinc-700">
                        {t.retrieval.forgotShortcut}
                      </p>
                    )}
                  </div>

                  {lastEvaluation && (
                    <div className="space-y-3 pb-4 border-b border-white/[0.05]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />
                          <span>{t.retrieval.aiDiagnosisTitle}</span>
                        </h3>
                        <span
                          className={`px-2.5 py-1 rounded-md text-xs font-mono tabular-nums flex items-center gap-1.5 ${
                            lastEvaluation.rating === 'correct'
                              ? 'bg-zinc-100 text-zinc-950 font-medium'
                              : 'surface-recessed text-zinc-200'
                          }`}
                        >
                          {lastEvaluation.rating === 'incorrect' && <XCircle className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />}
                          {lastEvaluation.rating === 'partial' && <CircleMinus className="w-3.5 h-3.5 text-zinc-400 stroke-[2]" />}
                          {lastEvaluation.rating === 'correct' && <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950 stroke-[1.75]" />}
                          <span>{ratingLabels[lastEvaluation.rating]}</span>
                        </span>
                      </div>

                      <p className="text-sm text-zinc-300 leading-relaxed border-l-2 border-zinc-500 pl-3">
                        {lastEvaluation.feedback}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-zinc-100">
                      {t.retrieval.benchmarkAnswer.replace(/:\s*$/, '')}
                    </h3>
                    <p className="text-sm sm:text-base text-zinc-100 leading-relaxed border-l-2 border-zinc-200 pl-3.5">
                      {currentCard.answer}
                    </p>
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
                variant={isFlipped ? 'default' : 'ghost'}
                size="sm"
                onClick={handleNextCard}
                className={`h-8 px-3 rounded-md text-[13px] flex items-center gap-1 cursor-pointer transition-colors ${
                  isFlipped
                    ? 'bg-zinc-100 hover:bg-white text-zinc-950 font-medium'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#16161a]'
                }`}
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
          <h3 className="text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-zinc-400 stroke-[1.75] shrink-0" />
            <span>{t.retrieval.synthesizeTitle}</span>
          </h3>

          <form onSubmit={handleGenerateDeck} className="space-y-3.5">
            {/* Dedicated Topic Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="retrieval-topic-input"
                className="text-xs font-medium text-zinc-400 block"
              >
                {t.retrieval.targetConceptLabel.replace(/:\s*$/, '')}
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
              <label className="text-xs font-medium text-zinc-400 block">
                {t.retrieval.cardCountLabel.replace(/:\s*$/, '')}
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
              <label className="text-xs font-medium text-zinc-400 block">
                {t.retrieval.difficultyLabel.replace(/:\s*$/, '')}
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

            {isGeneratingDeck ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled
                  className="flex-1 h-10 bg-zinc-900 text-zinc-400 text-sm font-medium rounded-md flex items-center justify-center gap-2"
                >
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.retrieval.synthesizing}</span>
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  className="h-10 px-3 surface-recessed hover:bg-[#16161a] hover:border-white/[0.14] text-zinc-200 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  title={t.retrieval.cancel}
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>{t.retrieval.cancel}</span>
                </Button>
              </div>
            ) : (
              <Button
                type="submit"
                disabled={!deckTopic.trim()}
                className="w-full h-10 bg-zinc-100 hover:bg-white disabled:bg-zinc-900 disabled:text-zinc-600 text-zinc-950 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 stroke-[1.75]" />
                <span>{t.retrieval.synthesizeButton}</span>
              </Button>
            )}

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
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-2 min-w-0">
              <Bookmark className="w-4 h-4 text-zinc-400 stroke-[1.75] shrink-0" />
              <span className="truncate">{t.retrieval.deckCardsTitle}</span>
            </h3>
            <span className="text-[13px] font-mono tabular-nums text-zinc-400 whitespace-nowrap shrink-0">
              {displayCards.length} {t.retrieval.cardsUnit}
            </span>
          </div>
          <div className="flex items-center gap-1.5 -ml-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,text/csv,text/tab-separated-values"
                onChange={handleImportFile}
                className="hidden"
              />
              <TooltipProvider delay={150}>
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-[#16161a] rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{t.retrieval.import}</span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="end"
                    sideOffset={6}
                    className="surface-panel rounded-lg p-2.5 text-xs text-zinc-300 max-w-[280px] flex-col items-start gap-1 ring-0"
                  >
                    <span className="font-semibold text-zinc-100 block">
                      {t.retrieval.importTooltipTitle}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-300 block">
                      {t.retrieval.importTooltipColumns}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400 block">
                      {t.retrieval.importTooltipSeparators}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {cards.length > 0 && (
                <Popover open={isExportOpen} onOpenChange={setIsExportOpen}>
                  <PopoverTrigger
                    type="button"
                    className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-[#16161a] rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                    title={t.retrieval.export}
                  >
                    <Download className="w-3 h-3" />
                    <span>{t.retrieval.export}</span>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    align="end"
                    sideOffset={4}
                    className="w-32 p-1 rounded-lg surface-panel border border-white/[0.08] shadow-lg ring-0 flex flex-col gap-0.5 z-50"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        handleExportCsv();
                        setIsExportOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-[#16161a] rounded-md font-mono transition-colors cursor-pointer"
                    >
                      {t.retrieval.exportCsv}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleExportAnki();
                        setIsExportOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-[#16161a] rounded-md font-mono transition-colors cursor-pointer"
                    >
                      {t.retrieval.exportTsv}
                    </button>
                  </PopoverContent>
                </Popover>
              )}
          </div>

          {importError && (
            <div className="pt-2 border-t border-white/[0.05] text-xs text-zinc-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{importError}</span>
              </div>
              <button
                type="button"
                onClick={() => setImportError(null)}
                className="p-1 text-zinc-500 hover:text-zinc-200 rounded-md cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {availableTopics.length > 1 && (
            <div className="pt-1">
              <Select
                value={topicFilter}
                onValueChange={(val) => {
                  if (val) {
                    setTopicFilter(val);
                    setCurrentIndex(0);
                  }
                }}
              >
                <SelectTrigger className="w-full h-8 rounded-md surface-recessed px-2.5 text-xs text-zinc-300 hover:border-white/[0.14] focus-visible:ring-0">
                  <SelectValue>
                    {topicFilter === 'all' ? t.retrieval.allTopics : topicFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  align="start"
                  sideOffset={4}
                  alignItemWithTrigger={false}
                  className="surface-panel rounded-lg p-1 text-zinc-200 ring-0"
                >
                  <SelectItem
                    value="all"
                    className="rounded-md text-xs text-zinc-300 hover:bg-[#16161a] hover:text-zinc-100 focus:bg-[#16161a] focus:text-zinc-100 cursor-pointer"
                  >
                    {t.retrieval.allTopics} ({cards.length})
                  </SelectItem>
                  {availableTopics.map((top) => (
                    <SelectItem
                      key={top}
                      value={top}
                      className="rounded-md text-xs text-zinc-300 hover:bg-[#16161a] hover:text-zinc-100 focus:bg-[#16161a] focus:text-zinc-100 cursor-pointer"
                    >
                      {top} ({cards.filter((c) => c.topic === top).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="divide-y divide-white/[0.05] -mx-6 border-t border-white/[0.05] max-h-[360px] overflow-y-auto">
            {displayCards.map((c, idx) => {
              const isSelected = safeIndex === idx;
              return (
                <div
                  key={c.id}
                  className={`w-full px-6 py-2.5 text-[13px] transition-colors flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-[#16161a] text-zinc-100 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#16161a]/60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                    }}
                    className="flex-1 text-left truncate min-w-0 py-0.5 cursor-pointer flex items-center gap-2"
                  >
                    {c.rating === 'correct' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300 shrink-0 stroke-[2]" />
                    )}
                    {c.rating === 'partial' && (
                      <CircleMinus className="w-3.5 h-3.5 text-zinc-400 shrink-0 stroke-[2]" />
                    )}
                    {c.rating === 'incorrect' && (
                      <XCircle className="w-3.5 h-3.5 text-zinc-500 shrink-0 stroke-[1.75]" />
                    )}
                    <span className="truncate">{c.question}</span>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDeleteCard(c.id)}
                      title={t.retrieval.deleteCard}
                      aria-label={t.retrieval.deleteCard}
                      className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[1.75]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
