import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
} from 'react';
import { ParsonsSettings, ParsonsOptions } from '@/@types/types';
import { AdaptiveState } from '@/lib/adaptiveFeatures';
import { adaptiveController } from '@/lib/adaptiveController';

interface ParsonsContextType {
  currentProblem: ParsonsSettings | null;
  setCurrentProblem: (problem: ParsonsSettings) => void;
  userSolution: string[];
  setUserSolution: (solution: string[]) => void;
  feedback: string | null;
  socraticFeedback: string | null;
  setFeedback: (feedback: string | null) => void;
  setSocraticFeedback: (socraticFeedback: string | null) => void;
  isCorrect: boolean | null;
  setIsCorrect: (isCorrect: boolean | null) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  attempts: number;
  incrementAttempts: () => void;
  handleFeedback: (feedback: any) => void;
  resetContext: () => void;

  // Adaptive features
  adaptiveState: AdaptiveState;
  setAdaptiveState: (state: AdaptiveState) => void;
  triggerAdaptation: () => void;
  adaptationMessage: string | null;
  setAdaptationMessage: (message: string | null) => void;
}

const defaultContext: ParsonsContextType = {
  currentProblem: null,
  setCurrentProblem: () => {},
  userSolution: [],
  setUserSolution: () => {},
  feedback: null,
  socraticFeedback: null,
  setFeedback: () => {},
  setSocraticFeedback: () => {},
  isCorrect: null,
  setIsCorrect: () => {},
  isLoading: false,
  setIsLoading: () => {},
  attempts: 0,
  incrementAttempts: () => {},
  handleFeedback: () => {},
  resetContext: () => {},

  // Adaptive features
  adaptiveState: adaptiveController.createInitialState(),
  setAdaptiveState: () => {},
  triggerAdaptation: () => {},
  adaptationMessage: null,
  setAdaptationMessage: () => {},
};

const ParsonsContext = createContext<ParsonsContextType>(defaultContext);

export const useParsonsContext = () => useContext(ParsonsContext);

interface ParsonsProviderProps {
  children: ReactNode;
}

export const ParsonsProvider = ({ children }: ParsonsProviderProps) => {
  const [currentProblem, setCurrentProblem] = useState<ParsonsSettings | null>(
    null
  );
  const [userSolution, setUserSolution] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [socraticFeedback, setSocraticFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState>(
    adaptiveController.createInitialState()
  );
  const [adaptationMessage, setAdaptationMessage] = useState<string | null>(
    null
  );

  const incrementAttempts = useCallback(() => {
    setAttempts((prev) => {
      const newAttempts = prev + 1;

      // Update adaptive state after attempt
      const newAdaptiveState = adaptiveController.updateStateAfterAttempt(
        adaptiveState,
        isCorrect === true
      );
      setAdaptiveState(newAdaptiveState);

      return newAttempts;
    });
  }, [adaptiveState, isCorrect]);

  const triggerAdaptation = useCallback(() => {
    if (!currentProblem) return;

    const shouldAdapt =
      adaptiveController.shouldTriggerAdaptation(adaptiveState);

    if (shouldAdapt) {
      const result = adaptiveController.applyAdaptiveFeatures(
        adaptiveState,
        currentProblem
      );

      if (result.success) {
        setCurrentProblem(result.newSettings);
        setAdaptiveState(result.newState);
        setAdaptationMessage(result.message);

        // Clear the message after 5 seconds
        setTimeout(() => setAdaptationMessage(null), 5000);
      }
    }
  }, [currentProblem, adaptiveState]);

  const resetContext = useCallback(() => {
    setCurrentProblem(null);
    setUserSolution([]);
    setFeedback(null);
    setSocraticFeedback(null);
    setIsCorrect(null);
    setIsLoading(false);
    setAttempts(0);
    setAdaptiveState(adaptiveController.createInitialState());
    setAdaptationMessage(null);
  }, []);

  const handleFeedback = (feedback: any) => {
    console.log('Feedback received:', feedback);
    if (feedback.success !== undefined) {
      setIsCorrect(feedback.success);

      // Store the feedback HTML in the context
      if (feedback.html) {
        setFeedback(feedback.html);
      }

      // Add additional feedback info to context if needed
      if (!feedback.success && feedback.errors) {
        console.log('Errors:', feedback.errors);
      }
    }
  };

  return (
    <ParsonsContext.Provider
      value={{
        currentProblem,
        setCurrentProblem,
        userSolution,
        setUserSolution,
        feedback,
        setFeedback,
        socraticFeedback,
        setSocraticFeedback,
        isCorrect,
        setIsCorrect,
        isLoading,
        setIsLoading,
        attempts,
        incrementAttempts,
        handleFeedback,
        resetContext,

        // Adaptive features
        adaptiveState,
        setAdaptiveState,
        triggerAdaptation,
        adaptationMessage,
        setAdaptationMessage,
      }}
    >
      {children}
    </ParsonsContext.Provider>
  );
};
