import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import ChatMessage from '@/components/ChatMessage';
import { useParsonsContext } from '@/contexts/ParsonsContext';

const TestChatContextPage: React.FC = () => {
  const {
    chatMessages,
    addChatMessage,
    clearChatHistory,
    isTyping,
    setChatLoading,
  } = useParsonsContext();

  const handleAddStudentMessage = () => {
    addChatMessage({
      role: 'student',
      content: `Student message ${
        chatMessages.length + 1
      }: I need help with this problem!`,
    });
  };

  const handleAddTutorMessage = () => {
    addChatMessage({
      role: 'tutor',
      content: `Tutor response ${
        chatMessages.length + 1
      }: I'm here to help! What specifically would you like to know?`,
    });
  };

  const handleToggleTyping = () => {
    setChatLoading(!isTyping);
  };

  const handleSimulateTyping = () => {
    setChatLoading(true);

    // Add typing message
    addChatMessage({
      role: 'tutor',
      content: '',
      isTyping: true,
    });

    setTimeout(() => {
      // Remove typing message and add real message
      setChatLoading(false);
      clearChatHistory();
      chatMessages.forEach((msg) => {
        if (!msg.isTyping) {
          addChatMessage({
            role: msg.role,
            content: msg.content,
          });
        }
      });

      addChatMessage({
        role: 'tutor',
        content: 'Thanks for waiting! Here is my response after typing.',
      });
    }, 2000);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Chat Context Test</h1>

        {/* Controls */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={handleAddStudentMessage}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Student Message
            </button>
            <button
              onClick={handleAddTutorMessage}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Add Tutor Message
            </button>
            <button
              onClick={handleToggleTyping}
              className={`px-4 py-2 rounded text-white ${
                isTyping
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isTyping ? 'Stop Typing' : 'Start Typing'}
            </button>
            <button
              onClick={handleSimulateTyping}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Simulate Typing Response
            </button>
            <button
              onClick={clearChatHistory}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear Chat
            </button>
          </div>

          <div className="text-sm text-gray-600">
            <p>
              <strong>Message Count:</strong> {chatMessages.length}
            </p>
            <p>
              <strong>Is Typing:</strong> {isTyping ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        {/* Chat Display */}
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-xl font-semibold mb-4">Chat Messages</h2>

          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Use the buttons above to add messages.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded">
              {chatMessages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-green-50 border border-green-200 rounded p-4 mt-6">
          <h3 className="font-semibold text-green-800 mb-2">
            Testing Instructions:
          </h3>
          <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
            <li>
              Click "Add Student Message" and "Add Tutor Message" to test
              message adding
            </li>
            <li>Use "Start/Stop Typing" to test the typing state</li>
            <li>Try "Simulate Typing Response" to see the full typing flow</li>
            <li>Use "Clear Chat" to test clearing functionality</li>
            <li>Check the message count and typing status indicators</li>
          </ol>
        </div>
      </div>
    </Layout>
  );
};

export default TestChatContextPage;
