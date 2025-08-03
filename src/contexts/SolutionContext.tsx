import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Import from the new hook we created in Priority 1A
import { BlockItem } from '@/hooks/useParsonsBlocks';

interface SolutionContextType {
  // Solution state
  userSolution: string[];
  currentBlocks: BlockItem[];
  attempts: number;

  // Solution actions
  setUserSolution: (solution: string[]) => void;
  setCurrentBlocks: (blocks: BlockItem[]) => void;
  incrementAttempts: () => void;
  resetSolution: () => void;
}

const SolutionContext = createContext<SolutionContextType | null>(null);

interface SolutionProviderProps {
  children: ReactNode;
}

export const SolutionProvider: React.FC<SolutionProviderProps> = ({ children }) => {
  const [userSolution, setUserSolution] = useState<string[]>([]);
  const [currentBlocks, setCurrentBlocks] = useState<BlockItem[]>([]);
  const [attempts, setAttempts] = useState<number>(0);

  const incrementAttempts = useCallback(() => {
    setAttempts((prev) => {
      const newAttempts = prev + 1;
      console.log(`📊 Attempts incremented to: ${newAttempts}`);
      return newAttempts;
    });
  }, []);

  const resetSolution = useCallback(() => {
    console.log('🔄 Resetting solution state');
    setUserSolution([]);
    setCurrentBlocks([]);
    setAttempts(0);
  }, []);

  const value: SolutionContextType = {
    userSolution,
    currentBlocks,
    attempts,
    setUserSolution,
    setCurrentBlocks,
    incrementAttempts,
    resetSolution,
  };

  return <SolutionContext.Provider value={value}>{children}</SolutionContext.Provider>;
};

export const useSolutionContext = () => {
  const context = useContext(SolutionContext);
  if (!context) {
    throw new Error('useSolutionContext must be used within a SolutionProvider');
  }
  return context;
};
