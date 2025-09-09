/**
 * ParsonsPuzzleIntegrated - React-based UI
 * src/components/ParsonsPuzzleIntegrated.tsx
 * Updated to use new dependency system
 */

import React from 'react';
import { useParsonsContext } from '@/contexts/useParsonsContext';
import { useDependencyStatus } from '@/hooks/useDependencies';
import { DependencyLoader } from './DependencyLoader';
import ParsonsBoard from './ParsonsBoard';
import ChatFeedbackPanel from './ChatFeedbackPanel';
import SolutionChecker from './SolutionChecker';

interface ParsonsPuzzleIntegratedProps {
  problemId?: string;
  title?: string; // Keep for potential use, but not used in this simplified version
  description?: string; // Keep for potential use, but not used in this simplified version
  onCheckSolution?: (isCorrect: boolean) => void;
}

const ParsonsPuzzleInner: React.FC<ParsonsPuzzleIntegratedProps> = ({
  problemId,
  // title = 'Parsons Problem', // Removed default
  // description = 'Rearrange the code blocks to form a correct solution.', // Removed default
  onCheckSolution,
}) => {
  const { currentProblem } = useParsonsContext();
  const { ready } = useDependencyStatus();

  // If there's no problem loaded, don't show anything
  if (!currentProblem) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No problem loaded. Please select a problem to get started.</p>
      </div>
    );
  }

  // If dependencies aren't ready yet, show a waiting message
  if (!ready) {
    return (
      <div className="parsons-puzzle-loading">
        <div className="text-center text-gray-500 p-4">
          Waiting for dependencies...
        </div>
      </div>
    );
  }

  return (
    <div className="parsons-puzzle-integrated">
      {/* Render React-based interface */}
      <>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-700">
            <strong>React-based Parsons Puzzle</strong>
          </p>
        </div>
        <ParsonsBoard />
        <SolutionChecker
          problemId={problemId}
          onCheckComplete={onCheckSolution} // Propagates to SolutionChecker
        />
      </>

      {/* Show feedback */}
      <div className="mt-6">
        <ChatFeedbackPanel />
      </div>
    </div>
  );
};

// Wrap with dependency loader
const ParsonsPuzzleIntegrated: React.FC<ParsonsPuzzleIntegratedProps> = (
  props
) => {
  return (
    <DependencyLoader showDetails={process.env.NODE_ENV === 'development'}>
      <ParsonsPuzzleInner {...props} />
    </DependencyLoader>
  );
};

export default ParsonsPuzzleIntegrated;
