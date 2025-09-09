/**
 * Global error handler component
 * To be integrated into _app.tsx
 */

import React, { useEffect } from 'react';
import { ErrorHandler } from '@/errors/ErrorHandler';
import { ErrorFactory } from '@/errors/ErrorFactory';

export const GlobalErrorHandler: React.FC = () => {
  useEffect(() => {
    // Handler for uncaught errors
    const handleGlobalError = (event: ErrorEvent) => {
      event.preventDefault();
      
      const appError = ErrorFactory.createApplicationError(
        event.message || 'Uncaught error',
        event.error,
        {
          additionalData: {
            source: event.filename,
            line: event.lineno,
            column: event.colno
          }
        }
      );
      
      ErrorHandler.processError(appError);
    };

    // Handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      
      const appError = ErrorFactory.createApplicationError(
        'Unhandled promise rejection',
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          url: window.location.href,
          additionalData: {
            reason: event.reason
          }
        }
      );
      
      ErrorHandler.processError(appError);
    };

    // Set up listeners
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Remove listeners on cleanup
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null; // This component doesn't render anything
};

/**
 * Error toast container component for displaying non-critical errors
 */
export const ErrorToastContainer: React.FC = () => {
  // Implementation would depend on your UI library for toasts
  // This would subscribe to ErrorHandler or a centralized store
  // and display toast notifications for certain types of errors

  return null; // Placeholder
};
