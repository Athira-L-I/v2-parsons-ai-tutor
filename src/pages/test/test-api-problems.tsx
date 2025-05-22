import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { fetchProblems, fetchProblemById } from '@/lib/api';

const TestApiProblems: NextPage = () => {
  const [problems, setProblems] = useState<any[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testProblemId, setTestProblemId] = useState('');

  const handleFetchProblems = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProblems();
      setProblems(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
    setLoading(false);
  };

  const handleFetchProblemById = async () => {
    if (!testProblemId.trim()) {
      setError('Please enter a problem ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProblemById(testProblemId.trim());
      setSelectedProblem(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setSelectedProblem(null);
    }
    setLoading(false);
  };

  // Test with invalid data
  const handleTestInvalidId = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchProblemById('invalid-id-12345');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">API Problems Test Page</h1>
      
      {/* Test fetchProblems */}
      <div className="mb-8 p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test fetchProblems()</h2>
        <button
          onClick={handleFetchProblems}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Loading...' : 'Fetch All Problems'}
        </button>
        
        {problems.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Problems ({problems.length}):</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {problems.map((problem, index) => (
                <div key={problem.id || index} className="p-2 bg-gray-100 rounded">
                  <strong>ID:</strong> {problem.id} | <strong>Title:</strong> {problem.title}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Test fetchProblemById */}
      <div className="mb-8 p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test fetchProblemById()</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={testProblemId}
            onChange={(e) => setTestProblemId(e.target.value)}
            placeholder="Enter problem ID"
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={handleFetchProblemById}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
          >
            {loading ? 'Loading...' : 'Fetch Problem'}
          </button>
        </div>
        
        <button
          onClick={handleTestInvalidId}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300 mb-4"
        >
          Test Invalid ID
        </button>

        {selectedProblem && (
          <div className="mt-4 p-4 bg-green-50 rounded">
            <h3 className="font-medium mb-2">Problem Details:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(selectedProblem, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading Display */}
      {loading && (
        <div className="p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          Loading...
        </div>
      )}
    </div>
  );
};

export default TestApiProblems;