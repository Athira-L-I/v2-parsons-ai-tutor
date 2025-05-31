import React, { useState } from 'react';
import { marked } from 'marked';

// Use environment variable for API key
const API_KEY = process.env.OPENROUTER_API_KEY;

if (typeof window !== 'undefined' && !API_KEY) {
  console.error('OpenRouter API key not found in environment variables');
}

marked.setOptions({
  gfm: true,
  breaks: true,
});

const ChatBotTest: React.FC = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!API_KEY) {
      setResponse(
        'Error: API key not configured. Please check your environment variables.'
      );
      return;
    }

    if (!input.trim()) {
      setResponse('Please enter a message.');
      return;
    }

    setIsLoading(true);
    setResponse('Loading...');

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'HTTP-Referer':
            'https://github.com/your-username/v2-parsons-ai-tutor',
          'X-Title': 'Parsons Puzzle AI Tutor',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen/qwen-2.5-coder-32b-instruct:free',
          messages: [{ role: 'user', content: input }],
        }),
      });

      if (!res.ok) {
        throw new Error(`API returned status ${res.status}`);
      }

      const data = await res.json();
      console.log('API Response:', data);

      const markdownText =
        data.choices?.[0]?.message?.content || 'No response received.';
      // Use marked synchronously
      const htmlContent = marked(markdownText) as string;
      setResponse(htmlContent);
    } catch (error) {
      setResponse(
        `Error: ${
          error instanceof Error ? error.message : 'Unknown error occurred'
        }`
      );
      console.error('API Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">AI Programming Tutor</h2>

      <div className="mb-4">
        <input
          type="text"
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a programming question..."
        />
      </div>

      <button
        className={`px-4 py-2 rounded ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600'
        } text-white font-medium`}
        onClick={sendMessage}
        disabled={isLoading}
      >
        {isLoading ? 'Thinking...' : 'Ask!'}
      </button>

      <div
        className="mt-6 p-4 border rounded min-h-[100px] prose max-w-none"
        dangerouslySetInnerHTML={{ __html: response }}
      />
    </div>
  );
};

export default ChatBotTest;
