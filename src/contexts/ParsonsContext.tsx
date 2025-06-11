/**
 * Enhanced ParsonsContext with integrated adaptive features
 * src/contexts/ParsonsContext.tsx
 */

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
} from 'react';
import { ParsonsSettings, ChatMessage } from '@/@types/types';
import { AdaptiveState } from '@/lib/adaptiveFeatures';
import { adaptiveController } from '@/lib/adaptiveController';

// Add BlockItem interface to context types
export interface BlockItem {
  id: string;
  text: string;
  indentation: number;
  isDistractor?: boolean;
  originalIndex?: number;
  groupId?: number;
  groupColor?: string;
  isPairedDistractor?: boolean;
  isCombined?: boolean;
  subLines?: string[];
}

interface ParsonsContextType {
  // Core problem state
  currentProblem: ParsonsSettings | null;
  currentProblemId: string | null;
  setCurrentProblem: (problem: ParsonsSettings, problemId?: string) => void; // Updated to accept problemId
  userSolution: string[];
  setUserSolution: (solution: string[]) => void;

  // Block structure for advanced indentation management
  currentBlocks: BlockItem[];
  setCurrentBlocks: (blocks: BlockItem[]) => void;

  // Feedback and correctness
  feedback: string | null;
  socraticFeedback: string | null;
  setFeedback: (feedback: string | null) => void;
  setSocraticFeedback: (socraticFeedback: string | null) => void;
  isCorrect: boolean | null;
  setIsCorrect: (isCorrect: boolean | null) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;

  // Attempt tracking
  attempts: number;
  incrementAttempts: () => void;

  // Adaptive features - now integrated
  adaptiveState: AdaptiveState;
  setAdaptiveState: (state: AdaptiveState) => void;
  adaptationMessage: string | null;
  setAdaptationMessage: (message: string | null) => void;

  // Utility functions
  handleFeedback: (feedback: any) => void;
  resetContext: () => void;

  // Adaptive feature helpers
  updateAdaptiveStateAfterAttempt: (isCorrect: boolean) => void;
  canTriggerAdaptation: () => boolean;
  getAdaptationSuggestions: () => string[];

  // Chat functionality
  chatMessages: ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatHistory: () => void;
  isTyping: boolean;
  setChatLoading: (isTyping: boolean) => void;
  removeTypingMessages: () => void;
}

const defaultAdaptiveState = (): AdaptiveState => ({
  attempts: 0,
  incorrectAttempts: 0,
  combinedBlocks: 0,
  removedDistractors: 0,
});

const defaultContext: ParsonsContextType = {
  currentProblem: null,
  currentProblemId: null,
  setCurrentProblem: () => {},
  userSolution: [],
  setUserSolution: () => {},
  currentBlocks: [],
  setCurrentBlocks: () => {},
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
  adaptiveState: defaultAdaptiveState(),
  setAdaptiveState: () => {},
  adaptationMessage: null,
  setAdaptationMessage: () => {},
  handleFeedback: () => {},
  resetContext: () => {},
  updateAdaptiveStateAfterAttempt: () => {},
  canTriggerAdaptation: () => false,
  getAdaptationSuggestions: () => [],
  chatMessages: [],
  addChatMessage: () => {},
  clearChatHistory: () => {},
  isTyping: false,
  setChatLoading: () => {},
  removeTypingMessages: () => {},
};

const ParsonsContext = createContext<ParsonsContextType>(defaultContext);

export const useParsonsContext = () => {
  const context = useContext(ParsonsContext);
  if (!context) {
    throw new Error('useParsonsContext must be used within a ParsonsProvider');
  }
  return context;
};

interface ParsonsProviderProps {
  children: ReactNode;
}

