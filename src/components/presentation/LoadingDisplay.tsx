import React from 'react';

interface LoadingDisplayProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Pure presentation component for loading states
 */
export const LoadingDisplay: React.FC<LoadingDisplayProps> = ({
  message = 'Loading problem...',
  size = 'medium',
}) => {
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
  };

  return (
    <div className="loading-display flex flex-col justify-center items-center h-64">
      <div
        className={`animate-spin rounded-full border-t-2 border-b-2 border-blue-500 ${sizeClasses[size]}`}
      />
      {message && (
        <p className="mt-4 text-gray-600 text-center">{message}</p>
      )}
    </div>
  );
};
