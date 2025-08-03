import React, { useEffect, useState, useCallback } from 'react';
import { ParsonsSettings, ProblemData } from '@/@types/types';
import * as api from '@/lib/api';
import { useProblemContext } from '@/contexts/ProblemContext';

interface ProblemDataContainerProps {
  problemId?: string;
  initialProblem?: ParsonsSettings;
  onProblemLoaded?: (problem: ParsonsSettings, problemId: string) => void;
  onError?: (error: string) => void;
  children: (props: {
    problemData: ProblemData | null;
    loading: boolean;
    error: string | null;
    retry: () => void;
  }) => React.ReactNode;
}

/**
 * Container responsible only for problem data fetching and management
 */
export const ProblemDataContainer: React.FC<ProblemDataContainerProps> = ({
  problemId,
  initialProblem,
  onProblemLoaded,
  onError,
  children,
}) => {
  const { setCurrentProblem, setLoading, setError } = useProblemContext();
  const [problemData, setProblemData] = useState<ProblemData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadProblemFromApi = useCallback(async (id: string) => {
    if (!id) return;

    console.log('🔄 Loading problem from API:', id);
    setLoading(true);
    setError(null);

    try {
      const data = await api.getProblem(id);
      
      if (data) {
        console.log('✅ Problem loaded successfully:', data.title);
        
        setProblemData(data);
        setCurrentProblem(data.parsonsSettings, id);
        
        if (onProblemLoaded) {
          onProblemLoaded(data.parsonsSettings, id);
        }
      } else {
        throw new Error('Problem data not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading problem';
      console.error('❌ Error loading problem:', errorMessage);
      
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [setCurrentProblem, setLoading, setError, onProblemLoaded, onError]);

  // Function for creating a mock problem from initialProblem is now inlined in useEffect and retry

  const retry = useCallback(async () => {
    console.log('🔄 Retrying problem load...');
    // Reset state
    setIsInitialized(false);
    setProblemData(null);
    setError(null); // Clear previous errors
    setLoading(true); // Show loading state
    
    try {
      if (problemId) {
        // Directly await the API call to catch any errors here
        const data = await api.getProblem(problemId);
        
        if (data) {
          console.log('✅ Problem loaded successfully on retry:', data.title);
          
          setProblemData(data);
          setCurrentProblem(data.parsonsSettings, problemId);
          
          if (onProblemLoaded) {
            onProblemLoaded(data.parsonsSettings, problemId);
          }
        } else {
          throw new Error('Problem data not found on retry');
        }
      } else if (initialProblem) {
        // Use a regular function call instead of the hook
        const mockProblemData: ProblemData = {
          id: 'initial-problem',
          title: 'Initial Problem',
          description: 'Initial problem loaded directly',
          parsonsSettings: initialProblem,
        };
        
        setProblemData(mockProblemData);
        setCurrentProblem(initialProblem, 'initial-problem');
        
        if (onProblemLoaded) {
          onProblemLoaded(initialProblem, 'initial-problem');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error on retry';
      console.error('❌ Error during retry:', errorMessage);
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [problemId, initialProblem, setCurrentProblem, setLoading, setError, onProblemLoaded, onError]);

  // Load problem on mount or when dependencies change
  useEffect(() => {
    if (isInitialized) return;

    console.log('🚀 ProblemDataContainer initializing...', {
      hasProblemId: !!problemId,
      hasInitialProblem: !!initialProblem,
    });

    if (problemId) {
      loadProblemFromApi(problemId);
    } else if (initialProblem) {
      // Create mock problem data for initial problem
      const mockProblemData: ProblemData = {
        id: 'initial-problem',
        title: 'Initial Problem',
        description: 'Initial problem loaded directly',
        parsonsSettings: initialProblem,
      };
      
      setProblemData(mockProblemData);
      setCurrentProblem(initialProblem, 'initial-problem');
      
      if (onProblemLoaded) {
        onProblemLoaded(initialProblem, 'initial-problem');
      }
    } else {
      console.warn('⚠️ No problem ID or initial problem provided');
    }

    setIsInitialized(true);
  }, [problemId, initialProblem, isInitialized, loadProblemFromApi, setCurrentProblem, onProblemLoaded]);

  return (
    <>
      {children({
        problemData,
        loading: false, // Loading state comes from context now
        error: null,    // Error state comes from context now
        retry,
      })}
    </>
  );
};
