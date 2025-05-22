import React, { useState } from 'react';
import { NextPage } from 'next';
import { 
  provideIndentation, 
  generateIndentationHints, 
  validatePythonIndentation,
  IndentationResult 
} from '@/lib/adaptiveFeatures';
import IndentationHelper from '@/components/IndentationHelper';
import { ParsonsSettings, ParsonsGrader } from '@/@types/types';

// This represents the correct solution with proper indentation (as stored in backend)
const correctProblem: ParsonsSettings = {
  initial: `def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    for num in numbers:
        if num < 0:
            print("Warning: negative number")
    return total / len(numbers)`,
  options: {
    sortableId: 'sortable',
    trashId: 'sortableTrash',
    max_wrong_lines: 0,
    can_indent: true,
    grader: ParsonsGrader.LineBased,
    exec_limit: 2500,
    show_feedback: true,
    x_indent: 50
  }
};

// This is the same problem but with flattened indentation (simulating student's incorrect state)
const flattenedProblem: ParsonsSettings = {
  ...correctProblem,
  initial: correctProblem.initial
    .split('\n')
    .map(line => line.trim()) // Remove all indentation
    .join('\n')
};

// Helper function to get indentation level
function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/);
  if (!match) return 0;
  return Math.floor(match[1].length / 4);
}

const TestIndentation: NextPage = () => {
  const [currentProblem, setCurrentProblem] = useState<ParsonsSettings>(flattenedProblem);
  const [studentSolution, setStudentSolution] = useState<string[]>(
    flattenedProblem.initial.split('\n').filter(line => line.trim())
  );
  const [result, setResult] = useState<IndentationResult | null>(null);

  // Get the correct solution for comparison
  const correctSolution = correctProblem.initial.split('\n').filter(line => line.trim());

  const handleProvideIndentation = () => {
    // Use the correct problem (with proper indentation) as the target
    const indentResult = provideIndentation(correctProblem);
    setResult(indentResult);
    if (indentResult.success) {
      setCurrentProblem(indentResult.newSettings);
      // Update student solution to show the correctly indented version
      setStudentSolution(correctProblem.initial.split('\n').filter(line => line.trim()));
    }
  };

  const handleReset = () => {
    setCurrentProblem(flattenedProblem);
    setStudentSolution(flattenedProblem.initial.split('\n').filter(line => line.trim()));
    setResult(null);
  };

  const handleApplyFix = (lineIndex: number) => {
    const newSolution = [...studentSolution];
    const hints = generateIndentationHints(studentSolution, correctSolution);
    const hint = hints.find(h => h.lineIndex === lineIndex);
    
    if (hint) {
      const line = newSolution[lineIndex];
      const trimmedLine = line.trim();
      const newLine = '    '.repeat(hint.expectedIndent) + trimmedLine;
      newSolution[lineIndex] = newLine;
      setStudentSolution(newSolution);
    }
  };

  const hints = generateIndentationHints(studentSolution, correctSolution);
  const validation = validatePythonIndentation(studentSolution);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Test Indentation Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Current Code</h2>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm">
              {studentSolution.map((line, index) => {
                const currentIndent = getIndentLevel(line);
                const expectedIndent = index < correctSolution.length ? getIndentLevel(correctSolution[index]) : 0;
                const isCorrect = currentIndent === expectedIndent;
                
                return (
                  <div key={index} className={`mb-1 whitespace-pre p-1 rounded ${
                    !isCorrect ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    <span className="text-gray-400 mr-2">{index + 1}:</span>
                    <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                      {line || ' '}
                    </span>
                    {!isCorrect && (
                      <span className="text-xs text-red-500 ml-2">
                        (indent: {currentIndent}, expected: {expectedIndent})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 space-y-2">
              <button
                onClick={handleProvideIndentation}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Provide Correct Indentation
              </button>
              <button
                onClick={handleReset}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Reset to Incorrect Indentation
              </button>
            </div>

            {result && (
              <div className="mt-4 p-3 rounded border">
                <h3 className="font-semibold mb-2">Action Result:</h3>
                <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                  {result.message}
                </p>
                <div className="mt-2 text-sm">
                  <p>Can indent: {currentProblem.options.can_indent ? 'Yes' : 'No'}</p>
                  <p>Indent size: {currentProblem.options.x_indent}px</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Validation Results</h2>
            <div className={`p-3 rounded ${validation.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`font-medium ${validation.isValid ? 'text-green-800' : 'text-red-800'}`}>
                {validation.isValid ? '✅ Valid Python indentation' : '❌ Invalid Python indentation'}
              </p>
              {validation.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-red-700 mb-1">Errors found:</p>
                  <ul className="text-sm text-red-600 space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <IndentationHelper 
            hints={hints} 
            onApplyHint={handleApplyFix}
          />
          
          <div className="mt-4 bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Expected Solution:</h3>
            <div className="bg-white p-3 rounded font-mono text-xs">
              {correctSolution.map((line, index) => (
                <div key={index} className="mb-1 whitespace-pre text-green-700">
                  <span className="text-gray-400 mr-2">{index + 1}:</span>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">How This Works:</h3>
        <ul className="text-sm space-y-1">
          <li>• The correct solution is stored in the problem's `initial` field with proper indentation</li>
          <li>• The test starts with flattened (no indentation) version to simulate student's incorrect state</li>
          <li>• "Provide Correct Indentation" uses the stored correct solution as reference</li>
          <li>• Individual "Fix" buttons correct specific lines based on the stored solution</li>
          <li>• This approach relies on the backend API data structure rather than hardcoded rules</li>
        </ul>
      </div>
    </div>
  );
};

export default TestIndentation;