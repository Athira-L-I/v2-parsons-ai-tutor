import React, { useState } from 'react';
import { NextPage } from 'next';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ParsonsProvider } from '@/contexts/ParsonsContext';
import ParsonsBoard from '@/components/ParsonsBoard';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import { ParsonsSettings, ParsonsGrader } from '@/@types/types';

// Sample problem with combined blocks
const sampleProblemWithCombined: ParsonsSettings = {
  initial: `def calculate_average(numbers):\\n    if not numbers:\\n        return 0
    total = sum(numbers)
    count = len(numbers)
    average = total / count\\n    return average
print("Starting calculation") #distractor
debug_mode = True #distractor`,
  options: {
    sortableId: 'sortable',
    trashId: 'sortableTrash',
    max_wrong_lines: 2,
    can_indent: true,
    grader: ParsonsGrader.LineBased,
    exec_limit: 2500,
    show_feedback: true,
    x_indent: 50,
  },
};

const TestContent: React.FC = () => {
  const {
    currentProblem,
    setCurrentProblem,
    userSolution,
    isCorrect,
    resetContext,
  } = useParsonsContext();

  const [showSolution, setShowSolution] = useState(false);

  const handleLoadProblem = () => {
    setCurrentProblem(sampleProblemWithCombined);
  };

  const handleReset = () => {
    resetContext();
  };

  const handleCheckSolution = () => {
    // Simple validation for demo - check if we have some blocks in solution
    // In real implementation, this would validate against the correct solution
    console.log('Current solution:', userSolution);
    alert(
      `Solution has ${userSolution.length} lines. Check console for details.`
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Test Combined Blocks Drag & Drop Integration
      </h1>

      <div className="mb-6 space-x-4">
        <button
          onClick={handleLoadProblem}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Load Problem with Combined Blocks
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Reset
        </button>
        <button
          onClick={handleCheckSolution}
          disabled={!currentProblem}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          Check Solution
        </button>
        <button
          onClick={() => setShowSolution(!showSolution)}
          disabled={!currentProblem}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
        >
          {showSolution ? 'Hide' : 'Show'} Solution Debug
        </button>
      </div>

      {!currentProblem && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-6">
          <p>
            Click "Load Problem with Combined Blocks" to test the drag & drop
            functionality.
          </p>
        </div>
      )}

      {currentProblem && (
        <>
          <div className="mb-6">
            <ParsonsBoard />
          </div>

          {showSolution && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Current Solution (Debug):</h3>
              <div className="bg-white p-3 rounded border">
                {userSolution.length === 0 ? (
                  <div className="text-gray-500 italic">
                    No blocks in solution area
                  </div>
                ) : (
                  <pre className="text-sm whitespace-pre-wrap">
                    {userSolution.join('\n')}
                  </pre>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Total lines in solution: {userSolution.length}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-6 bg-green-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Features to Test:</h3>
        <ul className="text-sm space-y-1">
          <li>
            • <strong>Combined Blocks:</strong> Blocks with multiple lines
            should stay together when dragged
          </li>
          <li>
            • <strong>Drag & Drop:</strong> Move blocks between trash and
            solution areas
          </li>
          <li>
            • <strong>Indentation:</strong> Use arrow buttons to indent/dedent
            blocks in solution area
          </li>
          <li>
            • <strong>Reordering:</strong> Drag blocks within the same area to
            reorder them
          </li>
          <li>
            • <strong>Solution Generation:</strong> Combined blocks should
            contribute all their lines to the solution
          </li>
          <li>
            • <strong>Visual Feedback:</strong> Combined blocks should show
            visual indicators and line counts
          </li>
        </ul>
      </div>

      <div className="mt-4 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Expected Combined Blocks:</h3>
        <ul className="text-sm space-y-1">
          <li>
            • <strong>Block 1:</strong> Function definition + if statement +
            return (3 lines)
          </li>
          <li>
            • <strong>Block 2:</strong> Average calculation + return statement
            (2 lines)
          </li>
          <li>
            • <strong>Individual blocks:</strong> Single-line statements and
            distractors
          </li>
        </ul>
      </div>

      <div className="mt-4 bg-orange-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Testing Instructions:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>
            Load the problem - you should see combined blocks (marked with line
            counts)
          </li>
          <li>
            Drag combined blocks from trash to solution - entire block should
            move as one unit
          </li>
          <li>Try reordering blocks within solution area</li>
          <li>
            Use indentation controls (←→) on combined blocks - entire block
            should indent together
          </li>
          <li>
            Check solution debug to see how combined blocks contribute multiple
            lines
          </li>
          <li>
            Verify that combined blocks maintain their internal structure during
            moves
          </li>
        </ol>
      </div>
    </div>
  );
};

const TestCombinedDragDrop: NextPage = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <ParsonsProvider>
        <TestContent />
      </ParsonsProvider>
    </DndProvider>
  );
};

export default TestCombinedDragDrop;
