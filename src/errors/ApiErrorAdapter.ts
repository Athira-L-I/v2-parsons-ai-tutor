/**
 * ApiError adapter
 * Converts ApiErrors to AppErrors and vice versa for integration
 */

import { ApiError, ApiErrorCode } from '../api/types';
import { AppError, ErrorCategory, ErrorSeverity, ErrorRecoveryStrategy } from './types';
// Import only the types we need

export class ApiErrorAdapter {
  /**
   * Convert API error to application error
   */
  static toAppError(apiError: ApiError, endpoint?: string): AppError {
    // Map API error codes to error categories
    const category = this.mapApiErrorCodeToCategory(apiError.code as ApiErrorCode);
    const severity = this.mapApiErrorCodeToSeverity(apiError.code as ApiErrorCode);
    const recoveryStrategy = this.mapApiErrorCodeToRecoveryStrategy(apiError.code as ApiErrorCode);
    
    // Create context with API specific data
    const context = {
      additionalData: {
        endpoint,
        requestId: apiError.requestId,
        details: apiError.details,
        field: apiError.field
      }
    };
    
    return {
      id: `api_${apiError.requestId || Date.now().toString()}`,
      code: apiError.code,
      message: apiError.message,
      userMessage: this.getUserMessageForApiError(apiError.code as ApiErrorCode),
      category,
      severity,
      recoveryStrategy,
      context,
      timestamp: apiError.timestamp || new Date().toISOString(),
    };
  }
  
  /**
   * Map API error code to error category
   */
  private static mapApiErrorCodeToCategory(code: ApiErrorCode): ErrorCategory {
    const categoryMap: Record<ApiErrorCode, ErrorCategory> = {
      [ApiErrorCode.BAD_REQUEST]: ErrorCategory.VALIDATION,
      [ApiErrorCode.UNAUTHORIZED]: ErrorCategory.AUTHENTICATION,
      [ApiErrorCode.FORBIDDEN]: ErrorCategory.AUTHENTICATION,
      [ApiErrorCode.NOT_FOUND]: ErrorCategory.APPLICATION,
      [ApiErrorCode.VALIDATION_ERROR]: ErrorCategory.VALIDATION,
      [ApiErrorCode.RATE_LIMITED]: ErrorCategory.NETWORK,
      [ApiErrorCode.INTERNAL_ERROR]: ErrorCategory.APPLICATION,
      [ApiErrorCode.SERVICE_UNAVAILABLE]: ErrorCategory.NETWORK,
      [ApiErrorCode.TIMEOUT]: ErrorCategory.NETWORK,
      [ApiErrorCode.PROBLEM_NOT_FOUND]: ErrorCategory.APPLICATION,
      [ApiErrorCode.INVALID_SOLUTION]: ErrorCategory.VALIDATION,
      [ApiErrorCode.DEPENDENCY_ERROR]: ErrorCategory.DEPENDENCY
    };
    
    return categoryMap[code] || ErrorCategory.APPLICATION;
  }
  
  /**
   * Map API error code to severity
   */
  private static mapApiErrorCodeToSeverity(code: ApiErrorCode): ErrorSeverity {
    const severityMap: Record<ApiErrorCode, ErrorSeverity> = {
      [ApiErrorCode.BAD_REQUEST]: ErrorSeverity.LOW,
      [ApiErrorCode.UNAUTHORIZED]: ErrorSeverity.HIGH,
      [ApiErrorCode.FORBIDDEN]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.NOT_FOUND]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.VALIDATION_ERROR]: ErrorSeverity.LOW,
      [ApiErrorCode.RATE_LIMITED]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.INTERNAL_ERROR]: ErrorSeverity.HIGH,
      [ApiErrorCode.SERVICE_UNAVAILABLE]: ErrorSeverity.HIGH,
      [ApiErrorCode.TIMEOUT]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.PROBLEM_NOT_FOUND]: ErrorSeverity.MEDIUM,
      [ApiErrorCode.INVALID_SOLUTION]: ErrorSeverity.LOW,
      [ApiErrorCode.DEPENDENCY_ERROR]: ErrorSeverity.HIGH
    };
    
    return severityMap[code] || ErrorSeverity.MEDIUM;
  }
  
  /**
   * Map API error code to recovery strategy
   */
  private static mapApiErrorCodeToRecoveryStrategy(code: ApiErrorCode): ErrorRecoveryStrategy {
    const strategyMap: Record<ApiErrorCode, ErrorRecoveryStrategy> = {
      [ApiErrorCode.BAD_REQUEST]: ErrorRecoveryStrategy.IGNORE,
      [ApiErrorCode.UNAUTHORIZED]: ErrorRecoveryStrategy.REDIRECT,
      [ApiErrorCode.FORBIDDEN]: ErrorRecoveryStrategy.REDIRECT,
      [ApiErrorCode.NOT_FOUND]: ErrorRecoveryStrategy.FALLBACK,
      [ApiErrorCode.VALIDATION_ERROR]: ErrorRecoveryStrategy.IGNORE,
      [ApiErrorCode.RATE_LIMITED]: ErrorRecoveryStrategy.MANUAL_RETRY,
      [ApiErrorCode.INTERNAL_ERROR]: ErrorRecoveryStrategy.RETRY,
      [ApiErrorCode.SERVICE_UNAVAILABLE]: ErrorRecoveryStrategy.RETRY,
      [ApiErrorCode.TIMEOUT]: ErrorRecoveryStrategy.RETRY,
      [ApiErrorCode.PROBLEM_NOT_FOUND]: ErrorRecoveryStrategy.FALLBACK,
      [ApiErrorCode.INVALID_SOLUTION]: ErrorRecoveryStrategy.IGNORE,
      [ApiErrorCode.DEPENDENCY_ERROR]: ErrorRecoveryStrategy.FALLBACK
    };
    
    return strategyMap[code] || ErrorRecoveryStrategy.RETRY;
  }
  
  /**
   * Get user-friendly message for API error code
   */
  private static getUserMessageForApiError(code: ApiErrorCode): string {
    const messageMap: Record<ApiErrorCode, string> = {
      [ApiErrorCode.BAD_REQUEST]: 'Please check your input and try again.',
      [ApiErrorCode.UNAUTHORIZED]: 'You need to log in to access this feature.',
      [ApiErrorCode.FORBIDDEN]: 'You don\'t have permission to perform this action.',
      [ApiErrorCode.NOT_FOUND]: 'The requested resource could not be found.',
      [ApiErrorCode.VALIDATION_ERROR]: 'There are issues with your input. Please check and try again.',
      [ApiErrorCode.RATE_LIMITED]: 'Please wait a moment before trying again.',
      [ApiErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again later.',
      [ApiErrorCode.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable. Please try again later.',
      [ApiErrorCode.TIMEOUT]: 'The request took too long to complete. Please try again.',
      [ApiErrorCode.PROBLEM_NOT_FOUND]: 'The requested problem could not be found.',
      [ApiErrorCode.INVALID_SOLUTION]: 'Your solution has some issues that need to be addressed.',
      [ApiErrorCode.DEPENDENCY_ERROR]: 'A required service is currently unavailable. Please try again later.'
    };
    
    return messageMap[code] || 'Something went wrong. Please try again.';
  }
  
  /**
   * Convert app error to API error format
   */
  static toApiError(appError: AppError): ApiError {
    return {
      code: appError.code,
      message: appError.message,
      details: {
        category: appError.category,
        severity: appError.severity,
        ...appError.context.additionalData
      },
      timestamp: appError.timestamp,
      requestId: appError.id
    };
  }
}
