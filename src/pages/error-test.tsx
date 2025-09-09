/**
 * Test page for error handling system
 * This page demonstrates various error handling scenarios
 */

import React, { useState } from 'react';
import { NextPage } from 'next';
import { EnhancedErrorBoundary } from '@/errors/EnhancedErrorBoundary';
import { StandardErrorDisplay } from '@/components/StandardErrorDisplay';
import { useErrorHandler } from '@/errors/useErrorHandler';
import { ErrorFactory } from '@/errors/ErrorFactory';
import { ErrorSeverity, ErrorRecoveryStrategy } from '@/errors/types';
import { enhancedFeedbackApiService } from '@/api/services/EnhancedFeedbackApiService';
import { enhancedSolutionApiService } from '@/api/services/EnhancedSolutionApiService';

// Component that will throw an error
const ErrorComponent: React.FC = () => {
  throw new Error("This is a test error from ErrorComponent");
  return <div>This will never render</div>;
};

// Component with button that triggers an error
const ErrorButtonComponent: React.FC = () => {
  const triggerError = () => {
    throw new Error("Error triggered from button click");
  };
  
  return (
    <button 
      onClick={triggerError}
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
    >
      Trigger Error
    </button>
  );
};

// Component with async error
const AsyncErrorComponent: React.FC = () => {
  const { handleError } = useErrorHandler('AsyncErrorComponent');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const triggerAsyncError = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call that fails
      await new Promise((_, reject) => setTimeout(() => reject(new Error("Async operation failed")), 1000));
    } catch (err) {
      handleError(err, 'async operation');
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }
  
  if (error) {
    return <StandardErrorDisplay error={error} onRetry={() => setError(null)} />;
  }
  
  return (
    <button 
      onClick={triggerAsyncError}
      className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
    >
      Trigger Async Error
    </button>
  );
};

// Component that tests API error handling
const ApiErrorComponent: React.FC = () => {
  const { handleError: logError } = useErrorHandler('ApiErrorComponent');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const triggerApiError = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call API with invalid parameters to trigger error
      await enhancedFeedbackApiService.generateFeedback({
        problemId: '', // Invalid empty ID
        currentSolution: []
      });
    } catch (err) {
      logError(err, 'API call failed');
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };
  
  const triggerSolutionApiError = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call API with invalid parameters to trigger error
      await enhancedSolutionApiService.validateSolution({
        problemId: '', // Invalid empty ID
        solution: []
      });
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <div className="p-4">Loading API...</div>;
  }
  
  if (error) {
    return <StandardErrorDisplay error={error} onRetry={() => setError(null)} />;
  }
  
  return (
    <div className="space-y-4">
      <button 
        onClick={triggerApiError}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Feedback API Error
      </button>
      <button 
        onClick={triggerSolutionApiError}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-4"
      >
        Test Solution API Error
      </button>
    </div>
  );
};

