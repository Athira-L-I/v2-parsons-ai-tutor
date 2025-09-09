/**
 * Factory for creating consistent errors across the application
 */

import { 
  AppError, 
  ErrorCategory, 
  ErrorSeverity, 
  ErrorRecoveryStrategy,
  ErrorContext,
  NetworkError,
  ValidationError,
  DependencyError,
  ApplicationError
} from './types';

export class ErrorFactory {
  private static generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static getBaseContext(): ErrorContext {
    return {
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
    };
  }

  /**
   * Create a network error
   */
  static createNetworkError(
    networkType: NetworkError['networkType'],
    originalError?: Error,
    context?: Partial<ErrorContext>
  ): NetworkError {
    const messageMap = {
      offline: 'You appear to be offline. Please check your internet connection.',
      timeout: 'The request timed out. Please try again.',
      server_error: 'The server encountered an error. Please try again later.',
      rate_limit: 'Too many requests. Please wait a moment before trying again.',
    };

    const userMessageMap = {
      offline: 'No internet connection. Please check your connection and try again.',
      timeout: 'Request took too long. Please try again.',
      server_error: 'Server is temporarily unavailable. Please try again in a few minutes.',
      rate_limit: 'Please wait a moment before making another request.',
    };

    return {
      id: this.generateId(),
      code: `NETWORK_${networkType.toUpperCase()}`,
      message: messageMap[networkType],
      userMessage: userMessageMap[networkType],
      category: ErrorCategory.NETWORK,
      severity: networkType === 'offline' ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      recoveryStrategy: networkType === 'offline' ? ErrorRecoveryStrategy.MANUAL_RETRY : ErrorRecoveryStrategy.RETRY,
      context: { ...this.getBaseContext(), ...context },
      originalError,
      timestamp: new Date().toISOString(),
      networkType,
      maxRetries: networkType === 'rate_limit' ? 1 : 3,
    };
  }

  /**
   * Create a validation error
   */
  static createValidationError(
    field: string,
    rule: string,
    value?: unknown,
    customMessage?: string,
    context?: Partial<ErrorContext>
  ): ValidationError {
    const defaultMessage = `${field} is invalid: ${rule}`;
    const userMessage = customMessage || `Please check the ${field} field and try again.`;

    return {
      id: this.generateId(),
      code: `VALIDATION_${rule.toUpperCase()}`,
      message: defaultMessage,
      userMessage,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      recoveryStrategy: ErrorRecoveryStrategy.IGNORE,
      context: { ...this.getBaseContext(), ...context },
      timestamp: new Date().toISOString(),
      field,
      validationRule: rule,
      value,
    };
  }

  /**
   * Create a dependency error
   */
  static createDependencyError(
    dependency: string,
    originalError?: Error,
    context?: Partial<ErrorContext>
  ): DependencyError {
    return {
      id: this.generateId(),
      code: `DEPENDENCY_${dependency.toUpperCase()}_FAILED`,
      message: `Failed to load dependency: ${dependency}`,
      userMessage: 'Some components failed to load. Please refresh the page.',
      category: ErrorCategory.DEPENDENCY,
      severity: ErrorSeverity.HIGH,
      recoveryStrategy: ErrorRecoveryStrategy.RELOAD,
      context: { ...this.getBaseContext(), ...context },
      originalError,
      timestamp: new Date().toISOString(),
      dependency,
      maxRetries: 2,
    };
  }

  /**
   * Create an application error (React errors, logic errors)
   */
  static createApplicationError(
    message: string,
    originalError?: Error,
    context?: Partial<ErrorContext>
  ): ApplicationError {
    return {
      id: this.generateId(),
      code: 'APPLICATION_ERROR',
      message,
      userMessage: 'Something unexpected happened. Please try refreshing the page.',
      category: ErrorCategory.APPLICATION,
      severity: ErrorSeverity.HIGH,
      recoveryStrategy: ErrorRecoveryStrategy.RELOAD,
      context: { ...this.getBaseContext(), ...context },
      originalError,
      timestamp: new Date().toISOString(),
      stackTrace: originalError?.stack,
    };
  }

