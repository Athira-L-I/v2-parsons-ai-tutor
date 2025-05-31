import React, { useRef, useEffect, useState } from 'react';
import { useParsonsContext, BlockItem } from '@/contexts/ParsonsContext';
import { generateIndentationHints } from '@/lib/adaptiveFeatures';
import ChatMessage from './ChatMessage';

const ChatFeedbackPanel: React.FC = () => {
  const {
    feedback,
    socraticFeedback,
    isCorrect,
    isLoading,
    currentProblem,
    currentBlocks,
    chatMessages,
    addChatMessage,
    clearChatHistory,
    isTyping,
    setChatLoading,
    removeTypingMessages,
  } = useParsonsContext();

  const [inputMessage, setInputMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  // Use the EXACT same logic as IndentationControls for consistency
  const generateSolutionData = () => {
    if (!currentProblem || !currentBlocks || currentBlocks.length === 0) {
      return { currentLines: [], expectedLines: [], lineToBlockMapping: [] };
    }

    const currentLines: string[] = [];
    const expectedLines: string[] = [];
    const lineToBlockMapping: Array<{
      blockId: string;
      subLineIndex?: number;
    }> = [];

    const allCorrectLines = currentProblem.initial
      .split('\n')
      .filter((line) => line.trim() && !line.includes('#distractor'));

    currentBlocks.forEach((block) => {
      if (block.isCombined && block.subLines) {
        block.subLines.forEach((subLine, subIndex) => {
          const subLineRelativeIndent = Math.floor(
            (subLine.match(/^(\s*)/)?.[1].length || 0) / 4
          );
          const totalIndent = block.indentation + subLineRelativeIndent;
          const indentString = '    '.repeat(totalIndent);
          const cleanSubLine = subLine.trim();
          currentLines.push(`${indentString}${cleanSubLine}`);

          const matchingExpectedLine = allCorrectLines.find(
            (expectedLine) => expectedLine.trim() === cleanSubLine
          );
          expectedLines.push(matchingExpectedLine || subLine);

          lineToBlockMapping.push({
            blockId: block.id,
            subLineIndex: subIndex,
          });
        });
      } else {
        const indentString = '    '.repeat(block.indentation);
        currentLines.push(`${indentString}${block.text}`);

        const matchingExpectedLine = allCorrectLines.find(
          (expectedLine) => expectedLine.trim() === block.text.trim()
        );
        expectedLines.push(matchingExpectedLine || block.text);

        lineToBlockMapping.push({
          blockId: block.id,
        });
      }
    });

    return { currentLines, expectedLines, lineToBlockMapping };
  };

  const { currentLines, expectedLines } = generateSolutionData();
  const indentationHints = generateIndentationHints(
    currentLines,
    expectedLines
  );
  const isIndentationProvided = currentProblem?.options.can_indent === false;

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSendingMessage) return;

    const messageContent = inputMessage.trim();
    setInputMessage('');
    setIsSendingMessage(true);

    // Add student message
    addChatMessage({
      role: 'student',
      content: messageContent,
    });

    try {
      // Show typing indicator
      setChatLoading(true);

      // Add typing message
      addChatMessage({
        role: 'tutor',
        content: '',
        isTyping: true,
      });

      // Simulate AI response (replace this with actual API call later)
      await new Promise((resolve) =>
        setTimeout(resolve, 1500 + Math.random() * 1000)
      );

      // Remove typing indicator
      setChatLoading(false);

      // Generate contextual response based on current state
      let aiResponse = '';

      if (isCorrect === true) {
        aiResponse =
          "Great job! Your solution is correct. Is there anything else you'd like to understand about this problem or Python programming in general?";
      } else if (isCorrect === false) {
        if (indentationHints.length > 0 && !isIndentationProvided) {
          aiResponse = `I notice you have some indentation issues. ${indentationHints[0].hint} Would you like me to explain more about Python indentation?`;
        } else if (feedback) {
          aiResponse =
            "I see you're having some trouble with the code arrangement. What specific part are you finding challenging?";
        } else {
          aiResponse =
            'Let me help you with this problem. What would you like to know about arranging these code blocks?';
        }
      } else {
        // No solution submitted yet
        aiResponse =
          "I'm here to help you with this Parsons problem! Feel free to ask me anything about Python code structure, indentation, or how to approach this puzzle.";
      }

      removeTypingMessages();
      // Add AI response
      addChatMessage({
        role: 'tutor',
        content: aiResponse,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setChatLoading(false);
      addChatMessage({
        role: 'tutor',
        content:
          "I'm sorry, I encountered an error. Please try asking your question again.",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (
      confirm(
        'Clear the chat history? This will remove all conversation messages.'
      )
    ) {
      clearChatHistory();
    }
  };

  // If there's no problem loaded, don't show the panel
  if (!currentProblem) {
    return null;
  }

  return (
    <div className="mt-6 border rounded-md bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 rounded-t-md">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">AI Tutor Chat</h3>
          <button
            onClick={handleClearChat}
            className="text-sm px-3 py-1 text-gray-600 hover:text-red-600 transition-colors"
            disabled={chatMessages.length === 0}
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="p-4 border-b">
        <div
          ref={chatContainerRef}
          className="h-64 overflow-y-auto space-y-2 bg-gray-50 rounded p-3 mb-4"
        >
          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="mb-2">💬</div>
              <p>Start a conversation with your AI tutor!</p>
              <p className="text-sm mt-1">
                Ask questions about the code blocks, Python syntax, or
                problem-solving strategies.
              </p>
            </div>
          ) : (
            chatMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
        </div>

        {/* Chat Input */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about this problem..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSendingMessage}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSendingMessage}
            className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
              inputMessage.trim() && !isSendingMessage
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {isSendingMessage ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {/* Traditional Feedback Section - All existing logic preserved */}
      <div className="p-4">
        <h4 className="text-md font-semibold mb-3">Problem Status</h4>

        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div>
            {isCorrect === true && (
              <div className="p-3 bg-green-100 text-green-800 rounded mb-3">
                <span className="font-bold">✅ Correct!</span> Your solution is
                right.
              </div>
            )}

            {isCorrect === false && (
              <div>
                <div className="p-3 bg-red-100 text-red-800 rounded mb-3">
                  <span className="font-bold">❌ Not quite right.</span> Try
                  again with the feedback below.
                </div>

                {/* Indentation Issues - Only show when indentation is NOT provided */}
                {!isIndentationProvided && indentationHints.length > 0 && (
                  <div className="prose max-w-none mb-4">
                    <h5 className="text-md font-medium mb-2 flex items-center">
                      <span className="mr-2">🔧</span>
                      Indentation Issues ({indentationHints.length})
                    </h5>
                    <div className="bg-orange-50 border border-orange-200 rounded p-3 text-sm">
                      <p className="text-orange-700 mb-2">
                        Found {indentationHints.length} indentation issue
                        {indentationHints.length !== 1 ? 's' : ''}:
                      </p>
                      <ul className="space-y-1">
                        {indentationHints.slice(0, 3).map((hint, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2 text-orange-500">•</span>
                            <span className="text-orange-700">
                              <strong>Line {hint.lineIndex + 1}:</strong>{' '}
                              {hint.hint}
                              <span className="text-xs ml-2 text-orange-600">
                                (Current: {hint.currentIndent}, Expected:{' '}
                                {hint.expectedIndent})
                              </span>
                            </span>
                          </li>
                        ))}
                        {indentationHints.length > 3 && (
                          <li className="text-orange-600 italic">
                            ... and {indentationHints.length - 3} more
                            indentation issues
                          </li>
                        )}
                      </ul>
                      <div className="mt-2 p-2 bg-orange-100 rounded text-xs text-orange-800">
                        💡 Use the indentation controls below your solution to
                        fix these issues.
                      </div>
                    </div>
                  </div>
                )}

                {/* Parsons Widget Feedback */}
                {feedback && (
                  <div className="prose max-w-none mb-4">
                    <h5 className="text-md font-medium mb-2">
                      Technical Issues:
                    </h5>
                    <div
                      className="bg-white p-3 rounded border text-sm"
                      dangerouslySetInnerHTML={{ __html: feedback }}
                    />
                  </div>
                )}

                {/* Socratic Feedback */}
                {socraticFeedback && (
                  <div className="prose max-w-none">
                    <h5 className="text-md font-medium mb-2">Learning Hint:</h5>
                    <div
                      className="bg-white p-3 rounded border text-sm border-blue-200 bg-blue-50"
                      dangerouslySetInnerHTML={{ __html: socraticFeedback }}
                    />
                  </div>
                )}

                {!feedback &&
                  !socraticFeedback &&
                  !isIndentationProvided &&
                  indentationHints.length === 0 && (
                    <p className="text-gray-500 italic">
                      Check your code ordering and indentation for errors.
                    </p>
                  )}
              </div>
            )}

            {isCorrect === null && currentBlocks.length === 0 && (
              <p className="text-gray-500 italic">
                Arrange some code blocks and submit your solution to get
                feedback
              </p>
            )}

            {isCorrect === null && currentBlocks.length > 0 && (
              <p className="text-gray-500 italic">
                Submit your solution to get feedback
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatFeedbackPanel;
