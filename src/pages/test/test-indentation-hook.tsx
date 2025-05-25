import React, { useState } from 'react';
import { NextPage } from 'next';
import {
  useParsonsWidgetContext,
  ParsonsWidgetProvider,
} from '@/contexts/ParsonsWidgetContext';
import { ParsonsSettings, ParsonsGrader } from '@/@types/types';

// Test settings with blocks that will go to solution area (no trashId)
const correctIndentationSettings: ParsonsSettings = {
  initial: `def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    for num in numbers:
        if num > 0:
            total += num
    return total / len(numbers)`,
  options: {
    sortableId: 'sortable',
    // No trashId - blocks go directly to solution
    max_wrong_lines: 0,
    can_indent: true,
    grader: ParsonsGrader.LineBased,
    exec_limit: 2500,
    show_feedback: true,
    x_indent: 50,
  },
};

const indentationProvidedSettings: ParsonsSettings = {
  ...correctIndentationSettings,
  options: {
    ...correctIndentationSettings.options,
    can_indent: false, // Indentation provided
  },
};

// Settings with trash area for testing movement
const settingsWithTrash: ParsonsSettings = {
  ...correctIndentationSettings,
  options: {
    ...correctIndentationSettings.options,
    trashId: 'sortableTrash', // Blocks start in trash
  },
};

