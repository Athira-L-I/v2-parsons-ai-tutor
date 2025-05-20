import React, { useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import ParsonsUI from '@/lib/ParsonsUI';
import { ParsonsGrader } from '@/@types/types';

// Sample Parsons problem for testing
const sampleProblem = {
  initial: "def factorial(n):\n    if n == 0:\n        return 1\n    else:\n        return n * factorial(n-1)\n# This is a distractor#distractor",
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

const TestParsonsUIPage: NextPage = () => {
  const parsonsUIRef = useRef<ParsonsUI | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);

  // Initialize the UI once we're on the client side
  useEffect(() => {
    // Check if running on client-side
    if (typeof window !== 'undefined' && !parsonsUIRef.current) {
      try {
        const ui = new ParsonsUI('#parsons-container', sampleProblem);
        parsonsUIRef.current = ui;
        
        // Initialize the UI
        ui.initialize();
        setInitialized(true);
        console.log('ParsonsUI initialized successfully');
      } catch (err) {
        console.error('Error initializing ParsonsUI:', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (parsonsUIRef.current) {
        parsonsUIRef.current.destroy();
        parsonsUIRef.current = null;
      }
    };
  }, []);

  const handleExportSettings = () => {
    if (parsonsUIRef.current) {
      try {
        const currentSettings = parsonsUIRef.current.export();
        console.log('Exported settings:', currentSettings);
        setSettings(currentSettings);
      } catch (err) {
        console.error('Error exporting settings:', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  };

  const handleDestroy = () => {
    if (parsonsUIRef.current) {
      parsonsUIRef.current.destroy();
      parsonsUIRef.current = null;
      setInitialized(false);
      setSettings(null);
    }
  };

  const handleReinitialize = () => {
    if (!parsonsUIRef.current) {
      const ui = new ParsonsUI('#parsons-container', sampleProblem);
      parsonsUIRef.current = ui;
      ui.initialize();
      setInitialized(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>ParsonsUI Test Page</title>
      </Head>
      
      <h1 className="text-2xl font-bold mb-4">ParsonsUI Test Page</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="mb-4 flex space-x-4">
        <button 
          onClick={handleExportSettings}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={!initialized}
        >
          Export Settings
        </button>
        
        <button 
          onClick={handleDestroy}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          disabled={!initialized}
        >
          Destroy UI
        </button>
        
        <button 
          onClick={handleReinitialize}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={initialized}
        >
          Reinitialize
        </button>
      </div>
      
      <div className="border p-4 rounded-md bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Parsons Container {initialized ? '(Initialized)' : '(Not Initialized)'}</h2>
        <div 
          id="parsons-container"
          className="min-h-[400px] bg-white border rounded-md p-4"
        ></div>
      </div>
      
      {settings && (
        <div className="mt-4 border p-4 rounded-md bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">Exported Settings</h2>
          <pre className="bg-white p-3 rounded border overflow-auto">
            {JSON.stringify(settings, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-medium text-blue-800">Instructions:</h3>
        <ul className="list-disc ml-5 text-blue-700">
          <li>This page demonstrates the ParsonsUI functionality</li>
          <li>Click "Export Settings" to get the current settings from the UI</li>
          <li>Click "Destroy UI" to remove the UI</li>
          <li>Click "Reinitialize" to create the UI again</li>
          <li>Open your browser's developer console to see detailed logs</li>
        </ul>
      </div>
    </div>
  );
};

export default TestParsonsUIPage;