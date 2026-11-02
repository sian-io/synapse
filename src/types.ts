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
}

export interface FeynmanEvaluation {
  topic?: string;
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

export type RetrievalRating = 'correct' | 'partial' | 'incorrect';

export interface RetrievalEvaluation {
  rating: RetrievalRating;
  feedback: string;
}

export interface Flashcard {
  id: string;
  topic: string;
  question: string;
  answer: string;
  userAnswer?: string;
  rating?: RetrievalRating;
  feedback?: string;
  reviewedAt?: number;
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
}

export type APIStandard = 'openai' | 'anthropic' | 'google';
export type OpenAIApiType = 'completions' | 'responses';
export type ReasoningEffort = 'low' | 'medium' | 'high';

export interface AIProviderConfig {
  apiStandard: APIStandard;
  openaiApiType?: OpenAIApiType;
  apiKey?: string;
  baseUrl: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  reasoningEffort?: ReasoningEffort;
  thinkingBudget?: number;


  manualEditEnabled?: boolean;
  customUrlOverride?: string;
  customHeadersOverride?: Record<string, string>;
  customBodyOverride?: Record<string, unknown>;
}
