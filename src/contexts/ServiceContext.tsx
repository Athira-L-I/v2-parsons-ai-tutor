import React, { createContext, useContext, ReactNode } from 'react';
import { ProblemRepository } from '@/services/repositories/ProblemRepository';
import { SolutionRepository } from '@/services/repositories/SolutionRepository';
import * as api from '@/lib/api';
import { DataModelConverter } from '@/types/legacy';

// Create repository instances
const problemRepository = new ProblemRepository();
const solutionRepository = new SolutionRepository();

// Flag to enable/disable repository usage (for gradual migration)
const USE_REPOSITORIES = true;

interface ServiceContextType {
  // Repository instances
  problemRepository: ProblemRepository;
  solutionRepository: SolutionRepository;
  
  // Compatibility layer API
  api: {
    // Problem API
    getProblem: (id: string) => Promise<{
      id: string;
      title: string;
      description: string;
      parsonsSettings: Record<string, unknown>;
    } | null>;
    getAllProblems: () => Promise<Array<{
      id: string;
      title: string;
      description: string;
      parsonsSettings: Record<string, unknown>;
    }>>;
    createProblem: (data: { 
      sourceCode: string;
      title?: string;
      description?: string;
    }) => Promise<{
      id: string;
      title: string;
      description: string;
      parsonsSettings: Record<string, unknown>;
    }>;
    
    // Solution API
    checkSolution: (problemId: string, solution: string[]) => Promise<{
      isCorrect: boolean;
      details: string;
    }>;
    submitSolution: (problemId: string, solution: string[]) => Promise<{
      isCorrect: boolean;
      details: string;
    }>;
    
    // Flags
    usingRepositories: boolean;
  };
}

const ServiceContext = createContext<ServiceContextType | null>(null);

