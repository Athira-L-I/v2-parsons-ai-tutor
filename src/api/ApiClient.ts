/**
 * Standardized API client with consistent error handling, retries, and validation
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  ApiResponse,
  ApiError,
  ApiErrorCode,
  RequestOptions,
  ResponseMetadata,
} from './types';

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  defaultRetries: number;
  defaultRetryDelay: number;
  enableRequestLogging: boolean;
  enableResponseValidation: boolean;
}

export class ApiClient {
  private axios: AxiosInstance;
  private requestIdCounter = 0;

  constructor(private config: ApiClientConfig) {
    this.axios = this.createAxiosInstance();
    this.setupInterceptors();
  }

  /**
   * Standard GET request
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, { params, ...options });
  }

  /**
   * Standard POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, options);
  }

  /**
   * Standard PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  /**
   * Standard DELETE request
   */
  async delete<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  /**
   * Core request method with standardized error handling and retries
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    const requestConfig: AxiosRequestConfig = {
      method,
      url: endpoint,
      data,
      timeout: options.timeout || this.config.timeout,
      signal: options.abortSignal,
      headers: {
        'X-Request-ID': requestId,
        ...options.headers,
      },
      ...options,
    };

    // Logging
    if (this.config.enableRequestLogging) {
      console.log(`📤 API Request [${requestId}]: ${method} ${endpoint}`, {
        data: data ? { ...data } : undefined,
        options,
      });
    }

    let lastError: Error | null = null;
    const maxRetries = options.retries ?? this.config.defaultRetries;
    const retryDelay = options.retryDelay ?? this.config.defaultRetryDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.axios.request<ApiResponse<T>>(
          requestConfig
        );
        const processingTime = Date.now() - startTime;

        // Validate response format
        if (this.config.enableResponseValidation) {
          this.validateResponse(response.data);
        }

        // Add metadata if missing
        if (!response.data.metadata) {
          response.data.metadata = this.createMetadata(
            requestId,
            processingTime
          );
        }

        // Logging
        if (this.config.enableRequestLogging) {
          console.log(`📥 API Response [${requestId}]: ${response.status}`, {
            success: response.data.success,
            processingTime,
            attempt: attempt + 1,
          });
        }

        return response.data;
      } catch (error) {
        const typedError = error as Error;
        lastError = typedError;
        const processingTime = Date.now() - startTime;

        console.error(
          `❌ API Request Failed [${requestId}] Attempt ${attempt + 1}:`,
          {
            error: typedError.message,
            endpoint,
            processingTime,
          }
        );

        // Don't retry on client errors (4xx) except for specific cases
        if (axios.isAxiosError(error) && error.response) {
          const status = error.response.status;
          if (status >= 400 && status < 500 && status !== 429) {
            // Don't retry client errors except rate limiting
            break;
          }
        }

        // Don't retry if this is the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry
        if (retryDelay > 0) {
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    // Convert error to standard format
    const apiError = this.convertToApiError(lastError as Error, requestId);
    const errorResponse: ApiResponse<T> = {
      success: false,
      error: apiError,
      metadata: this.createMetadata(requestId, Date.now() - startTime),
    };

    return errorResponse;
  }

  /**
   * Create standardized axios instance
   */
  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Set up request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        // Add timestamp
        config.headers = config.headers || {};
        config.headers['X-Request-Timestamp'] = new Date().toISOString();
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => {
        // Ensure response follows standard format
        if (!response.data.metadata) {
          response.data.metadata = this.createMetadata(
            (response.config.headers?.['X-Request-ID'] as string) || 'unknown',
            0
          );
        }
        return response;
      },
      (error) => {
        // Don't transform error here, let request method handle it
        return Promise.reject(error);
      }
    );
  }

  /**
   * Validate response format
   */
  private validateResponse(response: unknown): void {
    if (typeof response !== 'object' || response === null) {
      throw new Error('Response must be an object');
    }

    const apiResponse = response as Partial<ApiResponse<unknown>>;

    if (typeof apiResponse.success !== 'boolean') {
      throw new Error('Response must have a boolean success field');
    }

    if (apiResponse.success === false && !apiResponse.error) {
      throw new Error('Error responses must include error details');
    }
  }

  /**
   * Convert any error to standard API error format
   */
  private convertToApiError(error: Error, requestId: string): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error;

      // Network error
      if (!axiosError.response) {
        return {
          code: ApiErrorCode.SERVICE_UNAVAILABLE,
          message: 'Network error or service unavailable',
          details: { originalError: axiosError.message },
          timestamp: new Date().toISOString(),
          requestId,
        };
      }

      // Server returned an error response
      const response = axiosError.response;
      const status = response.status;

      // Try to extract error from response
      if (response.data?.error) {
        const responseError = response.data.error;
        return {
          code: responseError.code || this.getErrorCodeForStatus(status),
          message: responseError.message || `HTTP ${status} error`,
          details: responseError.details || {
            status,
            statusText: response.statusText,
          },
          field: responseError.field,
          timestamp: new Date().toISOString(),
          requestId,
        };
      }

      // Create error based on status code
      const errorCode = this.getErrorCodeForStatus(status);
      return {
        code: errorCode,
        message: this.getMessageForErrorCode(errorCode),
        details: {
          status,
          statusText: response.statusText,
          data: response.data,
        },
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    // Generic error
    return {
      code: ApiErrorCode.INTERNAL_ERROR,
      message: error.message || 'Unknown error',
      details: { originalError: error.toString() },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  /**
   * Map HTTP status to error code
   */
  private getErrorCodeForStatus(status: number): ApiErrorCode {
    const errorMap: Record<number, ApiErrorCode> = {
      400: ApiErrorCode.BAD_REQUEST,
      401: ApiErrorCode.UNAUTHORIZED,
      403: ApiErrorCode.FORBIDDEN,
      404: ApiErrorCode.NOT_FOUND,
      422: ApiErrorCode.VALIDATION_ERROR,
      429: ApiErrorCode.RATE_LIMITED,
      500: ApiErrorCode.INTERNAL_ERROR,
      502: ApiErrorCode.SERVICE_UNAVAILABLE,
      503: ApiErrorCode.SERVICE_UNAVAILABLE,
      504: ApiErrorCode.TIMEOUT,
    };

    return errorMap[status] || ApiErrorCode.INTERNAL_ERROR;
  }

  /**
   * Get message for error code
   */
  private getMessageForErrorCode(code: ApiErrorCode): string {
    const messageMap: Record<ApiErrorCode, string> = {
      [ApiErrorCode.BAD_REQUEST]: 'Bad request',
      [ApiErrorCode.UNAUTHORIZED]: 'Unauthorized',
      [ApiErrorCode.FORBIDDEN]: 'Forbidden',
      [ApiErrorCode.NOT_FOUND]: 'Resource not found',
      [ApiErrorCode.VALIDATION_ERROR]: 'Validation error',
      [ApiErrorCode.RATE_LIMITED]: 'Rate limit exceeded',
      [ApiErrorCode.INTERNAL_ERROR]: 'Internal server error',
      [ApiErrorCode.SERVICE_UNAVAILABLE]: 'Service unavailable',
      [ApiErrorCode.TIMEOUT]: 'Request timeout',
      [ApiErrorCode.PROBLEM_NOT_FOUND]: 'Problem not found',
      [ApiErrorCode.INVALID_SOLUTION]: 'Invalid solution',
      [ApiErrorCode.DEPENDENCY_ERROR]: 'Dependency error',
    };

    return messageMap[code] || 'Unknown error';
  }

  /**
   * Create response metadata
   */
  private createMetadata(
    requestId: string,
    processingTime: number
  ): ResponseMetadata {
    return {
      timestamp: new Date().toISOString(),
      requestId,
      processingTime,
      version: process.env.NEXT_PUBLIC_API_VERSION || '1.0.0',
    };
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    this.requestIdCounter = (this.requestIdCounter + 1) % 10000;
    return `req_${Date.now()}_${this.requestIdCounter}`;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Create configured client instance
const apiClientConfig: ApiClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
  defaultRetries: 3,
  defaultRetryDelay: 1000,
  enableRequestLogging: process.env.NODE_ENV === 'development',
  enableResponseValidation: true,
};

export const apiClient = new ApiClient(apiClientConfig);
