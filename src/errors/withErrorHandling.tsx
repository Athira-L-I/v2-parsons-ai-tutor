/**
 * withErrorHandling HOC
 * Higher-Order Component for adding error handling to any component
 */

import React, { ComponentType } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { ApplicationError } from './types';

interface WithErrorHandlingOptions {
  componentName?: string;
  fallback?: React.ReactNode;
  onError?: (error: ApplicationError) => void;
}

/**
 * Higher-Order Component that wraps a component with error handling
 */
export function withErrorHandling<P extends object>(
  Component: ComponentType<P>,
  options: WithErrorHandlingOptions = {}
): React.FC<P> {
  const { componentName, fallback, onError } = options;
  
  const displayName = componentName || Component.displayName || Component.name || 'Component';
  
  const WithErrorHandling: React.FC<P> = (props) => {
    return (
      <ErrorBoundary component={displayName} fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
  
  WithErrorHandling.displayName = `withErrorHandling(${displayName})`;
  
  return WithErrorHandling;
}
