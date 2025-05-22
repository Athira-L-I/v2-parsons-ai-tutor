import React, { useState } from 'react';
import { NextPage } from 'next';
import { combineBlocks, removeDistractors, BlockCombineResult } from '@/lib/adaptiveFeatures';
import { ParsonsSettings, ParsonsGrader } from '@/@types/types';

const sampleProblem: ParsonsSettings = {
  initial: `def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    count = len(numbers)
    average = total / count
    return average
print("Invalid input") #distractor
result = None #distractor`,
  options: {
    sortableId: 'sortable',
    trashId: 'sortableTrash',
    max_wrong_lines: 2,
    can_indent: true,
    grader: ParsonsGrader.LineBased,
    exec_limit: 2500,
    show_feedback: true
  }
};

const TestCombineBlocks: NextPage = () => {
  const [currentProblem, setCurrentProblem] = useState<ParsonsSettings>(sampleProblem);
  const [lastResult, setLastResult] = useState<BlockCombineResult | null>(null);

  const handleCombineBlocks = () => {
    const result = combineBlocks(currentProblem, 1);
    setLastResult(result);
    if (result.success) {
      setCurrentProblem(result.newSettings);
    }
  };

  const handleRemoveDistractors = () => {
    const result = removeDistractors(currentProblem, 1);
    setLastResult(result);
    if (result.success) {
      setCurrentProblem(result.newSettings);
    }
  };

  const handleReset = () => {
    setCurrentProblem(sampleProblem);
    setLastResult(null);
  };

  const displayLines = currentProblem.initial.split('\n').filter(line => line.trim());

  // Function to render a line, handling combined blocks
  const renderLine = (line: string, index: number) => {
    const isDistractor = line.includes('#distractor');
    const cleanLine = line.replace('#distractor', '').trim();
    
    // Check if this is a combined block (contains \\n)
    if (cleanLine.includes('\\n')) {
      const subLines = cleanLine.split('\\n');
      return (
        <div key={index} className={`mb-2 p-2 border rounded ${
          isDistractor ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="text-xs text-gray-500 mb-1">
            Combined Block ({subLines.length} lines)
          </div>
          {subLines.map((subLine, subIndex) => (
            <div key={subIndex} className={`font-mono text-sm ${
              isDistractor ? 'text-red-600' : 'text-blue-600'
            }`}>
              {subLine}
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div key={index} className={`mb-1 p-1 rounded ${
          isDistractor ? 'bg-red-50' : 'bg-green-50'
        }`}>
          <div className={`font-mono text-sm ${
            isDistractor ? 'text-red-600' : 'text-green-600'
          }`}>
            {cleanLine}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Test Combined Blocks Feature</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Current Problem</h2>
          <div className="bg-gray-100 p-3 rounded">
            {displayLines.map((line, index) => renderLine(line, index))}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Solution blocks: {displayLines.filter(line => !line.includes('#distractor')).length}</p>
            <p>Distractor blocks: {displayLines.filter(line => line.includes('#distractor')).length}</p>
            <p>Max wrong lines: {currentProblem.options.max_wrong_lines}</p>
            <p>Combined blocks: {displayLines.filter(line => line.includes('\\n')).length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Adaptive Actions</h2>
          <div className="space-y-3">
            <button
              onClick={handleCombineBlocks}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Combine Blocks
            </button>
            <button
              onClick={handleRemoveDistractors}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Remove Distractors
            </button>
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Reset Problem
            </button>
          </div>

          {lastResult && (
            <div className="mt-4 p-3 rounded border">
              <h3 className="font-semibold mb-2">Last Action Result:</h3>
              <p className={`text-sm ${lastResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {lastResult.message}
              </p>
              {lastResult.success && (
                <p className="text-sm text-gray-600 mt-1">
                  Blocks affected: {lastResult.combinedBlocks}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Legend:</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-50 border border-green-200 rounded mr-2"></div>
            <span>Individual solution blocks</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded mr-2"></div>
            <span>Combined solution blocks</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-50 border border-red-200 rounded mr-2"></div>
            <span>Distractor blocks</span>
          </div>
          <div className="text-xs text-gray-500">
            Combined blocks use \\n separator (Parsons standard)
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCombineBlocks;