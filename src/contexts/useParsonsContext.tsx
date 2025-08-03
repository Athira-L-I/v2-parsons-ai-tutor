import { useCallback } from 'react';
import { useProblemContext } from './ProblemContext';
import { useSolutionContext } from './SolutionContext';
import { useFeedbackContext } from './FeedbackContext';
import { useAdaptiveContext } from './AdaptiveContext';
import { useChatContext } from './ChatContext';

/**
 * Compatibility hook that provides the same API as the old monolithic context
 * This allows existing components to work without changes during migration
 */
export const useParsonsContext = () => {
  const problemContext = useProblemContext();
  const solutionContext = useSolutionContext();
  const feedbackContext = useFeedbackContext();
  const adaptiveContext = useAdaptiveContext();
  const chatContext = useChatContext();

  // Composite reset function - memoized to prevent unnecessary re-renders
  const resetContext = useCallback(() => {
    console.log('🔄 Resetting all Parsons contexts...');
    problemContext.clearProblem();
    solutionContext.resetSolution();
    feedbackContext.clearAllFeedback();
    adaptiveContext.resetAdaptiveState();
    chatContext.clearChatHistory();
    console.log('✅ All contexts reset complete');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // We deliberately omit the context objects themselves to prevent unnecessary 
    // recreation of this function, as these objects will always be the same instances
    // throughout the component lifecycle
  ]);

  // Legacy API compatibility
  return {
    // Problem context
    currentProblem: problemContext.currentProblem,
    currentProblemId: problemContext.currentProblemId,
    setCurrentProblem: problemContext.setCurrentProblem,

    // Solution context
    userSolution: solutionContext.userSolution,
    setUserSolution: solutionContext.setUserSolution,
    currentBlocks: solutionContext.currentBlocks,
    setCurrentBlocks: solutionContext.setCurrentBlocks,
    attempts: solutionContext.attempts,
    incrementAttempts: solutionContext.incrementAttempts,

    // Feedback context
    feedback: feedbackContext.feedback,
    socraticFeedback: feedbackContext.socraticFeedback,
    setFeedback: feedbackContext.setFeedback,
    setSocraticFeedback: feedbackContext.setSocraticFeedback,
    isCorrect: feedbackContext.isCorrect,
    setIsCorrect: feedbackContext.setIsCorrect,
    handleFeedback: feedbackContext.handleFeedbackResponse,

    // UI state (from problem and feedback contexts)
    isLoading: problemContext.isLoading || feedbackContext.isGeneratingFeedback,
    setIsLoading: problemContext.setLoading,

    // Adaptive context
    adaptiveState: adaptiveContext.adaptiveState,
    setAdaptiveState: adaptiveContext.setAdaptiveState,
    adaptationMessage: adaptiveContext.adaptationMessage,
    setAdaptationMessage: adaptiveContext.setAdaptationMessage,
    updateAdaptiveStateAfterAttempt: adaptiveContext.updateAdaptiveStateAfterAttempt,
    canTriggerAdaptation: adaptiveContext.canTriggerAdaptation,
    getAdaptationSuggestions: () => adaptiveContext.getAdaptationSuggestions(problemContext.currentProblem),

    // Chat context
    chatMessages: chatContext.chatMessages,
    addChatMessage: chatContext.addChatMessage,
    clearChatHistory: chatContext.clearChatHistory,
    isTyping: chatContext.isTyping,
    setChatLoading: chatContext.setTyping,
    removeTypingMessages: chatContext.removeTypingMessages,

    // Composite actions
    resetContext,
  };
};
