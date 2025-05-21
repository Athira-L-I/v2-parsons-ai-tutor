import React, { useEffect } from 'react';
import { NextPage } from 'next';
import FeedbackPanel from '@/components/FeedbackPanel';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import { ParsonsGrader } from '@/@types/types';

const TestFeedbackPage: NextPage = () => {
  const { 
    setCurrentProblem, 
    setFeedback, 
    setSocraticFeedback, 
    setIsCorrect, 
    setIsLoading, 
    isCorrect, 
    isLoading 
  } = useParsonsContext();
  
  // Initialize a sample problem on mount
  useEffect(() => {
    // Set a sample problem
    setCurrentProblem({
      initial: "for i in range(10):\n    print(i)",
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
  
  // Test functions to set different states
  const showCorrect = () => {
    setIsLoading(false);
    setIsCorrect(true);
    setFeedback("Your solution matched the expected order and indentation!");
    setSocraticFeedback(null);
  };
  
  const showIncorrect = () => {
    setIsLoading(false);
    setIsCorrect(false);
    setFeedback("The highlighted blocks in your solution are in the wrong order.");
    setSocraticFeedback("Have you considered what needs to happen first in this code? Remember that in Python, variables need to be defined before they are used.");
  };
  
  const showLoading = () => {
    setIsLoading(true);
  };
  
  const resetFeedback = () => {
    setIsLoading(false);
    setIsCorrect(null);
    setFeedback(null);
    setSocraticFeedback(null);
  };
  
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">FeedbackPanel Test Page</h1>
      
      <div className="mb-6 space-x-4">
        <button 
          className="px-4 py-2 bg-green-600 text-white rounded"
          onClick={showCorrect}
        >
          Show Correct
        </button>
        <button 
          className="px-4 py-2 bg-red-600 text-white rounded"
          onClick={showIncorrect}
        >
          Show Incorrect
        </button>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={showLoading}
        >
          Show Loading
        </button>
        <button 
          className="px-4 py-2 bg-gray-600 text-white rounded"
          onClick={resetFeedback}
        >
          Reset
        </button>
      </div>
      
      <div className="bg-white p-6 border rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Current State</h2>
        <p><strong>isCorrect:</strong> {isCorrect === null ? 'null' : isCorrect.toString()}</p>
        <p><strong>isLoading:</strong> {isLoading.toString()}</p>
      </div>
      
      <div className="mt-6">
        <FeedbackPanel />
      </div>
    </div>
  );
};

export default TestFeedbackPage;