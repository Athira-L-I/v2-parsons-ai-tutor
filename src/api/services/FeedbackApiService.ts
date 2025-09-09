/**
 * Standardized Feedback API service
 * All AI feedback generation calls go through this service
 */

import { apiClient } from '../ApiClient';
import {
  ApiResponse,
  FeedbackResponse,
  GenerateFeedbackRequest,
  RequestOptions,
} from '../types';
import { ChatMessage } from '@/@types/types';

export class FeedbackApiService {
  private readonly basePath = '/api/feedback';

  /**
   * Generate AI feedback for a solution
   */
  async generateFeedback(
    request: GenerateFeedbackRequest,
    options: RequestOptions = {}
  ): Promise<ApiResponse<FeedbackResponse>> {
    // Validate request
    this.validateFeedbackRequest(request);

    return apiClient.post<FeedbackResponse>(
      `${this.basePath}/generate`,
      request,
      { ...options, timeout: 15000 } // Longer timeout for AI generation
    );
  }

  /**
   * Generate Socratic feedback (question-based)
   */
  async generateSocraticFeedback(
    request: GenerateFeedbackRequest,
    options: RequestOptions = {}
  ): Promise<ApiResponse<FeedbackResponse>> {
    this.validateFeedbackRequest(request);

    return apiClient.post<FeedbackResponse>(
      `${this.basePath}/socratic`,
      request,
      { ...options, timeout: 15000 }
    );
  }

  /**
   * Generate hint for a specific error
   */
  async generateHint(
    request: {
      problemId: string;
      currentSolution: string[];
      errorType: string;
      blockId?: string;
    },
    options: RequestOptions = {}
  ): Promise<
    ApiResponse<{
      hint: string;
      severity: 'gentle' | 'direct';
      followUpQuestions: string[];
    }>
  > {
    if (!request.problemId || typeof request.problemId !== 'string') {
      throw new Error('Problem ID is required and must be a string');
    }

    if (!Array.isArray(request.currentSolution)) {
      throw new Error('Current solution must be an array');
    }

    if (!request.errorType || typeof request.errorType !== 'string') {
      throw new Error('Error type is required and must be a string');
    }

    return apiClient.post(`${this.basePath}/hint`, request, {
      ...options,
      timeout: 10000,
    });
  }

  /**
   * Get feedback templates for fallback scenarios
   */
  async getFeedbackTemplates(
    category: 'order' | 'indentation' | 'logic' | 'encouragement',
    options: RequestOptions = {}
  ): Promise<
    ApiResponse<{
      templates: Array<{
        id: string;
        template: string;
        variables: string[];
        difficulty: string;
      }>;
    }>
  > {
    const validCategories = ['order', 'indentation', 'logic', 'encouragement'];
    if (!validCategories.includes(category)) {
      throw new Error(
        `Invalid category. Must be one of: ${validCategories.join(', ')}`
      );
    }

    return apiClient.get(`${this.basePath}/templates`, { category }, options);
  }

  /**
   * Rate feedback quality (for training/improvement)
   */
  async rateFeedback(
    feedbackId: string,
    rating: {
      helpful: boolean;
      clarity: number; // 1-5
      accuracy: number; // 1-5
      comment?: string;
    },
    options: RequestOptions = {}
  ): Promise<ApiResponse<void>> {
    if (!feedbackId || typeof feedbackId !== 'string') {
      throw new Error('Feedback ID is required and must be a string');
    }

    if (typeof rating.helpful !== 'boolean') {
      throw new Error('Rating helpful must be a boolean');
    }

    if (
      typeof rating.clarity !== 'number' ||
      rating.clarity < 1 ||
      rating.clarity > 5
    ) {
      throw new Error('Rating clarity must be a number between 1 and 5');
    }

    if (
      typeof rating.accuracy !== 'number' ||
      rating.accuracy < 1 ||
      rating.accuracy > 5
    ) {
      throw new Error('Rating accuracy must be a number between 1 and 5');
    }

    return apiClient.post(
      `${this.basePath}/rate/${feedbackId}`,
      rating,
      options
    );
  }

  /**
   * Validate feedback request
   */
  private validateFeedbackRequest(request: GenerateFeedbackRequest): void {
    if (!request.problemId || typeof request.problemId !== 'string') {
      throw new Error('Problem ID is required and must be a string');
    }

    if (!Array.isArray(request.currentSolution)) {
      throw new Error('Current solution must be an array');
    }

    if (request.currentSolution.length === 0) {
      throw new Error('Current solution cannot be empty');
    }

    // Validate chat history if provided
    if (request.chatHistory) {
      if (!Array.isArray(request.chatHistory)) {
        throw new Error('Chat history must be an array');
      }

      if (request.chatHistory.length > 50) {
        throw new Error('Chat history cannot exceed 50 messages');
      }

      request.chatHistory.forEach((message, index) => {
        if (!message.id || !message.content || !message.role) {
          throw new Error(
            `Chat message ${index + 1} is missing required fields`
          );
        }
      });
    }

    // Validate context if provided
    if (request.context) {
      if (request.context.attempts !== undefined) {
        if (
          typeof request.context.attempts !== 'number' ||
          request.context.attempts < 0
        ) {
          throw new Error('Context attempts must be a non-negative number');
        }
      }

      if (request.context.timeSpent !== undefined) {
        if (
          typeof request.context.timeSpent !== 'number' ||
          request.context.timeSpent < 0
        ) {
          throw new Error('Context time spent must be a non-negative number');
        }
      }
    }
  }
}

// Export singleton instance
export const feedbackApiService = new FeedbackApiService();