  /**
   * Create an API error from response
   */
  static createApiError(
    apiError: unknown,
    endpoint?: string,
    context?: Partial<ErrorContext>
  ): AppError {
    const typedError = apiError as { code?: string; message?: string; requestId?: string; timestamp?: string; details?: unknown };
    
    // Handle standardized API errors
    if (typedError?.code && typedError?.message) {
      const category = this.mapApiErrorToCategory(typedError.code);
      const severity = this.mapApiErrorToSeverity(typedError.code);
      const recoveryStrategy = this.mapApiErrorToRecoveryStrategy(typedError.code);

      return {
        id: typedError.requestId || this.generateId(),
        code: typedError.code,
        message: typedError.message,
        userMessage: this.getApiErrorUserMessage(typedError.code),
        category,
        severity,
        recoveryStrategy,
        context: {
          ...this.getBaseContext(),
          ...(context || {}),
          additionalData: {
            ...(context?.additionalData || {}),
            endpoint,
            apiErrorDetails: typedError.details,
          }
        },
        timestamp: typedError.timestamp || new Date().toISOString(),
      };
    }

    // Fallback for non-standard errors
    const networkError = this.createNetworkError('server_error', apiError instanceof Error ? apiError : new Error(String(apiError)));
    
    // Add endpoint to additionalData
    if (endpoint) {
      networkError.context.additionalData = {
        ...(networkError.context.additionalData || {}),
        endpoint
      };
    }
    
    return networkError;
  }

  /**
   * Convert any error to AppError
   */
  static fromError(
    error: Error | unknown,
    category: ErrorCategory = ErrorCategory.APPLICATION,
    context?: Partial<ErrorContext>
  ): AppError {
    const actualError = error instanceof Error ? error : new Error(String(error));
    
    return {
      id: this.generateId(),
      code: actualError.name || 'UNKNOWN_ERROR',
      message: actualError.message,
      userMessage: 'An unexpected error occurred. Please try again.',
      category,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: ErrorRecoveryStrategy.RETRY,
      context: { ...this.getBaseContext(), ...context },
      originalError: actualError,
      timestamp: new Date().toISOString(),
    };
  }

  private static mapApiErrorToCategory(code: string): ErrorCategory {
    if (code.includes('NETWORK') || code.includes('TIMEOUT') || code.includes('UNAVAILABLE')) {
      return ErrorCategory.NETWORK;
    }
    if (code.includes('VALIDATION') || code.includes('BAD_REQUEST')) {
      return ErrorCategory.VALIDATION;
    }
    if (code.includes('UNAUTHORIZED') || code.includes('FORBIDDEN')) {
      return ErrorCategory.AUTHENTICATION;
    }
    return ErrorCategory.APPLICATION;
  }

  private static mapApiErrorToSeverity(code: string): ErrorSeverity {
    if (code.includes('CRITICAL') || code.includes('UNAUTHORIZED')) {
      return ErrorSeverity.CRITICAL;
    }
    if (code.includes('NOT_FOUND') || code.includes('SERVER_ERROR')) {
      return ErrorSeverity.HIGH;
    }
    if (code.includes('VALIDATION') || code.includes('BAD_REQUEST')) {
      return ErrorSeverity.LOW;
    }
    return ErrorSeverity.MEDIUM;
  }

  private static mapApiErrorToRecoveryStrategy(code: string): ErrorRecoveryStrategy {
    if (code.includes('VALIDATION') || code.includes('BAD_REQUEST')) {
      return ErrorRecoveryStrategy.IGNORE;
    }
    if (code.includes('RATE_LIMITED')) {
      return ErrorRecoveryStrategy.MANUAL_RETRY;
    }
    if (code.includes('UNAUTHORIZED')) {
      return ErrorRecoveryStrategy.REDIRECT;
    }
    if (code.includes('SERVER_ERROR') || code.includes('TIMEOUT')) {
      return ErrorRecoveryStrategy.RETRY;
    }
    return ErrorRecoveryStrategy.MANUAL_RETRY;
  }

  private static getApiErrorUserMessage(code: string): string {
    const userMessageMap: Record<string, string> = {
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'NOT_FOUND': 'The requested item could not be found.',
      'UNAUTHORIZED': 'You need to log in to access this feature.',
      'FORBIDDEN': 'You don\'t have permission to perform this action.',
      'RATE_LIMITED': 'Please wait a moment before trying again.',
      'SERVER_ERROR': 'Server is temporarily unavailable. Please try again later.',
      'SERVICE_UNAVAILABLE': 'Service is temporarily down. Please try again later.',
      'TIMEOUT': 'Request timed out. Please try again.',
    };

    return userMessageMap[code] || 'Something went wrong. Please try again.';
  }
}
