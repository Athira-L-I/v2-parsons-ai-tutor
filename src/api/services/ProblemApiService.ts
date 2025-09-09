/**
 * Standardized Problem API service
 * All problem-related API calls go through this service
 */

import { apiClient } from '../ApiClient';
import {
  ApiResponse,
  ProblemResponse,
  CreateProblemRequest,
  PaginatedResponse,
  RequestOptions,
} from '../types';
import { ParsonsSettings } from '@/@types/types';

export class ProblemApiService {
  private readonly basePath = '/api/problems';

  /**
   * Get all problems with pagination and filtering
   */
  async getAllProblems(
    options: {
      page?: number;
      limit?: number;
      difficulty?: string;
      tags?: string[];
      search?: string;
    } = {}
  ): Promise<ApiResponse<PaginatedResponse<ProblemResponse>>> {
    const params: Record<string, string | number | boolean | undefined> = {
      page: options.page || 1,
      limit: options.limit || 20,
      difficulty: options.difficulty,
      search: options.search,
    };

    // Convert tags array to comma-separated string if it exists
    if (options.tags && options.tags.length > 0) {
      params.tags = options.tags.join(',');
    }

    return apiClient.get<PaginatedResponse<ProblemResponse>>(
      this.basePath,
      params
    );
  }

  /**
   * Get a specific problem by ID
   */
  async getProblem(
    id: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<ProblemResponse>> {
    if (!id || typeof id !== 'string') {
      throw new Error('Problem ID is required and must be a string');
    }

    return apiClient.get<ProblemResponse>(
      `${this.basePath}/${id}`,
      undefined,
      options
    );
  }

  /**
   * Create a new problem
   */
  async createProblem(
    request: CreateProblemRequest,
    options: RequestOptions = {}
  ): Promise<ApiResponse<ProblemResponse>> {
    // Validate request
    this.validateCreateProblemRequest(request);

    return apiClient.post<ProblemResponse>(this.basePath, request, options);
  }

  /**
   * Update an existing problem
   */
  async updateProblem(
    id: string,
    updates: Partial<CreateProblemRequest>,
    options: RequestOptions = {}
  ): Promise<ApiResponse<ProblemResponse>> {
    if (!id || typeof id !== 'string') {
      throw new Error('Problem ID is required and must be a string');
    }

    return apiClient.put<ProblemResponse>(
      `${this.basePath}/${id}`,
      updates,
      options
    );
  }

  /**
   * Delete a problem
   */
  async deleteProblem(
    id: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<void>> {
    if (!id || typeof id !== 'string') {
      throw new Error('Problem ID is required and must be a string');
    }

    return apiClient.delete<void>(`${this.basePath}/${id}`, options);
  }

  /**
   * Generate problem from source code
   */
  async generateProblemFromCode(
    sourceCode: string,
    metadata: {
      title?: string;
      description?: string;
      language?: string;
      difficulty?: string;
    } = {},
    options: RequestOptions = {}
  ): Promise<ApiResponse<ProblemResponse>> {
    if (!sourceCode || typeof sourceCode !== 'string') {
      throw new Error('Source code is required and must be a string');
    }

    const request: CreateProblemRequest = {
      title: metadata.title || 'Generated Problem',
      description: metadata.description || 'Problem generated from source code',
      sourceCode,
      language: metadata.language || 'python',
      difficulty: metadata.difficulty || 'intermediate',
    };

    return apiClient.post<ProblemResponse>(
      `${this.basePath}/generate`,
      request,
      options
    );
  }

  /**
   * Search problems
   */
  async searchProblems(
    query: string,
    filters: {
      difficulty?: string;
      tags?: string[];
      language?: string;
    } = {},
    options: RequestOptions = {}
  ): Promise<ApiResponse<PaginatedResponse<ProblemResponse>>> {
    if (!query || typeof query !== 'string') {
      throw new Error('Search query is required and must be a string');
    }

    const params: Record<string, string | number | boolean | undefined> = {
      q: query,
      difficulty: filters.difficulty,
      language: filters.language,
    };

    // Convert tags array to comma-separated string if it exists
    if (filters.tags && filters.tags.length > 0) {
      params.tags = filters.tags.join(',');
    }

    return apiClient.get<PaginatedResponse<ProblemResponse>>(
      `${this.basePath}/search`,
      params,
      options
    );
  }

  /**
   * Get problems by difficulty
   */
  async getProblemsByDifficulty(
    difficulty: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<PaginatedResponse<ProblemResponse>>> {
    return this.getAllProblems({ difficulty });
  }

  /**
   * Get problems by tags
   */
  async getProblemsByTags(
    tags: string[],
    options: RequestOptions = {}
  ): Promise<ApiResponse<PaginatedResponse<ProblemResponse>>> {
    return this.getAllProblems({ tags });
  }

  /**
   * Validate create problem request
   */
  private validateCreateProblemRequest(request: CreateProblemRequest): void {
    if (!request.title || typeof request.title !== 'string') {
      throw new Error('Problem title is required and must be a string');
    }

    if (!request.description || typeof request.description !== 'string') {
      throw new Error('Problem description is required and must be a string');
    }

    if (!request.sourceCode || typeof request.sourceCode !== 'string') {
      throw new Error('Source code is required and must be a string');
    }

    if (request.title.length > 200) {
      throw new Error('Problem title cannot exceed 200 characters');
    }

    if (request.description.length > 2000) {
      throw new Error('Problem description cannot exceed 2000 characters');
    }

    if (request.sourceCode.length > 10000) {
      throw new Error('Source code cannot exceed 10000 characters');
    }

    if (
      request.tags &&
      (!Array.isArray(request.tags) || request.tags.length > 10)
    ) {
      throw new Error('Tags must be an array with maximum 10 items');
    }
  }
}

// Export singleton instance
export const problemApiService = new ProblemApiService();
