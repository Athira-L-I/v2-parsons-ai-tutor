import React from 'react';
import dynamic from 'next/dynamic';
import { ProblemData } from '@/@types/types';

const ParsonsPuzzleIntegrated = dynamic(() => import('../ParsonsPuzzleIntegrated'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

interface ProblemInterfaceProps {
  problemData: ProblemData | null;
  title?: string;
  description?: string;
  adaptiveFeaturesEnabled?: boolean;
  adaptationMessage?: string | null;
  onEnableAdaptiveFeatures?: () => void;
  onDisableAdaptiveFeatures?: () => void;
  onApplyAdaptiveFeatures?: () => void;
  onResetToOriginal?: () => void;
  onClearProgress?: () => void;
  onSolutionCheck?: (isCorrect: boolean) => void;
}

/**
 * Pure presentation component for the problem interface
 */
export const ProblemInterface: React.FC<ProblemInterfaceProps> = ({
  problemData,
  title = '',
  description = '',
  adaptiveFeaturesEnabled = false,
  adaptationMessage,
  onEnableAdaptiveFeatures,
  onDisableAdaptiveFeatures,
  onApplyAdaptiveFeatures,
  onResetToOriginal,
  onClearProgress,
  onSolutionCheck,
}) => {
  if (!problemData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">No problem data available</div>
      </div>
    );
  }

  return (
    <div className="problem-interface">
      {/* Problem Header */}
      <div className="problem-header mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {problemData.title || title || 'Parsons Problem'}
        </h1>
        {(problemData.description || description) && (
          <p className="text-gray-600 mb-4">
            {problemData.description || description}
          </p>
        )}
      </div>

      {/* Adaptive Features Controls */}
      <div className="adaptive-controls mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Adaptive Features</h3>
        <div className="flex gap-2 mb-2">
          <button
            onClick={adaptiveFeaturesEnabled ? onDisableAdaptiveFeatures : onEnableAdaptiveFeatures}
            className={`px-4 py-2 rounded ${
              adaptiveFeaturesEnabled
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {adaptiveFeaturesEnabled ? 'Disable Adaptive Features' : 'Enable Adaptive Features'}
          </button>

          {adaptiveFeaturesEnabled && (
            <>
              <button
                onClick={onApplyAdaptiveFeatures}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
              >
                Apply Adaptive Help
              </button>
              <button
                onClick={onResetToOriginal}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
              >
                Reset to Original
              </button>
            </>
          )}

          <button
            onClick={onClearProgress}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
          >
            Clear Progress
          </button>
        </div>

        {adaptationMessage && (
          <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded text-blue-800">
            {adaptationMessage}
          </div>
        )}
      </div>

      {/* Main Problem Interface */}
      <ParsonsPuzzleIntegrated
        problemId={problemData?.id}
        onCheckSolution={onSolutionCheck}
      />
    </div>
  );
};
