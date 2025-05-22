import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import { adaptiveController } from '@/lib/adaptiveController';
import { ParsonsSettings, ParsonsGrader } from '@/@types/types';

const sampleProblemWithDistractors: ParsonsSettings = {
  initial: `def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    count = len(numbers)
    average = total / count
    return average
print("Invalid input") #distractor
result = None #distractor
if not nums: #distractor
total = sum(nums) #distractor`,
  options: {
    sortableId: 'sortable',
    trashId: 'sortableTrash',
    max_wrong_lines: 4,
    can_indent: true,
    grader: ParsonsGrader.LineBased,
    exec_limit: 2500,
    show_feedback: true,
    x_indent: 50
  }
};

const TestAdaptiveLogic: NextPage = () => {
  const {
    currentProblem,
    setCurrentProblem,
    adaptiveState,
    setAdaptiveState,
    triggerAdaptation,
    adaptationMessage,
    resetContext
  } = useParsonsContext();

  const [manualAttempts, setManualAttempts] = useState(0);
  const [manualIncorrectAttempts, setManualIncorrectAttempts] = useState(0);

  // Initialize with sample problem
  useEffect(() => {
    if (!currentProblem) {
      setCurrentProblem(sampleProblemWithDistractors);
    }
  }, [currentProblem, setCurrentProblem]);

  const handleSimulateIncorrectAttempt = () => {
    const newAttempts = manualAttempts + 1;
    const newIncorrectAttempts = manualIncorrectAttempts + 1;
    
    setManualAttempts(newAttempts);
    setManualIncorrectAttempts(newIncorrectAttempts);
    
    // Update adaptive state
    const newAdaptiveState = {
      ...adaptiveState,
      attempts: newAttempts,
      incorrectAttempts: newIncorrectAttempts
    };
    setAdaptiveState(newAdaptiveState);
  };

  const handleSimulateCorrectAttempt = () => {
    const newAttempts = manualAttempts + 1;
    
    setManualAttempts(newAttempts);
    
    // Update adaptive state (correct attempt doesn't increment incorrect count)
    const newAdaptiveState = {
      ...adaptiveState,
      attempts: newAttempts
    };
    setAdaptiveState(newAdaptiveState);
  };

  const handleManualTriggerAdaptation = () => {
    if (currentProblem) {
      const result = adaptiveController.applyAdaptiveFeatures(adaptiveState, currentProblem);
      
      if (result.success) {
        setCurrentProblem(result.newSettings);
        setAdaptiveState(result.newState);
      }
    }
  };

  const handleReset = () => {
    resetContext();
    setManualAttempts(0);
    setManualIncorrectAttempts(0);
    setCurrentProblem(sampleProblemWithDistractors);
  };

  const availableActions = currentProblem 
    ? adaptiveController.getAvailableActions(adaptiveState, currentProblem)
    : [];

  const suggestions = currentProblem 
    ? adaptiveController.generateAdaptationSuggestions(adaptiveState, currentProblem)
    : [];

  const shouldTrigger = adaptiveController.shouldTriggerAdaptation(adaptiveState);

  const displayLines = currentProblem 
    ? currentProblem.initial.split('\n').filter(line => line.trim())
    : [];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Test Adaptive Logic Integration</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Current Problem State</h2>
          
          <div className="bg-gray-100 p-3 rounded mb-4 max-h-64 overflow-y-auto">
            {displayLines.map((line, index) => {
              const isDistractor = line.includes('#distractor');
              const isPaired = line.includes('#paired');
              const cleanLine = line.replace('#distractor', '').replace('#paired', '').trim();

              // Combined block
              if (cleanLine.includes('\\n')) {
                const subLines = cleanLine.split('\\n');
                return (
                  <div key={index} className={`mb-2 p-2 border rounded ${
                    isDistractor ? 'bg-red-50 border-red-200' :
                    isPaired ? 'bg-orange-50 border-orange-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="text-xs text-gray-500 mb-1">
                      Combined Block ({subLines.length} lines)
                    </div>
                    {subLines.map((subLine, subIndex) => (
                      <div key={subIndex} className={`font-mono text-sm ${
                        isDistractor ? 'text-red-600' :
                        isPaired ? 'text-orange-600' :
                        'text-blue-600'
                      }`}>
                        {subLine}
                      </div>
                    ))}
                  </div>
                );
              } else {
                return (
                  <div key={index} className={`mb-1 p-1 rounded ${
                    isDistractor ? 'bg-red-50' :
                    isPaired ? 'bg-orange-50' :
                    'bg-green-50'
                  }`}>
                    <div className={`font-mono text-sm ${
                      isDistractor ? 'text-red-600' :
                      isPaired ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {cleanLine}
                    </div>
                  </div>
                );
              }
            })}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-blue-50 p-2 rounded">
              <span className="font-medium">Solution blocks:</span><br />
              {displayLines.filter(line => !line.includes('#distractor') && !line.includes('#paired')).length}
            </div>
            <div className="bg-red-50 p-2 rounded">
              <span className="font-medium">Distractor blocks:</span><br />
              {displayLines.filter(line => line.includes('#distractor')).length}
            </div>
            <div className="bg-orange-50 p-2 rounded">
              <span className="font-medium">Combined blocks:</span><br />
              {displayLines.filter(line => line.includes('\\n')).length}
            </div>
            <div className="bg-purple-50 p-2 rounded">
              <span className="font-medium">Can indent:</span><br />
              {currentProblem?.options.can_indent ? 'Yes' : 'No'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Adaptive State</h2>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-2 rounded">
                <span className="font-medium">Total Attempts:</span><br />
                {adaptiveState.attempts}
              </div>
              <div className="bg-red-50 p-2 rounded">
                <span className="font-medium">Incorrect Attempts:</span><br />
                {adaptiveState.incorrectAttempts}
              </div>
              <div className="bg-blue-50 p-2 rounded">
                <span className="font-medium">Combined Blocks:</span><br />
                {adaptiveState.combinedBlocks}
              </div>
              <div className="bg-orange-50 p-2 rounded">
                <span className="font-medium">Removed Distractors:</span><br />
                {adaptiveState.removedDistractors}
              </div>
            </div>
            
            <div className="bg-purple-50 p-2 rounded text-sm">
              <span className="font-medium">Indentation Provided:</span><br />
              {adaptiveState.indentationProvided ? 'Yes' : 'No'}
            </div>
            
            <div className="bg-yellow-50 p-2 rounded text-sm">
              <span className="font-medium">Should Trigger Adaptation:</span><br />
              {shouldTrigger ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Simulation Controls</h2>
          
          <div className="space-y-3">
            <button
              onClick={handleSimulateIncorrectAttempt}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Simulate Incorrect Attempt
            </button>
            
            <button
              onClick={handleSimulateCorrectAttempt}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Simulate Correct Attempt
            </button>
            
            <button
              onClick={handleManualTriggerAdaptation}
              disabled={!shouldTrigger}
              className={`w-full px-4 py-2 rounded text-white ${
                shouldTrigger 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Trigger Adaptation
            </button>
            
            <button
              onClick={triggerAdaptation}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Auto Trigger Adaptation
            </button>
            
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Reset All
            </button>
          </div>

          {adaptationMessage && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
              <p className="text-green-800 text-sm">{adaptationMessage}</p>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Available Actions & Suggestions</h2>
          
          <div className="mb-4">
            <h3 className="font-medium mb-2">Available Actions:</h3>
            {availableActions.length > 0 ? (
              <ul className="text-sm space-y-1">
                {availableActions.map((action, index) => (
                  <li key={index} className="bg-blue-50 p-2 rounded">
                    <span className="font-medium">{action.type}:</span> {action.description}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No actions available yet</p>
            )}
          </div>

          <div>
            <h3 className="font-medium mb-2">Adaptation Suggestions:</h3>
            <ul className="text-sm space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="bg-yellow-50 p-2 rounded">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">How to Test:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Click "Simulate Incorrect Attempt" multiple times to build up failed attempts</li>
          <li>Watch as "Available Actions" populate based on attempt thresholds</li>
          <li>Click "Trigger Adaptation" when available to see adaptive features applied</li>
          <li>Observe how the problem changes (distractors removed, blocks combined, etc.)</li>
          <li>Use "Reset All" to start over and test different scenarios</li>
        </ol>
      </div>
    </div>
  );
};

export default TestAdaptiveLogic;