// Component that tests different error types
const ErrorTypesComponent: React.FC = () => {
  const [errorType, setErrorType] = useState<string | null>(null);
  
  const createNetworkError = () => {
    setErrorType('network');
  };
  
  const createValidationError = () => {
    setErrorType('validation');
  };
  
  const createCriticalError = () => {
    setErrorType('critical');
  };
  
  const createDependencyError = () => {
    setErrorType('dependency');
  };
  
  const clearError = () => {
    setErrorType(null);
  };
  
  let error = null;
  
  if (errorType === 'network') {
    error = ErrorFactory.createNetworkError(
      'timeout',
      new Error('Network request timed out'),
      { 
        additionalData: { 
          endpoint: '/api/test' 
        }
      }
    );
  } else if (errorType === 'validation') {
    error = ErrorFactory.createValidationError(
      'email',
      'format',
      'invalid@email',
      'Invalid email format'
    );
  } else if (errorType === 'critical') {
    const criticalError = ErrorFactory.createApplicationError(
      'Critical system error',
      new Error('Database connection failed')
    );
    criticalError.severity = ErrorSeverity.CRITICAL;
    error = criticalError;
  } else if (errorType === 'dependency') {
    // We need to use the factory methods that are available
    const dependencyError = ErrorFactory.createApplicationError(
      'Failed to load dependency',
      new Error('A required component failed to load'),
      {
        component: 'CodeMirror',
        additionalData: {
          dependency: 'CodeMirror',
          version: '6.0.1'
        }
      }
    );
    // We can't change the category, but we can adjust severity and recovery strategy
    dependencyError.severity = ErrorSeverity.HIGH;
    dependencyError.recoveryStrategy = ErrorRecoveryStrategy.RELOAD;
    error = dependencyError;
  }
  
  if (error) {
    return (
      <div className="space-y-4">
        <StandardErrorDisplay error={error} onRetry={clearError} />
        <button 
          onClick={clearError}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Error
        </button>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <button 
        onClick={createNetworkError}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Network Error
      </button>
      <button 
        onClick={createValidationError}
        className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
      >
        Validation Error
      </button>
      <button 
        onClick={createCriticalError}
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
      >
        Critical Error
      </button>
      <button 
        onClick={createDependencyError}
        className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
      >
        Dependency Error
      </button>
    </div>
  );
};

// Global error test
const GlobalErrorTest: React.FC = () => {
  const triggerGlobalError = () => {
    // This will be caught by the GlobalErrorHandler
    setTimeout(() => {
      throw new Error("Unhandled error (should be caught by GlobalErrorHandler)");
    }, 0);
  };
  
  const triggerUnhandledPromiseRejection = () => {
    // This creates an unhandled promise rejection
    Promise.reject(new Error("Unhandled promise rejection (should be caught by GlobalErrorHandler)"));
  };
  
  return (
    <div className="space-x-4">
      <button 
        onClick={triggerGlobalError}
        className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
      >
        Trigger Global Error
      </button>
      
      <button 
        onClick={triggerUnhandledPromiseRejection}
        className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-900"
      >
        Trigger Unhandled Promise
      </button>
    </div>
  );
};

const ErrorTestPage: NextPage = () => {
  // We use useErrorHandler in the child components
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Error Handling System Test</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">1. Component Error</h2>
          <p className="mb-4 text-gray-600">
            This tests the EnhancedErrorBoundary by rendering a component that throws.
          </p>
          <EnhancedErrorBoundary component="ErrorComponent">
            <ErrorComponent />
          </EnhancedErrorBoundary>
        </div>
        
        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">2. Event Handler Error</h2>
          <p className="mb-4 text-gray-600">
            This tests error handling in event handlers (click the button).
          </p>
          <EnhancedErrorBoundary component="ErrorButtonComponent">
            <ErrorButtonComponent />
          </EnhancedErrorBoundary>
        </div>
        
        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">3. Async Error</h2>
          <p className="mb-4 text-gray-600">
            This tests handling errors in async operations.
          </p>
          <EnhancedErrorBoundary component="AsyncErrorComponent">
            <AsyncErrorComponent />
          </EnhancedErrorBoundary>
        </div>
        
        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">4. API Error</h2>
          <p className="mb-4 text-gray-600">
            This tests error handling in API calls.
          </p>
          <EnhancedErrorBoundary component="ApiErrorComponent">
            <ApiErrorComponent />
          </EnhancedErrorBoundary>
        </div>
        
        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">5. Error Types</h2>
          <p className="mb-4 text-gray-600">
            This tests different error types and their display.
          </p>
          <EnhancedErrorBoundary component="ErrorTypesComponent">
            <ErrorTypesComponent />
          </EnhancedErrorBoundary>
        </div>
        
        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">6. Global Error</h2>
          <p className="mb-4 text-gray-600">
            This tests the GlobalErrorHandler for unhandled errors.
          </p>
          <EnhancedErrorBoundary component="GlobalErrorTest">
            <GlobalErrorTest />
          </EnhancedErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default ErrorTestPage;
