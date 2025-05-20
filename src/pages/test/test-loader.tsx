import React, { useState, useEffect } from 'react';
import { loadParsonsWidget, isParsonsWidgetLoaded } from '@/lib/parsonsLoader';

const LoaderTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadParsons = async () => {
    if (isParsonsWidgetLoaded()) {
      setLoaded(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const success = await loadParsonsWidget();
      setLoaded(success);
      if (!success) {
        setError('Failed to load some dependencies');
      }
    } catch (err) {
      console.error('Loading error:', err);
      setError('Error loading dependencies');
    } finally {
      setLoading(false);
    }
  };
  
  // Check initial load state
  useEffect(() => {
    setLoaded(isParsonsWidgetLoaded());
  }, []);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Parsons Loader Test</h1>
      
      <div className="mb-4">
        <p className="font-medium">Status: {loaded ? 'Loaded' : loading ? 'Loading...' : 'Not Loaded'}</p>
        {error && <p className="text-red-600">{error}</p>}
      </div>
      
      <button 
        onClick={loadParsons}
        disabled={loading || loaded}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300"
      >
        {loading ? 'Loading...' : loaded ? 'Already Loaded' : 'Load Parsons Dependencies'}
      </button>
      
      {loaded && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
          <p>Parsons dependencies loaded successfully!</p>
          <p className="mt-2">Available globals:</p>
          <ul className="list-disc pl-5 mt-1">
            <li>ParsonsWidget: {typeof window.ParsonsWidget !== 'undefined' ? '✓' : '✗'}</li>
            <li>jQuery: {typeof window.jQuery !== 'undefined' ? '✓' : '✗'}</li>
            <li>$: {typeof window.$ !== 'undefined' ? '✓' : '✗'}</li>
            <li>_: {typeof window._ !== 'undefined' ? '✓' : '✗'}</li>
            <li>LIS: {typeof window.LIS !== 'undefined' ? '✓' : '✗'}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default LoaderTest;