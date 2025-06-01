import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import ParsonsBoard from '@/components/ParsonsBoard';
import SolutionChecker from '@/components/SolutionChecker';
import ChatFeedbackPanel from '@/components/ChatFeedbackPanel';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import { ParsonsSettings } from '@/@types/types';

const TestAutoChatPage: React.FC = () => {
  const {
    setCurrentProblem,
    chatMessages,
    clearChatHistory,
    isCorrect,
    attempts,
    currentBlocks,
    userSolution,
  } = useParsonsContext();

  const [testScenario, setTestScenario] = useState<string>('setup');

  // Set up test problem
  useEffect(() => {
    const testProblem: ParsonsSettings = {
      initial:
        "def greet(name):\n    print(f'Hello, {name}!')\ngreet('Alice')\nprint('extra') #distractor",
      options: {
        sortableId: 'sortable',
        trashId: 'sortableTrash',
        max_wrong_lines: 1,
        can_indent: true,
        grader: 'ParsonsWidget._graders.LineBasedGrader',
        exec_limit: 2500,
        show_feedback: true,
      },
    };

    setCurrentProblem(testProblem);
  }, [setCurrentProblem]);

  const resetForTesting = () => {
    clearChatHistory();
    setTestScenario('ready');
  };

  const handleSolutionCheck = (isCorrect: boolean) => {
    console.log('🔍 Solution checked:', {
      isCorrect,
      chatCount: chatMessages.length,
    });

    if (!isCorrect && chatMessages.length > 0) {
      setTestScenario('chat-started');
    } else if (isCorrect) {
      setTestScenario('correct');
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Auto-Start Chat Test</h1>

        {/* Test Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">
            Testing Auto-Chat Feature
          </h2>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              <strong>Scenario:</strong> {testScenario}
            </p>
            <p>
              <strong>Current State:</strong> Attempts: {attempts}, Chat
              Messages: {chatMessages.length}, Is Correct:{' '}
              {isCorrect?.toString()}
            </p>

            <div className="mt-4">
              <h3 className="font-semibold mb-2">Test Steps:</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Arrange some code blocks in the wrong order (or with wrong
                  indentation)
                </li>
                <li>Click "Check Solution" - should show incorrect</li>
                <li>
                  Chat should automatically start with a contextual message
                </li>
                <li>
                  Try different types of errors (indentation, order, missing
                  blocks)
                </li>
                <li>Verify chat only starts once per attempt</li>
              </ol>
            </div>
          </div>

          <button
            onClick={resetForTesting}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reset for New Test
          </button>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div
            className={`p-4 rounded border-2 ${
              chatMessages.length === 0
                ? 'border-gray-300 bg-gray-50'
                : 'border-green-300 bg-green-50'
            }`}
          >
            <h3 className="font-semibold mb-2">Chat Status</h3>
            <p className="text-sm">Messages: {chatMessages.length}</p>
            <p className="text-sm">
              {chatMessages.length === 0 ? 'No chat started' : 'Chat active'}
            </p>
          </div>

          <div
            className={`p-4 rounded border-2 ${
              currentBlocks.length === 0
                ? 'border-orange-300 bg-orange-50'
                : 'border-blue-300 bg-blue-50'
            }`}
          >
            <h3 className="font-semibold mb-2">Solution Status</h3>
            <p className="text-sm">Blocks: {currentBlocks.length}</p>
            <p className="text-sm">Lines: {userSolution.length}</p>
          </div>

          <div
            className={`p-4 rounded border-2 ${
              isCorrect === null
                ? 'border-gray-300 bg-gray-50'
                : isCorrect
                ? 'border-green-300 bg-green-50'
                : 'border-red-300 bg-red-50'
            }`}
          >
            <h3 className="font-semibold mb-2">Check Status</h3>
            <p className="text-sm">Attempts: {attempts}</p>
            <p className="text-sm">
              Status:{' '}
              {isCorrect === null
                ? 'Not checked'
                : isCorrect
                ? 'Correct'
                : 'Incorrect'}
            </p>
          </div>
        </div>

        {/* Problem Interface */}
        <div className="space-y-6">
          <ParsonsBoard />
          <SolutionChecker onCheckSolution={handleSolutionCheck} />
          <ChatFeedbackPanel />
        </div>

        {/* Test Results */}
        <div className="bg-white border rounded p-4 mt-6">
          <h3 className="text-lg font-semibold mb-3">Expected Behavior:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2 text-green-800">
                ✅ Should Happen:
              </h4>
              <ul className="space-y-1 list-disc list-inside text-green-700">
                <li>Chat starts automatically on incorrect solution</li>
                <li>Initial message is contextual to the error type</li>
                <li>Chat only starts once per attempt</li>
                <li>Traditional feedback still shows</li>
                <li>Indentation errors get specific guidance</li>
                <li>Order errors get logical flow questions</li>
                <li>Missing blocks get completion prompts</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-red-800">
                ❌ Should NOT Happen:
              </h4>
              <ul className="space-y-1 list-disc list-inside text-red-700">
                <li>Chat starts multiple times for same attempt</li>
                <li>Chat starts when solution is correct</li>
                <li>Generic messages for specific errors</li>
                <li>Traditional feedback gets replaced</li>
                <li>Chat starts when already has messages</li>
                <li>Auto-chat interferes with manual chat</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-50 border rounded p-4 mt-6">
            <h3 className="font-semibold text-gray-800 mb-2">Debug Info:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Test Scenario:</strong> {testScenario}
              </p>
              <p>
                <strong>Attempts:</strong> {attempts}
              </p>
              <p>
                <strong>Chat Messages:</strong> {chatMessages.length}
              </p>
              <p>
                <strong>Is Correct:</strong> {isCorrect?.toString() || 'null'}
              </p>
              <p>
                <strong>Current Blocks:</strong> {currentBlocks.length}
              </p>
              <p>
                <strong>User Solution Lines:</strong> {userSolution.length}
              </p>

              {chatMessages.length > 0 && (
                <div className="mt-2">
                  <p>
                    <strong>Last Chat Message:</strong>
                  </p>
                  <p className="italic">
                    "
                    {chatMessages[chatMessages.length - 1]?.content.substring(
                      0,
                      100
                    )}
                    ..."
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TestAutoChatPage;
