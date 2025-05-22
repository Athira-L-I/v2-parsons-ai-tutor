import React, { useState } from 'react';
import { NextPage } from 'next';
import { generateFeedback } from '@/lib/api';

const testSolutions = {
 basicLoop: [
   "for i in range(1, 11):",
   "    if i % 2 == 0:",
   "        print(i)"
 ],
 wrongOrder: [
   "    if i % 2 == 0:",
   "for i in range(1, 11):",
   "        print(i)"
 ],
 withFunction: [
   "def calculate_sum(numbers):",
   "    total = 0",
   "    for num in numbers:",
   "        total += num",
   "    return total"
 ],
 empty: [],
 singleLine: ["print('Hello World')"]
};

const TestApiFeedback: NextPage = () => {
 const [feedback, setFeedback] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [customProblemId, setCustomProblemId] = useState('demo-problem-1');
 const [customSolution, setCustomSolution] = useState('');

 const handleTestFeedback = async (solutionType: keyof typeof testSolutions) => {
   setLoading(true);
   setError(null);
   setFeedback(null);
   
   try {
     const solution = testSolutions[solutionType];
     const response = await generateFeedback('demo-problem-1', solution);
     setFeedback(response);
   } catch (err) {
     setError(err instanceof Error ? err.message : 'Unknown error occurred');
   }
   
   setLoading(false);
 };

 const handleTestCustomFeedback = async () => {
   if (!customProblemId.trim()) {
     setError('Please enter a problem ID');
     return;
   }
   
   const solution = customSolution.split('\n').filter(line => line.trim());
   
   setLoading(true);
   setError(null);
   setFeedback(null);
   
   try {
     const response = await generateFeedback(customProblemId.trim(), solution);
     setFeedback(response);
   } catch (err) {
     setError(err instanceof Error ? err.message : 'Unknown error occurred');
   }
   
   setLoading(false);
 };

 const handleTestErrorScenarios = async () => {
   setLoading(true);
   setError(null);
   setFeedback(null);
   
   try {
     // Test with invalid problem ID
     const response = await generateFeedback('invalid-problem-id-12345', ['some code']);
     setFeedback(response);
   } catch (err) {
     setError(err instanceof Error ? err.message : 'Unknown error occurred');
   }
   
   setLoading(false);
 };

 const handleTestNetworkError = async () => {
   setLoading(true);
   setError(null);
   setFeedback(null);
   
   try {
     // Test by temporarily changing the API URL to simulate network error
     const originalFetch = window.fetch;
     window.fetch = () => Promise.reject(new Error('Network error'));
     
     const response = await generateFeedback('demo-problem-1', testSolutions.basicLoop);
     setFeedback(response);
     
     // Restore original fetch
     window.fetch = originalFetch;
   } catch (err) {
     setError(err instanceof Error ? err.message : 'Unknown error occurred');
   }
   
   setLoading(false);
 };

 return (
   <div className="container mx-auto p-8 max-w-4xl">
     <h1 className="text-3xl font-bold mb-6">API Feedback Test Page</h1>
     
     {/* Predefined test cases */}
     <div className="mb-8 p-6 border rounded-lg">
       <h2 className="text-xl font-semibold mb-4">Test Predefined Solutions</h2>
       <div className="grid grid-cols-2 gap-4 mb-4">
         {Object.keys(testSolutions).map((type) => (
           <button
             key={type}
             onClick={() => handleTestFeedback(type as keyof typeof testSolutions)}
             disabled={loading}
             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 capitalize text-sm"
           >
             Test {type.replace(/([A-Z])/g, ' $1')} Solution
           </button>
         ))}
       </div>
       
       <div className="grid grid-cols-2 gap-4">
         <button
           onClick={handleTestErrorScenarios}
           disabled={loading}
           className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-orange-300"
         >
           Test Invalid Problem ID
         </button>
         
         <button
           onClick={handleTestNetworkError}
           disabled={loading}
           className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300"
         >
           Test Network Error (Fallback)
         </button>
       </div>
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
         onClick={handleTestCustomFeedback}
         disabled={loading}
         className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
       >
         {loading ? 'Getting Feedback...' : 'Get Custom Feedback'}
       </button>
     </div>

     {/* Sample solutions display */}
     <div className="mb-8 p-6 border rounded-lg bg-gray-50">
       <h2 className="text-xl font-semibold mb-4">Sample Solutions for Testing</h2>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {Object.entries(testSolutions).map(([type, solution]) => (
           <div key={type} className="p-3 bg-white rounded border">
             <h3 className="font-medium mb-2 capitalize">{type.replace(/([A-Z])/g, ' $1')}:</h3>
             <pre className="text-sm text-gray-700 whitespace-pre-wrap">
               {solution.length > 0 ? solution.join('\n') : '(empty)'}
             </pre>
           </div>
         ))}
       </div>
     </div>

     {/* Feedback Display */}
     {feedback && (
       <div className="mb-8 p-6 border rounded-lg bg-blue-50">
         <h2 className="text-xl font-semibold mb-4">Generated Feedback</h2>
         <div className="p-4 bg-white rounded border">
           <p className="whitespace-pre-wrap">{feedback}</p>
         </div>
         <div className="mt-3 text-sm text-gray-600">
           {feedback.includes('(Note: This is basic feedback') ? (
             <span className="text-orange-600">🔄 Fallback feedback (server unavailable)</span>
           ) : (
             <span className="text-green-600">✅ Server-generated feedback</span>
           )}
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
         <div className="flex items-center">
           <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
           Generating feedback...
         </div>
       </div>
     )}
     
     {/* Instructions */}
     <div className="p-4 bg-gray-100 rounded text-sm text-gray-700">
       <h3 className="font-medium mb-2">Testing Instructions:</h3>
       <ul className="list-disc list-inside space-y-1">
         <li>Test different solution types to see varied feedback</li>
         <li>Try "Test Network Error" to see fallback feedback behavior</li>
         <li>Use "Test Invalid Problem ID" to see error handling</li>
         <li>Custom solutions let you test your own code arrangements</li>
       </ul>
     </div>
   </div>
 );
};

export default TestApiFeedback;