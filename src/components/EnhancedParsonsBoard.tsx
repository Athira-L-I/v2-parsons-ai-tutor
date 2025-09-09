/**
 * Enhanced ParsonsBoard with robust error handling
 */

import React from 'react';
import { EnhancedErrorBoundary } from '@/errors/EnhancedErrorBoundary';
import ParsonsBoard from './ParsonsBoard';
import { StandardErrorDisplay } from './StandardErrorDisplay';
import { useErrorHandler } from '@/errors/useErrorHandler';

export const EnhancedParsonsBoard: React.FC = () => {
  const { handleError } = useErrorHandler('ParsonsBoard');

  // Centralized error handler for any errors
  const onError = (error: Error) => {
    handleError(error, 'A problem occurred while interacting with the code blocks');
  };

  return (
    <EnhancedErrorBoundary 
      component="ParsonsBoard"
      onError={onError}
      className="border border-gray-200 rounded-md p-4 bg-white"
    >
      <ErrorCatcher onError={onError}>
        <ParsonsBoard />
      </ErrorCatcher>
    </EnhancedErrorBoundary>
  );
};

// Simple component to catch errors within the functional component lifecycle
interface ErrorCatcherProps {
  children: React.ReactNode;
  onError: (error: Error) => void;
}

const ErrorCatcher: React.FC<ErrorCatcherProps> = ({ children, onError }) => {
  const [error, setError] = React.useState<Error | null>(null);
  
  // Reset error state
  const handleRetry = () => {
    setError(null);
  };
  
  // Catch errors in event handlers and async functions
  React.useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      setError(event.error);
      onError(event.error);
      event.preventDefault();
    };
    
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, [onError]);
  
  if (error) {
    return (
      <StandardErrorDisplay
        error={error}
        onRetry={handleRetry}
        showDetails={process.env.NODE_ENV !== 'production'}
      />
    );
  }
  
  return <>{children}</>;
};
