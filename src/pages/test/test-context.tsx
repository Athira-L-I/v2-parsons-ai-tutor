import React from 'react';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import { ParsonsGrader } from '@/@types/types';

const ContextTest: React.FC = () => {
  const { 
    currentProblem,
    setCurrentProblem,
    isCorrect,
    setIsCorrect,
    attempts,
    incrementAttempts,
    resetContext
  } = useParsonsContext();

  // Sample problem for testing
  const sampleProblem = {
    initial: "def hello_world():\n    print('Hello, world!')",
    options: {
      sortableId: 'sortable',
      trashId: 'trash',
      max_wrong_lines: 1,
      can_indent: true,
      grader: ParsonsGrader.LineBased
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">ParsonsContext Test</h1>
      
      <div className="space-y-4">
        <div>
          <p className="font-medium">Current Problem:</p>
          <pre className="bg-gray-100 p-3 rounded mt-2">
            {currentProblem ? JSON.stringify(currentProblem, null, 2) : 'No problem loaded'}
          </pre>
        </div>
        
        <div>
          <p className="font-medium">Is Correct: {isCorrect === null ? 'Not checked' : isCorrect ? 'Yes' : 'No'}</p>
          <p className="font-medium">Attempts: {attempts}</p>
        </div>
        
        <div className="flex space-x-4">
          <button 
            onClick={() => setCurrentProblem(sampleProblem)}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Set Sample Problem
          </button>
          
          <button 
            onClick={() => setIsCorrect(true)}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Set Correct
          </button>
          
          <button 
            onClick={() => setIsCorrect(false)}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Set Incorrect
          </button>
          
          <button 
            onClick={incrementAttempts}
            className="px-4 py-2 bg-yellow-600 text-white rounded"
          >
            Increment Attempts
          </button>
          
          <button 
            onClick={resetContext}
            className="px-4 py-2 bg-gray-600 text-white rounded"
          >
            Reset Context
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContextTest;