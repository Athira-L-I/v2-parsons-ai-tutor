import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { ValidationService } from '@/lib/validationService';
import { ParsonsSettings } from '@/@types/types';

interface FeedbackContextType {
  // Feedback state
  feedback: string | null;
  socraticFeedback: string | null;
  isCorrect: boolean | null;
  isGeneratingFeedback: boolean;

  // Feedback actions
  setFeedback: (feedback: string | null) => void;
  setSocraticFeedback: (feedback: string | null) => void;
  setIsCorrect: (isCorrect: boolean | null) => void;
  setGeneratingFeedback: (generating: boolean) => void;
  clearAllFeedback: () => void;
  handleFeedbackResponse: (feedbackData: Record<string, unknown>) => void;
  validateAndProvideFeedback: (
    problemSettings: ParsonsSettings,
    userSolution: string[],
    context?: Record<string, unknown>
  ) => Promise<unknown>;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

interface FeedbackProviderProps {
  children: ReactNode;
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({
  children,
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [socraticFeedback, setSocraticFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isGeneratingFeedback, setGeneratingFeedback] =
    useState<boolean>(false);

  const clearAllFeedback = useCallback(() => {
    console.log('🧹 Clearing all feedback');
    setFeedback(null);
    setSocraticFeedback(null);
    setIsCorrect(null);
    setGeneratingFeedback(false);
  }, []);

  // Handle feedback from ParsonsWidget (migrated from original context)
  const handleFeedbackResponse = useCallback(
    (feedbackData: Record<string, unknown>) => {
      console.log('📨 Feedback received:', feedbackData);

      if (feedbackData.success !== undefined) {
        setIsCorrect(feedbackData.success as boolean);

        // Store the feedback HTML or message
        if (feedbackData.html) {
          setFeedback(feedbackData.html as string);
        } else if (feedbackData.message) {
          setFeedback(feedbackData.message as string);
        }

        // Handle additional feedback info
        if (!feedbackData.success && feedbackData.errors) {
          console.log('📋 Feedback errors:', feedbackData.errors);
        }
      }
    },
    []
  );

  const validateAndProvideFeedback = useCallback(
    async (
      problemSettings: ParsonsSettings,
      userSolution: string[],
      context?: Record<string, unknown>
    ) => {
      setGeneratingFeedback(true);

      try {
        // Use unified validation engine
        const validationService = new ValidationService();
        const result = await validationService.validateWithEngine(
          problemSettings,
          userSolution,
          context
        );

        setIsCorrect(result.isCorrect);
        setFeedback(result.feedback.summary);

        // Store detailed feedback for debugging
        console.log('🔍 Detailed validation result:', result);

        return result;
      } catch (error) {
        console.error('Error in validation:', error);
        setFeedback('Unable to validate solution. Please try again.');
        return null;
      } finally {
        setGeneratingFeedback(false);
      }
    },
    []
  );

  const value: FeedbackContextType = {
    feedback,
    socraticFeedback,
    isCorrect,
    isGeneratingFeedback,
    setFeedback,
    setSocraticFeedback,
    setIsCorrect,
    setGeneratingFeedback,
    clearAllFeedback,
    handleFeedbackResponse,
    validateAndProvideFeedback,
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
};

export const useFeedbackContext = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error(
      'useFeedbackContext must be used within a FeedbackProvider'
    );
  }
  return context;
};
