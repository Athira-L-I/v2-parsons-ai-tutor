/**
 * Base API Service with integrated error handling
 */

import { apiClient } from '../ApiClient';
import { ApiResponse } from '../types';
import { ApiErrorAdapter } from '@/errors/ApiErrorAdapter';
import { AppError, ErrorFactory, ErrorHandler } from '@/errors/index';

export abstract class BaseApiService {
  protected apiClient = apiClient;
  protected readonly serviceName: string;
  protected readonly basePath: string;

  constructor(serviceName: string, basePath: string) {
    this.serviceName = serviceName;
    this.basePath = basePath;
  }

  /**
   * Execute an API request with error handling
   */
  protected async executeRequest<T>(
    requestFn: () => Promise<ApiResponse<T>>,
    endpoint: string,
    actionDescription: string
  ): Promise<T | undefined> {
    try {
      const response = await requestFn();
      
      if (!response.success || response.error) {
        if (response.error) {
          const appError = ApiErrorAdapter.toAppError(
            response.error, 
            endpoint
          );
          
          // Log the error
          ErrorHandler.logError(appError);
          throw appError;
        } else {
          // API returned failure but no error details
          throw new Error('API returned failure response without error details');
        }
      }
      
      return response.data;
    } catch (error) {
      // If we get here, it's either a network error or we rethrew an API error
      if (!ErrorHandler.isAppError(error)) {
        const appError = ErrorFactory.createApplicationError(
          `Unhandled error in ${actionDescription}`,
          error instanceof Error ? error : new Error(String(error)),
          {
            component: this.serviceName,
            action: actionDescription,
            additionalData: { endpoint }
          }
        );
        
        ErrorHandler.logError(appError);
        throw appError;
      }
      
      // It's already an AppError, just rethrow
      throw error;
    }
  }

  /**
   * Handle validation error
   */
  protected handleValidationError(message: string, fieldName?: string): never {
    const appError = ErrorFactory.createValidationError(
      fieldName || 'input',
      'invalid_value',
      undefined,
      message,
      { component: this.serviceName }
    );
    
    throw appError;
  }

  /**
   * Check if response has an error
   */
  protected hasError<T>(response: ApiResponse<T> | undefined): boolean {
    return !response?.success || response?.error !== undefined;
  }

  /**
   * Get the error from a response
   */
  protected getErrorFromResponse<T>(response: ApiResponse<T>): AppError {
    if (!response.error) {
      return ErrorFactory.createApplicationError(
        'Unknown API error',
        new Error('API returned failure without error details'),
        { component: this.serviceName }
      );
    }

    return ApiErrorAdapter.toAppError(response.error);
  }
}
