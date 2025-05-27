/**
 * Test page for the fixed integration
 * src/pages/test/fixed-integration.tsx
 */

import React, { useState } from 'react';
import {
  ParsonsProvider,
  useParsonsContext,
  useParsonsDebug,
} from '@/contexts/ParsonsContext';
import ParsonsProblemContainer from '@/components/ParsonsProblemContainer';
import { ParsonsSettings } from '@/@types/types';

const TestFixedIntegrationPage: React.FC = () => {
  const [problemType, setProblemType] = useState<
    'simple' | 'complex' | 'adaptive'
  >('simple');

  // Sample problems for testing
  const simpleManualProblem: ParsonsSettings = {
    initial: `def hello():
    print("Hello")
    return "done"
print("Extra line") #distractor`,
    options: {
      can_indent: true,
      sortableId: 'sortable',
      trashId: 'trash',
      max_wrong_lines: 1,
      x_indent: 50,
    },
  };

  const complexProblem: ParsonsSettings = {
    initial: `def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    return total / len(numbers)
if not numbers:\\n    return 0
print("Hello World") #distractor
x = 5 #distractor
y = x * 2 #distractor`,
    options: {
      can_indent: true,
      sortableId: 'sortable',
      trashId: 'trash',
      max_wrong_lines: 3,
      x_indent: 50,
    },
  };

  const adaptiveProblem: ParsonsSettings = {
    initial: `def factorial(n):
    if n <= 1:
        return 1
    else:
        return n * factorial(n - 1)
result = factorial(5)
print(result)
print("Wrong approach") #distractor
return n + factorial(n - 1) #distractor
if n == 1: #distractor`,
    options: {
      can_indent: true,
      sortableId: 'sortable',
      trashId: 'trash',
      max_wrong_lines: 3,
      x_indent: 50,
    },
  };

  const getCurrentProblem = () => {
    switch (problemType) {
      case 'simple':
        return simpleManualProblem;
      case 'complex':
        return complexProblem;
      case 'adaptive':
        return adaptiveProblem;
      default:
        return simpleManualProblem;
    }
  };

  return (
    <ParsonsProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Fixed Integration Test
            </h1>
            <p className="text-gray-600 mb-4">
              Test the comprehensive fixes for ParsonsWidget loading and
              adaptive features.
            </p>

            {/* Problem Type Selector */}
            <div className="flex items-center space-x-4 mb-6 p-4 bg-white rounded border">
              <span className="font-medium text-gray-700">Test Problem:</span>

              <button
                onClick={() => setProblemType('simple')}
                className={`px-4 py-2 rounded transition-colors ${
                  problemType === 'simple'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Simple Problem
              </button>

              <button
                onClick={() => setProblemType('complex')}
                className={`px-4 py-2 rounded transition-colors ${
                  problemType === 'complex'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Complex Problem
              </button>

              <button
                onClick={() => setProblemType('adaptive')}
                className={`px-4 py-2 rounded transition-colors ${
                  problemType === 'adaptive'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Adaptive Test
              </button>

              {/* Reset Button */}
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Reset Page
              </button>
            </div>
          </div>

          {/* Debug Panel */}
          <DebugPanel />

          {/* Main Problem Container */}
          <div className="mt-6">
            <ParsonsProblemContainer
              problemId={`test-${problemType}`}
              initialProblem={getCurrentProblem()}
              title={`Test Problem: ${problemType}`}
              description={`Testing ${problemType} problem with fixed integration`}
              showUploader={false}
            />
          </div>

          {/* Testing Instructions */}
          <TestingInstructions />
        </div>
      </div>
    </ParsonsProvider>
  );
};

// Debug panel component
const DebugPanel: React.FC = () => {
  const debug = useParsonsDebug();
  const context = useParsonsContext();
  const [showDebug, setShowDebug] = useState(false);

  const problemStats = debug.getProblemStats();
  const adaptiveStats = debug.getAdaptiveStats();

  return (
    <div className="bg-white border rounded p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Debug Panel</h3>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
        >
          {showDebug ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {/* Quick Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-lg font-bold text-blue-600">
            {context.currentProblem ? '✅' : '❌'}
          </div>
          <div className="text-xs text-gray-600">Problem Loaded</div>
        </div>

        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-lg font-bold text-green-600">
            {context.attempts}
          </div>
          <div className="text-xs text-gray-600">Attempts</div>
        </div>

        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-lg font-bold text-purple-600">
            {adaptiveStats.incorrectAttempts}
          </div>
          <div className="text-xs text-gray-600">Incorrect</div>
        </div>

        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-lg font-bold text-orange-600">
            {context.isCorrect === true
              ? '✅'
              : context.isCorrect === false
              ? '❌'
              : '⏳'}
          </div>
          <div className="text-xs text-gray-600">Status</div>
        </div>
      </div>

      {showDebug && (
        <div className="space-y-4">
          {/* Problem Stats */}
          {problemStats && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                Problem Statistics:
              </h4>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>Total Lines: {problemStats.totalLines}</div>
                  <div>Solution Lines: {problemStats.solutionLines}</div>
                  <div>Distractor Lines: {problemStats.distractorLines}</div>
                  <div>Can Indent: {problemStats.canIndent ? 'Yes' : 'No'}</div>
                  <div>Max Wrong: {problemStats.maxWrongLines}</div>
                  <div>User Solution: {context.userSolution.length} lines</div>
                </div>
              </div>
            </div>
          )}

          {/* Adaptive Stats */}
          <div>
            <h4 className="font-medium text-gray-800 mb-2">
              Adaptive Features:
            </h4>
            <div className="bg-purple-50 p-3 rounded text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>Combined Blocks: {adaptiveStats.combinedBlocks}</div>
                <div>
                  Removed Distractors: {adaptiveStats.removedDistractors}
                </div>
                <div>
                  Can Trigger:{' '}
                  {adaptiveStats.canTriggerAdaptation ? 'Yes' : 'No'}
                </div>
                <div>Total Attempts: {adaptiveStats.attempts}</div>
              </div>

              {adaptiveStats.suggestions.length > 0 && (
                <div className="mt-2">
                  <div className="font-medium mb-1">Suggestions:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {adaptiveStats.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-purple-700">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Current Solution */}
          {context.userSolution.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                Current Solution:
              </h4>
              <pre className="bg-gray-50 p-3 rounded text-sm font-mono overflow-x-auto">
                {context.userSolution.join('\n')}
              </pre>
            </div>
          )}

          {/* Messages */}
          {context.adaptationMessage && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                Adaptation Message:
              </h4>
              <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                {context.adaptationMessage}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={debug.logState}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded"
            >
              Log State to Console
            </button>

            <button
              onClick={context.resetContext}
              className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded"
            >
              Reset Context
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Testing instructions component
const TestingInstructions: React.FC = () => (
  <div className="mt-8 p-4 bg-blue-50 rounded border border-blue-200">
    <h3 className="font-semibold text-blue-800 mb-2">Testing Instructions:</h3>
    <div className="text-sm text-blue-700 space-y-2">
      <div>
        <strong>1. Widget Loading Test:</strong>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>Widget should load reliably without errors</li>
          <li>All dependencies should load in correct order</li>
          <li>No race conditions or initialization failures</li>
          <li>Check browser console for successful loading logs</li>
        </ul>
      </div>

      <div>
        <strong>2. Adaptive Features Test:</strong>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>Enable adaptive features in the problem container</li>
          <li>Make 2+ incorrect attempts by submitting wrong solutions</li>
          <li>
            After 2+ incorrect attempts, "Apply Adaptive Help" should become
            enabled
          </li>
          <li>Click "Apply Adaptive Help" - problem should visibly change</li>
          <li>
            Look for combined blocks, removed distractors, or provided
            indentation
          </li>
          <li>You can reset to original problem to test again</li>
        </ul>
      </div>

      <div>
        <strong>3. State Management Test:</strong>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>Check debug panel to see unified state management</li>
          <li>Switch between problem types to test reloading</li>
          <li>All state should be properly tracked and synchronized</li>
          <li>Use "Log State to Console" to see detailed state info</li>
        </ul>
      </div>

      <div>
        <strong>4. Problem Type Tests:</strong>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>
            <strong>Simple:</strong> Basic 3-line function with 1 distractor
          </li>
          <li>
            <strong>Complex:</strong> More complex function with combined blocks
            and multiple distractors
          </li>
          <li>
            <strong>Adaptive:</strong> Recursive function designed for adaptive
            feature testing
          </li>
        </ul>
      </div>
    </div>
  </div>
);

export default TestFixedIntegrationPage;
