import React, { useEffect } from 'react';
import ParsonsBoard from '@/components/ParsonsBoard';
import { ParsonsProvider, useParsonsContext } from '@/contexts/ParsonsContext';
import { ParsonsGrader } from '@/@types/types';
import SolutionChecker from '@/components/SolutionChecker';
import FeedbackPanel from '@/components/FeedbackPanel';

export default function TestParsonsBoard() {
  // Wrap in ParsonsProvider for context access
  return (
    <ParsonsProvider>
      <TestParsonsBoardContent />
    </ParsonsProvider>
  );
}

function TestParsonsBoardContent() {
  const { setCurrentProblem, userSolution, isCorrect, setIsCorrect, setFeedback } = useParsonsContext();
  
  useEffect(() => {
    // Set a sample problem when the component mounts
    const sampleProblem = {
      initial: "def factorial(n):\n    if n <= 1:\n        return 1\n    else:\n        return n * factorial(n - 1)\n\nresult = factorial(5)\nprint(result)\n# This is a comment #distractor\nprint('Done')",
      options: {
        sortableId: 'sortable',
        trashId: 'sortableTrash',
        max_wrong_lines: 1,
        can_indent: true,
        grader: ParsonsGrader.LineBased,
        x_indent: 40,
        exec_limit: 2500,
        show_feedback: true
      }
    };
    
    setCurrentProblem(sampleProblem);
    
    // Reset feedback and correctness when component mounts
    setIsCorrect(null);
    setFeedback(null);
  }, [setCurrentProblem, setIsCorrect, setFeedback]);
  
  // Simple function to check the solution
  const handleCheckSolution = () => {
    // This is a simplified check - in a real app you'd use proper validation
    const correctSolution = [
      "def factorial(n):",
      "    if n <= 1:",
      "        return 1",
      "    else:",
      "        return n * factorial(n - 1)",
      "result = factorial(5)",
      "print(result)",
      "print('Done')"
    ];
    
    // Check if solution is correct (simplified)
    const correct = JSON.stringify(userSolution) === JSON.stringify(correctSolution);
    setIsCorrect(correct);
    
    if (correct) {
      setFeedback("Great job! Your solution is correct.");
    } else {
      setFeedback("Not quite right. Check the order of your code blocks and indentation.");
    }
  };
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">ParsonsBoard Component Test</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-lg font-semibold mb-4">Parsons Problem: Factorial Function</h2>
        <p className="mb-4">
          Arrange the code blocks to create a factorial function and test it with n=5.
        </p>
        
        <ParsonsBoard />
        
        <div className="mt-6">
          <button 
            onClick={handleCheckSolution}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Check Solution
          </button>
        </div>
        
        <div className="mt-4">
          {isCorrect !== null && (
            <div className={`p-3 rounded ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isCorrect ? 'Correct!' : 'Incorrect. Try again!'}
            </div>
          )}
        </div>
        
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Current Solution:</h3>
          <pre className="bg-gray-100 p-4 rounded font-mono text-sm whitespace-pre-wrap">
            {userSolution.join('\n')}
          </pre>
        </div>
      </div>
    </div>
  );
}