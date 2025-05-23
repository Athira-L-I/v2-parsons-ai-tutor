import React from 'react';
import { useParsonsWidgetContext } from '@/contexts/ParsonsWidgetContext'; // Changed import
import { isIndentationProvided } from '@/lib/adaptiveFeatures';
import { adaptiveController } from '@/lib/adaptiveController';

interface AdaptiveFeaturesToggleProps {
  className?: string;
}

const AdaptiveFeaturesToggle: React.FC<AdaptiveFeaturesToggleProps> = ({
  className = '',
}) => {
  const {
    adaptiveFeaturesEnabled,
    adaptiveState,
    settings,
    toggleAdaptiveFeatures,
    triggerAdaptation,
  } = useParsonsWidgetContext(); // Changed hook call

  const isIndentProvided = settings ? isIndentationProvided(settings) : false;
  const hasActiveFeatures =
    adaptiveState.combinedBlocks > 0 ||
    adaptiveState.removedDistractors > 0 ||
    isIndentProvided;

  // Fix: Use the same logic as the adaptiveController
  const canTriggerAdaptation =
    adaptiveFeaturesEnabled &&
    settings &&
    adaptiveController.shouldTriggerAdaptation(adaptiveState);

  return (
    <div className={`bg-white p-4 rounded-lg border ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Adaptive Features
          </h3>
          <p className="text-sm text-gray-600">
            Automatically adjust problem difficulty based on performance
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center">
          <span className="mr-3 text-sm font-medium text-gray-700">
            {adaptiveFeaturesEnabled ? 'Enabled' : 'Disabled'}
          </span>
          <button
            onClick={toggleAdaptiveFeatures}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              adaptiveFeaturesEnabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                adaptiveFeaturesEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Current Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Current Status:
          </span>
          <div className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                hasActiveFeatures ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            <span className="text-sm text-gray-600">
              {hasActiveFeatures ? 'Features Active' : 'No Active Features'}
            </span>
          </div>
        </div>
      </div>

      {/* Attempt Counter */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-xs text-blue-600 font-medium">
            Total Attempts
          </div>
          <div className="text-lg font-bold text-blue-800">
            {adaptiveState.attempts}
          </div>
        </div>
        <div className="bg-red-50 p-3 rounded">
          <div className="text-xs text-red-600 font-medium">
            Incorrect Attempts
          </div>
          <div className="text-lg font-bold text-red-800">
            {adaptiveState.incorrectAttempts}
          </div>
        </div>
      </div>

      {/* Active Features Display */}
      <div className="space-y-2 mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Active Features:
        </div>

        {/* Combined Blocks */}
        <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded mr-2" />
            <span className="text-sm text-purple-800">Combined Blocks</span>
          </div>
          <span className="text-sm font-bold text-purple-600">
            {adaptiveState.combinedBlocks}
          </span>
        </div>

        {/* Removed Distractors */}
        <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded mr-2" />
            <span className="text-sm text-orange-800">Removed Distractors</span>
          </div>
          <span className="text-sm font-bold text-orange-600">
            {adaptiveState.removedDistractors}
          </span>
        </div>

        {/* Indentation Provided */}
        <div className="flex items-center justify-between p-2 bg-green-50 rounded">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2" />
            <span className="text-sm text-green-800">Indentation Provided</span>
          </div>
          <span className="text-sm font-bold text-green-600">
            {isIndentProvided ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {/* Manual Trigger Button */}
      {adaptiveFeaturesEnabled && (
        <div className="border-t pt-3">
          <button
            onClick={triggerAdaptation}
            disabled={!canTriggerAdaptation}
            className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors ${
              canTriggerAdaptation
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canTriggerAdaptation
              ? 'Apply Adaptive Help'
              : `Need ${Math.max(
                  0,
                  2 - adaptiveState.incorrectAttempts
                )} more incorrect attempts`}
          </button>

          {canTriggerAdaptation && (
            <p className="text-xs text-gray-500 mt-1 text-center">
              Click to get adaptive help based on your attempts
            </p>
          )}
        </div>
      )}

      {/* Disabled State Message */}
      {!adaptiveFeaturesEnabled && (
        <div className="border-t pt-3">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600 text-center">
              Enable adaptive features to get help when you're struggling
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdaptiveFeaturesToggle;
