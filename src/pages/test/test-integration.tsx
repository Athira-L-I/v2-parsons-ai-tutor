import React, { useState } from 'react';
import { ParsonsProvider, useParsonsContext } from '@/contexts/ParsonsContext';
import ParsonsBoard from '@/components/ParsonsBoard';
import FeedbackPanel from '@/components/FeedbackPanel';
import SolutionChecker from '@/components/SolutionChecker';
import { ParsonsSettings } from '@/@types/types';

const TestIntegrationPage: React.FC = () => {
  const [adaptiveMode, setAdaptiveMode] = useState<'manual' | 'provided'>(
    'manual'
  );

  // Sample problem with different settings
  const manualProblem: ParsonsSettings = {
    initial: `def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    return total / len(numbers)
print("Hello World") #distractor
x = 5 #distractor`,
    options: {
      can_indent: true,
      sortableId: 'sortable',
      trashId: 'trash',
      max_wrong_lines: 2,
      x_indent: 50,
    },
  };

  const providedProblem: ParsonsSettings = {
    initial: `def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    return total / len(numbers)
print("Hello World") #distractor
x = 5 #distractor`,
    options: {
      can_indent: false, // Indentation provided
      sortableId: 'sortable',
      trashId: 'trash',
      max_wrong_lines: 2,
      x_indent: 50,
    },
  };

  const currentProblem =
    adaptiveMode === 'manual' ? manualProblem : providedProblem;

  return (
    <ParsonsProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Test: Indentation Controls Integration
            </h1>
            <p className="text-gray-600 mb-4">
              Test the complete integration of indentation controls with
              adaptive features.
            </p>

            {/* Adaptive Mode Toggle */}
            <div className="flex items-center space-x-4 mb-6 p-4 bg-white rounded border">
              <span className="font-medium text-gray-700">Adaptive Mode:</span>
              <button
                onClick={() => setAdaptiveMode('manual')}
                className={`px-4 py-2 rounded transition-colors ${
                  adaptiveMode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Manual Indentation
              </button>
              <button
                onClick={() => setAdaptiveMode('provided')}
                className={`px-4 py-2 rounded transition-colors ${
                  adaptiveMode === 'provided'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Indentation Provided
              </button>

              <div className="ml-4 text-sm text-gray-600">
                can_indent:{' '}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  {String(currentProblem.options.can_indent)}
                </code>
              </div>

              {/* Reset Test Button */}
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors"
              >
                Reset Test
              </button>
            </div>
          </div>

          {/* Problem Interface */}
          <div className="space-y-6">
            {/* Set the current problem in context */}
            <ProblemSetter problem={currentProblem} />

            {/* Main Parsons Board with integrated indentation controls */}
            <ParsonsBoard />

            {/* Solution Checker */}
            <SolutionChecker />

            {/* Feedback Panel with indentation feedback */}
            <FeedbackPanel />
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">
              Testing Instructions:
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • <strong>Manual Mode:</strong> Drag blocks to solution area and
                use indent/outdent buttons on blocks
              </li>
              <li>
                • <strong>Provided Mode:</strong> Indentation is automatic,
                focus on block order
              </li>
              <li>• Check the indentation controls below the solution area</li>
              <li>• Check the feedback panel for indentation status</li>
              <li>• Toggle between modes to see smooth transitions</li>
            </ul>
          </div>
        </div>
      </div>
    </ParsonsProvider>
  );
};

// Helper component to set the problem in context
const ProblemSetter: React.FC<{ problem: ParsonsSettings }> = ({ problem }) => {
  const { setCurrentProblem } = useParsonsContext();

  React.useEffect(() => {
    setCurrentProblem(problem);
  }, [problem, setCurrentProblem]);

  return null;
};

export default TestIntegrationPage;
