/**
 * Test page for conversation context awareness
 * Tests multi-turn conversations and AI response quality
 */

import React, { useState, useEffect } from 'react';
import { ParsonsProvider } from '@/contexts/ParsonsContext';
import ParsonsProblemContainer from '@/components/ParsonsProblemContainer';
import { ParsonsSettings } from '@/@types/types';

const ConversationContextTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [currentTest, setCurrentTest] = useState<number>(0);
  const [isTestingMode, setIsTestingMode] = useState(false);

  const testScenarios = [
    {
      name: 'Initial Confusion',
      description: 'Test how AI handles initial confusion',
      testMessages: [
        "I'm confused about where to start",
        "I don't understand how functions work",
        'What should go first?',
      ],
    },
    {
      name: 'Indentation Issues',
      description: 'Test AI handling of indentation problems',
      testMessages: [
        "I'm having trouble with indentation",
        'How many spaces should I use?',
        'Why is indentation important?',
      ],
    },
    {
      name: 'Order Problems',
      description: 'Test AI guidance for order issues',
      testMessages: [
        'I think I have the blocks in wrong order',
        'Should the function definition come first?',
        "What's the logical flow here?",
      ],
    },
    {
      name: 'Progressive Understanding',
      description: 'Test conversation progression',
      testMessages: [
        'I see, so functions need to be defined first',
        'That makes sense, what about the variables?',
        'Can you help me understand why this order works?',
      ],
    },
  ];

  const addTestResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
  };

  const clearTestResults = () => {
    setTestResults([]);
    setCurrentTest(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Test Header */}
        <div className="mb-8 bg-white p-6 rounded-lg border">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Conversation Context Awareness Test
          </h1>
          <p className="text-gray-600 mb-4">
            This page tests the AI tutor's ability to maintain conversation
            context, reference specific code issues, and progress naturally
            through different teaching strategies.
          </p>

          {/* Test Controls */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setIsTestingMode(!isTestingMode)}
              className={`px-4 py-2 rounded transition-colors ${
                isTestingMode
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isTestingMode ? 'Exit Testing Mode' : 'Enter Testing Mode'}
            </button>

            <button
              onClick={clearTestResults}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear Test Results
            </button>
          </div>

          {/* Test Scenarios */}
          {isTestingMode && (
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-3">
                Test Scenarios:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {testScenarios.map((scenario, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border ${
                      index === currentTest
                        ? 'border-blue-500 bg-blue-100'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <h4 className="font-medium">{scenario.name}</h4>
                    <p className="text-sm text-gray-600">
                      {scenario.description}
                    </p>
                    <button
                      onClick={() => setCurrentTest(index)}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Test This Scenario
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Test Instructions */}
        {isTestingMode && (
          <div className="mb-6 bg-yellow-50 p-4 rounded border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-2">
              Current Test: {testScenarios[currentTest].name}
            </h3>
            <div className="text-sm text-yellow-700">
              <p className="mb-2">Try these messages in sequence:</p>
              <ol className="list-decimal list-inside space-y-1">
                {testScenarios[currentTest].testMessages.map(
                  (message, index) => (
                    <li key={index} className="font-mono bg-white p-2 rounded">
                      "{message}"
                    </li>
                  )
                )}
              </ol>
              <p className="mt-2 font-medium">
                Look for: Context awareness, progressive questioning, specific
                code references
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Problem Area */}
          <div className="lg:col-span-2">
            <ParsonsProvider>
              <ParsonsProblemContainer
                problemId="40d3b7d0-e879-49f9-b527-408f5589ebf8"
                showUploader={false}
                clearSolutionOnLoad={true}
              />
            </ParsonsProvider>
          </div>

          {/* Test Results Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-lg border h-fit">
              <h3 className="text-lg font-semibold mb-4">
                Test Results & Observations
              </h3>

              {/* Manual Test Checklist */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Manual Test Checklist:</h4>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    AI references specific code blocks
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Responses build on previous messages
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Questions progress from diagnostic → analytical → guidance
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    AI doesn't repeat previous questions
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Conversation feels natural and contextual
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Different strategies for different error types
                  </label>
                </div>
              </div>

              {/* Test Results Log */}
              <div>
                <h4 className="font-medium mb-2">Test Log:</h4>
                <div className="bg-gray-50 p-3 rounded max-h-64 overflow-y-auto">
                  {testResults.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      Start testing to see results here...
                    </p>
                  ) : (
                    <div className="space-y-1 text-xs font-mono">
                      {testResults.map((result, index) => (
                        <div key={index} className="text-gray-700">
                          {result}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Test Actions */}
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => addTestResult('Manual test started')}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Log Test Start
                </button>
                <button
                  onClick={() => addTestResult('Observed context awareness')}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  ✓ Context Awareness Observed
                </button>
                <button
                  onClick={() =>
                    addTestResult('Progressive conversation noted')
                  }
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                >
                  ✓ Progressive Conversation
                </button>
                <button
                  onClick={() =>
                    addTestResult('Issue: AI response not contextual')
                  }
                  className="w-full px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  ✗ Issue Detected
                </button>
              </div>
            </div>

            {/* Expected Behavior Guide */}
            <div className="mt-6 bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3">
                Expected AI Behaviors
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium text-green-700">
                    ✓ Good Context Awareness:
                  </h4>
                  <ul className="list-disc list-inside text-gray-600 ml-2">
                    <li>References specific lines or blocks</li>
                    <li>Mentions previous topics discussed</li>
                    <li>Builds on student's understanding level</li>
                    <li>Adjusts strategy based on error type</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-red-700">✗ Poor Context:</h4>
                  <ul className="list-disc list-inside text-gray-600 ml-2">
                    <li>Generic responses</li>
                    <li>Repeats same questions</li>
                    <li>Ignores solution state</li>
                    <li>No conversation progression</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-8 bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">
            Technical Implementation Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Context Tracking:</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Chat history maintained in context</li>
                <li>Solution state analysis</li>
                <li>Error type classification</li>
                <li>Conversation progression tracking</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">AI Prompt Engineering:</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Current vs correct solution comparison</li>
                <li>Previous conversation summary</li>
                <li>Teaching strategy selection</li>
                <li>Socratic questioning framework</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationContextTest;
