import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import LocalStorageService, { ProblemProgress, UserSolution } from '@/lib/localStorageService';

const TestLocalStorage: NextPage = () => {
  const [currentProgress, setCurrentProgress] = useState<ProblemProgress | null>(null);
  const [allProgress, setAllProgress] = useState<Record<string, ProblemProgress>>({});
  const [solutions, setSolutions] = useState<UserSolution[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [testProblemId, setTestProblemId] = useState('test-problem-1');
  const [testSolution, setTestSolution] = useState('line1\nline2\nline3');

  // Initialize session on mount
  useEffect(() => {
    const sessionId = LocalStorageService.startSession();
    console.log('Started session:', sessionId);
    refreshData();
  }, []);

  const refreshData = () => {
    setCurrentProgress(LocalStorageService.getProblemProgress(testProblemId));
    setAllProgress(LocalStorageService.getAllProblemProgress());
    setSolutions(LocalStorageService.getUserSolutions(testProblemId));
    setStatistics(LocalStorageService.getProgressStatistics());
    setSessionData(LocalStorageService.getCurrentSession());
  };

  const handleSaveSolution = () => {
    const solution = testSolution.split('\n').filter(line => line.trim());
    const success = LocalStorageService.updateProblemSolution(testProblemId, solution);
    
    if (success) {
      alert('Solution saved successfully!');
      refreshData();
    } else {
      alert('Failed to save solution');
    }
  };

  const handleIncrementAttempts = () => {
    const success = LocalStorageService.incrementProblemAttempts(testProblemId);
    
    if (success) {
      alert('Attempts incremented!');
      refreshData();
    } else {
      alert('Failed to increment attempts');
    }
  };

  const handleMarkCompleted = () => {
    const solution = testSolution.split('\n').filter(line => line.trim());
    const success = LocalStorageService.markProblemCompleted(testProblemId, solution);
    
    if (success) {
      alert('Problem marked as completed!');
      refreshData();
    } else {
      alert('Failed to mark as completed');
    }
  };

  const handleSaveUserSolution = () => {
    const solution = testSolution.split('\n').filter(line => line.trim());
    const userSolution: UserSolution = {
      problemId: testProblemId,
      solution,
      isCorrect: Math.random() > 0.5, // Random for testing
      timestamp: Date.now(),
    };
    
    const success = LocalStorageService.saveUserSolution(userSolution);
    
    if (success) {
      alert('User solution saved!');
      refreshData();
    } else {
      alert('Failed to save user solution');
    }
  };

  const handleExportData = () => {
    const exportedData = LocalStorageService.exportAllData();
    if (exportedData) {
      const blob = new Blob([JSON.stringify(exportedData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'parsons-data-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert('Failed to export data');
    }
  };

  const handleClearAllData = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      const success = LocalStorageService.clearAllData();
      if (success) {
        alert('All data cleared!');
        refreshData();
      } else {
        alert('Failed to clear data');
      }
    }
  };

  const handleClearProblemData = () => {
    if (confirm(`Clear all data for problem ${testProblemId}?`)) {
      const success = LocalStorageService.clearProblemData(testProblemId);
      if (success) {
        alert('Problem data cleared!');
        refreshData();
      } else {
        alert('Failed to clear problem data');
      }
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Local Storage Service Test</h1>
      
      {/* Test Controls */}
      <div className="mb-8 p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Problem ID:</label>
            <input
              type="text"
              value={testProblemId}
              onChange={(e) => setTestProblemId(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Test Solution:</label>
            <textarea
              value={testSolution}
              onChange={(e) => setTestSolution(e.target.value)}
              className="w-full px-3 py-2 border rounded h-20"
              placeholder="Enter solution lines (one per line)"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={handleSaveSolution}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Save Solution
          </button>
          <button
            onClick={handleIncrementAttempts}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Increment Attempts
          </button>
          <button
            onClick={handleMarkCompleted}
            className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
          >
            Mark Completed
          </button>
          <button
            onClick={handleSaveUserSolution}
            className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
          >
            Save User Solution
          </button>
        </div>
      </div>

      {/* Current Problem Progress */}
      <div className="mb-8 p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Current Problem Progress</h2>
        {currentProgress ? (
          <div className="bg-gray-50 p-4 rounded">
            <pre className="text-sm">{JSON.stringify(currentProgress, null, 2)}</pre>
          </div>
        ) : (
          <p className="text-gray-500">No progress data for {testProblemId}</p>
        )}
      </div>

      {/* All Progress */}
      <div className="mb-8 p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">All Problem Progress</h2>
        {Object.keys(allProgress).length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(allProgress).map(([problemId, progress]) => (
              <div key={problemId} className="bg-gray-50 p-3 rounded">
                <div className="font-medium">{problemId}</div>
                <div className="text-sm text-gray-600">
                  Attempts: {progress.attempts} | 
                  Completed: {progress.isCompleted ? 'Yes' : 'No'} | 
                  Lines: {progress.currentSolution.length}
               </div>
             </div>
           ))}
         </div>
       ) : (
         <p className="text-gray-500">No progress data available</p>
       )}
     </div>

     {/* User Solutions */}
     <div className="mb-8 p-6 border rounded-lg">
       <h2 className="text-xl font-semibold mb-4">User Solutions for {testProblemId}</h2>
       {solutions.length > 0 ? (
         <div className="space-y-2 max-h-64 overflow-y-auto">
           {solutions.map((solution, index) => (
             <div key={index} className="bg-gray-50 p-3 rounded">
               <div className="flex justify-between items-start mb-2">
                 <span className={`text-sm font-medium ${solution.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                   {solution.isCorrect ? 'Correct' : 'Incorrect'}
                 </span>
                 <span className="text-xs text-gray-500">
                   {new Date(solution.timestamp).toLocaleString()}
                 </span>
               </div>
               <pre className="text-xs text-gray-700">
                 {solution.solution.join('\n')}
               </pre>
             </div>
           ))}
         </div>
       ) : (
         <p className="text-gray-500">No solutions saved for {testProblemId}</p>
       )}
     </div>

     {/* Statistics */}
     <div className="mb-8 p-6 border rounded-lg">
       <h2 className="text-xl font-semibold mb-4">Statistics</h2>
       {statistics ? (
         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
           <div className="bg-blue-50 p-3 rounded">
             <div className="text-sm text-gray-600">Problems Attempted</div>
             <div className="text-2xl font-bold text-blue-600">{statistics.totalProblemsAttempted}</div>
           </div>
           <div className="bg-green-50 p-3 rounded">
             <div className="text-sm text-gray-600">Problems Completed</div>
             <div className="text-2xl font-bold text-green-600">{statistics.totalProblemsCompleted}</div>
           </div>
           <div className="bg-purple-50 p-3 rounded">
             <div className="text-sm text-gray-600">Total Attempts</div>
             <div className="text-2xl font-bold text-purple-600">{statistics.totalAttempts}</div>
           </div>
           <div className="bg-orange-50 p-3 rounded">
             <div className="text-sm text-gray-600">Completion Rate</div>
             <div className="text-2xl font-bold text-orange-600">
               {(statistics.completionRate * 100).toFixed(1)}%
             </div>
           </div>
           <div className="bg-indigo-50 p-3 rounded">
             <div className="text-sm text-gray-600">Avg Attempts</div>
             <div className="text-2xl font-bold text-indigo-600">
               {statistics.averageAttemptsPerProblem.toFixed(1)}
             </div>
           </div>
           <div className="bg-gray-50 p-3 rounded">
             <div className="text-sm text-gray-600">Time Spent (ms)</div>
             <div className="text-2xl font-bold text-gray-600">{statistics.totalTimeSpent}</div>
           </div>
         </div>
       ) : (
         <p className="text-gray-500">No statistics available</p>
       )}
     </div>

     {/* Session Data */}
     <div className="mb-8 p-6 border rounded-lg">
       <h2 className="text-xl font-semibold mb-4">Current Session</h2>
       {sessionData ? (
         <div className="bg-gray-50 p-4 rounded">
           <pre className="text-sm">{JSON.stringify(sessionData, null, 2)}</pre>
         </div>
       ) : (
         <p className="text-gray-500">No active session</p>
       )}
     </div>

     {/* Data Management */}
     <div className="mb-8 p-6 border rounded-lg">
       <h2 className="text-xl font-semibold mb-4">Data Management</h2>
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <button
           onClick={refreshData}
           className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
         >
           Refresh Data
         </button>
         <button
           onClick={handleExportData}
           className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
         >
           Export Data
         </button>
         <button
           onClick={handleClearProblemData}
           className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
         >
           Clear Problem Data
         </button>
         <button
           onClick={handleClearAllData}
           className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
         >
           Clear All Data
         </button>
       </div>
     </div>

     {/* Testing Instructions */}
     <div className="p-4 bg-gray-100 rounded text-sm text-gray-700">
       <h3 className="font-medium mb-2">Testing Instructions:</h3>
       <ul className="list-disc list-inside space-y-1">
         <li>Change the Problem ID and Solution to test different scenarios</li>
         <li>Click "Save Solution" to update the current solution for a problem</li>
         <li>Click "Increment Attempts" to increase the attempt counter</li>
         <li>Click "Mark Completed" to mark a problem as finished</li>
         <li>Click "Save User Solution" to add a timestamped solution entry</li>
         <li>Use "Export Data" to download all stored data as JSON</li>
         <li>All data persists between page reloads and browser sessions</li>
       </ul>
     </div>
   </div>
 );
};

export default TestLocalStorage;