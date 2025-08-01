/**
 * Fixed ParsonsProblemContainer with improved fallback logic
 * src/components/ParsonsProblemContainer.tsx
 */

import React, { useEffect, useState } from 'react';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import dynamic from 'next/dynamic';
import ProblemUploader from './ProblemUploader';
import { ParsonsSettings } from '@/@types/types';
import * as api from '@/lib/api';
import LocalStorageService from '@/lib/localStorageService';
import { adaptiveController } from '@/lib/adaptiveController';
import { AdaptiveState } from '@/lib/adaptiveFeatures';

// Fix the dynamic import
const ParsonsPuzzleIntegrated = dynamic(
  () => import('./ParsonsPuzzleIntegrated'),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    ),
  }
);

interface ParsonsProblemContainerProps {
  problemId?: string;
  initialProblem?: ParsonsSettings;
  title?: string;
  description?: string;
  showUploader?: boolean;
}

/**
 * Main container component with integrated adaptive features and improved fallback logic
 */
const ParsonsProblemContainer: React.FC<ParsonsProblemContainerProps> = ({
  problemId,
  initialProblem,
  title = '',
  description = '',
  showUploader = false,
}) => {
  const {
    currentProblem,
    setCurrentProblem,
    userSolution,
    setUserSolution,
    isCorrect,
    feedback,
    socraticFeedback,
    attempts,
    resetContext,
    adaptiveState,
    setAdaptiveState,
    adaptationMessage,
    setAdaptationMessage,
  } = useParsonsContext();

  // Local state for API integration and adaptive features
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [problemData, setProblemData] = useState<any>(null);
  const [adaptiveFeaturesEnabled, setAdaptiveFeaturesEnabled] = useState(false);
  const [originalProblem, setOriginalProblem] =
    useState<ParsonsSettings | null>(null);

  // Track initialization to prevent multiple API calls
  const [isInitialized, setIsInitialized] = useState(false);

  // Load problem data when component mounts or problemId changes
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized) {
      return;
    }

    console.log('🚀 ParsonsProblemContainer initializing...', {
      hasProblemId: !!problemId,
      hasInitialProblem: !!initialProblem,
      currentProblemExists: !!currentProblem,
    });

    // Priority 1: Use problemId to fetch from API if provided
    if (problemId) {
      console.log(`📡 Fetching problem from API: ${problemId}`);
      loadProblemFromApi(problemId);
    }
    // Priority 2: Use initialProblem if no problemId or API fails
    else if (initialProblem) {
      console.log('📝 Using provided initial problem');
      useInitialProblem(initialProblem);
      setIsInitialized(true);
    }
    // Priority 3: Neither provided, wait for user input or show uploader
    else {
      console.log('⏳ No problem provided, waiting...');
      setIsInitialized(true);
    }
  }, [problemId, initialProblem]); // Only depend on problem identifiers

  const useInitialProblem = (problem: ParsonsSettings) => {
    console.log('✅ Setting up initial problem', {
      hasInitial: !!problem.initial,
      canIndent: problem.options.can_indent,
      linesCount: problem.initial.split('\n').filter((line) => line.trim())
        .length,
    });

    setCurrentProblem(problem, problemId || 'local-problem');
    setOriginalProblem(problem);
    setProblemData({
      id: problemId || 'local-problem',
      title: title || 'Local Problem',
      description: description,
      parsonsSettings: problem,
    });

    // Try to restore progress from local storage if problemId exists
    if (problemId) {
      restoreProgressFromStorage(problemId);
    }

    setError(null);
    setLoading(false);
  };

  const loadProblemFromApi = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`📡 Attempting API fetch for problem: ${id}`);
      const data = await api.fetchProblemById(id);

      console.log('✅ Problem loaded from API:', data);
      setProblemData(data);
      setCurrentProblem(data.parsonsSettings, id);
      setOriginalProblem(data.parsonsSettings);
      setIsInitialized(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load problem';
      console.warn(`⚠️ API fetch failed: ${errorMessage}`);

      // Fallback strategy
      if (initialProblem) {
        console.log('🔄 Falling back to initial problem');
        setError(`API unavailable: ${errorMessage}. Using local problem.`);
        useInitialProblem(initialProblem);
      } else {
        console.error(`❌ Failed to load problem: ${errorMessage}`);
        setError(`Failed to load problem: ${errorMessage}`);

        // Do NOT try to restore from local storage when we don't have problem data
        // as the solution might not match the problem structure
      }

      setIsInitialized(true);
    } finally {
      setLoading(false);
    }
  };

  const restoreProgressFromStorage = (id: string) => {
    try {
      const progress = LocalStorageService.getProblemProgress(id);
      if (progress && progress.currentSolution.length > 0) {
        console.log('💾 Restoring progress from local storage:', progress);

        // SAFETY CHECK - Verify the solution matches the current problem
        // This prevents loading a solution for a different problem
        if (currentProblem && currentProblem.initial) {
          const problemLines = currentProblem.initial
            .split('\n')
            .filter(
              (line) => !line.includes('#distractor') && line.trim().length > 0
            );

          // Check if at least 70% of solution lines are found in the problem
          const matchingLines = progress.currentSolution.filter((line) =>
            problemLines.some((probLine) =>
              probLine.trim().includes(line.trim())
            )
          ).length;

          const matchPercentage =
            problemLines.length > 0
              ? (matchingLines / problemLines.length) * 100
              : 0;

          if (matchPercentage < 70) {
            console.warn(
              '⚠️ Stored solution appears to be for a different problem:',
              {
                matchPercentage,
                problemLines: problemLines.length,
                matchingLines,
              }
            );
            return; // Don't restore incompatible solution
          }
        }

        setUserSolution(progress.currentSolution);

        if (progress.isCompleted) {
          console.log('✅ Problem was previously completed');
        }
      }
    } catch (err) {
      console.warn('⚠️ Failed to restore progress from local storage:', err);
    }
  };

  // Save progress to local storage whenever solution changes
  useEffect(() => {
    if (problemId && userSolution.length > 0) {
      LocalStorageService.updateProblemSolution(problemId, userSolution);
    }
  }, [problemId, userSolution]);

  // Save completion status when problem is solved
  useEffect(() => {
    if (problemId && isCorrect === true && userSolution.length > 0) {
      LocalStorageService.markProblemCompleted(problemId, userSolution);
    }
  }, [problemId, isCorrect, userSolution]);

  const handleCheckComplete = (isCorrect: boolean) => {
    console.log('🎯 Solution checked, is correct:', isCorrect);

    // Update adaptive state
    const newAdaptiveState = adaptiveController.updateStateAfterAttempt(
      adaptiveState,
      isCorrect
    );
    setAdaptiveState(newAdaptiveState);

    // Increment attempts in local storage
    if (problemId) {
      LocalStorageService.incrementProblemAttempts(problemId);
    }

    // If correct, mark as completed
    if (isCorrect && problemId && userSolution.length > 0) {
      LocalStorageService.markProblemCompleted(problemId, userSolution);
    }

    // Show adaptive help message when available
    if (
      adaptiveFeaturesEnabled &&
      newAdaptiveState.incorrectAttempts >= 2 &&
      !isCorrect
    ) {
      setAdaptationMessage(
        'Adaptive help is now available! Click "Apply Adaptive Help" to get assistance.'
      );
      setTimeout(() => setAdaptationMessage(null), 5000);
    }
  };

  const handleRetry = () => {
    console.log('🔄 Retrying problem load...');
    setIsInitialized(false);
    resetContext();

    if (problemId) {
      loadProblemFromApi(problemId);
    } else if (initialProblem) {
      useInitialProblem(initialProblem);
    }
  };

  const handleClearProgress = () => {
    if (problemId && confirm('Clear all progress for this problem?')) {
      LocalStorageService.clearProblemData(problemId);
      resetContext();
      if (problemData) {
        setCurrentProblem(problemData.parsonsSettings);
      }
    }
  };

  const toggleAdaptiveFeatures = () => {
    setAdaptiveFeaturesEnabled((prev) => {
      const newValue = !prev;
      console.log(`🔧 Adaptive features ${newValue ? 'enabled' : 'disabled'}`);

      if (newValue) {
        setAdaptationMessage(
          'Adaptive features enabled! Make incorrect attempts to trigger adaptive help.'
        );
        setTimeout(() => setAdaptationMessage(null), 3000);
      } else {
        setAdaptationMessage(null);
      }

      return newValue;
    });
  };

  const applyAdaptiveFeatures = () => {
    if (!originalProblem || !adaptiveFeaturesEnabled) {
      console.warn(
        '❌ Cannot apply adaptive features: no original problem or features disabled'
      );
      return;
    }

    const shouldTrigger =
      adaptiveController.shouldTriggerAdaptation(adaptiveState);
    if (!shouldTrigger) {
      setAdaptationMessage('No adaptive changes needed at this time');
      setTimeout(() => setAdaptationMessage(null), 3000);
      return;
    }

    console.log('🔧 Applying adaptive features...', adaptiveState);

    try {
      const result = adaptiveController.applyAdaptiveFeatures(
        adaptiveState,
        originalProblem
      );

      if (result.success) {
        console.log('✅ Adaptive features applied successfully:', result);

        // Apply the adapted settings
        setCurrentProblem(result.newSettings);
        setAdaptiveState(result.newState);

        // Update problem data to reflect adaptation
        setProblemData((prev) => ({
          ...prev,
          parsonsSettings: result.newSettings,
          title:
            (prev?.title || title).replace(' (Adapted)', '') + ' (Adapted)',
          description: result.message,
        }));

        // Clear user solution since the problem structure changed
        setUserSolution([]);

        setAdaptationMessage(result.message);
        setTimeout(() => setAdaptationMessage(null), 8000);
      } else {
        console.log('ℹ️ No adaptive changes applied');
        setAdaptationMessage('No adaptive changes were applied');
        setTimeout(() => setAdaptationMessage(null), 3000);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error during adaptation';
      console.error('❌ Error during adaptation:', err);
      setAdaptationMessage(`Error applying adaptive features: ${errorMessage}`);
      setTimeout(() => setAdaptationMessage(null), 5000);
    }
  };

  const resetToOriginal = () => {
    if (
      originalProblem &&
      confirm('Reset to original problem? This will clear your progress.')
    ) {
      console.log('🔄 Resetting to original problem');

      setCurrentProblem(originalProblem);
      setAdaptiveState(adaptiveController.createInitialState());
      setUserSolution([]);
      setAdaptationMessage(null);

      // Update problem data
      setProblemData((prev) => ({
        ...prev,
        parsonsSettings: originalProblem,
        title: (prev?.title || title).replace(' (Adapted)', ''),
        description: description || 'Problem reset to original state',
      }));
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="parsons-problem-container">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading problem...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state with retry option (only if no current problem)
  if (error && !currentProblem) {
    return (
      <div className="parsons-problem-container">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Problem
          </h2>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
            {showUploader && (
              <p className="text-sm text-red-600 self-center ml-4">
                Or create a new problem using the uploader below.
              </p>
            )}
          </div>
        </div>

        {showUploader && (
          <div className="mt-6">
            <ProblemUploader />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="parsons-problem-container">
      {/* Header with problem info */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {problemData?.title || title || 'Parsons Problem'}
            </h1>
            {(problemData?.description || description) && (
              <p className="text-gray-700 mb-2">
                {problemData?.description || description}
              </p>
            )}
          </div>

          {/* Problem management buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload
            </button>
            {problemId && (
              <button
                onClick={handleClearProgress}
                className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Clear Progress
              </button>
            )}
          </div>
        </div>

        {/* Error banner for API issues (when problem is loaded but there was an error) */}
        {error && currentProblem && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Adaptation message */}
        {adaptationMessage && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800">
            <p className="text-sm font-medium">{adaptationMessage}</p>
          </div>
        )}
      </div>

      {/* Show uploader if no problem and uploader is enabled */}
      {showUploader && !currentProblem && <ProblemUploader />}

      {/* Main problem interface */}
      {currentProblem && (
        <>
          <div className="mb-4">
            {/* Statistics */}
            <div className="stats flex flex-wrap gap-2 text-sm mb-4">
              <div className="stat bg-gray-100 p-2 rounded">
                <span className="font-medium">Attempts:</span> {attempts}
              </div>
              <div className="stat bg-gray-100 p-2 rounded">
                <span className="font-medium">Incorrect:</span>{' '}
                {adaptiveState.incorrectAttempts}
              </div>
              {isCorrect !== null && (
                <div
                  className={`stat p-2 rounded ${
                    isCorrect
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  <span className="font-medium">Status:</span>{' '}
                  {isCorrect ? 'Correct' : 'Incorrect'}
                </div>
              )}
              {problemId && (
                <div className="stat bg-blue-100 p-2 rounded">
                  <span className="font-medium">ID:</span> {problemId}
                </div>
              )}
              <div
                className={`stat p-2 rounded ${
                  adaptiveFeaturesEnabled
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <span className="font-medium">Adaptive:</span>{' '}
                {adaptiveFeaturesEnabled ? 'Enabled' : 'Disabled'}
              </div>
              {adaptiveState.combinedBlocks > 0 && (
                <div className="stat bg-purple-100 text-purple-800 p-2 rounded">
                  <span className="font-medium">Combined:</span>{' '}
                  {adaptiveState.combinedBlocks}
                </div>
              )}
              {adaptiveState.removedDistractors > 0 && (
                <div className="stat bg-orange-100 text-orange-800 p-2 rounded">
                  <span className="font-medium">Removed:</span>{' '}
                  {adaptiveState.removedDistractors}
                </div>
              )}
            </div>

            {/* Adaptive Features Controls */}
            <div className="adaptive-controls bg-white p-4 rounded border mb-4">
              <h3 className="text-lg font-semibold mb-3">Adaptive Features</h3>

              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={toggleAdaptiveFeatures}
                  className={`px-4 py-2 rounded transition-colors ${
                    adaptiveFeaturesEnabled
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  {adaptiveFeaturesEnabled ? 'Disable' : 'Enable'} Adaptive
                  Features
                </button>

                {adaptiveFeaturesEnabled && (
                  <>
                    <button
                      onClick={applyAdaptiveFeatures}
                      disabled={adaptiveState.incorrectAttempts < 2}
                      className={`px-4 py-2 rounded transition-colors ${
                        adaptiveState.incorrectAttempts >= 2
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {adaptiveState.incorrectAttempts >= 2
                        ? 'Apply Adaptive Help'
                        : `Need ${
                            2 - adaptiveState.incorrectAttempts
                          } more incorrect attempts`}
                    </button>

                    {originalProblem && currentProblem !== originalProblem && (
                      <button
                        onClick={resetToOriginal}
                        className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
                      >
                        Reset to Original
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="text-sm text-gray-600">
                {adaptiveFeaturesEnabled ? (
                  <p>
                    Adaptive features will help when you struggle.
                    {adaptiveState.incorrectAttempts >= 2
                      ? ' Click "Apply Adaptive Help" to get assistance.'
                      : ` Make ${
                          2 - adaptiveState.incorrectAttempts
                        } more incorrect attempts to trigger help.`}
                  </p>
                ) : (
                  <p>
                    Enable adaptive features to get automatic help when you're
                    struggling with the problem.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Load the Parsons puzzle component */}
          <ParsonsPuzzleIntegrated
            problemId={problemId}
            title={problemData?.title || title}
            description={problemData?.description || description}
            onCheckSolution={handleCheckComplete}
          />

          {/* Show current solution for debugging */}
          {userSolution.length > 0 &&
            process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 border rounded-md bg-gray-50">
                <h3 className="text-lg font-semibold mb-2">
                  Current Solution (Debug)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Solution Code:</h4>
                    <pre className="bg-white p-3 rounded border font-mono text-sm overflow-x-auto max-h-40">
                      {userSolution.join('\n')}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Current Problem:</h4>
                    <pre className="bg-white p-3 rounded border font-mono text-sm overflow-x-auto whitespace-pre-wrap max-h-40">
                      {currentProblem.initial}
                    </pre>
                  </div>
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
};

export default ParsonsProblemContainer;