export const ParsonsProvider = ({ children }: ParsonsProviderProps) => {
  // Core state
  const [currentProblem, setCurrentProblem] = useState<ParsonsSettings | null>(
    null
  );
  const [currentProblemId, setCurrentProblemId] = useState<string | null>(null); // Added to track problem ID
  const [userSolution, setUserSolution] = useState<string[]>([]);
  const [currentBlocks, setCurrentBlocks] = useState<BlockItem[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [socraticFeedback, setSocraticFeedback] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);

  // Adaptive features state
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState>(
    defaultAdaptiveState()
  );
  const [adaptationMessage, setAdaptationMessage] = useState<string | null>(
    null
  );

  // Enhanced increment attempts with adaptive state management
  const incrementAttempts = useCallback(() => {
    setAttempts((prev) => {
      const newAttempts = prev + 1;
      console.log(`📊 Attempts incremented to: ${newAttempts}`);
      return newAttempts;
    });
  }, []);
  // Update adaptive state after an attempt
  const updateAdaptiveStateAfterAttempt = useCallback(
    (isCorrect: boolean) => {
      console.log(`📊 Updating adaptive state - isCorrect: ${isCorrect}`);

      setAdaptiveState((currentState) => {
        const newAdaptiveState = adaptiveController.updateStateAfterAttempt(
          currentState,
          isCorrect
        );

        console.log('📊 New adaptive state:', newAdaptiveState);
        return newAdaptiveState;
      });
    },
    [] // Remove adaptiveState dependency to avoid stale closures
  );

  // Check if adaptation can be triggered
  const canTriggerAdaptation = useCallback((): boolean => {
    return adaptiveController.shouldTriggerAdaptation(adaptiveState);
  }, [adaptiveState]);

  // Get adaptation suggestions
  const getAdaptationSuggestions = useCallback((): string[] => {
    if (!currentProblem) return [];

    return adaptiveController.generateAdaptationSuggestions(
      adaptiveState,
      currentProblem
    );
  }, [adaptiveState, currentProblem]);

  // Enhanced reset context
  const resetContext = useCallback(() => {
    console.log('🔄 Resetting ParsonsContext...');

    setCurrentProblem(null);
    setUserSolution([]);
    setCurrentBlocks([]);
    setFeedback(null);
    setSocraticFeedback(null);
    setIsCorrect(null);
    setIsLoading(false);
    setAttempts(0);
    setAdaptiveState(defaultAdaptiveState());
    setAdaptationMessage(null);
    setChatMessages([]);
    setIsTyping(false);

    console.log('✅ ParsonsContext reset complete');
  }, []);

  // Handle feedback from ParsonsWidget
  const handleFeedback = useCallback(
    (feedback: any) => {
      console.log('📨 Feedback received in context:', feedback);

      if (feedback.success !== undefined) {
        setIsCorrect(feedback.success);

        // Store the feedback HTML in the context
        if (feedback.html) {
          setFeedback(feedback.html);
        } else if (feedback.message) {
          setFeedback(feedback.message);
        }

        // Handle additional feedback info
        if (!feedback.success && feedback.errors) {
          console.log('📋 Feedback errors:', feedback.errors);
        }

        // Update adaptive state after getting feedback
        updateAdaptiveStateAfterAttempt(feedback.success);
      }
    },
    [updateAdaptiveStateAfterAttempt]
  );

  // Enhanced setCurrentProblem with logging
  const setCurrentProblemEnhanced = useCallback(
    (problem: ParsonsSettings, problemId?: string) => {
      console.log('📝 Setting current problem:', {
        problemId: problemId || 'no-id-provided',
        hasInitial: !!problem.initial,
        canIndent: problem.options.can_indent,
        maxWrongLines: problem.options.max_wrong_lines,
        linesCount: problem.initial.split('\n').filter((line) => line.trim())
          .length,
      });

      setCurrentProblem(problem);
      setCurrentProblemId(problemId || null); // Set the problem ID

      // Clear solution when problem changes
      setUserSolution([]);
      setCurrentBlocks([]);
      setIsCorrect(null);
      setFeedback(null);
      setSocraticFeedback(null);
      // Clear chat when problem changes
      clearChatHistory();
    },
    []
  );

  // Enhanced setUserSolution with logging
  const setUserSolutionEnhanced = useCallback(
    (solution: string[]) => {
      console.log('📝 Setting user solution:', {
        linesCount: solution.length,
        hasContent: solution.some((line) => line.trim()),
      });

      setUserSolution(solution);

      // Clear correctness when solution changes
      if (isCorrect !== null) {
        setIsCorrect(null);
        setFeedback(null);
        setSocraticFeedback(null);
      }
    },
    [isCorrect]
  );

  // Chat message management
  const addChatMessage = useCallback(
    (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
      const newMessage: ChatMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      console.log('💬 Adding chat message:', newMessage);
      setChatMessages((prev) => [...prev, newMessage]);
    },
    []
  );

  const clearChatHistory = useCallback(() => {
    console.log('🗑️ Clearing chat history');
    setChatMessages([]);
    setIsTyping(false);
  }, []);

  const setChatLoading = useCallback((loading: boolean) => {
    console.log('⏳ Setting chat typing state:', loading);
    setIsTyping(loading);
  }, []);

  const removeTypingMessages = useCallback(() => {
    setChatMessages((prev) => prev.filter((msg) => !msg.isTyping));
  }, []);
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const contextValue: ParsonsContextType = {
    // Core problem state
    currentProblem,
    currentProblemId,
    setCurrentProblem: setCurrentProblemEnhanced,
    userSolution,
    setUserSolution: setUserSolutionEnhanced,
    currentBlocks,
    setCurrentBlocks,

    // Feedback and correctness
    feedback,
    setFeedback,
    socraticFeedback,
    setSocraticFeedback,
    isCorrect,
    setIsCorrect,
    isLoading,
    setIsLoading,

    // Attempt tracking
    attempts,
    incrementAttempts,

    // Adaptive features
    adaptiveState,
    setAdaptiveState,
    adaptationMessage,
    setAdaptationMessage,

    // Utility functions
    handleFeedback,
    resetContext,
    updateAdaptiveStateAfterAttempt,
    canTriggerAdaptation,
    getAdaptationSuggestions,

    // Chat functionality
    chatMessages,
    addChatMessage,
    clearChatHistory,
    isTyping,
    setChatLoading,
    removeTypingMessages,
  };

  return (
    <ParsonsContext.Provider value={contextValue}>
      {children}
    </ParsonsContext.Provider>
  );
};

// Export helpful debugging utilities
export const useParsonsDebug = () => {
  const context = useParsonsContext();

  return {
    logState: () => {
      console.log('🔍 Current ParsonsContext state:', {
        hasProblem: !!context.currentProblem,
        solutionLines: context.userSolution.length,
        currentBlocks: context.currentBlocks.length,
        isCorrect: context.isCorrect,
        attempts: context.attempts,
        adaptiveState: context.adaptiveState,
        adaptationMessage: context.adaptationMessage,
      });
    },

    getProblemStats: () => {
      if (!context.currentProblem) return null;

      const lines = context.currentProblem.initial
        .split('\n')
        .filter((line) => line.trim());
      const distractors = lines.filter((line) => line.includes('#distractor'));
      const solution = lines.filter((line) => !line.includes('#distractor'));

      return {
        totalLines: lines.length,
        solutionLines: solution.length,
        distractorLines: distractors.length,
        canIndent: context.currentProblem.options.can_indent,
        maxWrongLines: context.currentProblem.options.max_wrong_lines,
      };
    },

    getAdaptiveStats: () => ({
      ...context.adaptiveState,
      canTriggerAdaptation: context.canTriggerAdaptation(),
      suggestions: context.getAdaptationSuggestions(),
    }),
  };
};
