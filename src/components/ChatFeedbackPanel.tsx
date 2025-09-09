import React, { useRef, useEffect, useState } from 'react';
import { useParsonsContext } from '@/contexts/useParsonsContext';
import { BlockItem } from '@/hooks/useParsonsBlocks';
import { generateIndentationHints } from '@/lib/adaptiveFeatures';
import ChatMessage from './ChatMessage';

const ChatFeedbackPanel: React.FC = () => {
  const {
    feedback,
    socraticFeedback,
    isCorrect,
    isLoading,
    currentProblem,
    currentProblemId,
    currentBlocks,
    chatMessages,
    addChatMessage,
    clearChatHistory,
    isTyping,
    setChatLoading,
    removeTypingMessages,
    userSolution,
    setFeedback,
    setIsCorrect,
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

  // Extract group IDs for enhanced indentation hints
  const blockMetadata = currentBlocks.reduce(
    (metadata: { [id: string]: { groupId?: string } }, block: any) => {
      if (block.groupId) {
        // Convert groupId to string if it's a number
        const groupIdStr =
          typeof block.groupId === 'number'
            ? block.groupId.toString()
            : block.groupId;
        metadata[block.id] = { groupId: groupIdStr };
      }
      return metadata;
    },
    {} as { [id: string]: { groupId?: string } }
  );

  const indentationHints = generateIndentationHints(
    currentLines,
    expectedLines,
    blockMetadata
  );
  const isIndentationProvided = currentProblem?.options.can_indent === false;

  // Function to get the current problem ID
  const getProblemId = (): string | null => {
    // First try to get from context
    if (currentProblemId) {
      return currentProblemId;
    }

    // Then try URL params (if available)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlProblemId = urlParams.get('problemId');
      if (urlProblemId) {
        return urlProblemId;
      }
    }

    // Try to extract from current problem data
    if (currentProblem) {
      // Check if the problem has an ID field (from API)
      const problemData = (currentProblem as any).id;
      if (problemData) {
        return problemData;
      }

      // Try to generate a stable ID from problem content
      const contentHash = generateProblemHash(currentProblem);
      return `problem-${contentHash}`;
    }

    // Check if we're on a specific route that indicates problem ID
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const problemMatch = path.match(/\/problems\/([^\/]+)/);
      if (problemMatch) {
        return problemMatch[1];
      }
    }

    return null;
  };

  // Generate a simple hash from problem content for consistent ID
  const generateProblemHash = (problem: any): string => {
    const content = JSON.stringify({
      initial: problem.initial,
      canIndent: problem.options.can_indent,
      maxWrongLines: problem.options.max_wrong_lines,
    });

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSendingMessage || !currentProblem) return;

    const messageContent = inputMessage.trim();
    setInputMessage('');
    setIsSendingMessage(true);

    // Add student message immediately
    addChatMessage({
      role: 'student',
      content: messageContent,
    });

    try {
      // Show typing indicator
      setChatLoading(true);
      addChatMessage({
        role: 'tutor',
        content: '',
        isTyping: true,
      });

      // IMPORTANT CHANGE: Use solution data with proper indentation
      const { currentLines } = generateSolutionData();

      // Create solution context to ensure AI knows validation status
      const solutionContext = {
        isCorrect,
        indentationHints,
        solutionStatus:
          indentationHints.length > 0
            ? 'indentation-issues'
            : isCorrect === true
            ? 'correct'
            : isCorrect === false
            ? 'incorrect'
            : 'unchecked',
      };

      // Get the actual problem ID
      const problemId = getProblemId();

      console.log('📤 Sending chat message to API:', {
        problemId: problemId || 'no-id',
        messageLength: messageContent.length,
        historyLength: chatMessages.length,
        solutionLength: currentLines.length,
        solutionContext,
        currentLines,
      });

      // TODO: Implement a proper ChatRepository and use it here
      // For now we'll use the fetch API directly
      // This will be replaced with a repository call in the future
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        }/api/chat/message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            problemId: problemId || 'no-id',
            message: messageContent,
            chatHistory: chatMessages.filter((msg) => !msg.isTyping),
            currentSolution: currentLines,
            solutionContext,
          }),
        }
      ).then((res) => res.json());

      console.log('📥 Received chat response:', {
        success: response.success,
        hasMessage: !!response.chatMessage.content,
        hasTraditionalFeedback: !!response.traditionalFeedback,
        hasSolutionValidation: !!response.solutionValidation,
      });

      // Remove typing indicator
      setChatLoading(false);
      removeTypingMessages(); // <-- Add this line

      // Add the actual AI response (this will replace the typing message in the context)
      addChatMessage({
        role: 'tutor',
        content: response.chatMessage.content,
        isTyping: false,
      });

      // Update traditional feedback if provided
      if (response.traditionalFeedback && setFeedback) {
        setFeedback(response.traditionalFeedback);
      }

      // Update solution validation if provided
      if (response.solutionValidation && setIsCorrect) {
        setIsCorrect(response.solutionValidation.isCorrect);
      }

      // Show success message briefly if response indicates problems were resolved
      if (
        response.success &&
        response.chatMessage.content.toLowerCase().includes('correct')
      ) {
        setTimeout(() => {
          console.log('💬 AI indicated solution might be correct');
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Error sending chat message:', error);

      // Remove typing indicator
      setChatLoading(false);
      removeTypingMessages();

      // Determine appropriate error message
      let errorMessage = 'I apologize, but I encountered an error. ';

      if (
        error.message?.includes('timeout') ||
        error.code === 'ECONNABORTED' ||
        error.message?.includes('timed out')
      ) {
        errorMessage =
          '⏱️ The request timed out. Our AI tutor is taking longer than expected to respond. ' +
          'Please try asking your question again in a few moments. ' +
          'If the problem persists, you might want to try a shorter or more specific question.';
      } else if (
        error.message?.includes('offline') ||
        error.message?.includes('network')
      ) {
        errorMessage +=
          "I'm currently offline, but I'll try to help with what I know. Can you describe your specific question about this problem?";
      } else if (error.message?.includes('server')) {
        errorMessage +=
          "I'm having technical difficulties. Try asking your question again, or think about what the logical flow of this program should be.";
      } else {
        errorMessage +=
          'Please try asking your question again. What specific part of this problem would you like help with?';
      }

      // Add error message as AI response
      addChatMessage({
        role: 'tutor',
        content: errorMessage,
        isTyping: false,
      });

      // Show user-friendly error message briefly
      setTimeout(() => {
        console.log('💬 Chat error handled gracefully');
      }, 500);
    } finally {
      setIsSendingMessage(false);

      // Focus back on input for next message
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSendingMessage && inputMessage.trim()) {
        handleSendMessage();
      }
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
            placeholder={
              isSendingMessage
                ? 'Sending message...'
                : isTyping
                ? 'AI is typing...'
                : 'Ask a question about this problem...'
            }
            className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              isSendingMessage || isTyping
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-300'
            }`}
            disabled={isSendingMessage}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSendingMessage || isTyping}
            className={`px-4 py-2 rounded-md text-white font-medium transition-all duration-200 ${
              inputMessage.trim() && !isSendingMessage && !isTyping
                ? 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {isSendingMessage ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Sending
              </div>
            ) : isTyping ? (
              'AI Typing...'
            ) : (
              'Send'
            )}
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
