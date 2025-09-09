/**
 * useErrorHandler hook
 * Custom hook for handling errors in functional components
 */

import { useState, useCallback } from 'react';
import { AppError, ErrorCategory } from './types';
import { ErrorFactory } from './ErrorFactory';
import { ErrorHandler } from './ErrorHandler';

/**
 * Custom hook for handling errors in functional components
 */
export function useErrorHandler(componentName?: string) {
  const [error, setError] = useState<AppError | null>(null);

  /**
   * Handle any error by converting to AppError and processing
   */
  const handleError = useCallback(
    (err: unknown, actionDescription?: string, additionalContext?: Record<string, unknown>): AppError => {
      const context = {
        component: componentName,
        action: actionDescription,
        additionalData: additionalContext,
      };
      
      // Process the error
      let appError: AppError;
      if (ErrorHandler.isAppError(err)) {
        appError = err;
      } else {
        appError = ErrorFactory.fromError(err, ErrorCategory.APPLICATION, context);
      }
      
      // Log and set the error
      ErrorHandler.logError(appError);
      setError(appError);
      
      return appError;
    },
    [componentName]
  );

  /**
   * Utility for creating an async error handler
   */
  const createAsyncErrorHandler = useCallback(
    <T extends unknown[], R>(
      fn: (...args: T) => Promise<R>,
      actionDescription?: string
    ) => {
      return async (...args: T): Promise<R | undefined> => {
        try {
          return await fn(...args);
        } catch (err) {
          handleError(err, actionDescription, { arguments: args });
          return undefined;
        }
      };
    },
    [handleError]
  );

  /**
   * Handle a specific network error
   */
  const handleNetworkError = useCallback(
    (
      networkError: Error,
      networkType: 'offline' | 'timeout' | 'server_error' | 'rate_limit' = 'server_error',
      endpoint?: string
    ): AppError => {
      const appError = ErrorFactory.createNetworkError(networkType, networkError);
      
      // Add endpoint to context if provided
      if (endpoint && appError.context.additionalData) {
        appError.context.additionalData.endpoint = endpoint;
      }
      
      // Process the error
      ErrorHandler.logError(appError);
      setError(appError);
      
      return appError;
    },
    []
  );

  /**
   * Clear current error
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    handleNetworkError,
    createAsyncErrorHandler,
    clearError,
    hasError: error !== null,
  };
}
