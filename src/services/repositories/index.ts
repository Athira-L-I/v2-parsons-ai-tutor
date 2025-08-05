/**
 * Repository exports for data access layer
 */

export * from './Repository';
export * from './ProblemRepository';
export * from './SolutionRepository';

// Common API client factory
import axios, { AxiosInstance } from 'axios';

export const createApiClient = (): AxiosInstance => {
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
  });
};
