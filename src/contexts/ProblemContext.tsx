import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ParsonsSettings } from '@/@types/types';

interface ProblemContextType {
  // Problem state
  currentProblem: ParsonsSettings | null;
  currentProblemId: string | null;
  isLoading: boolean;
  error: string | null;

  // Problem actions
  setCurrentProblem: (problem: ParsonsSettings, problemId?: string) => void;
  clearProblem: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const ProblemContext = createContext<ProblemContextType | null>(null);

interface ProblemProviderProps {
  children: ReactNode;
}

export const ProblemProvider: React.FC<ProblemProviderProps> = ({ children }) => {
  const [currentProblem, setCurrentProblemState] = useState<ParsonsSettings | null>(null);
  const [currentProblemId, setCurrentProblemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const setCurrentProblem = useCallback((problem: ParsonsSettings, problemId?: string) => {
    console.log('📝 Setting current problem:', {
      problemId: problemId || 'no-id-provided',
      hasInitial: !!problem?.initial,
    });
    
    setCurrentProblemState(problem);
    setCurrentProblemId(problemId || null);
    setError(null); // Clear any previous errors
  }, []);

  const clearProblem = useCallback(() => {
    console.log('🗑️ Clearing current problem');
    setCurrentProblemState(null);
    setCurrentProblemId(null);
    setError(null);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    if (loading) {
      setError(null); // Clear errors when starting to load
    }
  }, []);

  const value: ProblemContextType = {
    currentProblem,
    currentProblemId,
    isLoading,
    error,
    setCurrentProblem,
    clearProblem,
    setLoading,
    setError,
  };

  return <ProblemContext.Provider value={value}>{children}</ProblemContext.Provider>;
};

export const useProblemContext = () => {
  const context = useContext(ProblemContext);
  if (!context) {
    throw new Error('useProblemContext must be used within a ProblemProvider');
  }
  return context;
};
