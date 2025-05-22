// src/pages/test-paired-distractors.tsx - Enhanced version
import React, { useState } from 'react';
import { NextPage } from 'next';
import { 
  identifyPairedDistractorsEnhanced, 
  PairedDistractorResult,
  ShuffleResult,
  GroupInfo 
} from '@/lib/adaptiveFeatures';
import PairedDistractorVisualizer from '@/components/PairedDistractorVisualizer';
import { ParsonsSettings, ParsonsGrader } from '@/@types/types';

const sampleProblemWithPairs: ParsonsSettings = {
  initial: `def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    count = len(numbers)
    return total / count
    if not nums: #distractor
    if numbers: #distractor
    total = sum(nums) #distractor
    return total / len(numbers) #distractor
    count = length(numbers) #distractor`,
  options: {
    sortableId: 'sortable',
    trashId: 'sortableTrash',
    max_wrong_lines: 5,
    can_indent: true,
    grader: ParsonsGrader.LineBased,
    exec_limit: 2500,
    show_feedback: true
  }
};

const TestPairedDistractors: NextPage = () => {
  const [currentProblem, setCurrentProblem] = useState<ParsonsSettings>(sampleProblemWithPairs);
  const [result, setResult] = useState<(PairedDistractorResult & { shuffleResult: ShuffleResult }) | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleIdentifyPairs = () => {
    const pairedResult = identifyPairedDistractorsEnhanced(currentProblem);
    setResult(pairedResult);
    if (pairedResult.success) {
      setCurrentProblem(pairedResult.newSettings);
    }
  };

  const handleReset = () => {
    setCurrentProblem(sampleProblemWithPairs);
    setResult(null);
    setShowAnalysis(false);
  };

  const displayLines = currentProblem.initial.split('\n').filter(line => line.trim());

  // Helper function to get group info for a line index
  const getGroupInfo = (lineIndex: number): GroupInfo | null => {
    if (!result?.shuffleResult.groupInfo) return null;
    
    return result.shuffleResult.groupInfo.find(
      group => lineIndex >= group.startIndex && lineIndex <= group.endIndex
    ) || null;
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Enhanced Paired Distractors Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Problem Display */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Shuffled Problem View</h2>
          <div className="bg-gray-100 p-3 rounded max-h-64 overflow-y-auto">
            {displayLines.map((line, index) => {
              const isDistractor = line.includes('#distractor');
              const isPaired = line.includes('#paired');
              const cleanLine = line.replace('#distractor', '').replace('#paired', '').trim();
              const groupInfo = getGroupInfo(index);

              // Handle combined blocks
              if (cleanLine.includes('\\n')) {
                const subLines = cleanLine.split('\\n');
                return (
                  <div 
                    key={index} 
                    className={`mb-2 p-3 border-2 rounded-lg ${
                      groupInfo ? groupInfo.color : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">
                        Combined Block ({subLines.length} lines)
                      </span>
                      {groupInfo && (
                        <span className="text-xs px-2 py-1 bg-white rounded border">
                          Group {groupInfo.groupId + 1}
                        </span>
                      )}
                    </div>
                    {subLines.map((subLine, subIndex) => (
                      <div key={subIndex} className="font-mono text-sm text-gray-800 mb-1">
                        {subLine}
                      </div>
                    ))}
                  </div>
                );
              }

              // Regular single lines
              return (
                <div 
                  key={index} 
                  className={`mb-1 p-2 border-2 rounded ${
                    groupInfo 
                      ? groupInfo.color
                      : isDistractor || isPaired
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="font-mono text-sm text-gray-800">
                    {cleanLine}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 space-y-2">
            <button
              onClick={handleIdentifyPairs}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Identify & Shuffle Paired Distractors
            </button>
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Reset Problem
            </button>
            {result && (
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {showAnalysis ? 'Hide' : 'Show'} Analysis
              </button>
            )}
          </div>

          {result && !showAnalysis && (
            <div className="mt-4 p-3 rounded border">
              <h3 className="font-semibold mb-2">Quick Result:</h3>
              <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                {result.message}
              </p>
            </div>
          )}
        </div>

        {/* Analysis Panel */}
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">
            {showAnalysis ? 'Detailed Analysis' : 'Paired Groups Preview'}
          </h2>
          
          {result && showAnalysis ? (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded">
                <h3 className="font-semibold mb-2">Shuffle Information:</h3>
                <ul className="text-sm space-y-1">
                  <li>• Total groups: {result.shuffleResult.groupInfo.length}</li>
                  <li>• Lines processed: {result.shuffleResult.shuffledLines.length}</li>
                  <li>• Grouped lines: {result.shuffleResult.groupInfo.reduce((sum, group) => sum + (group.endIndex - group.startIndex + 1), 0)}</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Group Positions:</h3>
                <div className="space-y-2">
                  {result.shuffleResult.groupInfo.map((group, index) => (
                    <div key={index} className={`p-2 rounded border-2 ${group.color}`}>
                      <span className="text-sm font-medium">
                        Group {group.groupId + 1}: Lines {group.startIndex + 1}-{group.endIndex + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : result ? (
            <PairedDistractorVisualizer groups={result.pairedGroups} />
          ) : (
            <p className="text-gray-500 italic">Click "Identify & Shuffle" to see grouped results</p>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Legend:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-200 border-2 border-blue-300 rounded mr-2"></div>
            <span>Regular solution lines</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-200 border-2 border-gray-300 rounded mr-2"></div>
            <span>Standalone distractors</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-50 border-2 border-purple-200 rounded mr-2"></div>
            <span>Paired group (example)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-white border-2 border-gray-400 border-dashed rounded mr-2"></div>
            <span>Visualizer: distractor option</span>
          </div>
        </div>
        
        <div className="mt-3 p-3 bg-white rounded border">
          <h4 className="font-medium mb-1">Key Improvements:</h4>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>• Paired groups are visually grouped with matching borders and backgrounds</li>
            <li>• Groups are shuffled together (members appear adjacent to each other)</li>
            <li>• No green highlighting to avoid giving away correct solutions</li>
            <li>• Group membership is clearly indicated with colored borders</li>
            <li>• Detailed analysis shows shuffle positioning</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestPairedDistractors;