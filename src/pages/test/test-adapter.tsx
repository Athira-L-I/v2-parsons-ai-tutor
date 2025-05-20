import React, { useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import ParsonsAdapter from '@/lib/ParsonsAdapter';
import Head from 'next/head';

// Sample Parsons problem for testing
const sampleProblem = {
  initial: "def factorial(n):\n    if n == 0:\n        return 1\n    else:\n        return n * factorial(n-1)\n# This is a distractor#distractor",
  options: {
    sortableId: 'sortable',
    trashId: 'sortableTrash',
    max_wrong_lines: 3,
    can_indent: true,
    grader: "LineBasedGrader",
    exec_limit: 2500,
    show_feedback: true
  }
};

const TestAdapterPage: NextPage = () => {
  const adapterRef = useRef<ParsonsAdapter | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only initialize once we're on the client
    if (typeof window !== 'undefined' && !adapterRef.current) {
      const adapter = new ParsonsAdapter('parsons-container', sampleProblem);
      adapterRef.current = adapter;
      
      // Initialize the adapter
      adapter.initialize();
      setInitialized(true);
      
      // Log the settings for debugging
      console.log('Current settings:', adapter.getCurrentSettings());
    }

    // Cleanup on unmount
    return () => {
      if (adapterRef.current) {
        adapterRef.current.destroy();
        adapterRef.current = null;
      }
    };
  }, []);

  const handleGetSettings = () => {
    if (adapterRef.current) {
      const settings = adapterRef.current.getCurrentSettings();
      console.log('Current settings:', settings);
      alert('Current settings logged to console. Check developer tools.');
    }
  };

  const handleDestroy = () => {
    if (adapterRef.current) {
      adapterRef.current.destroy();
      adapterRef.current = null;
      setInitialized(false);
      alert('Adapter destroyed. Click "Reinitialize" to rebuild.');
    }
  };

  const handleReinitialize = () => {
    if (!adapterRef.current) {
      const adapter = new ParsonsAdapter('parsons-container', sampleProblem);
      adapterRef.current = adapter;
      adapter.initialize();
      setInitialized(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>ParsonsAdapter Test Page</title>
      </Head>
      
      <h1 className="text-2xl font-bold mb-4">ParsonsAdapter Test Page</h1>
      
      <div className="mb-4 flex space-x-4">
        <button 
          onClick={handleGetSettings}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={!initialized}
        >
          Get Current Settings
        </button>
        
        <button 
          onClick={handleDestroy}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          disabled={!initialized}
        >
          Destroy Adapter
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
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-medium text-blue-800">Instructions:</h3>
        <ul className="list-disc ml-5 text-blue-700">
          <li>This page demonstrates the ParsonsAdapter functionality</li>
          <li>Click "Get Current Settings" to log the current settings to the console</li>
          <li>Click "Destroy Adapter" to clear the container</li>
          <li>Click "Reinitialize" to rebuild the adapter</li>
          <li>Open your browser's developer console to see detailed logs</li>
        </ul>
      </div>
    </div>
  );
};

export default TestAdapterPage;