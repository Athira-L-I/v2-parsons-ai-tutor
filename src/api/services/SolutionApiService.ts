/**
 * Standardized Solution API service
 * All solution validation and submission calls go through this service
 */

import { apiClient } from '../ApiClient';
import {
  ApiResponse,
  ValidationResponse,
  ValidateSolutionRequest,
  RequestOptions,
} from '../types';

export class SolutionApiService {
  private readonly basePath = '/api/solutions';

  /**
   * Validate a solution
   */
  async validateSolution(
    request: ValidateSolutionRequest,
    options: RequestOptions = {}
  ): Promise<ApiResponse<ValidationResponse>> {
    // Validate request
    this.validateSolutionRequest(request);

    return apiClient.post<ValidationResponse>(
      `${this.basePath}/validate`,
      request,
      options
    );
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
  ): Promise<
    ApiResponse<{
      validation: ValidationResponse;
      submissionId: string;
      score: number;
    }>
  > {
    this.validateSolutionRequest(request);

    return apiClient.post(`${this.basePath}/submit`, request, options);
  }

  /**
   * Get solution history for a problem
   */
  async getSolutionHistory(
    problemId: string,
    userId?: string,
    options: RequestOptions = {}
  ): Promise<
    ApiResponse<{
      solutions: Array<{
        id: string;
        solution: string[];
        validation: ValidationResponse;
        submittedAt: string;
      }>;
    }>
  > {
    if (!problemId || typeof problemId !== 'string') {
      throw new Error('Problem ID is required and must be a string');
    }

    const params: Record<string, string | number | boolean | undefined> = {
      problemId,
    };
    if (userId) {
      params.userId = userId;
    }

    return apiClient.get(`${this.basePath}/history`, params, options);
  }

  /**
   * Quick validation for real-time feedback
   */
  async quickValidate(
    request: ValidateSolutionRequest,
    options: RequestOptions = {}
  ): Promise<
    ApiResponse<{
      isCorrect: boolean;
      score: number;
      quickFeedback: string;
    }>
  > {
    this.validateSolutionRequest(request);

    return apiClient.post(
      `${this.basePath}/quick-validate`,
      request,
      { ...options, timeout: 3000 } // Shorter timeout for quick validation
    );
  }

  /**
   * Validate solution request
   */
  private validateSolutionRequest(request: ValidateSolutionRequest): void {
    if (!request.problemId || typeof request.problemId !== 'string') {
      throw new Error('Problem ID is required and must be a string');
    }

    if (!Array.isArray(request.solution)) {
      throw new Error('Solution must be an array');
    }

    if (request.solution.length === 0) {
      throw new Error('Solution cannot be empty');
    }

    if (request.solution.length > 100) {
      throw new Error('Solution cannot have more than 100 lines');
    }

    // Validate each solution line
    for (let i = 0; i < request.solution.length; i++) {
      const line = request.solution[i];
      if (typeof line !== 'string') {
        throw new Error(`Solution line ${i + 1} must be a string`);
      }
      if (line.length > 500) {
        throw new Error(`Solution line ${i + 1} cannot exceed 500 characters`);
      }
    }

    // Validate context if provided
    if (request.context) {
      if (request.context.attemptNumber !== undefined) {
        if (
          typeof request.context.attemptNumber !== 'number' ||
          request.context.attemptNumber < 1
        ) {
          throw new Error('Attempt number must be a positive number');
        }
      }

      if (request.context.timeSpent !== undefined) {
        if (
          typeof request.context.timeSpent !== 'number' ||
          request.context.timeSpent < 0
        ) {
          throw new Error('Time spent must be a non-negative number');
        }
      }

      if (request.context.sessionId !== undefined) {
        if (typeof request.context.sessionId !== 'string') {
          throw new Error('Session ID must be a string');
        }
      }
    }
  }
}

// Export singleton instance
export const solutionApiService = new SolutionApiService();