interface ServiceProviderProps {
  children: ReactNode;
  // For testing purposes, we can inject mock repositories
  mockProblemRepository?: ProblemRepository;
  mockSolutionRepository?: SolutionRepository;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ 
  children,
  mockProblemRepository,
  mockSolutionRepository
}) => {
  // Create compatibility layer that works with both direct API calls and repositories
  const compatibilityApi = {
    // Problem API
    getProblem: async (id: string): Promise<{
      id: string;
      title: string;
      description: string;
      parsonsSettings: Record<string, unknown>;
    } | null> => {
      if (USE_REPOSITORIES) {
        const problem = await (mockProblemRepository || problemRepository).findById(id);
        if (!problem) return null;
        
        // Convert to legacy format for backwards compatibility
        const legacySettings = DataModelConverter.problemToLegacySettings(problem);
        return {
          id: problem.id,
          title: problem.title,
          description: problem.description,
          parsonsSettings: legacySettings as Record<string, unknown>
        };
      } else {
        // Use direct API call
        const result = await api.getProblem(id);
        return result ? {
          id: result.id || '',
          title: result.title || '',
          description: result.description || '',
          parsonsSettings: result.parsonsSettings || {}
        } : null;
      }
    },
    
    getAllProblems: async (): Promise<Array<{
      id: string;
      title: string;
      description: string;
      parsonsSettings: Record<string, unknown>;
    }>> => {
      if (USE_REPOSITORIES) {
        const problems = await (mockProblemRepository || problemRepository).findAll();
        
        // Convert to legacy format
        return problems.map(problem => ({
          id: problem.id,
          title: problem.title,
          description: problem.description,
          parsonsSettings: DataModelConverter.problemToLegacySettings(problem) as unknown as Record<string, unknown>
        }));
      } else {
        const problems = await api.fetchProblems();
        // Ensure we always return an array of the expected type
        return Array.isArray(problems) ? problems.map(p => ({
          id: p.id || '',
          title: p.title || '',
          description: p.description || '',
          parsonsSettings: p.parsonsSettings || {}
        })) : [];
      }
    },
    
    createProblem: async (data: { 
      sourceCode: string, 
      title?: string, 
      description?: string 
    }): Promise<{
      id: string;
      title: string;
      description: string;
      parsonsSettings: Record<string, unknown>;
    }> => {
      if (USE_REPOSITORIES) {
        // Extract problem data from the legacy format
        const problem = await (mockProblemRepository || problemRepository).create({
          title: data.title || 'Untitled Problem',
          description: data.description || '',
          difficulty: 'intermediate',
          tags: [],
          metadata: {
            language: 'python',
            concepts: [],
            prerequisites: [],
            isPublic: true,
            version: 1,
          },
          codeStructure: {
            correctSolution: [],
            distractors: [],
            combinedBlocks: [],
            options: {
              canIndent: true,
              maxWrongLines: 3,
              showFeedback: true,
              executionLimit: 2500,
              gradingMethod: 'line_based',
              adaptiveFeatures: {
                enabled: false,
                triggerThresholds: { incorrectAttempts: 3, timeSpentMinutes: 10, helpRequests: 2 },
                availableHelp: ['combine_blocks', 'remove_distractors'],
              },
            },
          },
          educationalObjectives: [],
          estimatedTimeMinutes: 15,
        });
        
        // Convert back to legacy format
        return {
          id: problem.id,
          title: problem.title,
          description: problem.description,
          parsonsSettings: DataModelConverter.problemToLegacySettings(problem) as unknown as Record<string, unknown>
        };
      } else {
        const result = await api.generateProblem(data.sourceCode);
        return {
          id: result?.id || 'generated',
          title: result?.title || data.title || 'Generated Problem',
          description: result?.description || data.description || '',
          parsonsSettings: result?.parsonsSettings || {}
        };
      }
    },
    
    // Solution API
    checkSolution: async (problemId: string, solution: string[]): Promise<{
      isCorrect: boolean;
      details: string;
    }> => {
      if (USE_REPOSITORIES) {
        // Convert solution to BlockArrangement
        const arrangement = {
          blocks: solution.map((line, index) => ({
            blockId: `block-${index}`,
            position: index,
            indentationLevel: (line.length - line.trimStart().length) / 4, // Assuming 4 spaces per indent level
            isInSolution: true
          })),
          timestamp: Date.now(),
          attemptNumber: 1
        };
        
        try {
          const validationResult = await (mockSolutionRepository || solutionRepository).validate(problemId, arrangement);
          
          return {
            isCorrect: validationResult.isCorrect,
            details: validationResult.feedback.content
          };
        } catch (error) {
          console.error('Error validating solution:', error);
          return {
            isCorrect: false,
            details: error instanceof Error ? error.message : 'Unknown error validating solution'
          };
        }
      } else {
        try {
          const result = await api.checkSolution(problemId, solution);
          return {
            isCorrect: result?.isCorrect || false,
            details: result?.details || 'No details available'
          };
        } catch (error) {
          console.error('Error checking solution:', error);
          return {
            isCorrect: false,
            details: error instanceof Error ? error.message : 'Unknown error checking solution'
          };
        }
      }
    },
    
    submitSolution: async (problemId: string, solution: string[]): Promise<{
      isCorrect: boolean;
      details: string;
    }> => {
      if (USE_REPOSITORIES) {
        // Convert solution to BlockArrangement
        const arrangement = {
          blocks: solution.map((line, index) => ({
            blockId: `block-${index}`,
            position: index,
            indentationLevel: (line.length - line.trimStart().length) / 4,
            isInSolution: true
          })),
          timestamp: Date.now(),
          attemptNumber: 1
        };
        
        try {
          const result = await (mockSolutionRepository || solutionRepository).submit(problemId, arrangement);
          return {
            isCorrect: result.validation.isCorrect,
            details: result.validation.feedback.content
          };
        } catch (error) {
          console.error('Error submitting solution:', error);
          return {
            isCorrect: false,
            details: error instanceof Error ? error.message : 'Unknown error submitting solution'
          };
        }
      } else {
        // Call checkSolution since there's no direct submitSolution in the API
        try {
          const result = await api.checkSolution(problemId, solution);
          return {
            isCorrect: result?.isCorrect || false,
            details: result?.details || 'No details available'
          };
        } catch (error) {
          console.error('Error checking solution:', error);
          return {
            isCorrect: false,
            details: error instanceof Error ? error.message : 'Unknown error checking solution'
          };
        }
      }
    },
    
    // Flag indicating whether we're using repositories or direct API calls
    usingRepositories: USE_REPOSITORIES as boolean
  };

  const value: ServiceContextType = {
    problemRepository: mockProblemRepository || problemRepository,
    solutionRepository: mockSolutionRepository || solutionRepository,
    api: compatibilityApi
  };

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
};

export const useServices = () => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};
