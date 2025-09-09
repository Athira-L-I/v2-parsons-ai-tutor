/**
 * Enhanced dependency error boundary using our error handling system
 */

import React from 'react';
import { ErrorBoundary } from '@/errors/ErrorBoundary';
import { ErrorFactory } from '@/errors/ErrorFactory';
import { DependencyError } from '@/errors/types';

interface DependencyErrorBoundaryProps {
  children: React.ReactNode;
  dependencyName: string;
  fallback?: React.ReactNode;
  onError?: (error: DependencyError) => void;
}

export const EnhancedDependencyErrorBoundary: React.FC<DependencyErrorBoundaryProps> = ({
  children,
  dependencyName,
  fallback,
  onError
}) => {
  const handleError = (appError: any) => {
    // Create a specialized dependency error
    const dependencyError = ErrorFactory.createDependencyError(
      dependencyName,
      appError.originalError || new Error(appError.message || 'Unknown dependency error'),
      { component: `DependencyLoader:${dependencyName}` }
    );
    
    // Pass to parent if handler provided
    if (onError) {
      onError(dependencyError);
    }
  };
  
  return (
    <ErrorBoundary
      component={`DependencyLoader:${dependencyName}`}
      onError={handleError}
      fallback={fallback}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * DependencyLoader component with integrated error handling
 */
interface DependencyLoaderProps {
  name: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: DependencyError) => void;
}

export const DependencyLoader: React.FC<DependencyLoaderProps> = ({
  name,
  children,
  fallback,
  onError
}) => {
  return (
    <EnhancedDependencyErrorBoundary
      dependencyName={name}
      fallback={fallback}
      onError={onError}
    >
      {children}
    </EnhancedDependencyErrorBoundary>
  );
};
