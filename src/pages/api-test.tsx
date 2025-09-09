/**
 * API Error Handling Test Page
 * This page demonstrates and tests our API error handling implementation
 */

import React, { useState } from 'react';
import { NextPage } from 'next';
import { testApiService } from '@/api/services/TestApiService';
import { StandardErrorDisplay } from '@/components/StandardErrorDisplay';
import { useErrorHandler } from '@/errors/useErrorHandler';

const ApiErrorTestPage: NextPage = () => {
  const { handleError } = useErrorHandler('ApiErrorTestPage');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ name: string; result: unknown } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const runTest = async (testFn: () => Promise<unknown>, name: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const result = await testFn();
      setResult({ name, result });
    } catch (err) {
      handleError(err, `API test "${name}" failed`);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };
  
  const testSuccess = () => runTest(() => 
    testApiService.testSuccess({ message: 'Success!' }),
    'Success'
  );
  
  const testApiError = () => runTest(() => 
    testApiService.testApiError('API error from server'),
    'API Error'
  );
  
  const testEmptyError = () => runTest(() => 
    testApiService.testEmptyError(),
    'Empty Error'
  );
  
  const testJsError = () => runTest(() => 
    testApiService.testJsError('JavaScript error during request'),
    'JS Error'
  );
  
  const testValidationError = () => runTest(() => 
    testApiService.testValidation('username', ''),
    'Validation Error'
  );
  
  const clearResults = () => {
    setError(null);
    setResult(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">API Error Handling Test</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Test API Error Handling</h2>
          <p className="mb-4 text-gray-600">
            Click the buttons below to test different API error scenarios.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={testSuccess}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Test Success
            </button>
            
            <button 
              onClick={testApiError}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              Test API Error
            </button>
            
            <button 
              onClick={testEmptyError}
              disabled={isLoading}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              Test Empty Error
            </button>
            
            <button 
              onClick={testJsError}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Test JS Error
            </button>
            
            <button 
              onClick={testValidationError}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Test Validation
            </button>
            
            <button 
              onClick={clearResults}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Results
            </button>
          </div>
        </div>
        
        <div className="border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Results</h2>
          
          {isLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2">Loading...</span>
            </div>
          )}
          
          {!isLoading && error && (
            <div className="mt-4">
              <h3 className="font-medium text-red-600 mb-2">Error:</h3>
              <StandardErrorDisplay 
                error={error} 
                onRetry={clearResults}
                showDetails={true}
              />
            </div>
          )}
          
          {!isLoading && result && (
            <div className="mt-4">
              <h3 className="font-medium text-green-600 mb-2">Result from &ldquo;{result.name}&rdquo; test:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-64">
                {JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiErrorTestPage;
