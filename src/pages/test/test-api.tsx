import React, { useState } from 'react';
import axios from 'axios';

const ApiTest: React.FC = () => {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testLocalApi = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await axios.get('/api/test');
      setResponse(result.data);
    } catch (err) {
      console.error('API Test Error:', err);
      setError('Error testing API. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">API Client Test</h1>
      
      <button 
        onClick={testLocalApi}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300"
      >
        {loading ? 'Loading...' : 'Test Local API'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
      
      {response && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Response:</h2>
          <pre className="bg-gray-100 p-3 rounded">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ApiTest;