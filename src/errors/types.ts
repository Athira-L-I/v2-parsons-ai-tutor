/**
 * Comprehensive error type system
 * Provides consistent error classification and handling
 */

export enum ErrorSeverity {
  LOW = 'low',           // Minor issues, app continues normally
  MEDIUM = 'medium',     // Some functionality affected
  HIGH = 'high',         // Major functionality affected
  CRITICAL = 'critical', // App may be unusable
}

export enum ErrorCategory {
  NETWORK = 'network',           // Connection, timeout, server issues
  VALIDATION = 'validation',     // Input validation, form errors
  AUTHENTICATION = 'authentication', // Auth/permission issues
  DEPENDENCY = 'dependency',     // External service failures
  APPLICATION = 'application',   // Logic errors, bugs
  SYSTEM = 'system',            // Browser, device issues
  USER = 'user',                // User action errors
}

export enum ErrorRecoveryStrategy {
  RETRY = 'retry',               // Automatic retry
  MANUAL_RETRY = 'manual_retry', // User-triggered retry
  FALLBACK = 'fallback',         // Use alternative approach
  REDIRECT = 'redirect',         // Redirect to different page
  RELOAD = 'reload',             // Page/app reload required
  CONTACT_SUPPORT = 'contact_support', // User needs help
  IGNORE = 'ignore',             // Safe to ignore
}

export interface AppError {
  id: string;
  code: string;
  message: string;
  userMessage: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoveryStrategy: ErrorRecoveryStrategy;
  context: ErrorContext;
  originalError?: Error;
  timestamp: string;
  retryCount?: number;
  maxRetries?: number;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorRecoveryAction {
  type: 'retry' | 'fallback' | 'redirect' | 'reload' | 'dismiss';
  label: string;
  action: () => Promise<void> | void;
  primary?: boolean;
  destructive?: boolean;
}

export interface ErrorDisplayInfo {
  title: string;
  description: string;
  actions: ErrorRecoveryAction[];
  showTechnicalDetails?: boolean;
  icon?: 'warning' | 'error' | 'info' | 'network';
}

// Specific error types
export interface NetworkError extends AppError {
  category: ErrorCategory.NETWORK;
  networkType: 'offline' | 'timeout' | 'server_error' | 'rate_limit';
  endpoint?: string;
  httpStatus?: number;
}

export interface ValidationError extends AppError {
  category: ErrorCategory.VALIDATION;
  field?: string;
  validationRule?: string;
  value?: any;
}

export interface DependencyError extends AppError {
  category: ErrorCategory.DEPENDENCY;
  dependency: string;
  version?: string;
  loadTime?: number;
}

export interface ApplicationError extends AppError {
  category: ErrorCategory.APPLICATION;
  stackTrace?: string;
  componentStack?: string;
  props?: Record<string, any>;
}
