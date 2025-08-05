/**
 * ProblemIntegrationTest.tsx
 * 
 * This component demonstrates a full integration of:
 * 1. Loading problems using domain models
 * 2. Managing student solution state
 * 3. Validating solutions
 * 4. Providing feedback
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useServices } from '@/contexts/ServiceContext';
import { ArrangedBlock, BlockArrangement, Problem, ValidationResult, CodeBlock } from '@/types/domain';

/**
 * Props for the ProblemIntegrationTest component
 */
interface ProblemIntegrationTestProps {
  problemId: string;
  showAllFeatures?: boolean;
}

// We'll create a student solution model to make working with arranged blocks easier
interface StudentSolution {
  // Using the proper BlockArrangement structure
  arrangement: BlockArrangement;
  // Added for UI convenience
  unplacedBlocks: CodeBlock[];
  placedBlocks: ArrangedBlock[];
  timestamp: number;
}

/**
 * A comprehensive component that demonstrates integrating all the parts
 * of a Parsons Problem UI with domain models
 */
const ProblemIntegrationTest: React.FC<ProblemIntegrationTestProps> = ({ 
  problemId, 
  showAllFeatures = true 
}) => {
  // Domain model states
  const [problem, setProblem] = useState<Problem | null>(null);
  const [solution, setSolution] = useState<StudentSolution | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [attempts, setAttempts] = useState<number>(0);
  
  // UI states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Get services via context
  const { problemRepository, api, validationService } = useServices();
  
  // Load problem using domain model
  const loadProblem = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the problem through the repository
      const problemData = await problemRepository.findById(id);
      
      if (problemData) {
        setProblem(problemData);
        
        // Initialize solution state with empty arrangement
        const initialArrangement: BlockArrangement = {
          id: `solution-${id}`,
          problemId: id,
          unplacedBlocks: [
            ...problemData.codeStructure.correctSolution,
            ...problemData.codeStructure.distractors
          ].map(block => ({
            ...block,
            indentationLevel: 0 // Reset indentation for unplaced blocks
          })),
          placedBlocks: [], // Start with no placed blocks
          attemptCount: 0,
          lastUpdated: new Date().toISOString()
        };
        
        // Shuffle blocks if needed
        if (problemData.codeStructure.options.randomizeBlockOrder) {
          initialArrangement.unplacedBlocks.sort(() => Math.random() - 0.5);
        }
        
        setSolution(initialArrangement);
      } else {
        setError('Problem not found');
      }
    } catch (err) {
      setError(`Failed to load problem: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [problemRepository]);
  
  // Submit solution for validation
  const validateSolution = useCallback(async () => {
    if (!problem || !solution) return;
    
    setIsSubmitting(true);
    
    try {
      // Use the validator service to check the solution
      const result = await solutionValidator.validateSolution(problem, solution);
      
      // Update state with validation results
      setValidationResult(result);
      setAttempts(prev => prev + 1);
      
      // Update solution with attempt count
      setSolution(prev => prev ? {
        ...prev,
        attemptCount: prev.attemptCount + 1,
        lastUpdated: new Date().toISOString()
      } : null);
    } catch (err) {
      setError(`Validation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [problem, solution, solutionValidator]);
  
  // Simulated block movement function (in a real app, this would update based on drag and drop)
  const moveBlockToPlaced = useCallback((blockId: string) => {
    if (!solution) return;
    
    const block = solution.unplacedBlocks.find(b => b.id === blockId);
    if (!block) return;
    
    // Update solution state
    setSolution({
      ...solution,
      unplacedBlocks: solution.unplacedBlocks.filter(b => b.id !== blockId),
      placedBlocks: [...solution.placedBlocks, block],
      lastUpdated: new Date().toISOString()
    });
  }, [solution]);
  
  // Simulated indentation function
  const indentBlock = useCallback((blockId: string, delta: number) => {
    if (!solution) return;
    
    // Find the block in placed blocks
    const blockIndex = solution.placedBlocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const block = solution.placedBlocks[blockIndex];
    const newIndentation = Math.max(0, block.indentationLevel + delta);
    
    // Create updated block
    const updatedBlock = {
      ...block,
      indentationLevel: newIndentation
    };
    
    // Update solution with modified block
    const newPlacedBlocks = [...solution.placedBlocks];
    newPlacedBlocks[blockIndex] = updatedBlock;
    
    setSolution({
      ...solution,
      placedBlocks: newPlacedBlocks,
      lastUpdated: new Date().toISOString()
    });
  }, [solution]);
  
  // Reset solution to initial state
  const resetSolution = useCallback(() => {
    if (!problem) return;
    
    // Create a new solution state with all blocks unplaced
    const resetArrangement: BlockArrangement = {
      id: `solution-${problem.id}`,
      problemId: problem.id,
      unplacedBlocks: [
        ...problem.codeStructure.correctSolution,
        ...problem.codeStructure.distractors
      ].map(block => ({
        ...block,
        indentationLevel: 0 // Reset indentation
      })),
      placedBlocks: [],
      attemptCount: 0,
      lastUpdated: new Date().toISOString()
    };
    
    // Shuffle blocks if needed
    if (problem.codeStructure.options.randomizeBlockOrder) {
      resetArrangement.unplacedBlocks.sort(() => Math.random() - 0.5);
    }
    
    setSolution(resetArrangement);
    setValidationResult(null);
  }, [problem]);
  
  // Load problem on component mount
  useEffect(() => {
    if (problemId) {
      loadProblem(problemId);
    }
  }, [problemId, loadProblem]);
  
  // Loading and error states
  if (loading) {
    return (
      <div className="p-6 text-center border rounded">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-20 bg-slate-200 rounded mb-4"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
        <p className="mt-4 text-gray-500">Loading problem...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 border border-red-300 rounded text-red-600 bg-red-50">
        <h3 className="text-lg font-semibold mb-2">Error</h3>
        <p>{error}</p>
        <button 
          onClick={() => loadProblem(problemId)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!problem || !solution) {
    return (
      <div className="p-6 border rounded text-gray-500">
        No problem data available.
      </div>
    );
  }
  
  // Render the component with problem data
  return (
    <div className="problem-integration-test p-4 border rounded">
      {/* Problem header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">{problem.title}</h2>
        <p className="mb-4">{problem.description}</p>
        
        {showAllFeatures && (
          <div className="flex gap-2 text-sm mb-4">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
              {problem.difficulty}
            </span>
            {problem.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Problem workspace */}
      <div className="mb-6 flex gap-6">
        {/* Unplaced blocks */}
        <div className="w-1/2">
          <h3 className="font-semibold mb-2">Available Blocks</h3>
          <div className="p-4 min-h-[200px] bg-gray-50 border rounded">
            {solution.unplacedBlocks.length === 0 ? (
              <p className="text-gray-400 text-center">All blocks placed</p>
            ) : (
              <div className="space-y-2">
                {solution.unplacedBlocks.map(block => (
                  <div 
                    key={block.id}
                    onClick={() => moveBlockToPlaced(block.id)}
                    className="p-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-blue-50"
                  >
                    <pre className="font-mono text-sm whitespace-pre-wrap">{block.content}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Placed blocks */}
        <div className="w-1/2">
          <h3 className="font-semibold mb-2">Your Solution</h3>
          <div className="p-4 min-h-[200px] bg-gray-50 border rounded">
            {solution.placedBlocks.length === 0 ? (
              <p className="text-gray-400 text-center">Drag blocks here to build your solution</p>
            ) : (
              <div className="space-y-2">
                {solution.placedBlocks.map(block => (
                  <div 
                    key={block.id}
                    className="flex items-center p-2 bg-white border border-gray-300 rounded group"
                  >
                    {/* Indentation controls */}
                    <div className="flex-shrink-0 mr-2">
                      <button 
                        onClick={() => indentBlock(block.id, -1)}
                        disabled={block.indentationLevel === 0}
                        className="px-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      >
                        ◀
                      </button>
                      <button 
                        onClick={() => indentBlock(block.id, 1)}
                        className="px-1 text-gray-500 hover:text-gray-700"
                      >
                        ▶
                      </button>
                    </div>
                    
                    {/* Block content with indentation */}
                    <pre className="flex-grow font-mono text-sm whitespace-pre-wrap">
                      {' '.repeat(block.indentationLevel * 2)}{block.content}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-between mb-6">
        <button
          onClick={resetSolution}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Reset
        </button>
        
        <button
          onClick={validateSolution}
          disabled={isSubmitting || solution.placedBlocks.length === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          {isSubmitting ? 'Checking...' : 'Check Solution'}
        </button>
      </div>
      
      {/* Validation results */}
      {validationResult && (
        <div className={`p-4 rounded border mb-6 ${
          validationResult.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <h3 className="font-semibold mb-2">
            {validationResult.isCorrect ? 'Correct Solution! 🎉' : 'Not quite right...'}
          </h3>
          
          <div className="mt-2">
            {validationResult.feedback.map((item, i) => (
              <div key={i} className="mb-2">
                <p>{item.message}</p>
                {item.lineNumber && (
                  <p className="text-sm text-gray-600">Line {item.lineNumber}</p>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Attempts: {attempts}
          </div>
        </div>
      )}
      
      {/* Debug information (shown when showAllFeatures is true) */}
      {showAllFeatures && (
        <div className="mt-6 p-4 border border-gray-300 rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Debug Information</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Problem ID:</strong> {problem.id}</p>
            <p><strong>Repository in use:</strong> {api.usingRepositories ? 'Yes' : 'No'}</p>
            <p><strong>Total blocks:</strong> {problem.codeStructure.correctSolution.length + problem.codeStructure.distractors.length}</p>
            <p><strong>Distractors:</strong> {problem.codeStructure.distractors.length}</p>
            <p><strong>Created:</strong> {new Date(problem.createdAt).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemIntegrationTest;
