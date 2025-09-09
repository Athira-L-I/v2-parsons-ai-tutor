/**
 * Example component using the standardized API layer
 */

import React, { useState, useEffect } from 'react';
import { useParsonsProblems } from '@/hooks/useParsonsProblems';
import { useChatFeedback } from '@/hooks/useChatFeedback';

const ParsonsProblemsExample: React.FC = () => {
  // State for the selected problem
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(
    null
  );
  const [userSolution, setUserSolution] = useState<string[]>([]);
  const [userMessage, setUserMessage] = useState('');

  // Use our custom hooks
  const {
    problems,
    isLoading: problemsLoading,
    error: problemsError,
    fetchNextPage,
    fetchPreviousPage,
    page,
    totalPages,
    filterByDifficulty,
  } = useParsonsProblems({
    initialDifficulty: 'medium',
    pageSize: 5,
  });

  const {
    chatHistory,
    isLoading: chatLoading,
    error: chatError,
    addUserMessage,
    resetChat,
  } = useChatFeedback({
    problemId: selectedProblemId || '',
    onError: (error) => console.error('Chat error:', error),
  });

  // Reset chat when problem changes
  useEffect(() => {
    resetChat();
    setUserSolution([]);
  }, [selectedProblemId, resetChat]);

  // Handle problem selection
  const handleSelectProblem = (problemId: string) => {
    setSelectedProblemId(problemId);
  };

  // Handle difficulty filter change
  const handleDifficultyChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    filterByDifficulty(event.target.value);
  };

  // Handle solution update (simulated)
  const handleSolutionUpdate = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    // Split text by newlines to simulate code blocks
    setUserSolution(event.target.value.split('\n'));
  };

  // Handle message submission
  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();

    if (userMessage.trim() && selectedProblemId) {
      addUserMessage(userMessage, userSolution);
      setUserMessage('');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Parsons Problems Example</h1>

      {/* Problem filtering */}
      <div className="mb-4">
        <label className="block mb-2">
          Difficulty:
          <select
            className="ml-2 p-1 border rounded"
            onChange={handleDifficultyChange}
          >
            <option value="">All</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
      </div>

      {/* Problems list */}
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Problems</h2>

        {problemsLoading && <p>Loading problems...</p>}
        {problemsError && (
          <p className="text-red-500">Error: {problemsError.message}</p>
        )}

        <div className="grid grid-cols-1 gap-2 mb-2">
          {problems.map((problem) => (
            <div
              key={problem.id}
              className={`p-2 border rounded cursor-pointer ${
                selectedProblemId === problem.id ? 'bg-blue-100' : ''
              }`}
              onClick={() => handleSelectProblem(problem.id)}
            >
              <h3 className="font-bold">{problem.title}</h3>
              <p className="text-sm">Difficulty: {problem.difficulty}</p>
              <div className="flex gap-1">
                {problem.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-200 rounded px-1">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center">
          <button
            disabled={page <= 1}
            onClick={fetchPreviousPage}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={fetchNextPage}
            className="px-2 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Selected problem and chat */}
      {selectedProblemId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Solution area */}
          <div>
            <h2 className="text-xl font-bold mb-2">Your Solution</h2>
            <textarea
              className="w-full h-40 p-2 border rounded font-mono"
              value={userSolution.join('\n')}
              onChange={handleSolutionUpdate}
              placeholder="Type your solution here (one line per code block)..."
            />
          </div>

          {/* Chat area */}
          <div>
            <h2 className="text-xl font-bold mb-2">Chat</h2>

            {/* Chat history */}
            <div className="border rounded p-2 h-40 mb-2 overflow-y-auto">
              {chatHistory.length === 0 ? (
                <p className="text-gray-500">
                  No messages yet. Ask a question to get started!
                </p>
              ) : (
                chatHistory.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-2 ${
                      message.role === 'student' ? 'text-right' : ''
                    }`}
                  >
                    <div
                      className={`inline-block p-2 rounded ${
                        message.role === 'student'
                          ? 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}
                    >
                      {message.isTyping ? (
                        <span className="inline-block animate-pulse">
                          AI is typing...
                        </span>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                className="flex-1 p-2 border rounded"
                placeholder="Ask a question..."
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={!userMessage.trim() || chatLoading}
                className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-blue-300"
              >
                Send
              </button>
            </form>

            {chatError && (
              <p className="text-red-500 mt-2">Error: {chatError.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParsonsProblemsExample;
