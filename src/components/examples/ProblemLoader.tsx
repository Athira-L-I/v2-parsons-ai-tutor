import React, { useCallback, useEffect, useState } from 'react';
import { useServices } from '@/contexts/ServiceContext';
import { Problem } from '@/types/domain';
import { DataModelConverter } from '@/types/legacy';

interface ProblemLoaderProps {
  problemId: string;
  onLoaded?: (problem: Problem) => void;
}

/**
 * Example component demonstrating the compatibility layer approach
 * This component shows how to gradually migrate from direct API calls to repositories
 * and work with the new domain models
 */
const ProblemLoader: React.FC<ProblemLoaderProps> = ({ problemId, onLoaded }) => {
  // Use proper domain model types
  const [problem, setProblem] = useState<Problem | null>(null);
  // We'll keep the legacy problem data for internal usage and compatibility
  // Using a Record type instead of any for legacy data
  const [, setLegacyProblem] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get both API compatibility layer and direct repository access
  const { api, problemRepository } = useServices();
  
  // Example showing how to check if repositories are being used
  const usingRepositories = api.usingRepositories;

  // Wrap both loading functions in useCallback to prevent recreation on every render
  const loadProblemViaCompatLayer = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // This works regardless of whether repositories are enabled or not
      const legacyData = await api.getProblem(id);
      
      // Store the legacy data format for UI components that still need it
      setLegacyProblem(legacyData);
      
      if (!legacyData) {
        throw new Error('Problem not found');
      }
      
      // If we're using the repository pattern directly, we already have domain models
      if (api.usingRepositories) {
        // In this case, we can get the domain model directly
        const domainProblem = await problemRepository.findById(id);
        if (domainProblem) {
          setProblem(domainProblem);
          if (onLoaded) onLoaded(domainProblem);
        }
      } else {
        // Otherwise, we need to convert from legacy format to domain model
        // This is where DataModelConverter comes in
        // For this example, we'll create a minimal Problem object manually
        const minimalProblem: Problem = {
          id: legacyData.id,
          title: legacyData.title,
          description: legacyData.description,
          difficulty: 'intermediate',
          tags: [],
          metadata: {
            language: 'python',
            concepts: [],
            prerequisites: [],
            isPublic: true,
            version: 1
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
                triggerThresholds: {
                  incorrectAttempts: 3,
                  timeSpentMinutes: 10,
                  helpRequests: 2
                },
                availableHelp: ['combine_blocks', 'remove_distractors']
              }
            }
          },
          educationalObjectives: [],
          estimatedTimeMinutes: 15,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setProblem(minimalProblem);
        if (onLoaded) onLoaded(minimalProblem);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load problem';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [api, onLoaded, problemRepository]); // Include all dependencies
  
  // Phase 2: Using the repository directly (final goal of migration)
  // This function is included for completeness and would be used in the final implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadProblemViaRepository = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // This directly uses the repository to get the domain model
      const domainProblem = await problemRepository.findById(id);
      
      if (domainProblem) {
        // Store the domain model directly - it's already in the right format
        setProblem(domainProblem);
        
        // For backward compatibility, also convert to legacy format
        // This step would be needed while some components still use legacy formats
        const legacySettings = DataModelConverter.problemToLegacySettings(domainProblem);
        setLegacyProblem({
          id: domainProblem.id,
          title: domainProblem.title,
          description: domainProblem.description,
          parsonsSettings: legacySettings
        });
        
        if (onLoaded) onLoaded(domainProblem);
      } else {
        setError('Problem not found');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load problem';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [onLoaded, problemRepository]); // Include dependencies
  
  // In this example, we're using the compatibility layer
  useEffect(() => {
    if (problemId) {
      // Choose which approach to use:
      
      // Approach 1: Compatibility layer (works with both old and new code)
      loadProblemViaCompatLayer(problemId);
      
      // Approach 2: Direct repository usage (final goal of migration)
      // loadProblemViaRepository(problemId);
    }
  }, [problemId, loadProblemViaCompatLayer]);

  if (loading) return <div className="p-4 text-center">Loading problem...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!problem) return <div className="p-4 text-center">No problem loaded</div>;

  // Display the domain model data
  return (
    <div className="problem-loader-example p-4 border rounded">
      <div className="bg-blue-50 p-2 mb-4 rounded">
        <p>
          <strong>Current data access method:</strong>{' '}
          {usingRepositories ? 'Repository Pattern' : 'Direct API Calls'}
        </p>
      </div>
      
      <h2 className="text-xl font-bold mb-2">{problem.title}</h2>
      <p className="mb-4">{problem.description}</p>
      
      {/* Display domain model specific data */}
      <div className="mt-4 bg-gray-50 p-3 rounded">
        <h3 className="font-semibold mb-2">Domain Model Properties:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Difficulty: {problem.difficulty}</li>
          <li>Tags: {problem.tags.length ? problem.tags.join(', ') : 'None'}</li>
          <li>Language: {problem.metadata.language}</li>
          <li>Correct blocks: {problem.codeStructure.correctSolution.length}</li>
          <li>Distractors: {problem.codeStructure.distractors.length}</li>
          <li>Created: {new Date(problem.createdAt).toLocaleString()}</li>
        </ul>
      </div>
      
      {/* Example of how to render code blocks from domain model */}
      {problem.codeStructure.correctSolution.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold">Solution blocks:</h3>
          <pre className="bg-gray-800 text-white p-3 rounded mt-2 overflow-x-auto">
            {problem.codeStructure.correctSolution.map((block) => (
              <div key={block.id} className="py-1">
                {' '.repeat(block.indentationLevel * 2)}{block.content}
              </div>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ProblemLoader;
