import React, { useEffect, useState } from 'react';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import dynamic from 'next/dynamic';
import SolutionChecker from './SolutionChecker';
import FeedbackPanel from './FeedbackPanel';
import { ParsonsSettings } from '@/@types/types';
import ProblemUploader from './ProblemUploader';

// Use dynamic import for the ParsonsWidget component since it relies on browser APIs
const ParsonsWidgetComponent = dynamic(() => import('./ParsonsWidget'), { 
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
    isCorrect, 
    feedback,
    attempts,
    resetContext
  } = useParsonsContext();
  
  // Track the current problem ID to detect changes
  const [lastProblemId, setLastProblemId] = useState<string | undefined>(problemId);
  
  // Initialize with the provided problem if available
  useEffect(() => {
    // Only set the problem if it's different from the current one
    if (initialProblem && (!currentProblem || initialProblem !== currentProblem)) {
      setCurrentProblem(initialProblem);
    }
    
    // If the problemId changes, we should reset context
    if (problemId !== lastProblemId) {
      resetContext();
      setLastProblemId(problemId);
    }
  }, [initialProblem, currentProblem, setCurrentProblem, problemId, lastProblemId, resetContext]);
  
  // Handle completion of the check
  const handleCheckComplete = (isCorrect: boolean) => {
    console.log("Solution checked, is correct:", isCorrect);
  };
  
  return (
    <div className="parsons-problem-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        {description && (
          <p className="text-gray-700">{description}</p>
        )}
      </div>
      
      {/* Show uploader if requested and no problem is loaded */}
      {showUploader && !currentProblem && (
        <ProblemUploader />
      )}

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
            </div>
          </div>
          
          {/* Load the Parsons puzzle component */}
          <ParsonsWidgetComponent 
            problemId={problemId}
            onCheckSolution={handleCheckComplete}
          />

          <FeedbackPanel />
          
          {userSolution.length > 0 && (
            <div className="mt-6 p-4 border rounded-md bg-gray-50">
              <h3 className="text-lg font-semibold mb-2">Current Solution</h3>
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