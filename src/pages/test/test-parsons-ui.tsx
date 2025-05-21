import React, { useState } from 'react';
import { NextPage } from 'next';
import ParsonsUIReact from '@/components/ParsonsUIReact';
import { ParsonsSettings, ParsonsGrader } from '@/@types/types';

const TestParsonsUIPage: NextPage = () => {
  // Sample initial settings for the Parsons UI
  const [settings, setSettings] = useState<ParsonsSettings>({
    initial: 'def example():\n    print("Hello, world!")',
    options: {
      sortableId: 'sortable',
      trashId: 'sortableTrash',
      max_wrong_lines: 10,
      can_indent: true,
      grader: ParsonsGrader.LineBased,
      exec_limit: 2500,
      show_feedback: true
    }
  });

  // Handler for settings changes
  const handleSettingsChange = (newSettings: ParsonsSettings) => {
    console.log('Settings changed:', newSettings);
    setSettings(newSettings);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Test: ParsonsUIReact</h1>
      
      <div className="bg-white p-6 rounded-md shadow-sm border mb-6">
        <h2 className="text-xl font-semibold mb-4">Parsons UI Editor</h2>
        <ParsonsUIReact 
          initialSettings={settings}
          containerId="parsons-editor"
          onSettingsChange={handleSettingsChange}
        />
      </div>
      
      <div className="bg-white p-6 rounded-md shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Current Settings</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TestParsonsUIPage;