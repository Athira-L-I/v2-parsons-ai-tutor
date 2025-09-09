/**
 * Standardized error display component
 * Use this instead of ad-hoc error displays
 */

import React from 'react';
import {
  AppError,
  ErrorCategory,
  ErrorSeverity,
  ErrorRecoveryStrategy,
} from '@/errors/types';
import { ErrorDisplay as CoreErrorDisplay } from '@/errors/ErrorDisplay';

interface StandardErrorDisplayProps {
  error: AppError | Error | string | null | undefined;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
  showDetails?: boolean;
}

export const StandardErrorDisplay: React.FC<StandardErrorDisplayProps> = ({
  error,
  onRetry,
  className = '',
  compact = false,
  showDetails = false,
}) => {
  // Don't render anything if there's no error
  if (!error) return null;

  // Convert string errors to app errors
  const appError = getAppErrorFromInput(error);

  // Use the core error display with our standardized props
  return (
    <CoreErrorDisplay
      error={appError}
      onReset={onRetry}
      showReset={!!onRetry}
      showDetails={showDetails}
      className={className}
      compact={compact}
    />
  );
};

/**
 * Helper to convert any error type to an AppError
 */
function getAppErrorFromInput(
  error: AppError | Error | string | null | undefined
): AppError {
  if (!error) {
    return {
      id: `err_${Date.now()}`,
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error',
      userMessage: 'An unexpected error occurred.',
      category: ErrorCategory.APPLICATION,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: ErrorRecoveryStrategy.MANUAL_RETRY,
      context: {},
      timestamp: new Date().toISOString(),
    };
  }

  // Already an AppError
  if (typeof error === 'object' && 'category' in error && 'severity' in error) {
    return error as AppError;
  }

  // Convert Error object
  if (error instanceof Error) {
    return {
      id: `err_${Date.now()}`,
      code: 'JS_ERROR',
      message: error.message || 'JavaScript error',
      userMessage: 'Something went wrong. Please try again.',
      category: ErrorCategory.APPLICATION,
      severity: ErrorSeverity.MEDIUM,
      recoveryStrategy: ErrorRecoveryStrategy.MANUAL_RETRY,
      context: {
        additionalData: {
          stack: error.stack,
        },
      },
      originalError: error,
      timestamp: new Date().toISOString(),
    };
  }

  // Convert string error
  return {
    id: `err_${Date.now()}`,
    code: 'STRING_ERROR',
    message: String(error),
    userMessage: String(error),
    category: ErrorCategory.APPLICATION,
    severity: ErrorSeverity.LOW,
    recoveryStrategy: ErrorRecoveryStrategy.MANUAL_RETRY,
    context: {},
    timestamp: new Date().toISOString(),
  };
}
