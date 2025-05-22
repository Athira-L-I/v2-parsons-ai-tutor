import React, { useState } from 'react';
import { NextPage } from 'next';
import { checkSolution } from '@/lib/api';

const testSolutions = {
  correct: [
    "start = 1, end = 10",
    "for i in range(start, end + 1):",
    "    if i % 2 == 0:",
    "        print(i)"
  ],
  incorrect: [
    "for i in range(start, end + 1):",
    "start = 1, end = 10",
    "    if i % 2 == 0:",
    "        print(i)"
  ],
  empty: [],
  invalid: ["only one line"]
};

const TestApiSolutions: NextPage = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customProblemId, setCustomProblemId] = useState('demo-problem-1');
  const [customSolution, setCustomSolution] = useState('');

  const handleTestSolution = async (solutionType: keyof typeof testSolutions) => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const solution = testSolutions[solutionType];
      const response = await checkSolution('demo-problem-1', solution);
      setResult({
        type: solutionType,
        solution,
        response
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
    
    setLoading(false);
  };

  const handleTestCustomSolution = async () => {
    if (!customProblemId.trim()) {
      setError('Please enter a problem ID');
      return;
    }
    
    const solution = customSolution.split('\n').filter(line => line.trim());
    if (solution.length === 0) {
      setError('Please enter a solution');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await checkSolution(customProblemId.trim(), solution);
      setResult({
        type: 'custom',
        solution,
        response
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
    
    setLoading(false);
  };

  const handleTestInvalidInputs = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Test with invalid problem ID
      await checkSolution('', ['some code']);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
    
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">API Solutions Test Page</h1>
      
      {/* Predefined test cases */}
      <div className="mb-8 p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test Predefined Solutions</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {Object.keys(testSolutions).map((type) => (
            <button
              key={type}
              onClick={() => handleTestSolution(type as keyof typeof testSolutions)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 capitalize"
            >
              Test {type} Solution
            </button>
          ))}
        </div>
        
        <button
          onClick={handleTestInvalidInputs}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300"
        >
          Test Invalid Inputs
        </button>
      </div>

      {/* Custom solution test */}
      <div className="mb-8 p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test Custom Solution</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Problem ID:</label>
          <input
            type="text"
            value={customProblemId}
            onChange={(e) => setCustomProblemId(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="Enter problem ID"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Solution (one line per row):</label>
          <textarea
            value={customSolution}
            onChange={(e) => setCustomSolution(e.target.value)}
            className="w-full px-3 py-2 border rounded h-32"
            placeholder="Enter your solution, one line per row"
          />
        </div>
        <button
          onClick={handleTestCustomSolution}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
        >
          {loading ? 'Validating...' : 'Test Custom Solution'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="mb-8 p-6 border rounded-lg bg-green-50">
          <h2 className="text-xl font-semibold mb-4">Validation Result</h2>
          <div className="space-y-2">
            <p><strong>Test Type:</strong> {result.type}</p>
            <p><strong>Is Correct:</strong> 
              <span className={result.response.isCorrect ? 'text-green-600' : 'text-red-600'}>
                {result.response.isCorrect ? ' ✓ Yes' : ' ✗ No'}
              </span>
            </p>
            <p><strong>Details:</strong> {result.response.details}</p>
            <div>
              <strong>Solution tested:</strong>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-sm">
                {result.solution.join('\n')}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading Display */}
      {loading && (
        <div className="p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          Validating solution...
        </div>
      )}
    </div>
  );
};

export default TestApiSolutions;