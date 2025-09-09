/**
 * Enhanced Feedback API Service with robust error handling
 * Extends from BaseApiService to benefit from standardized error handling
 */

import { BaseApiService } from './BaseApiService';
import {
  FeedbackResponse,
  GenerateFeedbackRequest,
  RequestOptions,
} from '../types';
import { ErrorFactory } from '@/errors';

export class EnhancedFeedbackApiService extends BaseApiService {
  constructor() {
    super('FeedbackApiService', '/api/feedback');
  }

  /**
   * Generate AI feedback for a solution
   */
  async generateFeedback(
    request: GenerateFeedbackRequest,
    options: RequestOptions = {}
  ): Promise<FeedbackResponse | undefined> {
    try {
      this.validateFeedbackRequest(request);
      
      return await this.executeRequest<FeedbackResponse>(
        () => this.apiClient.post<FeedbackResponse>(
          `${this.basePath}/generate`,
          request,
          { ...options, timeout: 15000 } // Longer timeout for AI generation
        ),
        `${this.basePath}/generate`,
        'generating feedback'
      );
    } catch (error) {
      if (error instanceof Error && error.message?.includes('validation')) {
        // Convert validation errors to proper validation errors
        throw ErrorFactory.createValidationError(
          'feedback_request',
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
   * Generate Socratic feedback (question-based)
   */
  async generateSocraticFeedback(
    request: GenerateFeedbackRequest,
    options: RequestOptions = {}
  ): Promise<FeedbackResponse | undefined> {
    try {
      this.validateFeedbackRequest(request);
      
      return await this.executeRequest<FeedbackResponse>(
        () => this.apiClient.post<FeedbackResponse>(
          `${this.basePath}/socratic`,
          request,
          { ...options, timeout: 15000 }
        ),
        `${this.basePath}/socratic`,
        'generating Socratic feedback'
      );
    } catch (error) {
      if (error instanceof Error && error.message?.includes('validation')) {
        throw ErrorFactory.createValidationError(
          'feedback_request',
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
  ): Promise<{
    hint: string;
    severity: 'gentle' | 'direct';
    followUpQuestions: string[];
  } | undefined> {
    try {
      this.validateHintRequest(request);
      
      return await this.executeRequest<{
        hint: string;
        severity: 'gentle' | 'direct';
        followUpQuestions: string[];
      }>(
        () => this.apiClient.post(
          `${this.basePath}/hint`,
          request,
          { ...options, timeout: 10000 }
        ),
        `${this.basePath}/hint`,
        'generating hint'
      );
    } catch (error) {
      if (error instanceof Error && error.message?.includes('validation')) {
        throw ErrorFactory.createValidationError(
          'hint_request',
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
   * Get feedback templates for fallback scenarios
   */
  async getFeedbackTemplates(
    category: 'order' | 'indentation' | 'logic' | 'encouragement',
    options: RequestOptions = {}
  ): Promise<{
    templates: Array<{
      id: string;
      template: string;
      variables: string[];
      difficulty: string;
    }>;
  } | undefined> {
    const validCategories = ['order', 'indentation', 'logic', 'encouragement'];
    if (!validCategories.includes(category)) {
      this.handleValidationError(
        `Invalid category. Must be one of: ${validCategories.join(', ')}`,
        'category'
      );
    }

    return await this.executeRequest<{
      templates: Array<{
        id: string;
        template: string;
        variables: string[];
        difficulty: string;
      }>;
    }>(
      () => this.apiClient.get(
        `${this.basePath}/templates`, 
        { category }, 
        options
      ),
      `${this.basePath}/templates?category=${category}`,
      'retrieving feedback templates'
    );
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
  ): Promise<void> {
    try {
      this.validateRatingRequest(feedbackId, rating);
      
      await this.executeRequest<void>(
        () => this.apiClient.post(
          `${this.basePath}/rate/${feedbackId}`,
          rating,
          options
        ),
        `${this.basePath}/rate/${feedbackId}`,
        'rating feedback'
      );
    } catch (error) {
      if (error instanceof Error && error.message?.includes('validation')) {
        throw ErrorFactory.createValidationError(
          'rating_request',
          'invalid_format',
          { feedbackId, rating },
          error.message,
          { component: this.serviceName }
        );
      }
      throw error;
    }
  }

  /**
   * Validate hint request
   */
  private validateHintRequest(request: {
    problemId: string;
    currentSolution: string[];
    errorType: string;
    blockId?: string;
  }): void {
    if (!request.problemId || typeof request.problemId !== 'string') {
      this.handleValidationError('Problem ID is required and must be a string', 'problemId');
    }

    if (!Array.isArray(request.currentSolution)) {
      this.handleValidationError('Current solution must be an array', 'currentSolution');
    }

    if (!request.errorType || typeof request.errorType !== 'string') {
      this.handleValidationError('Error type is required and must be a string', 'errorType');
    }
  }

  /**
   * Validate rating request
   */
  private validateRatingRequest(
    feedbackId: string,
    rating: {
      helpful: boolean;
      clarity: number;
      accuracy: number;
      comment?: string;
    }
  ): void {
    if (!feedbackId || typeof feedbackId !== 'string') {
      this.handleValidationError('Feedback ID is required and must be a string', 'feedbackId');
    }

    if (typeof rating.helpful !== 'boolean') {
      this.handleValidationError('Rating helpful must be a boolean', 'helpful');
    }

    if (
      typeof rating.clarity !== 'number' ||
      rating.clarity < 1 ||
      rating.clarity > 5
    ) {
      this.handleValidationError('Rating clarity must be a number between 1 and 5', 'clarity');
    }

    if (
      typeof rating.accuracy !== 'number' ||
      rating.accuracy < 1 ||
      rating.accuracy > 5
    ) {
      this.handleValidationError('Rating accuracy must be a number between 1 and 5', 'accuracy');
    }
  }

  /**
   * Validate feedback request
   */
  private validateFeedbackRequest(request: GenerateFeedbackRequest): void {
    if (!request.problemId || typeof request.problemId !== 'string') {
      this.handleValidationError('Problem ID is required and must be a string', 'problemId');
    }

    if (!Array.isArray(request.currentSolution)) {
      this.handleValidationError('Current solution must be an array', 'currentSolution');
    }

    if (request.currentSolution.length === 0) {
      this.handleValidationError('Current solution cannot be empty', 'currentSolution');
    }

    // Validate chat history if provided
    if (request.chatHistory) {
      if (!Array.isArray(request.chatHistory)) {
        this.handleValidationError('Chat history must be an array', 'chatHistory');
      }

      if (request.chatHistory.length > 50) {
        this.handleValidationError('Chat history cannot exceed 50 messages', 'chatHistory');
      }

      request.chatHistory.forEach((message, index) => {
        if (!message.id || !message.content || !message.role) {
          this.handleValidationError(
            `Chat message ${index + 1} is missing required fields`,
            `chatHistory[${index}]`
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
          this.handleValidationError('Context attempts must be a non-negative number', 'context.attempts');
        }
      }

      if (request.context.timeSpent !== undefined) {
        if (
          typeof request.context.timeSpent !== 'number' ||
          request.context.timeSpent < 0
        ) {
          this.handleValidationError('Context time spent must be a non-negative number', 'context.timeSpent');
        }
      }
    }
  }
}

// Export singleton instance
export const enhancedFeedbackApiService = new EnhancedFeedbackApiService();
