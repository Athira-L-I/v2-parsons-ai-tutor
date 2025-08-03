import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AdaptiveState } from '@/lib/adaptiveFeatures';
import { adaptiveController } from '@/lib/adaptiveController';
import { ParsonsSettings } from '@/@types/types';

interface AdaptiveContextType {
  // Adaptive state
  adaptiveState: AdaptiveState;
  adaptationMessage: string | null;

  // Adaptive actions
  setAdaptiveState: (state: AdaptiveState) => void;
  setAdaptationMessage: (message: string | null) => void;
  updateAdaptiveStateAfterAttempt: (isCorrect: boolean) => void;
  canTriggerAdaptation: () => boolean;
  getAdaptationSuggestions: (currentProblem: ParsonsSettings | null) => string[];
  resetAdaptiveState: () => void;
}

const defaultAdaptiveState = (): AdaptiveState => ({
  attempts: 0,
  incorrectAttempts: 0,
  combinedBlocks: 0,
  removedDistractors: 0,
});

const AdaptiveContext = createContext<AdaptiveContextType | null>(null);

interface AdaptiveProviderProps {
  children: ReactNode;
}

export const AdaptiveProvider: React.FC<AdaptiveProviderProps> = ({ children }) => {
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState>(defaultAdaptiveState());
  const [adaptationMessage, setAdaptationMessage] = useState<string | null>(null);

  const updateAdaptiveStateAfterAttempt = useCallback((isCorrect: boolean) => {
    console.log(`📊 Updating adaptive state - isCorrect: ${isCorrect}`);

    setAdaptiveState((currentState) => {
      const newAdaptiveState = adaptiveController.updateStateAfterAttempt(
        currentState,
        isCorrect
      );

      console.log('📊 New adaptive state:', newAdaptiveState);
      return newAdaptiveState;
    });
  }, []);

  const canTriggerAdaptation = useCallback((): boolean => {
    return adaptiveController.shouldTriggerAdaptation(adaptiveState);
  }, [adaptiveState]);

  const getAdaptationSuggestions = useCallback((currentProblem: ParsonsSettings | null): string[] => {
    if (!currentProblem) return [];

    return adaptiveController.generateAdaptationSuggestions(
      adaptiveState,
      currentProblem
    );
  }, [adaptiveState]);

  const resetAdaptiveState = useCallback(() => {
    console.log('🔄 Resetting adaptive state');
    setAdaptiveState(defaultAdaptiveState());
    setAdaptationMessage(null);
  }, []);

  const value: AdaptiveContextType = {
    adaptiveState,
    adaptationMessage,
    setAdaptiveState,
    setAdaptationMessage,
    updateAdaptiveStateAfterAttempt,
    canTriggerAdaptation,
    getAdaptationSuggestions,
    resetAdaptiveState,
  };

  return <AdaptiveContext.Provider value={value}>{children}</AdaptiveContext.Provider>;
};

export const useAdaptiveContext = () => {
  const context = useContext(AdaptiveContext);
  if (!context) {
    throw new Error('useAdaptiveContext must be used within an AdaptiveProvider');
  }
  return context;
};
