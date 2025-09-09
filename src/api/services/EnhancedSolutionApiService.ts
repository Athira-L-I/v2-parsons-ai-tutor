/**
 * Enhanced Solution API Service with robust error handling
 * Extends from BaseApiService to benefit from standardized error handling
 */

import { BaseApiService } from './BaseApiService';
import {
  ValidationResponse,
  ValidateSolutionRequest,
  RequestOptions,
} from '../types';
import { ErrorFactory } from '@/errors';

export class EnhancedSolutionApiService extends BaseApiService {
  constructor() {
    super('SolutionApiService', '/api/solutions');
  }

  /**
   * Validate a solution
   */
  async validateSolution(
    request: ValidateSolutionRequest,
    options: RequestOptions = {}
  ): Promise<ValidationResponse | undefined> {
    try {
      this.validateSolutionRequest(request);
      
      return await this.executeRequest<ValidationResponse>(
        () => this.apiClient.post<ValidationResponse>(
          `${this.basePath}/validate`,
          request,
          options
        ),
        `${this.basePath}/validate`,
        'validating solution'
      );
    } catch (error) {
      if (error instanceof Error && error.message?.includes('validation')) {
        throw ErrorFactory.createValidationError(
          'solution_request',
          'invalid_format',
          request,
          error.message,
          { component: this.serviceName }
        );
      }
      throw error;
    }
  }

  /**
   * Submit a solution for grading and storage
   */
  async submitSolution(
    request: ValidateSolutionRequest & {
      userId?: string;
      sessionId?: string;
    },
    options: RequestOptions = {}
  ): Promise<{
    validation: ValidationResponse;
    submissionId: string;
    score: number;
  } | undefined> {
    try {
      this.validateSolutionRequest(request);
      
      return await this.executeRequest<{
        validation: ValidationResponse;
        submissionId: string;
        score: number;
      }>(
        () => this.apiClient.post(
          `${this.basePath}/submit`,
          request,
          options
        ),
        `${this.basePath}/submit`,
        'submitting solution'
      );
    } catch (error) {
      if (error instanceof Error && error.message?.includes('validation')) {
        throw ErrorFactory.createValidationError(
          'solution_submission',
          'invalid_format',
          request,
          error.message,
          { component: this.serviceName }
        );
      }
      throw error;
    }
  }

  /**
   * Get solution history for a problem
   */
  async getSolutionHistory(
    problemId: string,
    userId?: string,
    options: RequestOptions = {}
  ): Promise<{
    solutions: Array<{
      id: string;
      solution: string[];
      validation: ValidationResponse;
      submittedAt: string;
    }>;
  } | undefined> {
    if (!problemId || typeof problemId !== 'string') {
      this.handleValidationError('Problem ID is required and must be a string', 'problemId');
    }

    const params: Record<string, string | number | boolean | undefined> = {
      problemId,
    };
    if (userId) {
      params.userId = userId;
    }

    return await this.executeRequest<{
      solutions: Array<{
        id: string;
        solution: string[];
        validation: ValidationResponse;
        submittedAt: string;
      }>;
    }>(
      () => this.apiClient.get(
        `${this.basePath}/history`,
        params,
        options
      ),
      `${this.basePath}/history?problemId=${problemId}${userId ? `&userId=${userId}` : ''}`,
      'retrieving solution history'
    );
  }

  /**
   * Quick validation for real-time feedback
   */
  async quickValidate(
    request: ValidateSolutionRequest,
    options: RequestOptions = {}
  ): Promise<{
    isCorrect: boolean;
    score: number;
    quickFeedback: string;
  } | undefined> {
    try {
      this.validateSolutionRequest(request);
      
      return await this.executeRequest<{
        isCorrect: boolean;
        score: number;
        quickFeedback: string;
      }>(
        () => this.apiClient.post(
          `${this.basePath}/quick-validate`,
          request,
          { ...options, timeout: 3000 } // Shorter timeout for quick validation
        ),
        `${this.basePath}/quick-validate`,
        'quick validating solution'
      );
    } catch (error) {
      if (error instanceof Error && error.message?.includes('validation')) {
        throw ErrorFactory.createValidationError(
          'solution_request',
          'invalid_format',
          request,
          error.message,
          { component: this.serviceName }
        );
      }
      throw error;
    }
  }

  /**
   * Validate solution request
   */
  private validateSolutionRequest(request: ValidateSolutionRequest): void {
    if (!request.problemId || typeof request.problemId !== 'string') {
      this.handleValidationError('Problem ID is required and must be a string', 'problemId');
    }

    if (!Array.isArray(request.solution)) {
      this.handleValidationError('Solution must be an array', 'solution');
    }

    if (request.solution.length === 0) {
      this.handleValidationError('Solution cannot be empty', 'solution');
    }

    if (request.solution.length > 100) {
      this.handleValidationError('Solution cannot have more than 100 lines', 'solution');
    }

    // Validate each solution line
    for (let i = 0; i < request.solution.length; i++) {
      const line = request.solution[i];
      if (typeof line !== 'string') {
        this.handleValidationError(`Solution line ${i + 1} must be a string`, `solution[${i}]`);
      }
      if (line.length > 500) {
        this.handleValidationError(`Solution line ${i + 1} cannot exceed 500 characters`, `solution[${i}]`);
      }
    }

    // Validate context if provided
    if (request.context) {
      if (request.context.attemptNumber !== undefined) {
        if (
          typeof request.context.attemptNumber !== 'number' ||
          request.context.attemptNumber < 1
        ) {
          this.handleValidationError('Attempt number must be a positive number', 'context.attemptNumber');
        }
      }

      if (request.context.timeSpent !== undefined) {
        if (
          typeof request.context.timeSpent !== 'number' ||
          request.context.timeSpent < 0
        ) {
          this.handleValidationError('Time spent must be a non-negative number', 'context.timeSpent');
        }
      }

      if (request.context.sessionId !== undefined) {
        if (typeof request.context.sessionId !== 'string') {
          this.handleValidationError('Session ID must be a string', 'context.sessionId');
        }
      }
    }
  }
}

// Export singleton instance
export const enhancedSolutionApiService = new EnhancedSolutionApiService();
