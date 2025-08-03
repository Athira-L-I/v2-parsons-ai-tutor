import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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
  handleFeedbackResponse: (feedbackData: any) => void;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

interface FeedbackProviderProps {
  children: ReactNode;
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [socraticFeedback, setSocraticFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isGeneratingFeedback, setGeneratingFeedback] = useState<boolean>(false);

  const clearAllFeedback = useCallback(() => {
    console.log('🧹 Clearing all feedback');
    setFeedback(null);
    setSocraticFeedback(null);
    setIsCorrect(null);
    setGeneratingFeedback(false);
  }, []);

  // Handle feedback from ParsonsWidget (migrated from original context)
  const handleFeedbackResponse = useCallback((feedbackData: any) => {
    console.log('📨 Feedback received:', feedbackData);

    if (feedbackData.success !== undefined) {
      setIsCorrect(feedbackData.success);

      // Store the feedback HTML or message
      if (feedbackData.html) {
        setFeedback(feedbackData.html);
      } else if (feedbackData.message) {
        setFeedback(feedbackData.message);
      }

      // Handle additional feedback info
      if (!feedbackData.success && feedbackData.errors) {
        console.log('📋 Feedback errors:', feedbackData.errors);
      }
    }
  }, []);

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
  };

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
};

export const useFeedbackContext = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedbackContext must be used within a FeedbackProvider');
  }
  return context;
};
