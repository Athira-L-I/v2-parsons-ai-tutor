/**
 * Component that handles dependency loading with proper UI feedback
 */

import React from 'react';
import { useDependencies } from '@/hooks/useDependencies';
import { DependencyErrorBoundary } from './DependencyErrorBoundary';

interface DependencyLoaderProps {
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  showDetails?: boolean;
}

export const DependencyLoader: React.FC<DependencyLoaderProps> = ({
  children,
  loadingComponent,
  errorComponent,
  showDetails = false,
}) => {
  const { isLoading, isLoaded, hasError, error, result, retry } =
    useDependencies();

  // Loading state
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div className="dependency-loader-loading">
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 text-center">
            Loading Parsons components...
          </p>
          <p className="text-gray-500 text-sm text-center mt-2">
            This may take a few seconds on first load
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }

    return (
      <div className="dependency-loader-error">
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 max-w-md mx-auto mt-8">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Component Loading Issue
              </h3>
            </div>
          </div>

          <div className="text-sm text-yellow-700 mb-4">
            {error || 'Failed to load required components'}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={retry}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm font-medium"
            >
              Try Again
            </button>
          </div>

          {/* Show details in development */}
          {showDetails && result && result.errors.length > 0 && (
            <details className="mt-4">
              <summary className="text-sm font-medium text-yellow-800 cursor-pointer">
                Loading Details
              </summary>
              <div className="mt-2 text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
                <div>✅ Loaded: {result.loaded.join(', ') || 'none'}</div>
                <div>❌ Failed: {result.failed.join(', ') || 'none'}</div>
                <div>⏱️ Duration: {result.duration}ms</div>
                {result.errors.length > 0 && (
                  <div className="mt-2">
                    <div>Errors:</div>
                    <ul className="list-disc list-inside">
                      {result.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  // Success state - render children with error boundary
  if (isLoaded) {
    return <DependencyErrorBoundary>{children}</DependencyErrorBoundary>;
  }

  // Fallback (shouldn't reach here normally)
  return (
    <div className="dependency-loader-fallback">
      <div className="text-center text-gray-500 p-8">
        Initializing Parsons components...
      </div>
    </div>
  );
};
