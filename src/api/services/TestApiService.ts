/**
 * BaseApiService Test Implementation
 * Tests the BaseApiService error handling functionality directly
 */

import { BaseApiService } from './BaseApiService';
import { ApiResponse } from '../types';

// Test implementation that extends BaseApiService
export class TestApiService extends BaseApiService {
  constructor() {
    super('TestApiService', '/api/test');
  }
  
  // Test successful request
  async testSuccess<T>(data: T): Promise<T | undefined> {
    return this.executeRequest<T>(
      () => Promise.resolve({ 
        success: true, 
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: `test-${Date.now()}`,
          processingTime: 10,
          version: '1.0.0'
        }
      }),
      '/api/test/success',
      'testing success'
    );
  }
  
  // Test API error with error object
  async testApiError(errorMessage: string): Promise<unknown> {
    return this.executeRequest<unknown>(
      () => Promise.resolve({
        success: false,
        error: {
          code: 'TEST_ERROR',
          message: errorMessage,
          details: { source: 'test' },
          timestamp: new Date().toISOString(),
          requestId: `test-${Date.now()}`
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: `test-${Date.now()}`,
          processingTime: 10,
          version: '1.0.0'
        }
      }),
      '/api/test/api-error',
      'testing API error'
    );
  }
  
  // Test error without error object
  async testEmptyError(): Promise<unknown> {
    return this.executeRequest<unknown>(
      () => Promise.resolve({
        success: false,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: `test-${Date.now()}`,
          processingTime: 10,
          version: '1.0.0'
        }
      }),
      '/api/test/empty-error',
      'testing empty error'
    );
  }
  
  // Test JavaScript error
  async testJsError(errorMessage: string): Promise<unknown> {
    return this.executeRequest<unknown>(
      () => {
        throw new Error(errorMessage);
      },
      '/api/test/js-error',
      'testing JavaScript error'
    );
  }
  
  // Test validation error
  async testValidation(fieldName: string, value: string | null): Promise<{ valid: boolean }> {
    if (!value || value === '') {
      this.handleValidationError(`${fieldName} cannot be empty`, fieldName);
    }
    
    return { valid: true };
  }
}

// Export a singleton instance
export const testApiService = new TestApiService();
