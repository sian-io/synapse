import { useState, useEffect } from 'react';
import {
  Brain,
  MessageSquareText,
  Sparkles,
  Zap,
  Layers,
  BookOpen,
  Flame,
  Globe,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { SocraticTutor } from './components/SocraticTutor';
import { FeynmanStudio } from './components/FeynmanStudio';
import { ActiveRetrievalLab } from './components/ActiveRetrievalLab';
import { CognitiveMap } from './components/CognitiveMap';
import { NeuroscienceGuide } from './components/NeuroscienceGuide';
import { UnifiedConceptBar } from './components/UnifiedConceptBar';
import { CognitiveStats } from './types';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { AIConfigProvider, useAIConfig } from './context/AIConfigContext';

type ActiveTab = 'socratic' | 'feynman' | 'retrieval' | 'cognitive_map' | 'neuroscience';

function AppContent() {
  const { t, language, setLanguage } = useLanguage();
  const { isConfigured, openModal } = useAIConfig();
  const isPt = language === 'pt';
  const [activeTab, setActiveTab] = useState<ActiveTab>('socratic');
  const [currentTopic, setCurrentTopic] = useState<string>(() => {
    return localStorage.getItem('synapse_current_topic') || t.conceptBar.defaultTopic;
  });
  const [socraticPromptOverride, setSocraticPromptOverride] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('synapse_current_topic', currentTopic);
  }, [currentTopic]);

  const [stats, setStats] = useState<CognitiveStats>(() => {
    const saved = localStorage.getItem('synapse_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      retrievalAttempts: 7,
      feynmanExplanations: 2,
      socraticQuestionsAnswered: 5,
      retentionStreakDays: 3,
      averageCalibration: 85,
      totalActiveMinutes: 38,
    };
  });

  useEffect(() => {
    localStorage.setItem('synapse_stats', JSON.stringify(stats));
  }, [stats]);

  const handleIncrementStats = (type: 'socratic' | 'retrieval' | 'feynman') => {
    setStats((prev) => ({
      ...prev,
      retrievalAttempts: type === 'retrieval' ? prev.retrievalAttempts + 1 : prev.retrievalAttempts,
      feynmanExplanations: type === 'feynman' ? prev.feynmanExplanations + 1 : prev.feynmanExplanations,
      socraticQuestionsAnswered: type === 'socratic' ? prev.socraticQuestionsAnswered + 1 : prev.socraticQuestionsAnswered,
      totalActiveMinutes: prev.totalActiveMinutes + 2,
    }));
  };

  const handleOpenSocraticWithPrompt = (prompt: string) => {
    setSocraticPromptOverride(prompt);
    setActiveTab('socratic');
  };

  const navItems = [
    {
      id: 'socratic' as ActiveTab,
      label: t.app.nav.socratic,
      icon: MessageSquareText,
    },
    {
      id: 'feynman' as ActiveTab,
      label: t.app.nav.feynman,
      icon: Sparkles,
    },
    {
      id: 'retrieval' as ActiveTab,
      label: t.app.nav.retrieval,
      icon: Zap,
    },
    {
      id: 'cognitive_map' as ActiveTab,
      label: t.app.nav.cognitive_map,
      icon: Layers,
    },
    {
      id: 'neuroscience' as ActiveTab,
      label: t.app.nav.neuroscience,
      icon: BookOpen,
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-zinc-100">
      {/* Top Header */}
      <header className="sticky top-0 z-40 min-h-14 lg:h-14 py-2 lg:py-0 border-b border-white/[0.07] bg-[#09090b]/90 backdrop-blur-md px-4 sm:px-6 xl:px-8 flex items-center">
        <div className="max-w-[1600px] w-full mx-auto flex flex-wrap lg:flex-nowrap items-center justify-between gap-y-2 gap-x-3">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded-md surface-panel flex items-center justify-center text-zinc-100">
                <Brain className="w-3.5 h-3.5 text-zinc-100 stroke-[1.75]" />
              </div>
              <span className="font-mono text-xs font-semibold tracking-[0.2em] text-zinc-100">
                SYNAPSE
              </span>
            </div>

            <div className="hidden lg:block h-4 w-px bg-white/[0.08] shrink-0" />
          </div>

          {/* Navigation Tabs - Minimalist Segmented Control */}
          <nav className="order-last lg:order-none w-full lg:w-auto lg:mr-auto flex items-center gap-0.5 p-0.5 rounded-lg surface-recessed overflow-x-auto no-scrollbar min-w-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-950 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#16161a]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 stroke-[1.75] ${isActive ? 'text-zinc-950' : 'text-zinc-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Metrics, Language Selector & AI Settings */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Neuro Cognitive Stats */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Retention Streak */}
              <div
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md surface-panel text-[11px] text-zinc-400 transition-colors hover:border-white/[0.14]"
                title={t.app.stats.retentionStreakTooltip}
              >
                <Flame className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />
                <span className="font-mono tabular-nums font-semibold text-zinc-100">
                  {stats.retentionStreakDays}
                </span>
                <span className="hidden md:inline text-zinc-500">{t.app.stats.retentionStreak}</span>
                <span className="md:hidden font-mono tabular-nums text-zinc-500">{t.app.stats.retentionStreakShort}</span>
              </div>

              {/* LTP Recalls */}
              <div
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md surface-panel text-[11px] text-zinc-400 transition-colors hover:border-white/[0.14]"
                title={t.app.stats.recallsLTPTooltip}
              >
                <Zap className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75]" />
                <span className="font-mono tabular-nums font-semibold text-zinc-100">
                  {stats.retrievalAttempts + stats.socraticQuestionsAnswered}
                </span>
                <span className="hidden md:inline text-zinc-500">{t.app.stats.recallsLTP}</span>
                <span className="md:hidden font-mono tabular-nums text-zinc-500">{t.app.stats.recallsLTPShort}</span>
              </div>
            </div>

            <div className="hidden sm:block h-4 w-px bg-white/[0.08] shrink-0" />

            {/* Language Switcher */}
            <div className="flex items-center rounded-md surface-recessed p-0.5 text-xs text-zinc-300 font-medium">
              <div className="hidden sm:flex items-center px-1.5 text-zinc-500">
                <Globe className="w-3 h-3 stroke-[1.75]" />
              </div>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono tabular-nums font-medium transition-colors cursor-pointer ${
                  language === 'en'
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('pt')}
                className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono tabular-nums font-medium transition-colors cursor-pointer ${
                  language === 'pt'
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Mudar para Português"
              >
                PT
              </button>
            </div>

            <div className="hidden sm:block h-4 w-px bg-white/[0.08] shrink-0" />

            {/* AI Settings Button */}
            <button
              type="button"
              onClick={openModal}
              className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                isConfigured
                  ? 'surface-panel text-zinc-400 hover:text-zinc-100 hover:border-white/[0.14] hover:bg-[#16161a]'
                  : 'bg-zinc-100 text-zinc-950 hover:bg-white'
              }`}
              title={isPt ? 'Configurações de IA' : 'AI Configuration'}
            >
              <Settings className="w-3.5 h-3.5 stroke-[1.75]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 xl:px-8 py-5 space-y-5">
        {!isConfigured && (
          <div className="px-3.5 py-2.5 rounded-lg surface-panel text-zinc-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>
                {isPt
                  ? 'Configure sua API de inferência para habilitar o Tutor Socrático, Feynman, Flashcards e Mapa Cognitivo.'
                  : 'Configure your Inference API to enable Socratic Tutor, Feynman Studio, Flashcards, and Cognitive Map.'}
              </span>
            </div>
            <button
              type="button"
              onClick={openModal}
              className="px-3 py-1 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs transition-colors shrink-0 cursor-pointer"
            >
              {isPt ? 'Configurar API' : 'Configure API'}
            </button>
          </div>
        )}

        {/* Unified Concept Definition Bar - Persistent Across All Pages */}
        <UnifiedConceptBar
          currentTopic={currentTopic}
          onTopicChange={setCurrentTopic}
        />

        {activeTab === 'socratic' && (
          <SocraticTutor
            currentTopic={currentTopic}
            onIncrementStats={handleIncrementStats}
            initialPrompt={socraticPromptOverride}
            onClearInitialPrompt={() => setSocraticPromptOverride(null)}
          />
        )}

        {activeTab === 'feynman' && (
          <FeynmanStudio
            currentTopic={currentTopic}
            onTopicChange={setCurrentTopic}
            onIncrementStats={handleIncrementStats}
            onOpenSocraticWithPrompt={handleOpenSocraticWithPrompt}
          />
        )}

        {activeTab === 'retrieval' && (
          <ActiveRetrievalLab
            currentTopic={currentTopic}
            onIncrementStats={handleIncrementStats}
          />
        )}

        {activeTab === 'cognitive_map' && (
          <CognitiveMap
            currentTopic={currentTopic}
            onOpenSocraticWithPrompt={handleOpenSocraticWithPrompt}
          />
        )}

        {activeTab === 'neuroscience' && <NeuroscienceGuide />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AIConfigProvider>
        <AppContent />
      </AIConfigProvider>
    </LanguageProvider>
  );
}

