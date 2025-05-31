import React from 'react';
import Layout from '@/components/Layout';
import ChatMessage from '@/components/ChatMessage';
import { ChatMessage as ChatMessageType } from '@/@types/types';

const TestChatMessagePage: React.FC = () => {
  // Sample messages for testing
  const sampleMessages: ChatMessageType[] = [
    {
      id: '1',
      role: 'tutor',
      content:
        "Hello! I'm here to help you with your Parsons problem. What would you like to know about arranging these code blocks?",
      timestamp: Date.now() - 300000, // 5 minutes ago
    },
    {
      id: '2',
      role: 'student',
      content:
        "I'm confused about the indentation. How do I know which lines should be indented?",
      timestamp: Date.now() - 240000, // 4 minutes ago
    },
    {
      id: '3',
      role: 'tutor',
      content:
        'Great question! In Python, indentation shows which code belongs together. Lines inside functions, if statements, and loops should be indented. Look for lines that end with a colon (:) - the next lines usually need to be indented.',
      timestamp: Date.now() - 180000, // 3 minutes ago
    },
    {
      id: '4',
      role: 'student',
      content:
        'That makes sense! So if I see a line like "if x > 5:", the next line should be indented?',
      timestamp: Date.now() - 120000, // 2 minutes ago
    },
    {
      id: '5',
      role: 'tutor',
      content:
        'Exactly! You\'ve got it. The line after "if x > 5:" should be indented because it\'s inside the if block.',
      timestamp: Date.now() - 60000, // 1 minute ago
    },
    {
      id: '6',
      role: 'tutor',
      content: '',
      timestamp: Date.now(),
      isTyping: true,
    },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Chat Message Component Test</h1>

        <div className="bg-white rounded-lg border p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Sample Chat Conversation
          </h2>

          {/* Chat container */}
          <div className="space-y-2 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded">
            {sampleMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Testing Notes:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Student messages appear on the right in blue</li>
            <li>• Tutor messages appear on the left in gray</li>
            <li>• Each message shows a timestamp</li>
            <li>• The typing indicator shows animated dots</li>
            <li>• Messages are responsive and will adapt to screen size</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default TestChatMessagePage;
