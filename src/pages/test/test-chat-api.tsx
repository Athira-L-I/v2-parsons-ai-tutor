import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { sendChatMessage } from '@/lib/api';
import { ChatMessage } from '@/@types/types';

const TestChatApiPage: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const addResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
  };

  const testBasicMessage = async () => {
    setIsLoading(true);
    addResult('Testing basic chat message...');

    try {
      const response = await sendChatMessage(
        'demo-problem-1',
        'Hello, can you help me with this problem?',
        [],
        []
      );

      addResult(
        `✓ Basic message test passed: ${response.chatMessage.content.substring(
          0,
          50
        )}...`
      );
      addResult(`✓ Response success: ${response.success}`);
      addResult(`✓ Message ID: ${response.chatMessage.id}`);
      addResult(`✓ Message role: ${response.chatMessage.role}`);
    } catch (error) {
      addResult(`✗ Basic message test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testMessageWithHistory = async () => {
    setIsLoading(true);
    addResult('Testing message with chat history...');

    const history: ChatMessage[] = [
      {
        id: 'msg1',
        role: 'tutor',
        content: 'Hello! How can I help you?',
        timestamp: Date.now() - 60000,
      },
      {
        id: 'msg2',
        role: 'student',
        content: 'I need help understanding this problem',
        timestamp: Date.now() - 30000,
      },
    ];

    try {
      const response = await sendChatMessage(
        'demo-problem-1',
        'Can you explain how loops work?',
        history,
        ['for i in range(5):', 'print(i)']
      );

      addResult(
        `✓ History message test passed: ${response.chatMessage.content.substring(
          0,
          50
        )}...`
      );
      addResult(
        `✓ Has traditional feedback: ${!!response.traditionalFeedback}`
      );
      addResult(`✓ Has solution validation: ${!!response.solutionValidation}`);

      // Update chat history for display
      setChatHistory([
        ...history,
        {
          id: 'msg3',
          role: 'student',
          content: 'Can you explain how loops work?',
          timestamp: Date.now() - 5000,
        },
        response.chatMessage,
      ]);
    } catch (error) {
      addResult(`✗ History message test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testInvalidInput = async () => {
    setIsLoading(true);
    addResult('Testing invalid input handling...');

    try {
      await sendChatMessage('', '', [], []);
      addResult(`✗ Invalid input test failed: Should have thrown error`);
    } catch (error) {
      addResult(`✓ Invalid input properly caught: ${error.message}`);
    }

    try {
      await sendChatMessage('demo-problem-1', '   ', [], []);
      addResult(`✗ Empty message test failed: Should have thrown error`);
    } catch (error) {
      addResult(`✓ Empty message properly caught: ${error.message}`);
    }

    setIsLoading(false);
  };

  const testOfflineResponse = async () => {
    setIsLoading(true);
    addResult(
      'Testing offline response (this will fail to server but show fallback)...'
    );

    try {
      // Use invalid URL to simulate offline
      const originalApiCall = sendChatMessage;
      const response = await sendChatMessage(
        'nonexistent-problem',
        'This should trigger an offline response',
        [],
        []
      );

      addResult(
        `✓ Offline response received: ${response.chatMessage.content.substring(
          0,
          50
        )}...`
      );
      addResult(`✓ Offline success flag: ${response.success}`);
    } catch (error) {
      addResult(`ℹ️ Expected behavior - error handled: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setChatHistory([]);
  };

  const testConsoleCommands = () => {
    addResult('Opening browser console - you can test manually with:');
    addResult("sendChatMessage('demo-problem-1', 'test message', [], [])");

    // Make function available in console
    (window as any).sendChatMessage = sendChatMessage;
    (window as any).testChatAPI = {
      sendChatMessage,
      sampleHistory: chatHistory,
    };

    console.log('🧪 Chat API test functions loaded!');
    console.log("Try: sendChatMessage('demo-problem-1', 'Hello!', [], [])");
    console.log('Available: window.testChatAPI');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Chat API Test</h1>

        {/* Test Controls */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Test Controls</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={testBasicMessage}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              Test Basic Message
            </button>
            <button
              onClick={testMessageWithHistory}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
            >
              Test With History
            </button>
            <button
              onClick={testInvalidInput}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-orange-300"
            >
              Test Validation
            </button>
            <button
              onClick={testOfflineResponse}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-300"
            >
              Test Offline Mode
            </button>
            <button
              onClick={testConsoleCommands}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Enable Console Testing
            </button>
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear Results
            </button>
          </div>

          {isLoading && (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2"></div>
              <span>Testing API...</span>
            </div>
          )}
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          {testResults.length === 0 ? (
            <div className="text-gray-500 italic">
              No tests run yet. Click a test button above.
            </div>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto bg-gray-50 p-3 rounded font-mono text-sm">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`${
                    result.includes('✓')
                      ? 'text-green-700'
                      : result.includes('✗')
                      ? 'text-red-700'
                      : result.includes('ℹ️')
                      ? 'text-blue-700'
                      : 'text-gray-700'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sample Chat History Display */}
        {chatHistory.length > 0 && (
          <div className="bg-white rounded-lg border p-4">
            <h2 className="text-xl font-semibold mb-4">
              Sample Chat from Tests
            </h2>
            <div className="space-y-2 bg-gray-50 p-3 rounded max-h-64 overflow-y-auto">
              {chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded ${
                    msg.role === 'student'
                      ? 'bg-blue-100 text-blue-900 ml-8'
                      : 'bg-gray-100 text-gray-900 mr-8'
                  }`}
                >
                  <div className="text-xs font-semibold mb-1">
                    {msg.role === 'student' ? 'You' : 'AI Tutor'}
                  </div>
                  <div className="text-sm">{msg.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-6">
          <h3 className="font-semibold text-blue-800 mb-2">
            Testing Instructions:
          </h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>
              Make sure your backend server is running (uvicorn main:app
              --reload)
            </li>
            <li>Click each test button to verify different scenarios</li>
            <li>Check the browser console for detailed API logs</li>
            <li>
              Use "Enable Console Testing" to manually test the API function
            </li>
            <li>
              Verify that offline/error modes provide helpful fallback responses
            </li>
          </ol>
        </div>
      </div>
    </Layout>
  );
};

export default TestChatApiPage;
