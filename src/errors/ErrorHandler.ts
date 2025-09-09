/**
 * Error handling utility
 * Provides centralized error handling, logging, recovery and display options
 */

import { AppError, ErrorDisplayInfo, ErrorRecoveryAction, ErrorRecoveryStrategy, ErrorSeverity } from './types';
import { ErrorFactory } from './ErrorFactory';

export class ErrorHandler {
  /**
   * Process an error and determine appropriate actions
   */
  static processError(error: Error | unknown, contextInfo?: Record<string, unknown>): AppError {
    // Convert to AppError if it's not already
    let appError: AppError;
    if (this.isAppError(error)) {
      appError = error;
    } else {
      // Convert to AppError
      appError = ErrorFactory.fromError(error, undefined, { 
        additionalData: contextInfo
      });
    }

    // Log the error based on severity
    this.logError(appError);

    // Return processed error
    return appError;
  }

  /**
   * Check if an error is an AppError
   */
  static isAppError(error: unknown): error is AppError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'category' in error &&
      'severity' in error &&
      'code' in error &&
      'id' in error
    );
  }

  /**
   * Log an error appropriately based on its severity
   */
  static logError(error: AppError): void {
    const { severity, category, message, code, id } = error;
    
    // Create log message with important metadata
    const logPrefix = `[${category}][${code}][${id}]`;
    
    // Log based on severity
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error(`${logPrefix} ${message}`, error);
        // In a production app, you'd send this to a logging service
        this.sendErrorToLoggingService(error);
        break;
        
      case ErrorSeverity.MEDIUM:
        console.warn(`${logPrefix} ${message}`, error);
        break;
        
      case ErrorSeverity.LOW:
      default:
        console.info(`${logPrefix} ${message}`);
        break;
    }
  }

  /**
   * Generate user-facing error info with appropriate actions
   */
  static getErrorDisplayInfo(error: AppError): ErrorDisplayInfo {
    const actions: ErrorRecoveryAction[] = [];
    let title = '';
    const description = error.userMessage;
    let showTechnicalDetails = false;
    let icon: 'warning' | 'error' | 'info' | 'network' = 'error';

    // Create actions based on recovery strategy
    switch (error.recoveryStrategy) {
      case ErrorRecoveryStrategy.RETRY:
        actions.push({
          type: 'retry',
          label: 'Try Again',
          action: () => {
            // This would be implemented by the consumer
            return Promise.resolve();
          },
          primary: true,
        });
        break;
        
      case ErrorRecoveryStrategy.MANUAL_RETRY:
        actions.push({
          type: 'retry',
          label: 'Try Again',
          action: () => {
            // This would be implemented by the consumer
            return Promise.resolve();
          },
          primary: true,
        });
        actions.push({
          type: 'dismiss',
          label: 'Cancel',
          action: () => void 0,
        });
        break;
        
      case ErrorRecoveryStrategy.FALLBACK:
        // Fallback actions would be provided by the component using this
        break;
        
      case ErrorRecoveryStrategy.REDIRECT:
        actions.push({
          type: 'redirect',
          label: 'Go Back',
          action: () => {
            if (typeof window !== 'undefined') {
              window.history.back();
            }
            return Promise.resolve();
          },
        });
        break;
        
      case ErrorRecoveryStrategy.RELOAD:
        actions.push({
          type: 'reload',
          label: 'Refresh Page',
          action: () => {
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
            return Promise.resolve();
          },
          primary: true,
        });
        break;
        
      case ErrorRecoveryStrategy.CONTACT_SUPPORT:
        actions.push({
          type: 'redirect',
          label: 'Contact Support',
          action: () => {
            // In a real app, this would open a support ticket or contact form
            return Promise.resolve();
          },
          primary: true,
        });
        showTechnicalDetails = true;
        break;
        
      case ErrorRecoveryStrategy.IGNORE:
      default:
        actions.push({
          type: 'dismiss',
          label: 'Dismiss',
          action: () => void 0,
        });
        break;
    }

    // Set title and icon based on severity
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        title = 'Critical Error';
        icon = 'error';
        showTechnicalDetails = true;
        break;
        
      case ErrorSeverity.HIGH:
        title = 'Error';
        icon = 'error';
        break;
        
      case ErrorSeverity.MEDIUM:
        title = 'Warning';
        icon = 'warning';
        break;
        
      case ErrorSeverity.LOW:
      default:
        title = 'Notice';
        icon = 'info';
        break;
    }

    // Override for network errors
    if (error.category === 'network') {
      icon = 'network';
      title = 'Connection Issue';
    }

    return {
      title,
      description,
      actions,
      showTechnicalDetails,
      icon,
    };
  }

  /**
   * Get detailed technical information about the error (for debugging)
   */
  static getTechnicalDetails(error: AppError): Record<string, unknown> {
    return {
      id: error.id,
      code: error.code,
      message: error.message,
      category: error.category,
      severity: error.severity,
      timestamp: error.timestamp,
      context: error.context,
      stack: error.originalError?.stack,
    };
  }

  /**
   * Send error to external logging service
   * This is a stub - would be implemented with an actual service
   */
  private static sendErrorToLoggingService(error: AppError): void {
    // In a real app, you'd send to a service like Sentry, LogRocket, etc.
    if (process.env.NODE_ENV !== 'production') {
      console.log('Error would be sent to logging service:', error);
    }
    
    // Example implementation:
    // try {
    //   fetch('/api/log-error', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       id: error.id,
    //       code: error.code,
    //       message: error.message,
    //       userMessage: error.userMessage,
    //       category: error.category,
    //       severity: error.severity,
    //       context: error.context,
    //       timestamp: error.timestamp,
    //       stack: error.originalError?.stack,
    //     }),
    //   });
    // } catch (e) {
    //   // Don't let logging errors cause more errors
    //   console.error('Failed to send error to logging service', e);
    // }
  }
}
