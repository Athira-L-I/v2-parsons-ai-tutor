/**
 * API contract types for frontend-backend communication
 * These define the exact structure of API requests and responses
 */

import {
  Problem,
  Solution,
  Progress,
  ChatMessage,
  ValidationResult,
  AdaptiveState,
  BlockArrangement,
  ProblemOptions,
  AdaptiveHelp
} from './domain';

// Base API types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ResponseMetadata {
  timestamp: string;
  requestId: string;
  processingTime: number;
  version: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Problem API types
export interface CreateProblemRequest {
  title: string;
  description: string;
  sourceCode: string;
  language: string;
  difficulty?: string;
  tags?: string[];
  options?: Partial<ProblemOptions>;
}

export interface CreateProblemResponse extends ApiResponse<Problem> {}

export interface GetProblemResponse extends ApiResponse<Problem> {}

export interface UpdateProblemRequest extends Partial<CreateProblemRequest> {
  id: string;
}

export interface UpdateProblemResponse extends ApiResponse<Problem> {}

export interface ListProblemsRequest extends PaginationParams {
  difficulty?: string;
  language?: string;
  tags?: string[];
  userId?: string;
}

export interface ListProblemsResponse extends ApiResponse<PaginatedResponse<Problem>> {}

// Solution API types
export interface SubmitSolutionRequest {
  problemId: string;
  arrangement: BlockArrangement;
  sessionId?: string;
}

export interface SubmitSolutionResponse extends ApiResponse<{
  solution: Solution;
  validation: ValidationResult;
  nextSteps?: string[];
}> {}

export interface ValidateSolutionRequest {
  problemId: string;
  arrangement: BlockArrangement;
  context?: {
    attemptNumber: number;
    timeSpent: number;
    previousErrors: string[];
  };
}

export interface ValidateSolutionResponse extends ApiResponse<ValidationResult> {}

// Feedback API types
export interface GenerateFeedbackRequest {
  problemId: string;
  currentSolution: BlockArrangement;
  validationResult: ValidationResult;
  chatHistory?: ChatMessage[];
  userContext: {
    attempts: number;
    timeSpent: number;
    adaptiveState: AdaptiveState;
  };
}

export interface GenerateFeedbackResponse extends ApiResponse<{
  feedback: ChatMessage;
  suggestions?: string[];
  nextActions?: string[];
}> {}

// Progress API types
export interface GetProgressRequest {
  userId?: string;
  problemId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface GetProgressResponse extends ApiResponse<Progress[]> {}

export interface UpdateProgressRequest {
  progressId: string;
  updates: Partial<Progress>;
}

export interface UpdateProgressResponse extends ApiResponse<Progress> {}

// Adaptive learning API types
export interface GetAdaptiveRecommendationsRequest {
  problemId: string;
  currentState: AdaptiveState;
  userProfile?: {
    learningStyle: string;
    experience: string;
    goals: string[];
  };
}

export interface GetAdaptiveRecommendationsResponse extends ApiResponse<{
  recommendations: AdaptiveHelp[];
  reasoning: string[];
  confidence: number;
}> {}

export interface ApplyAdaptiveHelpRequest {
  problemId: string;
  helpType: string;
  currentState: AdaptiveState;
}

export interface ApplyAdaptiveHelpResponse extends ApiResponse<{
  modifiedProblem: Problem;
  newState: AdaptiveState;
  explanation: string;
}> {}

// Analytics API types
export interface GetAnalyticsRequest {
  userId?: string;
  problemId?: string;
  timeframe: 'day' | 'week' | 'month' | 'year';
  metrics: string[];
}

export interface GetAnalyticsResponse extends ApiResponse<{
  metrics: Record<string, unknown>;
  insights: string[];
  trends: TrendData[];
}> {}

export interface TrendData {
  metric: string;
  values: Array<{
    timestamp: string;
    value: number;
  }>;
  direction: 'up' | 'down' | 'stable';
}

// Utility types for API
export type ApiEndpoint = 
  | 'GET /api/problems'
  | 'GET /api/problems/:id'
  | 'POST /api/problems'
  | 'PUT /api/problems/:id'
  | 'DELETE /api/problems/:id'
  | 'POST /api/solutions/validate'
  | 'POST /api/solutions/submit'
  | 'POST /api/feedback/generate'
  | 'GET /api/progress'
  | 'PUT /api/progress/:id'
  | 'GET /api/adaptive/recommendations'
  | 'POST /api/adaptive/apply'
  | 'GET /api/analytics';

export interface ApiClient {
  get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>>;
  post<T>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>>;
  put<T>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>>;
  delete<T>(endpoint: string): Promise<ApiResponse<T>>;
}
