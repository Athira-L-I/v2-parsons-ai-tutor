import React, { useState } from 'react';
import { NextPage } from 'next';
import ParsonsProblemContainer from '@/components/ParsonsProblemContainer';
import { ParsonsGrader } from '@/@types/types';

const testProblem = {
  initial: "start = 1, end = 10\nfor i in range(start, end + 1):\n    if i % 2 == 0:\n        print(i)",
  options: {
    sortableId: 'sortable',
    trashId: 'sortableTrash',
    max_wrong_lines: 3,
    can_indent: true,
    grader: ParsonsGrader.LineBased,
    exec_limit: 2500,
    show_feedback: true
  }
};

const TestProblemContainer: NextPage = () => {
  const [testMode, setTestMode] = useState<'api' | 'local' | 'uploader'>('api');
  const [apiProblemId, setApiProblemId] = useState('demo-problem-1');

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Problem Container Integration Test</h1>
      
      {/* Test Mode Selection */}
      <div className="mb-8 p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test Mode</h2>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setTestMode('api')}
            className={`px-4 py-2 rounded ${
              testMode === 'api' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            API Mode
          </button>
          <button
            onClick={() => setTestMode('local')}
            className={`px-4 py-2 rounded ${
              testMode === 'local' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Local Problem
          </button>
          <button
            onClick={() => setTestMode('uploader')}
            className={`px-4 py-2 rounded ${
              testMode === 'uploader' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Uploader Mode
          </button>
        </div>
        
        {testMode === 'api' && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Problem ID for API:</label>
            <input
              type="text"
              value={apiProblemId}
              onChange={(e) => setApiProblemId(e.target.value)}
              className="px-3 py-2 border rounded w-64"
              placeholder="Enter problem ID"
            />
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-600">
          <strong>API Mode:</strong> Loads problem from backend API<br/>
          <strong>Local Problem:</strong> Uses predefined test problem<br/>
          <strong>Uploader Mode:</strong> Shows problem creation interface
        </div>
      </div>

      {/* Problem Container */}
      <div className="border rounded-lg p-6">
        {testMode === 'api' && (
          <ParsonsProblemContainer
            problemId={apiProblemId}
            title="API Test Problem"
            description="This problem is loaded from the API"
          />
        )}
        
        {testMode === 'local' && (
          <ParsonsProblemContainer
            problemId="local-test-problem"
            initialProblem={testProblem}
            title="Local Test Problem"
            description="This is a predefined test problem for development"
          />
        )}
        
        {testMode === 'uploader' && (
          <ParsonsProblemContainer
            showUploader={true}
            title="Create New Problem"
            description="Upload or paste code to create a new Parsons problem"
          />
        )}
      </div>

      {/* Testing Instructions */}
      <div className="mt-8 p-4 bg-gray-100 rounded text-sm text-gray-700">
        <h3 className="font-medium mb-2">Testing Instructions:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>API Mode:</strong> Tests loading problems from the backend API. Try both valid and invalid problem IDs.</li>
          <li><strong>Local Problem:</strong> Tests with a predefined problem. Good for testing the UI without API dependencies.</li>
          <li><strong>Uploader Mode:</strong> Tests the problem creation workflow.</li>
          <li>All modes support local storage persistence - your progress will be saved between page reloads.</li>
          <li>Try solving problems, refreshing the page, and see if your progress is restored.</li>
          <li>Use the "Clear Progress" button to reset saved progress for a problem.</li>
          <li>Check the browser console for detailed logging of API calls and storage operations.</li>
        </ul>
      </div>
    </div>
  );
};

export default TestProblemContainer;