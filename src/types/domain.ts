/**
 * Core domain models shared between frontend and backend
 * These represent the business entities in their normalized form
 */

// Base entities
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  email?: string;
  name?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  adaptiveFeaturesEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

// Problem domain
export interface Problem extends BaseEntity {
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  tags: string[];
  metadata: ProblemMetadata;
  codeStructure: CodeStructure;
  educationalObjectives: string[];
  estimatedTimeMinutes: number;
}

export interface ProblemMetadata {
  language: ProgrammingLanguage;
  concepts: ProgrammingConcept[];
  prerequisites: string[];
  authorId?: string;
  isPublic: boolean;
  version: number;
}

export interface CodeStructure {
  correctSolution: CodeBlock[];
  distractors: CodeBlock[];
  combinedBlocks: CombinedBlock[];
  options: ProblemOptions;
}

export interface CodeBlock {
  id: string;
  content: string;
  indentationLevel: number;
  position: number;
  groupId?: string;
  metadata: BlockMetadata;
}

export interface CombinedBlock {
  id: string;
  subBlocks: CodeBlock[];
  displayAs: 'single' | 'grouped';
  groupColor?: string;
}

export interface BlockMetadata {
  isDistractor: boolean;
  difficulty: number;
  concepts: ProgrammingConcept[];
  hints: string[];
  correctPosition?: number;
}

export interface ProblemOptions {
  canIndent: boolean;
  maxWrongLines: number;
  showFeedback: boolean;
  executionLimit: number;
  gradingMethod: GradingMethod;
  adaptiveFeatures: AdaptiveOptions;
}

export interface AdaptiveOptions {
  enabled: boolean;
  triggerThresholds: {
    incorrectAttempts: number;
    timeSpentMinutes: number;
    helpRequests: number;
  };
  availableHelp: AdaptiveHelpType[];
}

// Solution domain
export interface Solution extends BaseEntity {
  problemId: string;
  userId?: string;
  arrangement: BlockArrangement;
  validation: ValidationResult;
  metadata: SolutionMetadata;
}

export interface BlockArrangement {
  blocks: ArrangedBlock[];
  timestamp: number;
  attemptNumber: number;
}

export interface ArrangedBlock {
  blockId: string;
  position: number;
  indentationLevel: number;
  isInSolution: boolean;
}

export interface ValidationResult {
  isCorrect: boolean;
  score: number;
  errors: ValidationError[];
  feedback: FeedbackData;
  completionTime: number;
}

export interface ValidationError {
  type: ErrorType;
  blockId?: string;
  expectedPosition?: number;
  actualPosition?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface FeedbackData {
  type: FeedbackType;
  content: string;
  isPersonalized: boolean;
  generatedAt: string;
  source: 'ai' | 'template' | 'instructor';
}

export interface SolutionMetadata {
  timeSpent: number;
  hintsUsed: string[];
  adaptiveHelpsApplied: AdaptiveHelpType[];
  deviceInfo: DeviceInfo;
  sessionId: string;
}

// Progress tracking domain
export interface Progress extends BaseEntity {
  userId?: string;
  problemId: string;
  attempts: Attempt[];
  currentState: ProgressState;
  analytics: ProgressAnalytics;
}

export interface Attempt {
  id: string;
  startTime: string;
  endTime?: string;
  solution: BlockArrangement;
  validation: ValidationResult;
  adaptiveState: AdaptiveState;
}

export interface ProgressState {
  isCompleted: boolean;
  bestScore: number;
  totalAttempts: number;
  totalTimeSpent: number;
  currentStreak: number;
  lastAttemptAt: string;
}

export interface ProgressAnalytics {
  averageAttemptTime: number;
  commonErrors: ErrorPattern[];
  learningVelocity: number;
  conceptMastery: ConceptMasteryMap;
}

export interface ErrorPattern {
  type: ErrorType;
  frequency: number;
  contexts: string[];
}

export interface ConceptMasteryMap {
  [concept: string]: {
    mastery: number; // 0-1
    confidence: number; // 0-1
    lastAssessed: string;
  };
}

// Adaptive learning domain
export interface AdaptiveState {
  attempts: number;
  incorrectAttempts: number;
  timeSpent: number;
  hintsUsed: string[];
  appliedHelps: AdaptiveHelp[];
  currentDifficulty: number;
  learningVelocity: number;
}

export interface AdaptiveHelp {
  type: AdaptiveHelpType;
  appliedAt: string;
  effectiveness?: number;
  userFeedback?: UserFeedback;
}

export interface UserFeedback {
  helpful: boolean;
  comment?: string;
  timestamp: string;
}

// Chat and feedback domain
export interface ChatMessage extends BaseEntity {
  type: MessageType;
  content: string;
  sender: MessageSender;
  metadata: MessageMetadata;
  parentMessageId?: string;
  reactions: MessageReaction[];
}

export interface MessageMetadata {
  isGenerated: boolean;
  generationModel?: string;
  context: MessageContext;
  processingTime?: number;
}

export interface MessageContext {
  problemId: string;
  currentSolution?: BlockArrangement;
  userState: {
    attempts: number;
    timeSpent: number;
    frustrationLevel: number;
  };
}

export interface MessageReaction {
  type: 'helpful' | 'not_helpful' | 'confusing' | 'clear';
  userId?: string;
  timestamp: string;
}

// Enums and constants
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ProgrammingLanguage = 'python' | 'javascript' | 'java' | 'cpp' | 'other';
export type ProgrammingConcept = 
  | 'variables' 
  | 'functions' 
  | 'loops' 
  | 'conditionals' 
  | 'arrays' 
  | 'objects' 
  | 'recursion' 
  | 'algorithms'
  | 'data_structures';

export type GradingMethod = 'line_based' | 'ast_based' | 'execution_based' | 'hybrid';
export type AdaptiveHelpType = 
  | 'combine_blocks' 
  | 'remove_distractors' 
  | 'provide_hints' 
  | 'show_structure' 
  | 'guided_tutorial';

export type ErrorType = 
  | 'wrong_order' 
  | 'wrong_indentation' 
  | 'missing_block' 
  | 'extra_block' 
  | 'logic_error';

export type FeedbackType = 'socratic' | 'direct' | 'hint' | 'encouragement' | 'correction';
export type MessageType = 'user' | 'system' | 'ai' | 'instructor' | 'typing';
export type MessageSender = 'user' | 'ai_tutor' | 'system' | 'instructor';

export interface DeviceInfo {
  type: 'desktop' | 'tablet' | 'mobile';
  browser: string;
  screenSize: string;
  inputMethod: 'mouse' | 'touch' | 'keyboard';
}
