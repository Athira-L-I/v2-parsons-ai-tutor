import React, { useEffect } from 'react';
import { NextPage } from 'next';
import SolutionChecker from '@/components/SolutionChecker';
import FeedbackPanel from '@/components/FeedbackPanel';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import { ParsonsGrader } from '@/@types/types';

const TestSolutionCheckerPage: NextPage = () => {
  const { 
    setCurrentProblem, 
    setUserSolution, 
    userSolution,
    isCorrect, 
    isLoading, 
    attempts
  } = useParsonsContext();
  
  // Initialize a sample problem on mount
  useEffect(() => {
    // Set a sample problem
    setCurrentProblem({
      initial: "def calculate_sum(a, b):\n    return a + b\n\nresult = calculate_sum(5, 10)\nprint(result)",
      options: {
        sortableId: 'sortable',
        trashId: 'sortableTrash',
        max_wrong_lines: 0,
        can_indent: true,
        grader: ParsonsGrader.LineBased,
        exec_limit: 2500,
        show_feedback: true
      }
    });
  }, [setCurrentProblem]);
  
  // Sample solutions - correct and incorrect
  const setCorrectSolution = () => {
    setUserSolution([
      "def calculate_sum(a, b):",
      "    return a + b",
      "",
      "result = calculate_sum(5, 10)",
      "print(result)"
    ]);
  };
  
  const setIncorrectSolution = () => {
    setUserSolution([
      "def calculate_sum(a, b):",
      "print(result)",
      "    return a + b",
      "result = calculate_sum(5, 10)"
    ]);
  };
  
  const clearSolution = () => {
    setUserSolution([]);
  };
  
  const handleCheckComplete = (isCorrect: boolean) => {
    console.log("Check completed, solution is:", isCorrect ? "correct" : "incorrect");
  };
  
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">SolutionChecker Test Page</h1>
      
      <div className="mb-6 space-x-4">
        <button 
          className="px-4 py-2 bg-green-600 text-white rounded"
          onClick={setCorrectSolution}
        >
          Set Correct Solution
        </button>
        <button 
          className="px-4 py-2 bg-red-600 text-white rounded"
          onClick={setIncorrectSolution}
        >
          Set Incorrect Solution
        </button>
        <button 
          className="px-4 py-2 bg-gray-600 text-white rounded"
          onClick={clearSolution}
        >
          Clear Solution
        </button>
      </div>
      
      <div className="bg-white p-6 border rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Current State</h2>
        <p><strong>Solution Length:</strong> {userSolution.length} lines</p>
        <p><strong>isCorrect:</strong> {isCorrect === null ? 'null' : isCorrect.toString()}</p>
        <p><strong>isLoading:</strong> {isLoading.toString()}</p>
        <p><strong>Attempts:</strong> {attempts}</p>
        
        {userSolution.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Current Solution:</h3>
            <pre className="bg-gray-100 p-2 rounded">
              {userSolution.join('\n')}
            </pre>
          </div>
        )}
      </div>
      
      <SolutionChecker onCheckComplete={handleCheckComplete} />
      
      <div className="mt-6">
        <FeedbackPanel />
      </div>
    </div>
  );
};

export default TestSolutionCheckerPage;