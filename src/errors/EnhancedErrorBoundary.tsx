/**
 * Enhanced Error Boundary Component
 * Catches errors in its child components and displays standardized error UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StandardErrorDisplay } from '@/components/StandardErrorDisplay';
import { ErrorHandler } from '@/errors/ErrorHandler';
import { ErrorFactory } from '@/errors/ErrorFactory';

interface EnhancedErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  component?: string;
  className?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface EnhancedErrorBoundaryState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class EnhancedErrorBoundary extends Component<
  EnhancedErrorBoundaryProps,
  EnhancedErrorBoundaryState
> {
  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render shows the fallback UI
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can log the error to an error reporting service
    this.setState({ errorInfo });
    
    // Create a standardized app error
    const appError = ErrorFactory.createApplicationError(
      `Error in component ${this.props.component || 'unknown'}`,
      error,
      {
        component: this.props.component,
        additionalData: {
          componentStack: errorInfo.componentStack,
        },
      }
    );
    
    // Log with our error handler
    ErrorHandler.logError(appError);
    
    // Call onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ error: null, errorInfo: null });
  };

  render() {
    const { error } = this.state;
    const { children, fallback, className = '' } = this.props;
    
    if (error) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback;
      }
      
      // Otherwise use our standard error display
      return (
        <StandardErrorDisplay
          error={error}
          onRetry={this.handleRetry}
          className={className}
          showDetails={process.env.NODE_ENV !== 'production'}
        />
      );
    }
    
    return children;
  }
}
