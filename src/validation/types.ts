/**
 * Core validation types used across the entire validation system
 */

export interface ValidationContext {
  problemId: string;
  userId?: string;
  sessionId?: string;
  attemptNumber: number;
  timeSpent: number;
  previousAttempts: ValidationResult[];
}

export interface ValidationInput {
  problem: NormalizedProblem;
  solution: SolutionArrangement;
  context: ValidationContext;
}

export interface ValidationResult {
  isCorrect: boolean;
  score: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  feedback: ValidationFeedback;
  metadata: ValidationMetadata;
}

export interface ValidationError {
  type: ValidationErrorType;
  severity: 'critical' | 'major' | 'minor';
  blockId?: string;
  expectedValue: unknown;
  actualValue: unknown;
  position?: number;
  message: string;
  suggestion?: string;
}

export interface ValidationWarning {
  type: 'style' | 'performance' | 'best_practice';
  message: string;
  blockId?: string;
  suggestion?: string;
}

export interface ValidationFeedback {
  type: 'success' | 'partial' | 'incorrect';
  summary: string;
  details: FeedbackDetail[];
  nextSteps: string[];
  encouragement?: string;
}

export interface FeedbackDetail {
  category: 'order' | 'indentation' | 'logic' | 'syntax';
  message: string;
  helpLevel: 'hint' | 'explanation' | 'direct';
}

export interface ValidationMetadata {
  validatedAt: string;
  validationDuration: number;
  rulesApplied: string[];
  confidence: number;
  version: string;
}

export interface SolutionArrangement {
  blocks: ArrangedBlock[];
  timestamp: number;
}

export interface ArrangedBlock {
  id: string;
  content: string;
  position: number;
  indentationLevel: number;
  isInSolution: boolean;
}

export interface NormalizedProblem {
  id: string;
  correctSolution: SolutionBlock[];
  distractors: SolutionBlock[];
  options: ValidationOptions;
  metadata: ProblemValidationMetadata;
}

export interface SolutionBlock {
  id: string;
  content: string;
  correctPosition: number;
  correctIndentation: number;
  groupId?: string;
  dependencies: string[];
  metadata: BlockValidationMetadata;
}

export interface BlockValidationMetadata {
  isOptional: boolean;
  alternatives: string[];
  strictOrder: boolean;
  validIndentations: number[];
  concepts: string[];
}

export interface ValidationOptions {
  strictOrder: boolean;
  allowIndentationErrors: boolean;
  allowExtraSpaces: boolean;
  caseSensitive: boolean;
  validateSyntax: boolean;
  maxScore: number;
  partialCredit: boolean;
}

export interface ProblemValidationMetadata {
  language: string;
  difficulty: number;
  estimatedTime: number;
  concepts: string[];
}

export type ValidationErrorType =
  | 'wrong_order'
  | 'wrong_indentation'
  | 'missing_block'
  | 'extra_block'
  | 'syntax_error'
  | 'logic_error'
  | 'incomplete_solution';

export interface ValidationRule {
  name: string;
  priority: number;
  category: 'order' | 'indentation' | 'completeness' | 'syntax' | 'logic';
  validate: (input: ValidationInput) => Promise<ValidationRuleResult>;
}

export interface ValidationRuleResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number;
  confidence: number;
}
