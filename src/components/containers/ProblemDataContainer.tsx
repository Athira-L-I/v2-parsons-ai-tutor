import React, { useEffect, useState, useCallback } from 'react';
import { ParsonsSettings, ProblemData } from '@/@types/types';
import { useServices } from '@/contexts/ServiceContext';
import { useProblemContext } from '@/contexts/ProblemContext';
import { DataModelConverter } from '@/types/legacy';
import { Problem } from '@/types/domain';

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
  const { problemRepository } = useServices();
  const [problemData, setProblemData] = useState<ProblemData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadProblemFromApi = useCallback(async (id: string) => {
    if (!id) return;

    console.log('🔄 Loading problem from repository:', id);
    setLoading(true);
    setError(null);

    try {
      const problem = await problemRepository.findById(id);
      
      if (problem) {
        console.log('✅ Problem loaded successfully:', problem.title);
        
        // Convert domain Problem to legacy ParsonsSettings for backward compatibility
        const legacySettings = DataModelConverter.problemToLegacySettings(problem);
        
        // Create a ProblemData object to match the expected interface
        const data: ProblemData = {
          id: problem.id,
          title: problem.title,
          description: problem.description,
          parsonsSettings: legacySettings
        };
        
        setProblemData(data);
        setCurrentProblem(legacySettings, id);
        
        if (onProblemLoaded) {
          onProblemLoaded(legacySettings, id);
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
  }, [problemRepository, setCurrentProblem, setLoading, setError, onProblemLoaded, onError]);

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
        // Use the repository pattern
        const problem = await problemRepository.findById(problemId);
        
        if (problem) {
          console.log('✅ Problem loaded successfully on retry:', problem.title);
          
          // Convert domain Problem to legacy ParsonsSettings for backward compatibility
          const legacySettings = DataModelConverter.problemToLegacySettings(problem);
          
          // Create a ProblemData object to match the expected interface
          const data: ProblemData = {
            id: problem.id,
            title: problem.title,
            description: problem.description,
            parsonsSettings: legacySettings
          };
          
          setProblemData(data);
          setCurrentProblem(legacySettings, problemId);
          
          if (onProblemLoaded) {
            onProblemLoaded(legacySettings, problemId);
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
  }, [problemId, initialProblem, problemRepository, setCurrentProblem, setLoading, setError, onProblemLoaded, onError]);

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
