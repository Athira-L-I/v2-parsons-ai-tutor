/**
 * Enhanced ChatFeedbackPanel with robust error handling
 */

import React from 'react';
import { EnhancedErrorBoundary } from '@/errors/EnhancedErrorBoundary';
import ChatFeedbackPanel from './ChatFeedbackPanel';
import { StandardErrorDisplay } from './StandardErrorDisplay';
import { useErrorHandler } from '@/errors/useErrorHandler';

export const EnhancedChatFeedbackPanel: React.FC = () => {
  const { handleError } = useErrorHandler('ChatFeedbackPanel');

  // Centralized error handler for chat feedback
  const onError = (error: Error) => {
    handleError(
      error, 
      'An error occurred in the chat feedback panel',
      { component: 'ChatFeedbackPanel' }
    );
  };

  return (
    <EnhancedErrorBoundary 
      component="ChatFeedbackPanel"
      onError={onError}
      className="border border-gray-200 rounded-md p-4 bg-white"
    >
      <ErrorCatcher onError={onError}>
        <ChatFeedbackPanel />
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
      // Only handle errors from this component's children
      if (event.target && 
          event.target instanceof Node && 
          event.currentTarget instanceof Node &&
          event.currentTarget.contains(event.target)) {
        setError(event.error);
        onError(event.error);
        event.preventDefault();
      }
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
