/**
 * API Error Handling Hook
 * Special hook for handling API errors with appropriate UI feedback
 */

import { useState, useCallback } from 'react';
import { ApiError, ApiResponse } from '../api/types';
import { AppError } from './types';
import { ApiErrorAdapter } from './ApiErrorAdapter';
import { useErrorHandler } from './useErrorHandler';

interface ApiErrorHandlerOptions {
  componentName?: string;
  defaultEndpoint?: string;
}

export function useApiErrorHandler(options: ApiErrorHandlerOptions = {}) {
  const { componentName, defaultEndpoint } = options;
  const { 
    error: appError, 
    handleError,
    clearError,
    hasError
  } = useErrorHandler(componentName);
  
  // Track API-specific state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [endpoint, setEndpoint] = useState<string | undefined>(defaultEndpoint);
  
  /**
   * Process API response and handle any errors
   */
  const processApiResponse = useCallback(<T>(
    response: ApiResponse<T>,
    currentEndpoint?: string
  ): T | undefined => {
    // Update endpoint state if provided
    if (currentEndpoint) {
      setEndpoint(currentEndpoint);
    }
    
    // Clear any previous errors if successful
    if (response.success) {
      clearError();
      return response.data;
    }
    
    // Handle API error
    if (response.error) {
      const apiError = response.error;
      const appError = ApiErrorAdapter.toAppError(
        apiError, 
        currentEndpoint || endpoint
      );
      
      handleError(appError);
      return undefined;
    }
    
    // This shouldn't happen (response with success=false but no error)
    handleError(new Error('API returned failure response without error details'));
    return undefined;
  }, [handleError, clearError, endpoint]);
  
  /**
   * Wrap an API call with error handling
   */
  const withErrorHandling = useCallback(<T>(
    apiPromise: Promise<ApiResponse<T>>,
    currentEndpoint?: string
  ): Promise<T | undefined> => {
    setIsLoading(true);
    
    return apiPromise
      .then(response => {
        setIsLoading(false);
        return processApiResponse(response, currentEndpoint);
      })
      .catch(error => {
        setIsLoading(false);
        handleError(error, `API call failed to ${currentEndpoint || endpoint || 'unknown endpoint'}`);
        return undefined;
      });
  }, [processApiResponse, handleError, endpoint]);
  
  /**
   * Convert an API error to an app error
   */
  const convertApiError = useCallback((
    apiError: ApiError,
    currentEndpoint?: string
  ): AppError => {
    return ApiErrorAdapter.toAppError(apiError, currentEndpoint || endpoint);
  }, [endpoint]);
  
  return {
    error: appError,
    isLoading,
    hasError,
    processApiResponse,
    withErrorHandling,
    convertApiError,
    clearError
  };
}
