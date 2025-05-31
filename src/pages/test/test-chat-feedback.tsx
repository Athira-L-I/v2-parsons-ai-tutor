import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import ChatFeedbackPanel from '@/components/ChatFeedbackPanel';
import { useParsonsContext } from '@/contexts/ParsonsContext';
import { ParsonsSettings } from '@/@types/types';

const TestChatFeedbackPage: React.FC = () => {
  const {
    setCurrentProblem,
    setIsCorrect,
    setFeedback,
    setSocraticFeedback,
    setCurrentBlocks,
    addChatMessage,
  } = useParsonsContext();

  // Set up a test problem when component mounts
  useEffect(() => {
    const testProblem: ParsonsSettings = {
      initial:
        "start = 1\nend = 10\nfor i in range(start, end + 1):\n    if i % 2 == 0:\n        print(i)\nprint('end') #distractor",
      options: {
        sortableId: 'sortable',
        trashId: 'sortableTrash',
        max_wrong_lines: 3,
        can_indent: true,
        grader: 'ParsonsWidget._graders.LineBasedGrader',
        exec_limit: 2500,
        show_feedback: true,
      },
    };

    setCurrentProblem(testProblem);

    // Set up some test blocks
    setCurrentBlocks([
      {
        id: 'block-1',
        text: 'start = 1',
        indentation: 0,
      },
      {
        id: 'block-2',
        text: 'end = 10',
        indentation: 0,
      },
      {
        id: 'block-3',
        text: 'for i in range(start, end + 1):',
        indentation: 0,
      },
      {
        id: 'block-4',
        text: 'if i % 2 == 0:',
        indentation: 0, // Wrong indentation - should be 1
      },
      {
        id: 'block-5',
        text: 'print(i)',
        indentation: 0, // Wrong indentation - should be 2
      },
    ]);

    // Add a welcome message
    setTimeout(() => {
      addChatMessage({
        role: 'tutor',
        content:
          "Hello! I'm your AI tutor. I can help you with this Parsons problem. Feel free to ask me any questions!",
      });
    }, 500);
  }, [setCurrentProblem, setCurrentBlocks, addChatMessage]);

  const simulateCorrectSolution = () => {
    setIsCorrect(true);
    setFeedback(null);
    setSocraticFeedback(null);
  };

  const simulateIncorrectSolution = () => {
    setIsCorrect(false);
    setFeedback(
      '<div class="error">Code fragments in your program are wrong, or in wrong order.</div>'
    );
    setSocraticFeedback(
      'Think about the logical flow of your program. What should happen first?'
    );
  };

  const simulateNoSolution = () => {
    setIsCorrect(null);
    setFeedback(null);
    setSocraticFeedback(null);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Chat Feedback Panel Test</h1>

        {/* Test Controls */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={simulateCorrectSolution}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Simulate Correct Solution
            </button>
            <button
              onClick={simulateIncorrectSolution}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Simulate Incorrect Solution
            </button>
            <button
              onClick={simulateNoSolution}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Reset to No Solution
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Use these buttons to test different feedback states. The chat will
            respond contextually.
          </p>
        </div>

        {/* Chat Feedback Panel */}
        <ChatFeedbackPanel />

        <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-6">
          <h3 className="font-semibold text-blue-800 mb-2">Testing Notes:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Chat interface appears at the top with input field</li>
            <li>• All existing feedback logic is preserved below the chat</li>
            <li>• Indentation issues are detected and displayed</li>
            <li>• Chat auto-scrolls to latest message</li>
            <li>• AI responses are contextual based on solution state</li>
            <li>• Enter key sends messages, Send button works</li>
            <li>• Clear Chat button removes conversation history</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default TestChatFeedbackPage;
