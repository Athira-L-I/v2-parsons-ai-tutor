import React from 'react';
import { useParsonsContext } from '@/contexts/useParsonsContext';
import { isIndentationProvided } from '@/lib/adaptiveFeatures';
import { adaptiveController } from '@/lib/adaptiveController';

interface AdaptiveFeaturesToggleProps {
  className?: string;
}

const AdaptiveFeaturesToggle: React.FC<AdaptiveFeaturesToggleProps> = ({
  className = '',
}) => {  const {
    currentProblem: settings,
    setCurrentProblem,
    adaptiveState,
    setAdaptiveState,
    adaptationMessage,
    setAdaptationMessage,
    canTriggerAdaptation,
    getAdaptationSuggestions,
  } = useParsonsContext();

  const isIndentProvided = settings ? isIndentationProvided(settings) : false;
  const hasActiveFeatures =
    adaptiveState.combinedBlocks > 0 ||
    adaptiveState.removedDistractors > 0 ||
    isIndentProvided;

  // Use the canTriggerAdaptation from context
  const canTriggerAdaptationNow = canTriggerAdaptation();
  const handleApplyAdaptation = () => {
    if (!settings) return;

    try {
      const result = adaptiveController.applyAdaptiveFeatures(
        adaptiveState,
        settings
      );

      if (result.success) {
        console.log('Adaptive features applied:', result);
        
        // Update both the problem settings and adaptive state in the context
        setCurrentProblem(result.newSettings);
        setAdaptiveState(result.newState);
        setAdaptationMessage(result.message);
        
        // Clear the message after 5 seconds
        setTimeout(() => setAdaptationMessage(null), 5000);
      } else {
        console.log('No adaptive features applied:', result.message);
        setAdaptationMessage(result.message);
        setTimeout(() => setAdaptationMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error applying adaptive features:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setAdaptationMessage(`Error: ${errorMessage}`);
      setTimeout(() => setAdaptationMessage(null), 5000);
    }
  };

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
      <div className="border-t pt-3">
        <button
          onClick={handleApplyAdaptation}
          disabled={!canTriggerAdaptationNow}
          className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors ${
            canTriggerAdaptationNow
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {canTriggerAdaptationNow
            ? 'Apply Adaptive Help'
            : `Need ${Math.max(
                0,
                2 - adaptiveState.incorrectAttempts
              )} more incorrect attempts`}
        </button>

        {canTriggerAdaptationNow && (
          <p className="text-xs text-gray-500 mt-1 text-center">
            Click to get adaptive help based on your attempts
          </p>
        )}
      </div>

      {/* Adaptation Message */}
      {adaptationMessage && (
        <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
          {adaptationMessage}
        </div>
      )}
    </div>
  );
};

export default AdaptiveFeaturesToggle;
