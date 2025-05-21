import React, { useEffect } from 'react';
import { NextPage } from 'next';
import ParsonsWidgetComponent from '@/components/ParsonsWidget';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import { ParsonsGrader } from '@/@types/types';
import FeedbackPanel from '@/components/FeedbackPanel';

const TestParsonsWidgetPage: NextPage = () => {
  const { 
    setCurrentProblem, 
    userSolution,
    isCorrect, 
    isLoading
  } = useParsonsContext();
  
  // Initialize a sample problem on mount
  useEffect(() => {
    // Set a sample problem with a simple loop
    setCurrentProblem({
      initial: "for i in range(10):\n    print(i)\n    if i % 2 == 0:\n        print('Even')\n    else:\n        print('Odd')",
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
  
  const handleSolutionChange = (solution: string[]) => {
    console.log("Solution changed:", solution);
  };
  
  const handleCheckSolution = (isCorrect: boolean) => {
    console.log("Check solution result:", isCorrect);
  };
  
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">ParsonsWidget Test Page</h1>
      
      <div className="bg-white p-6 border rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Current State</h2>
        <p><strong>Solution Lines:</strong> {userSolution.length}</p>
        <p><strong>isCorrect:</strong> {isCorrect === null ? 'null' : isCorrect.toString()}</p>
        <p><strong>isLoading:</strong> {isLoading.toString()}</p>
        
        {userSolution.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Current Solution:</h3>
            <pre className="bg-gray-100 p-2 rounded">
              {userSolution.join('\n')}
            </pre>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 border rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Parsons Widget</h2>
        <p className="mb-4">Drag and drop the code blocks to create a solution:</p>
        
        <ParsonsWidgetComponent 
          onSolutionChange={handleSolutionChange}
          onCheckSolution={handleCheckSolution}
        />
      </div>
      
      <FeedbackPanel />
    </div>
  );
};

export default TestParsonsWidgetPage;