const TestContent: React.FC = () => {
  const {
    settings,
    solution,
    trash,
    isIndentationProvided,
    currentIndentationHints,
    updateSettings,
    applyIndentationHint,
    validateCurrentIndentation,
    generateCurrentIndentationHints,
    moveBlock,
    moveMultipleBlocks, // NEW: Use the batch move function
    setBlockIndentation,
    randomizeIndentation,
    cleanup,
  } = useParsonsWidgetContext();

  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
  } | null>(null);

  const handleLoadCorrectSettings = () => {
    updateSettings(correctIndentationSettings);
  };

  const handleLoadProvidedSettings = () => {
    updateSettings(indentationProvidedSettings);
  };

  const handleLoadWithTrash = () => {
    updateSettings(settingsWithTrash);
  };

  // FIXED: Use the new batch move function
  const handleMoveAllToSolution = () => {
    if (trash.length === 0) {
      console.warn('No blocks in trash to move');
      return;
    }

    // Get all block IDs from trash
    const allTrashBlockIds = trash.map((block) => block.id);

    console.log(
      `Moving ${allTrashBlockIds.length} blocks from trash to solution using batch move`
    );
    console.log('Block IDs to move:', allTrashBlockIds);

    // Use the new batch move function - this will handle all blocks in a single atomic update
    moveMultipleBlocks(allTrashBlockIds, 'trash', 'solution');
  };

  const handleValidateIndentation = () => {
    const result = validateCurrentIndentation();
    setValidationResult(result);
  };

  const handleApplyFirstHint = () => {
    if (currentIndentationHints.length > 0 && solution.length > 0) {
      const firstHint = currentIndentationHints[0];
      // Apply the first hint using the correct function
      applyIndentationHint(solution[0].id, firstHint.lineIndex);
    }
  };

  const handleRandomizeIndentation = () => {
    randomizeIndentation();
  };

  const handleTestSpecificIndentation = () => {
    // Set specific indentation levels for testing
    if (solution.length >= 3) {
      setBlockIndentation(solution[0].id, 0); // First block - no indent
      setBlockIndentation(solution[1].id, 1); // Second block - indent 1
      setBlockIndentation(solution[2].id, 2); // Third block - indent 2
    }
  };

  // NEW: Test moving specific blocks
  const handleMoveFirstThreeToSolution = () => {
    if (trash.length >= 3) {
      const firstThreeIds = trash.slice(0, 3).map((block) => block.id);
      console.log(`Moving first 3 blocks to solution:`, firstThreeIds);
      moveMultipleBlocks(firstThreeIds, 'trash', 'solution');
    }
  };

  // NEW: Test moving solution blocks back to trash
  const handleMoveAllBackToTrash = () => {
    if (solution.length === 0) {
      console.warn('No blocks in solution to move back');
      return;
    }

    const allSolutionBlockIds = solution.map((block) => block.id);
    console.log(
      `Moving ${allSolutionBlockIds.length} blocks from solution back to trash`
    );
    moveMultipleBlocks(allSolutionBlockIds, 'solution', 'trash');
  };

  const handleReset = () => {
    cleanup();
    setValidationResult(null);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Fixed Indentation Management Test (Batch Move)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>

          <div className="space-y-3">
            <button
              onClick={handleLoadCorrectSettings}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Load Settings (Blocks in Solution)
            </button>

            <button
              onClick={handleLoadProvidedSettings}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Load Settings (Indentation Provided)
            </button>

            <button
              onClick={handleLoadWithTrash}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Load Settings (Blocks in Trash)
            </button>

            {/* FIXED: Batch move controls */}
            {trash.length > 0 && (
              <div className="border-t pt-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Batch Move Options:
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={handleMoveAllToSolution}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Move All Blocks to Solution ({trash.length} blocks)
                  </button>

                  {trash.length >= 3 && (
                    <button
                      onClick={handleMoveFirstThreeToSolution}
                      className="w-full px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                    >
                      Move First 3 Blocks to Solution
                    </button>
                  )}
                </div>
              </div>
            )}

            {solution.length > 0 && settings?.options.trashId && (
              <button
                onClick={handleMoveAllBackToTrash}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Move All Back to Trash ({solution.length} blocks)
              </button>
            )}

            <div className="border-t pt-3">
              <button
                onClick={handleValidateIndentation}
                disabled={!settings || solution.length === 0}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400"
              >
                Validate Current Indentation
              </button>

              <button
                onClick={handleApplyFirstHint}
                disabled={
                  currentIndentationHints.length === 0 || solution.length === 0
                }
                className="w-full mt-2 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:bg-gray-400"
              >
                Apply First Hint (Fixed)
              </button>

              <button
                onClick={handleRandomizeIndentation}
                disabled={solution.length === 0 || isIndentationProvided}
                className="w-full mt-2 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400"
              >
                Randomize Indentation (Fixed)
              </button>

              <button
                onClick={handleTestSpecificIndentation}
                disabled={solution.length < 3 || isIndentationProvided}
                className="w-full mt-2 px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:bg-gray-400"
              >
                Set Test Indentation (0,1,2)
              </button>

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
                  Indentation Provided: {isIndentationProvided ? 'Yes' : 'No'}
                </div>
                <div>Solution Blocks: {solution.length}</div>
                <div>Trash Blocks: {trash.length}</div>
                <div>Indentation Hints: {currentIndentationHints.length}</div>
              </div>

              {settings && (
                <div className="mt-2 text-xs text-gray-600">
                  <div>
                    can_indent: {settings.options.can_indent ? 'true' : 'false'}
                  </div>
                  <div>trashId: {settings.options.trashId || 'none'}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Results</h2>

          {/* Solution Blocks Display */}
          <div className="mb-4">
            <h3 className="font-medium mb-2">Current Solution Blocks:</h3>
            {solution.length === 0 ? (
              <div className="text-gray-500 italic p-3 border border-dashed rounded">
                No blocks in solution area
                {trash.length > 0 && (
                  <div className="mt-2 text-sm">
                    ({trash.length} blocks available in trash - use batch move
                    buttons above)
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {solution.map((block, index) => (
                  <div
                    key={block.id}
                    className="p-2 bg-gray-50 border rounded text-sm font-mono"
                    style={{
                      paddingLeft: `${8 + block.indentation * 16}px`,
                    }}
                  >
                    <span className="text-gray-400 mr-2">{index + 1}:</span>
                    {block.isCombined ? (
                      <span className="text-purple-600">{block.text}</span>
                    ) : (
                      block.text
                    )}
                    <span className="text-blue-600 ml-2">
                      (indent: {block.indentation})
                    </span>
                    {/* Manual indent controls for testing */}
                    {!isIndentationProvided && (
                      <div className="ml-2 inline-flex space-x-1">
                        <button
                          onClick={() =>
                            setBlockIndentation(
                              block.id,
                              Math.max(0, block.indentation - 1)
                            )
                          }
                          className="px-1 py-0.5 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                          disabled={block.indentation === 0}
                        >
                          -
                        </button>
                        <button
                          onClick={() =>
                            setBlockIndentation(block.id, block.indentation + 1)
                          }
                          className="px-1 py-0.5 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trash Blocks Display (if any) */}
          {trash.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Trash Blocks:</h3>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {trash.slice(0, 5).map((block, index) => (
                  <div
                    key={block.id}
                    className="p-1 bg-red-50 border border-red-200 rounded text-xs font-mono"
                    style={{
                      paddingLeft: `${4 + block.indentation * 8}px`,
                    }}
                  >
                    <span className="text-gray-400 mr-2">{index + 1}:</span>
                    {block.text.substring(0, 30)}...
                    <span className="text-blue-600 ml-1">
                      (i:{block.indentation})
                    </span>
                  </div>
                ))}
                {trash.length > 5 && (
                  <div className="text-xs text-gray-500">
                    ... and {trash.length - 5} more blocks
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Indentation Hints */}
          <div className="mb-4">
            <h3 className="font-medium mb-2">Current Indentation Hints:</h3>
            {currentIndentationHints.length === 0 ? (
              <div className="text-green-600">
                ✅ All indentation is correct!
              </div>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {currentIndentationHints.map((hint, index) => (
                  <div
                    key={index}
                    className="p-2 bg-orange-50 border border-orange-200 rounded text-sm"
                  >
                    <div className="font-medium">Line {hint.lineIndex + 1}</div>
                    <div className="text-gray-600">
                      Current: {hint.currentIndent}, Expected:{' '}
                      {hint.expectedIndent}
                    </div>
                    <div className="text-gray-700 mt-1 text-xs">
                      {hint.hint}
                    </div>
                    {!isIndentationProvided && (
                      <button
                        onClick={() =>
                          applyIndentationHint('any', hint.lineIndex)
                        }
                        className="mt-1 px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                      >
                        Apply This Hint
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Validation Results */}
          {validationResult && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Validation Results:</h3>
              <div
                className={`p-3 rounded ${
                  validationResult.isValid
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div
                  className={`font-medium ${
                    validationResult.isValid ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {validationResult.isValid
                    ? '✅ Valid Indentation'
                    : '❌ Invalid Indentation'}
                </div>
                {validationResult.errors.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm text-red-700 mb-1">Errors:</div>
                    <ul className="text-sm text-red-600 space-y-1">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-green-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2 text-green-800">
          ✅ Fixed: Batch Move Operations
        </h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>
            • <strong>Atomic Updates:</strong> All blocks now move in a single
            state update, preventing race conditions
          </li>
          <li>
            • <strong>Batch Move Function:</strong> New `moveMultipleBlocks()`
            function handles multiple blocks efficiently
          </li>
          <li>
            • <strong>Group Conflict Resolution:</strong> Properly handles group
            conflicts when moving multiple blocks
          </li>
          <li>
            • <strong>State Consistency:</strong> No more stale state issues
            when moving many blocks quickly
          </li>
          <li>
            • <strong>Progress Feedback:</strong> Clear messages show how many
            blocks were moved
          </li>
        </ul>
      </div>

      <div className="mt-4 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">How to Test (Fixed Version):</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>
            Click "Load Settings (Blocks in Trash)" - all blocks should appear
            in trash area
          </li>
          <li>
            Click "Move All Blocks to Solution" - ALL blocks should move to
            solution in one operation
          </li>
          <li>Verify in the console that all blocks are logged as moved</li>
          <li>
            Check the "Current Solution Blocks" section - should show all moved
            blocks
          </li>
          <li>
            Try "Move First 3 Blocks" and "Move All Back to Trash" for
            additional testing
          </li>
          <li>All moves should now work correctly without losing blocks</li>
        </ol>
      </div>

      <div className="mt-4 bg-orange-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2 text-orange-800">
          🔧 Key Technical Fixes:
        </h3>
        <ul className="text-sm text-orange-700 space-y-1">
          <li>
            1. <strong>Single State Update:</strong> All blocks moved in one
            atomic operation
          </li>
          <li>
            2. <strong>State Snapshots:</strong> Current state captured before
            any modifications
          </li>
          <li>
            3. <strong>Batch Processing:</strong> Multiple blocks processed
            together, not individually
          </li>
          <li>
            4. <strong>Race Condition Prevention:</strong> No more setTimeout
            delays or sequential operations
          </li>
          <li>
            5. <strong>Conflict Resolution:</strong> Group conflicts handled
            properly in batch operations
          </li>
        </ul>
      </div>
    </div>
  );
};

// Main component that provides the context
const TestIndentationHook: NextPage = () => {
  return (
    <ParsonsWidgetProvider>
      <TestContent />
    </ParsonsWidgetProvider>
  );
};

export default TestIndentationHook;
