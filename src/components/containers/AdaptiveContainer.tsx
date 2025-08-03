import React, { useState, useCallback, ReactNode } from 'react';
import { adaptiveController } from '@/lib/adaptiveController';
import { ParsonsSettings } from '@/@types/types';
import { useAdaptiveContext } from '@/contexts/AdaptiveContext';
import { useProblemContext } from '@/contexts/ProblemContext';
import { useSolutionContext } from '@/contexts/SolutionContext';

interface AdaptiveContainerProps {
  onAdaptationApplied?: (message: string) => void;
  children: ReactNode;
}

/**
 * Container responsible only for adaptive feature management
 */
export const AdaptiveContainer: React.FC<AdaptiveContainerProps> = ({
  onAdaptationApplied,
  children,
}) => {
  const { currentProblem, setCurrentProblem } = useProblemContext();
  const { setUserSolution } = useSolutionContext();
  const {
    adaptiveState,
    setAdaptiveState,
    adaptationMessage,
    setAdaptationMessage,
    updateAdaptiveStateAfterAttempt,
  } = useAdaptiveContext();

  const [adaptiveFeaturesEnabled, setAdaptiveFeaturesEnabled] = useState(false);
  const [originalProblem, setOriginalProblem] = useState<ParsonsSettings | null>(null);

  // Store original problem when adaptive features are enabled
  const enableAdaptiveFeatures = useCallback(() => {
    if (currentProblem && !originalProblem) {
      setOriginalProblem(currentProblem);
    }
    setAdaptiveFeaturesEnabled(true);
    setAdaptationMessage('Adaptive features enabled! Make incorrect attempts to trigger adaptive help.');
    setTimeout(() => setAdaptationMessage(null), 3000);
  }, [currentProblem, originalProblem, setAdaptationMessage]);

  const disableAdaptiveFeatures = useCallback(() => {
    setAdaptiveFeaturesEnabled(false);
    setAdaptationMessage(null);
  }, [setAdaptationMessage]);

  const applyAdaptiveFeatures = useCallback(() => {
    if (!originalProblem || !adaptiveFeaturesEnabled) {
      console.warn('❌ Cannot apply adaptive features: no original problem or features disabled');
      return;
    }

    const shouldTrigger = adaptiveController.shouldTriggerAdaptation(adaptiveState);
    if (!shouldTrigger) {
      setAdaptationMessage('No adaptive changes needed at this time');
      setTimeout(() => setAdaptationMessage(null), 3000);
      return;
    }

    console.log('🔧 Applying adaptive features...', adaptiveState);

    try {
      const result = adaptiveController.applyAdaptiveFeatures(adaptiveState, originalProblem);

      if (result.success) {
        console.log('✅ Adaptive features applied successfully:', result);

        // Apply the adapted settings
        setCurrentProblem(result.newSettings);
        setAdaptiveState(result.newState);

        // Clear user solution since the problem structure changed
        setUserSolution([]);

        setAdaptationMessage(result.message);
        setTimeout(() => setAdaptationMessage(null), 8000);

        if (onAdaptationApplied) {
          onAdaptationApplied(result.message);
        }
      } else {
        console.log('ℹ️ No adaptive changes applied');
        setAdaptationMessage('No adaptive changes were applied');
        setTimeout(() => setAdaptationMessage(null), 3000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during adaptation';
      console.error('❌ Error during adaptation:', err);
      setAdaptationMessage(`Error applying adaptive features: ${errorMessage}`);
      setTimeout(() => setAdaptationMessage(null), 5000);
    }
  }, [
    originalProblem,
    adaptiveFeaturesEnabled,
    adaptiveState,
    setCurrentProblem,
    setAdaptiveState,
    setUserSolution,
    setAdaptationMessage,
    onAdaptationApplied,
  ]);

  const resetToOriginal = useCallback(() => {
    if (originalProblem && confirm('Reset to original problem? This will clear your progress.')) {
      console.log('🔄 Resetting to original problem');
      setCurrentProblem(originalProblem);
      setUserSolution([]);
      setAdaptationMessage('Reset to original problem');
      setTimeout(() => setAdaptationMessage(null), 3000);
    }
  }, [originalProblem, setCurrentProblem, setUserSolution, setAdaptationMessage]);

  const handleSolutionCheck = useCallback((isCorrect: boolean) => {
    updateAdaptiveStateAfterAttempt(isCorrect);

    // Show adaptive help message when available
    if (adaptiveFeaturesEnabled && adaptiveState.incorrectAttempts >= 2 && !isCorrect) {
      setAdaptationMessage('Adaptive help is now available! Click "Apply Adaptive Help" to get assistance.');
      setTimeout(() => setAdaptationMessage(null), 5000);
    }
  }, [updateAdaptiveStateAfterAttempt, adaptiveFeaturesEnabled, adaptiveState.incorrectAttempts, setAdaptationMessage]);

  // Inject adaptive functionality into children
  return (
    <div data-testid="adaptive-container">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          const childProps = {
            ...child.props as object,
            adaptiveFeaturesEnabled,
            adaptationMessage,
            onEnableAdaptiveFeatures: enableAdaptiveFeatures,
            onDisableAdaptiveFeatures: disableAdaptiveFeatures,
            onApplyAdaptiveFeatures: applyAdaptiveFeatures,
            onResetToOriginal: resetToOriginal,
            onSolutionCheck: handleSolutionCheck
          };
          return React.cloneElement(child, childProps);
        }
        return child;
      })}
    </div>
  );
};
