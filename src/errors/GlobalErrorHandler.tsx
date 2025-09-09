/**
 * Global Error Handler
 * Catches and handles uncaught errors and unhandled promise rejections
 * This should be included near the top of the application tree
 */

import { useEffect, FC } from 'react';
import { ErrorHandler } from '@/errors/ErrorHandler';
import { ErrorFactory } from '@/errors/ErrorFactory';
import { ErrorSeverity } from '@/errors/types';

interface GlobalErrorHandlerProps {
  onError?: (error: Error) => void;
}

export const GlobalErrorHandler: FC<GlobalErrorHandlerProps> = ({ onError }) => {
  useEffect(() => {
    // Handler for unhandled errors
    const handleGlobalError = (
      event: ErrorEvent | PromiseRejectionEvent,
      source: 'error' | 'unhandledrejection'
    ) => {
      // Prevent default browser handling
      event.preventDefault();
      
      const originalError = source === 'error' 
        ? (event as ErrorEvent).error 
        : (event as PromiseRejectionEvent).reason;
        
      // Create a standardized AppError
      const appError = ErrorFactory.createApplicationError(
        source === 'error' ? 'Uncaught error' : 'Unhandled promise rejection',
        originalError instanceof Error ? originalError : new Error(String(originalError)),
        {
          additionalData: {
            source,
            message: source === 'error' 
              ? (event as ErrorEvent).message 
              : String((event as PromiseRejectionEvent).reason),
            filename: source === 'error' ? (event as ErrorEvent).filename : undefined,
            lineno: source === 'error' ? (event as ErrorEvent).lineno : undefined,
            colno: source === 'error' ? (event as ErrorEvent).colno : undefined,
          }
        }
      );
      
      // Log the error using our centralized error handler
      ErrorHandler.logError(appError);
      
      // Call the onError callback if provided
      if (onError && originalError instanceof Error) {
        onError(originalError);
      }
      
      // Optionally show UI notification for critical errors
      if (appError.severity === ErrorSeverity.CRITICAL || 
          appError.severity === ErrorSeverity.HIGH) {
        ErrorHandler.showErrorNotification(appError);
      }
      
      return true;
    };

    // Add global error handlers
    const errorHandler = (event: ErrorEvent) => handleGlobalError(event, 'error');
    const rejectionHandler = (event: PromiseRejectionEvent) => 
      handleGlobalError(event, 'unhandledrejection');
    
    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    // Remove handlers on cleanup
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, [onError]);

  // This component doesn't render anything
  return null;
};
