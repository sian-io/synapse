export type PedagogicalMode = 
  | 'socratic'          // Socratic Method & Elaborative Interrogation
  | 'feynman'           // Feynman Technique (Explain to Learn)
  | 'active_retrieval'  // Retrieval Practice & Challenge
  | 'concept_breakdown' // Deconstruction & Cognitive Load
  | 'metacognition';    // Metacognitive Calibration & Reflection

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
  masteryLevel: number; // 0: new, up to 5: consolidated memory
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
