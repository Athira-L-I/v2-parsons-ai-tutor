import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import ChatFeedbackPanel from '@/components/ChatFeedbackPanel';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import { ParsonsSettings } from '@/@types/types';

const TestChatIntegrationPage: React.FC = () => {
  const {
    setCurrentProblem,
    setIsCorrect,
    setFeedback,
    setSocraticFeedback,
    setCurrentBlocks,
    addChatMessage,
    chatMessages,
    clearChatHistory,
  } = useParsonsContext();

  const [testScenario, setTestScenario] = useState<string>('empty');

  // Set up test problem
  useEffect(() => {
    const testProblem: ParsonsSettings = {
      initial:
        "def calculate_average(numbers):\n    if not numbers:\n        return 0\n    total = sum(numbers)\n    return total / len(numbers)\nprint('extra line') #distractor",
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

  const setupScenario = (scenario: string) => {
    setTestScenario(scenario);
    clearChatHistory();

    switch (scenario) {
      case 'empty':
        setIsCorrect(null);
        setFeedback(null);
        setSocraticFeedback(null);
        setCurrentBlocks([]);
        break;

      case 'incorrect':
        setIsCorrect(false);
        setFeedback(
          '<div class="error">Code fragments in your program are wrong, or in wrong order.</div>'
        );
        setSocraticFeedback(
          'Think about the logical flow of your program. What should happen first?'
        );
        setCurrentBlocks([
          {
            id: 'block-1',
            text: 'def calculate_average(numbers):',
            indentation: 0,
          },
          {
            id: 'block-2',
            text: 'total = sum(numbers)',
            indentation: 0, // Wrong - should be 1
          },
          {
            id: 'block-3',
            text: 'return total / len(numbers)',
            indentation: 0, // Wrong - should be 1
          },
        ]);
        break;

      case 'correct':
        setIsCorrect(true);
        setFeedback(null);
        setSocraticFeedback(null);
        setCurrentBlocks([
          {
            id: 'block-1',
            text: 'def calculate_average(numbers):',
            indentation: 0,
          },
          {
            id: 'block-2',
            text: 'if not numbers:',
            indentation: 1,
          },
          {
            id: 'block-3',
            text: 'return 0',
            indentation: 2,
          },
          {
            id: 'block-4',
            text: 'total = sum(numbers)',
            indentation: 1,
          },
          {
            id: 'block-5',
            text: 'return total / len(numbers)',
            indentation: 1,
          },
        ]);
        break;

      case 'conversation':
        setIsCorrect(false);
        setFeedback('<div class="error">Indentation errors detected.</div>');
        setCurrentBlocks([
          {
            id: 'block-1',
            text: 'def calculate_average(numbers):',
            indentation: 0,
          },
          {
            id: 'block-2',
            text: 'total = sum(numbers)',
            indentation: 0, // Wrong indentation
          },
        ]);

        // Add some conversation history
        setTimeout(() => {
          addChatMessage({
            role: 'tutor',
            content:
              "Hello! I can see you're working on a function to calculate averages. What would you like to know?",
          });
        }, 500);

        setTimeout(() => {
          addChatMessage({
            role: 'student',
            content: "I'm confused about the indentation. Can you help?",
          });
        }, 1000);

        setTimeout(() => {
          addChatMessage({
            role: 'tutor',
            content:
              'Of course! In Python, indentation shows which code belongs inside functions, if statements, and other blocks. Lines inside your function should be indented.',
          });
        }, 1500);
        break;
    }
  };

  const testSpecificMessages = () => {
    const testMessages = [
      'Can you help me understand how this function works?',
      "I'm having trouble with indentation",
      'What should be the first line of code?',
      'Is my solution correct now?',
      "I don't understand this problem at all",
    ];

    console.log('🧪 Test these messages manually:');
    testMessages.forEach((msg, i) => {
      console.log(`${i + 1}. "${msg}"`);
    });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Chat Integration Test</h1>

        {/* Scenario Controls */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Scenarios</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setupScenario('empty')}
              className={`px-4 py-2 rounded ${
                testScenario === 'empty'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Empty State
            </button>
            <button
              onClick={() => setupScenario('incorrect')}
              className={`px-4 py-2 rounded ${
                testScenario === 'incorrect'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Incorrect Solution
            </button>
            <button
              onClick={() => setupScenario('correct')}
              className={`px-4 py-2 rounded ${
                testScenario === 'correct'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Correct Solution
            </button>
            <button
              onClick={() => setupScenario('conversation')}
              className={`px-4 py-2 rounded ${
                testScenario === 'conversation'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Ongoing Conversation
            </button>
            <button
              onClick={testSpecificMessages}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Log Test Messages
            </button>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              <strong>Current Scenario:</strong> {testScenario}
            </p>
            <p>
              <strong>Chat Messages:</strong> {chatMessages.length}
            </p>
            <p>
              <strong>Instructions:</strong> Select a scenario above, then try
              typing different messages in the chat below.
            </p>
          </div>
        </div>

        {/* Chat Integration */}
        <ChatFeedbackPanel />

        {/* Testing Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-6">
          <h3 className="font-semibold text-blue-800 mb-2">
            Integration Testing Checklist:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-medium mb-2">Message Sending:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Type message and press Enter - should send</li>
                <li>Click Send button - should send</li>
                <li>Student message appears immediately</li>
                <li>Input clears after sending</li>
                <li>Can't send empty messages</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">AI Responses:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Typing indicator appears while waiting</li>
                <li>AI response appears after delay</li>
                <li>Messages auto-scroll to bottom</li>
                <li>Error messages if API fails</li>
                <li>Responses are contextual</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Loading States:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Send button shows loading spinner</li>
                <li>Input disabled while sending</li>
                <li>Can't send multiple messages at once</li>
                <li>Proper focus management</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Integration:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Traditional feedback still works</li>
                <li>Chat history maintained</li>
                <li>Context-aware responses</li>
                <li>Scenario changes affect chat</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-50 border rounded p-4 mt-6">
            <h3 className="font-semibold text-gray-800 mb-2">Debug Info:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Chat Messages Count:</strong> {chatMessages.length}
              </p>
              <p>
                <strong>Last Message Role:</strong>{' '}
                {chatMessages[chatMessages.length - 1]?.role || 'None'}
              </p>
              <p>
                <strong>Backend Status:</strong> Check console for API logs
              </p>
              <p>
                <strong>Test API:</strong> Open console and run
                `sendChatMessage('demo-problem-1', 'test', [], [])`
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TestChatIntegrationPage;
