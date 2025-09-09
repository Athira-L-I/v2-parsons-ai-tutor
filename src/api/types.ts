/**
 * Standard API types and contracts
 * All API communication must follow these patterns
 */
import { ParsonsSettings, ChatMessage } from '@/@types/types';

// Base API Response envelope
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
  field?: string; // For validation errors
  timestamp: string;
  requestId: string;
}

export interface ResponseMetadata {
  timestamp: string;
  requestId: string;
  processingTime: number;
  version: string;
  rateLimit?: RateLimitInfo;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: string;
}

// Pagination envelope
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMetadata;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Standard request options
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  abortSignal?: AbortSignal;
  cache?: boolean;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
}

// Standard error codes
export enum ApiErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',

  // Custom business errors
  PROBLEM_NOT_FOUND = 'PROBLEM_NOT_FOUND',
  INVALID_SOLUTION = 'INVALID_SOLUTION',
  DEPENDENCY_ERROR = 'DEPENDENCY_ERROR',
}

// Specific API types
export interface ProblemResponse {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  parsonsSettings: ParsonsSettings;
  metadata: ProblemMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemMetadata {
  language: string;
  sourceCodeLength: number;
  generatedAt: string;
  [key: string]: string | number | boolean | null; // Allow for extensibility with primitive types
}

export interface ValidationResponse {
  isCorrect: boolean;
  score: number;
  errors: ValidationError[];
  feedback: FeedbackData;
  metadata: ValidationMetadata;
}

export interface ValidationError {
  type: string;
  message: string;
  line?: number;
  blockId?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface FeedbackData {
  message: string;
  suggestions?: string[];
  hints?: string[];
}

export interface ValidationMetadata {
  processingTime: number;
  validationEngine: string;
  version: string;
}

export interface FeedbackResponse {
  feedback: ChatMessage;
  suggestions: string[];
  nextSteps: string[];
  confidence: number;
}

// Request types
export interface CreateProblemRequest {
  title: string;
  description: string;
  sourceCode: string;
  language?: string;
  difficulty?: string;
  tags?: string[];
}

export interface ValidateSolutionRequest {
  problemId: string;
  solution: string[];
  context?: {
    attemptNumber: number;
    timeSpent: number;
    sessionId?: string;
  };
}

export interface GenerateFeedbackRequest {
  problemId: string;
  currentSolution: string[];
  validationResult?: ValidationResponse;
  chatHistory?: ChatMessage[];
  context?: {
    attempts: number;
    timeSpent: number;
    userId?: string;
  };
}
