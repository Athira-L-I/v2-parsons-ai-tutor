import React, { useState } from 'react';
import { NextPage } from 'next';
import { ParsonsSettings, ParsonsGrader } from '@/@types/types';

const TestValidationPage: NextPage = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Sample problem for testing
  const sampleProblem: ParsonsSettings = {
    initial: 'def sum_numbers(a, b):\n    return a + b',
    options: {
      sortableId: 'sortable',
      trashId: 'sortableTrash',
      max_wrong_lines: 0,
      can_indent: true,
      grader: ParsonsGrader.LineBased,
      exec_limit: 2500,
      show_feedback: true
    }
  };
  
  // Sample solutions for testing
  const correctSolution = ['def sum_numbers(a, b):', '    return a + b'];
  const wrongOrderSolution = ['    return a + b', 'def sum_numbers(a, b):'];
  const wrongIndentSolution = ['def sum_numbers(a, b):', 'return a + b'];
  const tooShortSolution = ['def sum_numbers(a, b):'];
  
  const testValidation = async (solution: string[]) => {
    setLoading(true);
    try {
      const response = await fetch('/api/local-validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: sampleProblem,
          solution: solution
        }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error testing validation:', error);
      setResult({ error: 'Failed to test validation' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Test: Local Validation API</h1>
      
      <div className="bg-white p-6 rounded-md shadow-sm border mb-6">
        <h2 className="text-xl font-semibold mb-4">Problem</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm font-mono mb-6">
          {sampleProblem.initial}
        </pre>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => testValidation(correctSolution)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            disabled={loading}
          >
            Test Correct Solution
          </button>
          <button
            onClick={() => testValidation(wrongOrderSolution)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            disabled={loading}
          >
            Test Wrong Order
          </button>
          <button
            onClick={() => testValidation(wrongIndentSolution)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            disabled={loading}
          >
            Test Wrong Indent
          </button>
          <button
            onClick={() => testValidation(tooShortSolution)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={loading}
          >
            Test Too Short
          </button>
        </div>
        
        {loading && (
          <div className="flex justify-center my-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {result && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Result</h3>
            <div className={`p-4 rounded ${
              result.error ? 'bg-red-100 text-red-800' :
              result.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {result.error ? result.error : result.details}
            </div>
            <div className="mt-4">
              <h4 className="font-medium">Full Response:</h4>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestValidationPage;