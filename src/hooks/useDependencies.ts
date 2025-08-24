/**
 * React hook for managing dependencies
 * Provides clean React integration for dependency loading
 */

import { useState, useEffect, useCallback } from 'react';
import { dependencyLoader, LoadingResult } from '@/dependencies/DependencyLoader';

export interface DependencyStatus {
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  error: string | null;
  result: LoadingResult | null;
  retry: () => void;
}

export function useDependencies(): DependencyStatus {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LoadingResult | null>(null);

  const loadDependencies = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    setError(null);

    try {
      console.log('🔄 Loading dependencies via hook...');
      const loadResult = await dependencyLoader.loadAll();
      
      setResult(loadResult);
      
      if (loadResult.success) {
        setIsLoaded(true);
        console.log('✅ All dependencies loaded successfully');
      } else {
        setHasError(true);
        setError(loadResult.errors.join('; '));
        console.error('❌ Dependency loading failed:', loadResult.errors);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setHasError(true);
      setError(errorMessage);
      console.error('❌ Dependency loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    console.log('🔄 Retrying dependency loading...');
    dependencyLoader.reset();
    loadDependencies();
  }, [loadDependencies]);

  // Load dependencies on mount
  useEffect(() => {
    loadDependencies();
  }, [loadDependencies]);

  return {
    isLoading,
    isLoaded,
    hasError,
    error,
    result,
    retry,
  };
}

/**
 * Hook for loading specific dependencies
 */
export function useSpecificDependencies(dependencies: string[]): DependencyStatus {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LoadingResult | null>(null);

  const loadSpecificDependencies = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    setError(null);

    try {
      for (const dep of dependencies) {
        await dependencyLoader.loadDependency(dep);
      }
      setIsLoaded(true);
      setResult({
        success: true,
        loaded: dependencies,
        failed: [],
        errors: [],
        duration: 0
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setHasError(true);
      setError(errorMessage);
      setResult({
        success: false,
        loaded: [],
        failed: dependencies,
        errors: [errorMessage],
        duration: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, [dependencies]);

  const retry = useCallback(() => {
    loadSpecificDependencies();
  }, [loadSpecificDependencies]);

  useEffect(() => {
    loadSpecificDependencies();
  }, [loadSpecificDependencies]);

  return {
    isLoading,
    isLoaded,
    hasError,
    error,
    result,
    retry,
  };
}

/**
 * Hook to check if dependencies are ready
 */
export function useDependencyStatus() {
  const [status, setStatus] = useState({
    loaded: [] as string[],
    loading: [] as string[],
    ready: false,
  });

  useEffect(() => {
    const checkStatus = () => {
      const currentStatus = dependencyLoader.getStatus();
      const ready = currentStatus.loaded.includes('parsonsWidget') && 
                   currentStatus.loading.length === 0;
      
      setStatus({
        ...currentStatus,
        ready,
      });
    };

    // Check immediately
    checkStatus();

    // Set up periodic checking
    const interval = setInterval(checkStatus, 500);

    return () => clearInterval(interval);
  }, []);

  return status;
}
