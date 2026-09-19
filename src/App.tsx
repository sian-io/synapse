import React, { useState, useEffect } from 'react';
import {
  Brain,
  MessageSquareText,
  Sparkles,
  Zap,
  Layers,
  BookOpen,
  Activity,
  Flame,
  Award,
  ChevronRight,
  HelpCircle,
  BarChart2
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
  const [activeTab, setActiveTab] = useState<ActiveTab>('socratic');
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
      badge: 'Andaimes & Diálogo',
    },
    {
      id: 'feynman' as ActiveTab,
      label: 'Estúdio Feynman',
      icon: Sparkles,
      badge: 'Desconstrução',
    },
    {
      id: 'retrieval' as ActiveTab,
      label: 'Recuperação Ativa',
      icon: Zap,
      badge: 'LTP & Espaçamento',
    },
    {
      id: 'cognitive_map' as ActiveTab,
      label: 'Carga Cognitiva',
      icon: Layers,
      badge: 'Sweller',
    },
    {
      id: 'neuroscience' as ActiveTab,
      label: 'Base Neurocientífica',
      icon: BookOpen,
      badge: 'Evidências',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-600/30 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-400">
                  <Brain className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                    SYNAPSE
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Active AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Agente Pedagógico Fundamentado em Neurociência
                </p>
              </div>
            </div>

            {/* Mobile streak indicator */}
            <div className="flex md:hidden items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span className="font-bold">{stats.retentionStreakDays}d</span>
            </div>
          </div>

          {/* Neuro Cognitive Stats Pills */}
          <div className="hidden sm:flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium"
              title="Dias consecutivos de prática de recuperação ativa"
            >
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{stats.retentionStreakDays} dias de estímulo</span>
            </div>

            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-medium"
              title="Total de recuperações ativas e diálogos socráticos"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>{stats.retrievalAttempts + stats.socraticQuestionsAnswered} evocações LTP</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md hidden lg:inline ${
                    isActive ? 'bg-indigo-800/60 text-indigo-100' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
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

      {/* Bottom Cognitive Science Tip Banner */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-3 px-4 text-center text-xs text-slate-500">
        <p>
          🧠 Fundamentado em: <strong>Roediger & Karpicke (2006)</strong> (Recuperação Ativa),{' '}
          <strong>Richard Feynman</strong> (Compreensão sem Jargão), <strong>John Sweller</strong> (Carga Cognitiva) e{' '}
          <strong>Robert Bjork</strong> (Dificuldades Desejáveis).
        </p>
      </footer>
    </div>
  );
}
