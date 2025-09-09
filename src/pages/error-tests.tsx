/**
 * Error Handling Test Index
 * Links to all error handling test pages
 */

import React from 'react';
import Link from 'next/link';
import { NextPage } from 'next';

const ErrorTestsIndexPage: NextPage = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Error Handling System Tests</h1>
      
      <p className="text-lg text-gray-700 mb-8">
        This index page provides links to various tests for the error handling system.
        These tests demonstrate how the system handles different types of errors in different parts of the application.
      </p>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-4">Component Error Tests</h2>
          <p className="mb-4 text-gray-600">
            Tests error handling in React components, event handlers, and async operations.
          </p>
          <Link href="/error-test" className="text-blue-600 hover:text-blue-800 font-medium">
            View Component Tests &rarr;
          </Link>
        </div>
        
        <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-4">API Error Tests</h2>
          <p className="mb-4 text-gray-600">
            Tests BaseApiService error handling with different API error scenarios.
          </p>
          <Link href="/api-test" className="text-blue-600 hover:text-blue-800 font-medium">
            View API Tests &rarr;
          </Link>
        </div>
        
        <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-4">Enhanced Components</h2>
          <p className="mb-4 text-gray-600">
            Shows the enhanced components with integrated error handling.
          </p>
          <Link href="/enhanced" className="text-blue-600 hover:text-blue-800 font-medium">
            View Enhanced Components &rarr;
          </Link>
        </div>
      </div>
      
      <div className="mt-12 p-6 border rounded-lg bg-blue-50">
        <h2 className="text-xl font-semibold mb-4">Error Handling Documentation</h2>
        <p className="mb-4">
          The error handling system includes the following key components:
        </p>
        <ul className="list-disc pl-8 mb-6">
          <li className="mb-2"><code className="bg-gray-100 px-2 py-1 rounded">ErrorFactory</code> - Creates standardized error objects</li>
          <li className="mb-2"><code className="bg-gray-100 px-2 py-1 rounded">ErrorHandler</code> - Processes and logs errors</li>
          <li className="mb-2"><code className="bg-gray-100 px-2 py-1 rounded">GlobalErrorHandler</code> - Catches uncaught errors</li>
          <li className="mb-2"><code className="bg-gray-100 px-2 py-1 rounded">EnhancedErrorBoundary</code> - Boundary for React components</li>
          <li className="mb-2"><code className="bg-gray-100 px-2 py-1 rounded">StandardErrorDisplay</code> - Standardized error UI</li>
          <li className="mb-2"><code className="bg-gray-100 px-2 py-1 rounded">BaseApiService</code> - API error handling</li>
        </ul>
        <p>
          See the <Link href="https://github.com/Athira-L-I/v2-parsons-ai-tutor/blob/main/src/errors/README.md" className="text-blue-600 hover:text-blue-800 font-medium">error handling documentation</Link> for more details.
        </p>
      </div>
    </div>
  );
};

export default ErrorTestsIndexPage;
