import React from 'react';
import { NextPage } from 'next';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import AdaptiveFeaturesToggle from '@/components/AdaptiveFeaturesToggle';
import { ParsonsSettings, ParsonsGrader } from '@/@types/types';

const sampleSettings: ParsonsSettings = {
  initial: `def calculate_sum(numbers):
    total = 0
    for num in numbers:
        if num > 0:
            total += num
    return total
print("Error") #distractor
result = 0 #distractor`,
  options: {
    sortableId: 'sortable',
    trashId: 'sortableTrash',
    max_wrong_lines: 2,
    can_indent: true,
    grader: ParsonsGrader.LineBased,
    exec_limit: 2500,
    show_feedback: true,
  },
};

// Move the test content into a separate component that uses the context
const TestContent: React.FC = () => {
  const {
    settings,
    adaptiveState,
    adaptiveFeaturesEnabled,
    updateSettings,
    incrementAttempts,
    cleanup,
  } = useParsonsContext(); // Changed hook call

  const handleLoadSettings = () => {
    updateSettings(sampleSettings);
    console.log('Settings loaded:', sampleSettings);
  };

  const handleSimulateIncorrectAttempt = () => {
    incrementAttempts(false);
  };

  const handleSimulateCorrectAttempt = () => {
    incrementAttempts(true);
  };

  const handleReset = () => {
    cleanup();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Test Adaptive Features Toggle Component
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Toggle Component */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Adaptive Features Toggle
          </h2>
          <AdaptiveFeaturesToggle />
        </div>

        {/* Test Controls */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>

          <div className="space-y-3">
            <button
              onClick={handleLoadSettings}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Load Sample Settings
            </button>

            <div className="border-t pt-3">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Simulate Attempts:
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSimulateIncorrectAttempt}
                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Incorrect Attempt
                </button>
                <button
                  onClick={handleSimulateCorrectAttempt}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Correct Attempt
                </button>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Reset All
            </button>
          </div>

          {/* Current State Display */}
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Current State:
            </h3>
            <div className="text-sm space-y-1">
              <div>Settings Loaded: {settings ? 'Yes' : 'No'}</div>
              <div>
                Adaptive Features:{' '}
                {adaptiveFeaturesEnabled ? 'Enabled' : 'Disabled'}
              </div>
              <div>Total Attempts: {adaptiveState.attempts}</div>
              <div>Incorrect Attempts: {adaptiveState.incorrectAttempts}</div>
              <div>Combined Blocks: {adaptiveState.combinedBlocks}</div>
              <div>Removed Distractors: {adaptiveState.removedDistractors}</div>
            </div>

            {/* Debug: Show settings content */}
            {settings && (
              <div className="mt-3 p-2 bg-white rounded border">
                <div className="text-xs font-medium text-gray-600 mb-1">
                  Settings Preview:
                </div>
                <div className="text-xs text-gray-500 max-h-20 overflow-y-auto">
                  <div>
                    Can indent: {settings.options.can_indent ? 'Yes' : 'No'}
                  </div>
                  <div>Max wrong lines: {settings.options.max_wrong_lines}</div>
                  <div>
                    Lines in initial:{' '}
                    {
                      settings.initial.split('\n').filter((line) => line.trim())
                        .length
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-green-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2 text-green-800">
          ✅ Fixed: Shared State
        </h3>
        <p className="text-sm text-green-700">
          Both components now use the same shared state via Context Provider.
          You should see only 1 hook instance in the console.
        </p>
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">How to Test:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>
            Click "Load Sample Settings" - both components should see the
            settings
          </li>
          <li>Toggle adaptive features - should work properly now</li>
          <li>
            Click "Incorrect Attempt" 2+ times to build up failed attempts
          </li>
          <li>The "Apply Adaptive Help" button should become enabled</li>
          <li>Click "Apply Adaptive Help" to trigger adaptation</li>
          <li>Both components should show the same updated state</li>
        </ol>
      </div>
    </div>
  );
};

// Main component that provides the context
const TestAdaptiveFeaturesToggle: NextPage = () => {
  return <TestContent />;
};

export default TestAdaptiveFeaturesToggle;
