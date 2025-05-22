import React, { useEffect, useState } from 'react';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import dynamic from 'next/dynamic';
import SolutionChecker from './SolutionChecker';
import FeedbackPanel from './FeedbackPanel';
import ProblemUploader from './ProblemUploader';
import { ParsonsSettings } from '@/@types/types';
import * as api from '@/lib/api';
import LocalStorageService from '@/lib/localStorageService';

// Fix the dynamic import
const ParsonsPuzzleIntegrated = dynamic(() => import('./ParsonsPuzzleIntegrated'), { 
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
});

interface ParsonsProblemContainerProps {
  problemId?: string;
  initialProblem?: ParsonsSettings;
  title?: string;
  description?: string;
  showUploader?: boolean;
}

/**
 * Main container component that brings together all Parsons Problem components
 * Now with full API integration and local storage persistence
 */
const ParsonsProblemContainer: React.FC<ParsonsProblemContainerProps> = ({
  problemId,
  initialProblem,
  title = '',
  description = '',
  showUploader = false
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
    resetContext
  } = useParsonsContext();
  
  // Local state for API integration
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [problemData, setProblemData] = useState<any>(null);
  
  // Track the current problem ID to detect changes
  const [lastProblemId, setLastProblemId] = useState<string | undefined>(problemId);
  
  // Load problem data when component mounts or problemId changes
  useEffect(() => {
    if (problemId && problemId !== lastProblemId) {
      loadProblemFromApi(problemId);
      setLastProblemId(problemId);
    } else if (initialProblem && (!currentProblem || initialProblem !== currentProblem)) {
      // Use initial problem if provided and different from current
      setCurrentProblem(initialProblem);
      setProblemData({
        id: problemId || 'local-problem',
        title: title || 'Local Problem',
        description: description,
        parsonsSettings: initialProblem
      });
      
      // Try to restore progress from local storage
      if (problemId) {
        restoreProgressFromStorage(problemId);
      }
    }
  }, [problemId, initialProblem, currentProblem, setCurrentProblem, title, description, lastProblemId]);

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

  const loadProblemFromApi = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to load from API first
      const data = await api.fetchProblemById(id);
      setProblemData(data);
      setCurrentProblem(data.parsonsSettings);
      
      // Try to restore progress from local storage
      restoreProgressFromStorage(id);
      
      console.log('Problem loaded from API:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load problem';
      console.error('Error loading problem:', err);
      
      // Try to fall back to local storage
      const localProgress = LocalStorageService.getProblemProgress(id);
      if (localProgress && localProgress.currentSolution.length > 0) {
        console.log('Falling back to local storage data');
        setError(`API unavailable: ${errorMessage}. Restored from local storage.`);
        setUserSolution(localProgress.currentSolution);
        
        // Create minimal problem data from local storage
        setProblemData({
          id,
          title: `Problem ${id} (Local)`,
          description: 'Problem loaded from local storage due to API unavailability',
          parsonsSettings: null // Will need to be handled in the UI
        });
      } else {
        setError(`Failed to load problem: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const restoreProgressFromStorage = (id: string) => {
    try {
      const progress = LocalStorageService.getProblemProgress(id);
      if (progress && progress.currentSolution.length > 0) {
        console.log('Restoring progress from local storage:', progress);
        setUserSolution(progress.currentSolution);
        
        // If problem was completed, update the context
        if (progress.isCompleted) {
          // Note: We don't set isCorrect here as it should be determined by validation
          console.log('Problem was previously completed');
        }
      }
    } catch (err) {
      console.warn('Failed to restore progress from local storage:', err);
    }
  };

  const handleCheckComplete = (isCorrect: boolean) => {
    console.log("Solution checked, is correct:", isCorrect);
    
    // Increment attempts in local storage
    if (problemId) {
      LocalStorageService.incrementProblemAttempts(problemId);
    }
    
    // If correct, mark as completed
    if (isCorrect && problemId && userSolution.length > 0) {
      LocalStorageService.markProblemCompleted(problemId, userSolution);
    }
  };

  const handleRetry = () => {
    if (problemId) {
      resetContext();
      loadProblemFromApi(problemId);
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

  // Show error state with retry option
  if (error && !currentProblem) {
    return (
      <div className="parsons-problem-container">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Problem</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex gap-2">
            {problemId && (
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            )}
            {showUploader && (
              <p className="text-sm text-red-600">
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
          {problemId && (
            <div className="flex gap-2">
              <button
                onClick={handleRetry}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reload
              </button>
              <button
                onClick={handleClearProgress}
                className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Clear Progress
              </button>
            </div>
          )}
        </div>
        
        {/* Error banner for API issues */}
        {error && currentProblem && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
      
      {/* Show uploader if no problem and uploader is enabled */}
      {showUploader && !currentProblem && (
        <ProblemUploader />
      )}
      
      {/* Main problem interface */}
      {currentProblem && (
        <>
          <div className="mb-4">
            <div className="stats flex gap-4 text-sm mb-4">
              <div className="stat bg-gray-100 p-2 rounded">
                <span className="font-medium">Attempts:</span> {attempts}
              </div>
              {isCorrect !== null && (
                <div className={`stat p-2 rounded ${
                  isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  <span className="font-medium">Status:</span> {isCorrect ? 'Correct' : 'Incorrect'}
                </div>
              )}
              {problemId && (
                <div className="stat bg-blue-100 p-2 rounded">
                  <span className="font-medium">Problem ID:</span> {problemId}
                </div>
              )}
            </div>
          </div>
          
          {/* Load the Parsons puzzle component */}
          <ParsonsPuzzleIntegrated 
            problemId={problemId}
            title={problemData?.title || title}
            description={problemData?.description || description}
            onCheckSolution={handleCheckComplete}
          />

          <FeedbackPanel />
          
          {/* Show current solution for debugging */}
          {userSolution.length > 0 && process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 border rounded-md bg-gray-50">
              <h3 className="text-lg font-semibold mb-2">Current Solution (Debug)</h3>
              <pre className="bg-white p-3 rounded border font-mono text-sm overflow-x-auto">
                {userSolution.join('\n')}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ParsonsProblemContainer;