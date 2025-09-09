/**
 * ErrorBoundary component
 * Catches React component errors and displays fallback UI
 */

import React from 'react';
import { ErrorFactory } from './ErrorFactory';
import { ErrorHandler } from './ErrorHandler';
import { ApplicationError, ErrorContext } from './types';
import { ErrorDisplay } from './ErrorDisplay';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: ApplicationError) => void;
  component?: string;
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  error: ApplicationError | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Create a standardized application error
    const appError = ErrorFactory.createApplicationError(
      error.message,
      error
    );
    
    return { error: appError };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Enhance error with component stack
    const { component } = this.props;
    const context: ErrorContext = {
      component,
      additionalData: {
        componentStack: info.componentStack,
      }
    };

    // Create enhanced error with React component details
    const appError = ErrorFactory.createApplicationError(
      error.message,
      error,
      context
    );
    
    // Add component stack to the error
    if (info.componentStack) {
      appError.componentStack = info.componentStack;
    }

    // Set the state with the enhanced error
    this.setState({ error: appError });

    // Log the error
    ErrorHandler.logError(appError);

    // Call the optional onError callback
    if (this.props.onError) {
      this.props.onError(appError);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state if resetKeys have changed
    if (
      this.state.error !== null &&
      this.props.resetKeys &&
      this.props.resetKeys.length > 0 &&
      prevProps.resetKeys &&
      prevProps.resetKeys.some((key, i) => key !== this.props.resetKeys?.[i])
    ) {
      this.setState({ error: null });
    }
  }

  private handleReset = (): void => {
    this.setState({ error: null });
  }

  render(): React.ReactNode {
    const { error } = this.state;
    
    // If there's no error, render children normally
    if (error === null) {
      return this.props.children;
    }

    // If a custom fallback is provided, use it
    if (this.props.fallback) {
      return this.props.fallback;
    }

    // Otherwise, use the default error display
    return <ErrorDisplay 
      error={error} 
      onReset={this.handleReset}
      showReset={true}
    />;
  }
}
