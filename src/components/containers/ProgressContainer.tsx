import React, { useEffect, useCallback, ReactNode } from 'react';
import LocalStorageService from '@/lib/localStorageService';
import { useProblemContext } from '@/contexts/ProblemContext';
import { useSolutionContext } from '@/contexts/SolutionContext';
import { useFeedbackContext } from '@/contexts/FeedbackContext';

interface ProgressContainerProps {
  problemId?: string;
  onProgressRestored?: () => void;
  children: ReactNode;
}

/**
 * Container responsible only for progress tracking and local storage
 */
export const ProgressContainer: React.FC<ProgressContainerProps> = ({
  problemId,
  onProgressRestored,
  children,
}) => {
  const { currentProblem } = useProblemContext();
  const { userSolution, setUserSolution, incrementAttempts } = useSolutionContext();
  const { isCorrect } = useFeedbackContext();

  // Restore progress from local storage
  const restoreProgress = useCallback(() => {
    if (!problemId || !currentProblem) return;

    try {
      console.log('📂 Attempting to restore progress for:', problemId);
      const progress = LocalStorageService.getProblemProgress(problemId);

      if (progress && progress.currentSolution.length > 0) {
        console.log('📚 Found existing progress:', {
          attempts: progress.attempts,
          solutionLength: progress.currentSolution.length,
          isCompleted: progress.isCompleted,
        });

        // Validate that stored solution matches current problem
        const problemLines = currentProblem.initial
          .split('\n')
          .filter(line => line.trim() && !line.includes('#distractor'));

        if (problemLines.length > 0) {
          const matchingLines = progress.currentSolution.filter(line =>
            problemLines.some(problemLine => problemLine.trim() === line.trim())
          ).length;

          const matchPercentage = problemLines.length > 0
            ? (matchingLines / problemLines.length) * 100
            : 0;

          if (matchPercentage < 70) {
            console.warn('⚠️ Stored solution appears to be for a different problem:', {
              matchPercentage,
              problemLines: problemLines.length,
              matchingLines,
            });
            return; // Don't restore incompatible solution
          }
        }

        setUserSolution(progress.currentSolution);
        
        if (progress.isCompleted) {
          console.log('✅ Problem was previously completed');
        }

        if (onProgressRestored) {
          onProgressRestored();
        }
      }
    } catch (err) {
      console.warn('⚠️ Failed to restore progress from local storage:', err);
    }
  }, [problemId, currentProblem, setUserSolution, onProgressRestored]);

  // Save progress when solution changes
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

  // Restore progress when problem loads
  useEffect(() => {
    if (currentProblem) {
      restoreProgress();
    }
  }, [currentProblem, restoreProgress]);

  const clearProgress = useCallback(() => {
    if (problemId && confirm('Clear all progress for this problem?')) {
      LocalStorageService.clearProblemData(problemId);
      setUserSolution([]);
    }
  }, [problemId, setUserSolution]);

  const handleAttemptIncrement = useCallback(() => {
    incrementAttempts();
    if (problemId) {
      LocalStorageService.incrementProblemAttempts(problemId);
    }
  }, [incrementAttempts, problemId]);

  // Provide progress management functions via context or props injection
  return (
    <div data-testid="progress-container">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          const childProps = { 
            ...child.props as object, 
            onClearProgress: clearProgress,
            onAttemptIncrement: handleAttemptIncrement
          };
          return React.cloneElement(child, childProps);
        }
        return child;
      })}
    </div>
  );
};
