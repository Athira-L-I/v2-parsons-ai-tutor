/**
 * Error Display Component
 * Displays user-friendly error messages with appropriate actions
 */

import React, { useState } from 'react';
import { AppError } from './types';
import { ErrorHandler } from './ErrorHandler';

interface ErrorDisplayProps {
  error: AppError;
  onReset?: () => void;
  showReset?: boolean;
  showDetails?: boolean;
  className?: string;
  compact?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onReset,
  showReset = false,
  showDetails = false,
  className = '',
  compact = false
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(showDetails);
  const { title, description, actions, icon } = ErrorHandler.getErrorDisplayInfo(error);

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
  };

  const getIconComponent = () => {
    switch (icon) {
      case 'error':
        return (
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'network':
        return (
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const technicalDetails = ErrorHandler.getTechnicalDetails(error);

  if (compact) {
    return (
      <div className={`px-3 py-2 border rounded ${getErrorBackground()} ${className}`} role="alert">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-2">{getIconComponent()}</div>
          <p className="text-sm font-medium">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-md shadow-sm ${getErrorBackground()} ${className}`} role="alert">
      <div className="px-4 py-3">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3">{getIconComponent()}</div>
          <div>
            <h3 className="font-medium text-lg">{title}</h3>
            <p className="text-sm">{description}</p>
          </div>
        </div>

        {showReset && (
          <div className="mt-4">
            <button 
              onClick={handleReset} 
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="flex mt-4 space-x-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.action();
                if (action.type === 'retry' && onReset) {
                  onReset();
                }
              }}
              className={`px-3 py-1 text-sm rounded ${
                action.primary
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              } ${action.destructive ? 'bg-red-500 text-white hover:bg-red-600' : ''}`}
            >
              {action.label}
            </button>
          ))}
        </div>

        {ErrorHandler.getErrorDisplayInfo(error).showTechnicalDetails && (
          <div className="mt-4">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-sm text-blue-600 hover:underline"
            >
              {showTechnicalDetails ? 'Hide' : 'Show'} technical details
            </button>

            {showTechnicalDetails && (
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-60">
                <pre>{JSON.stringify(technicalDetails, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function getErrorBackground(): string {
  return 'bg-red-50 border-red-200';
}
