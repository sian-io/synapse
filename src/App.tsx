import React, { useState, useEffect } from 'react';
import {
  Brain,
  MessageSquareText,
  Sparkles,
  Zap,
  Layers,
  BookOpen,
  Flame,
} from 'lucide-react';
import { SocraticTutor } from './components/SocraticTutor';
import { FeynmanStudio } from './components/FeynmanStudio';
import { ActiveRetrievalLab } from './components/ActiveRetrievalLab';
import { CognitiveMap } from './components/CognitiveMap';
import { NeuroscienceGuide } from './components/NeuroscienceGuide';
import { UnifiedConceptBar } from './components/UnifiedConceptBar';
import { CognitiveStats } from './types';

type ActiveTab = 'socratic' | 'feynman' | 'retrieval' | 'cognitive_map' | 'neuroscience';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('neuroscience');
  const [currentTopic, setCurrentTopic] = useState<string>(() => {
    return localStorage.getItem('synapse_current_topic') || 'Mecanismos de Memória e Neuroplasticidade';
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
      label: 'Tutor Socrático',
      icon: MessageSquareText,
    },
    {
      id: 'feynman' as ActiveTab,
      label: 'Estúdio Feynman',
      icon: Sparkles,
    },
    {
      id: 'retrieval' as ActiveTab,
      label: 'Recuperação Ativa',
      icon: Zap,
    },
    {
      id: 'cognitive_map' as ActiveTab,
      label: 'Carga Cognitiva',
      icon: Layers,
    },
    {
      id: 'neuroscience' as ActiveTab,
      label: 'Base Neurocientífica',
      icon: BookOpen,
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-zinc-100">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/70 bg-[#09090b]/90 backdrop-blur-xl px-4 sm:px-8 xl:px-12 py-3.5">
        <div className="max-w-[1600px] w-full mx-auto flex items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-100 shadow-md shadow-zinc-950/40">
              <Brain className="w-6 h-6 text-zinc-100 stroke-[2]" />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-wider text-zinc-100">
              SYNAPSE
            </span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 flex-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 stroke-[1.75] ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Neuro Cognitive Stats Pills */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div
              className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 font-medium transition-colors hover:border-zinc-700"
              title="Dias consecutivos de prática de recuperação ativa"
            >
              <Flame className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
              <span className="hidden sm:inline"><strong className="text-zinc-100 font-semibold">{stats.retentionStreakDays}</strong> dias de estímulo</span>
              <span className="sm:hidden"><strong className="text-zinc-100 font-semibold">{stats.retentionStreakDays}</strong>d</span>
            </div>

            <div
              className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 font-medium transition-colors hover:border-zinc-700"
              title="Total de recuperações ativas e diálogos socráticos"
            >
              <Zap className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
              <span className="hidden sm:inline"><strong className="text-zinc-100 font-semibold">{stats.retrievalAttempts + stats.socraticQuestionsAnswered}</strong> evocações LTP</span>
              <span className="sm:hidden"><strong className="text-zinc-100 font-semibold">{stats.retrievalAttempts + stats.socraticQuestionsAnswered}</strong> LTP</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-8 xl:px-12 py-6 space-y-6">
        {/* Unified Concept Definition Bar - Persistent Across All Pages */}
        <UnifiedConceptBar
          currentTopic={currentTopic}
          onTopicChange={setCurrentTopic}
          activeTabLabel={navItems.find((n) => n.id === activeTab)?.label || ''}
        />

        {activeTab === 'socratic' && (
          <SocraticTutor
            currentTopic={currentTopic}
            onTopicChange={setCurrentTopic}
            onIncrementStats={handleIncrementStats}
            initialPrompt={socraticPromptOverride}
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
            onTopicChange={setCurrentTopic}
            onIncrementStats={handleIncrementStats}
          />
        )}

        {activeTab === 'cognitive_map' && (
          <CognitiveMap
            currentTopic={currentTopic}
            onTopicChange={setCurrentTopic}
            onOpenSocraticWithPrompt={handleOpenSocraticWithPrompt}
          />
        )}

        {activeTab === 'neuroscience' && (
          <NeuroscienceGuide onSelectAction={(tab) => setActiveTab(tab)} />
        )}
      </main>
    </div>
  );
}
