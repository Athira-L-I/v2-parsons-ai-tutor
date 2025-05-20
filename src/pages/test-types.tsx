import React from 'react';
import { ParsonsSettings, ParsonsGrader } from '@/@types/types';

// A simple test component to verify type imports
const TypeTest: React.FC = () => {
  // Sample problem configuration
  const testProblem: ParsonsSettings = {
    initial: "def hello_world():\n    print('Hello, world!')",
    options: {
      sortableId: 'sortable',
      trashId: 'trash',
      max_wrong_lines: 1,
      can_indent: true,
      grader: ParsonsGrader.LineBased
    }
  };

  return (
    <div>
      <h1>Type Import Test</h1>
      <pre>{JSON.stringify(testProblem, null, 2)}</pre>
    </div>
  );
};

export default TypeTest;