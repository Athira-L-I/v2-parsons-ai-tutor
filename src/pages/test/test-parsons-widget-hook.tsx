import React, { useEffect } from 'react';
import { NextPage } from 'next';
import { useParsonsWidget, BlockItem } from '@/hooks/useParsonsWidget';
import { ParsonsSettings, ParsonsGrader } from '@/@types/types';
import { adaptiveController } from '@/lib/adaptiveController';

const sampleSettings: ParsonsSettings = {
  initial: `def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    count = len(numbers)
    return total / count
print("Invalid input") #distractor
result = None #distractor`,
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

const sampleBlocks: BlockItem[] = [
  {
    id: 'block-1',
    text: 'def calculate_average(numbers):',
    indentation: 0,
    originalIndex: 0,
  },
  { id: 'block-2', text: 'if not numbers:', indentation: 1, originalIndex: 1 },
  { id: 'block-3', text: 'return 0', indentation: 2, originalIndex: 2 },
  {
    id: 'block-4',
    text: 'total = sum(numbers)',
    indentation: 1,
    originalIndex: 3,
  },
  {
    id: 'block-5',
    text: 'print("Invalid input")',
    indentation: 0,
    isDistractor: true,
    originalIndex: 4,
  },
];

const TestParsonsWidgetHook: NextPage = () => {
  const {
    isInitialized,
    isLoading,
    error,
    settings,
    adaptiveFeaturesEnabled,
    blocks,
    solution,
    trash,
    adaptiveState,
    adaptationMessage,
    isIndentationProvided,
    initialize,
    cleanup,
    updateSettings,
    toggleAdaptiveFeatures,
    moveBlock,
    incrementAttempts,
    triggerAdaptation,
  } = useParsonsWidget();

  const handleUpdateSettings = () => {
    updateSettings(sampleSettings);
  };

  const handleLoadSampleBlocks = () => {
    updateSettings(sampleSettings);
    // Optionally, you can move blocks after a short delay or in a useEffect that checks isInitialized
  };

  const handleSimulateIncorrectAttempt = () => {
    incrementAttempts(false);
  };

  const handleSimulateCorrectAttempt = () => {
    incrementAttempts(true);
  };

  const availableActions = settings
    ? adaptiveController.getAvailableActions(adaptiveState, settings)
    : [];

  const shouldTrigger =
    adaptiveController.shouldTriggerAdaptation(adaptiveState);

  const renderBlockList = (
    blockList: BlockItem[],
    areaName: string,
    targetArea: 'blocks' | 'solution' | 'trash'
  ) => (
    <div className="bg-gray-50 p-3 rounded min-h-24">
      <div className="text-sm font-medium text-gray-600 mb-2">
        {areaName} ({blockList.length})
      </div>
      {blockList.length === 0 ? (
        <div className="text-gray-400 italic text-sm">Empty</div>
      ) : (
        <div className="space-y-2">
          {blockList.map((block) => (
            <div
              key={block.id}
              className={`p-2 rounded border text-sm ${
                block.isDistractor
                  ? 'bg-red-100 border-red-300'
                  : 'bg-white border-gray-300'
              }`}
            >
              <div className="font-mono">{block.text}</div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  ID: {block.id} | Indent: {block.indentation}
                </span>
                <div className="flex gap-1">
                  {targetArea !== 'trash' && (
                    <button
                      onClick={() => moveBlock(block.id, targetArea, 'trash')}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      To Trash
                    </button>
                  )}
                  {targetArea !== 'solution' && (
                    <button
                      onClick={() =>
                        moveBlock(block.id, targetArea, 'solution')
                      }
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      To Solution
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  useEffect(() => {
    if (isInitialized && blocks.length > 0) {
      // Move distractors to trash
      blocks.forEach((block) => {
        if (block.isDistractor) {
          moveBlock(block.id, 'blocks', 'trash');
        }
      });
    }
    // Only run when initialized or blocks change
  }, [isInitialized, blocks]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Test useParsonsWidget Hook - Adaptive Features Integration
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Hook State</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium text-gray-600">
                Is Initialized
              </div>
              <div
                className={`text-lg font-bold ${
                  isInitialized ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isInitialized ? 'True' : 'False'}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium text-gray-600">
                Adaptive Features
              </div>
              <div
                className={`text-lg font-bold ${
                  adaptiveFeaturesEnabled ? 'text-green-600' : 'text-orange-600'
                }`}
              >
                {adaptiveFeaturesEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium text-gray-600">Error</div>
              <div
                className={`text-lg font-bold ${
                  error ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {error || 'None'}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium text-gray-600">
                Should Trigger
              </div>
              <div
                className={`text-lg font-bold ${
                  shouldTrigger ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                {shouldTrigger ? 'Yes' : 'No'}
              </div>
            </div>
          </div>

          {adaptationMessage && (
            <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded">
              <p className="text-blue-800 text-sm">{adaptationMessage}</p>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Adaptive State</h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-blue-50 p-2 rounded">
              <span className="font-medium">Total Attempts:</span>
              <br />
              {adaptiveState.attempts}
            </div>
            <div className="bg-red-50 p-2 rounded">
              <span className="font-medium">Incorrect Attempts:</span>
              <br />
              {adaptiveState.incorrectAttempts}
            </div>
            <div className="bg-green-50 p-2 rounded">
              <span className="font-medium">Combined Blocks:</span>
              <br />
              {adaptiveState.combinedBlocks}
            </div>
            <div className="bg-yellow-50 p-2 rounded">
              <span className="font-medium">Removed Distractors:</span>
              <br />
              {adaptiveState.removedDistractors}
            </div>
          </div>

          <div className="mt-3 bg-purple-50 p-2 rounded text-sm">
            <span className="font-medium">Indentation Provided:</span>
            <br />
            {isIndentationProvided ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>

          <div className="space-y-3">
            <button
              onClick={handleUpdateSettings}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Load Settings (Required for Adaptation)
            </button>

            <button
              onClick={handleLoadSampleBlocks}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Load Sample Blocks
            </button>

            <button
              onClick={toggleAdaptiveFeatures}
              className={`w-full px-4 py-2 rounded text-white ${
                adaptiveFeaturesEnabled
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {adaptiveFeaturesEnabled ? 'Disable' : 'Enable'} Adaptive Features
            </button>

            <div className="border-t pt-3">
              <div className="text-sm font-medium mb-2">Simulate Attempts:</div>
              <div className="flex gap-2">
                <button
                  onClick={handleSimulateIncorrectAttempt}
                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Incorrect Attempt
                </button>
                <button
                  onClick={handleSimulateCorrectAttempt}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Correct Attempt
                </button>
              </div>
            </div>

            <button
              onClick={triggerAdaptation}
              disabled={!shouldTrigger || !adaptiveFeaturesEnabled}
              className={`w-full px-4 py-2 rounded text-white ${
                shouldTrigger && adaptiveFeaturesEnabled
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Trigger Adaptation
            </button>

            <button
              onClick={cleanup}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Reset All
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Available Actions</h2>

          {availableActions.length > 0 ? (
            <div className="space-y-2">
              {availableActions.map((action, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded">
                  <div className="font-medium text-blue-800">{action.type}</div>
                  <div className="text-sm text-blue-600">
                    {action.description}
                  </div>
                  <div className="text-xs text-blue-500 mt-1">
                    Priority: {action.priority}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">
              No adaptive actions available yet
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderBlockList(blocks, 'Blocks', 'blocks')}
        {renderBlockList(solution, 'Solution', 'solution')}
        {renderBlockList(trash, 'Trash', 'trash')}
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">How to Test Adaptive Features:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Click "Load Settings" to enable adaptation functionality</li>
          <li>Click "Enable Adaptive Features" to turn on auto-adaptation</li>
          <li>
            Click "Incorrect Attempt" multiple times to build up failed attempts
          </li>
          <li>
            Watch as "Available Actions" populate based on attempt thresholds
          </li>
          <li>
            Click "Trigger Adaptation" when available to see adaptive features
            applied
          </li>
          <li>Observe how the settings change (check console for details)</li>
        </ol>
      </div>
    </div>
  );
};

export default TestParsonsWidgetHook;
