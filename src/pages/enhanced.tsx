/**
 * Enhanced Home Page with robust error handling
 * This demonstrates how to apply our error handling framework to a page
 */

import React from 'react';
import { NextPage } from 'next';
import { EnhancedErrorBoundary } from '@/errors/EnhancedErrorBoundary';
import { StandardErrorDisplay } from '@/components/StandardErrorDisplay';
import { useErrorHandler } from '@/errors/useErrorHandler';
import HomePage from './index';
import { EnhancedParsonsBoard } from '@/components/EnhancedParsonsBoard';
import { EnhancedChatFeedbackPanel } from '@/components/EnhancedChatFeedbackPanel';

const EnhancedHomePage: NextPage = () => {
  const { handleError, error, clearError } = useErrorHandler('HomePage');
  
  // Handler for global page errors
  const onPageError = (err: Error) => {
    handleError(err, 'An error occurred while loading the page');
  };

  return (
    <EnhancedErrorBoundary
      component="HomePage"
      onError={onPageError}
      className="p-4 m-4 rounded-lg"
    >
      {error ? (
        <StandardErrorDisplay
          error={error}
          onRetry={clearError}
          className="max-w-2xl mx-auto my-8 p-4 rounded-lg"
        />
      ) : (
        <HomePage />
      )}
      
      {/* Usage examples for enhanced components */}
      <div className="mt-8 p-4 border-t border-gray-200 pt-8">
        <h2 className="text-2xl font-bold mb-6">Enhanced Components Demo</h2>
        <p className="mb-4 text-gray-600">
          The components below have been enhanced with comprehensive error handling.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-3">Enhanced Parsons Board</h3>
            <EnhancedParsonsBoard />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-3">Enhanced Chat Feedback</h3>
            <EnhancedChatFeedbackPanel />
          </div>
        </div>
      </div>
    </EnhancedErrorBoundary>
  );
};

export default EnhancedHomePage;
