/**
 * API configuration and initialization
 * Sets up the API client with proper configuration for the environment
 */

import { apiClient } from './ApiClient';

/**
 * Initialize API client with configuration
 * @param options Configuration options
 */
export function initializeApiClient(options?: {
  baseURL?: string;
  timeout?: number;
  enableLogging?: boolean;
}) {
  // Get base URL from environment variable or options
  const baseURL =
    options?.baseURL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000';

  // Configure the API client
  apiClient.configure({
    baseURL,
    timeout: options?.timeout || 10000,
    enableRequestLogging:
      options?.enableLogging ?? process.env.NODE_ENV === 'development',
  });

  console.log(`API client initialized with baseURL: ${baseURL}`);
}

/**
 * Get current API configuration
 */
export function getApiConfiguration() {
  return {
    baseURL: apiClient.getBaseUrl(),
    timeout: apiClient.getTimeout(),
  };
}

// Auto-initialize on import in browser environment
if (typeof window !== 'undefined') {
  initializeApiClient();
}
