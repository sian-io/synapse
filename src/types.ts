export type PedagogicalMode = 
  | 'socratic'          // Método Socrático & Interrogação Elaborativa
  | 'feynman'           // Técnica de Feynman (Explicar para Aprender)
  | 'active_retrieval'  // Prática de Recuperação & Desafio
  | 'concept_breakdown' // Decomposição & Carga Cognitiva
  | 'metacognition';    // Calibração Metacognitiva & Reflexão

export interface PedagogicalPillar {
  id: string;
  name: string;
  scientist: string;
  neuroBasis: string;
  practicalAction: string;
  iconName: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  pedagogicalMeta?: {
    mode?: PedagogicalMode;
    cognitivePhase?: string;
    metacognitivePrompt?: string;
    desirableDifficultyNote?: string;
    suggestedActions?: string[];
  };
}

export interface FeynmanEvaluation {
  score: number;
  clarityAssessment: string;
  jargonIdentified: string[];
  conceptualGaps: string[];
  strengths: string[];
  analogiesEvaluation: string;
  suggestedAnalogy: string;
  simplifiedAlternative: string;
  followUpQuestion: string;
}

export interface Flashcard {
  id: string;
  topic: string;
  question: string;
  answer: string;
  keyConcept: string;
  neuroTip: string;
  intervalDays: number;
  repetitions: number;
  easeFactor: number;
  lastReviewed?: number;
  nextReviewDate: number;
  masteryLevel: number; // 0: novo, até 5: memória consolidada
}

export interface ConceptBreakdown {
  topic: string;
  overview: string;
  prerequisites: string[];
  coreMechanism: string;
  commonMisconceptions: string[];
  elaborativeQuestions: string[];
  realWorldAnalogy: string;
  neuroscienceRationale: string;
  isPedagogicalFallback?: boolean;
}

export interface CognitiveStats {
  retrievalAttempts: number;
  feynmanExplanations: number;
  socraticQuestionsAnswered: number;
  retentionStreakDays: number;
  averageCalibration: number; // 0-100%
  totalActiveMinutes: number;
}
