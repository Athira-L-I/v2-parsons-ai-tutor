/**
 * DomainModelExample.tsx
 * 
 * A simplified component demonstrating how to use domain models correctly
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useServices } from '@/contexts/ServiceContext';
import { Problem } from '@/types/domain';

interface DomainModelExampleProps {
  problemId: string;
}

const DomainModelExample: React.FC<DomainModelExampleProps> = ({ problemId }) => {
  // State using actual domain model types
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Access the repository via context
  const { problemRepository } = useServices();
  
  // Load problem using the repository
  const loadProblem = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const problemData = await problemRepository.findById(id);
      if (problemData) {
        setProblem(problemData);
      } else {
        setError('Problem not found');
      }
    } catch (err) {
      setError(`Failed to load problem: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [problemRepository]);
  
  // Load problem on component mount
  useEffect(() => {
    if (problemId) {
      loadProblem(problemId);
    }
  }, [problemId, loadProblem]);
  
  // Loading and error states
  if (loading) {
    return <div className="p-4">Loading problem...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }
  
  if (!problem) {
    return <div className="p-4">No problem data available.</div>;
  }
  
  // Render the component with problem data
  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold mb-2">{problem.title}</h2>
      <p className="mb-4">{problem.description}</p>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Problem Details:</h3>
        <ul className="list-disc pl-5">
          <li>Difficulty: {problem.difficulty}</li>
          <li>Tags: {problem.tags.join(', ')}</li>
          <li>Language: {problem.metadata.language}</li>
          <li>Created: {new Date(problem.createdAt).toLocaleString()}</li>
        </ul>
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Code Structure:</h3>
        <p>Total blocks: {problem.codeStructure.correctSolution.length + 
                         problem.codeStructure.distractors.length}</p>
        <p>Distractors: {problem.codeStructure.distractors.length}</p>
        
        {problem.codeStructure.correctSolution.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-1">Solution blocks:</h4>
            <pre className="bg-gray-800 text-white p-3 rounded overflow-x-auto">
              {problem.codeStructure.correctSolution.map((block) => (
                <div key={block.id} className="py-1">
                  {' '.repeat(block.indentationLevel * 2)}{block.content}
                </div>
              ))}
            </pre>
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Adaptive Features:</h3>
        <p>Enabled: {problem.codeStructure.options.adaptiveFeatures?.enabled ? 'Yes' : 'No'}</p>
        {problem.codeStructure.options.adaptiveFeatures?.enabled && (
          <ul className="list-disc pl-5">
            <li>Incorrect attempts trigger: 
              {problem.codeStructure.options.adaptiveFeatures.triggerThresholds.incorrectAttempts}
            </li>
            <li>Time trigger (minutes): 
              {problem.codeStructure.options.adaptiveFeatures.triggerThresholds.timeSpentMinutes}
            </li>
            <li>Help requests trigger: 
              {problem.codeStructure.options.adaptiveFeatures.triggerThresholds.helpRequests}
            </li>
          </ul>
        )}
      </div>
      
      <div>
        <h3 className="font-semibold mb-2">Educational Objectives:</h3>
        {problem.educationalObjectives.length === 0 ? (
          <p>No specific objectives defined.</p>
        ) : (
          <ul className="list-disc pl-5">
            {problem.educationalObjectives.map((objective, index) => (
              <li key={index}>{objective}</li>
            ))}
          </ul>
        )}
      </div>
      
      <button 
        onClick={() => loadProblem(problemId)} 
        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Reload Problem
      </button>
    </div>
  );
};

export default DomainModelExample;
