/**
 * Hook for handling chat interactions with the API
 */

import { useState, useCallback, useRef } from 'react';
import { ChatMessage } from '@/@types/types';
import { feedbackApiService } from '@/api';
import { ApiErrorCode } from '@/api/types';

export interface UseChatFeedbackOptions {
  problemId: string;
  onError?: (error: Error) => void;
}

export interface UseChatFeedbackResult {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  error: Error | null;
  addUserMessage: (content: string, solution: string[]) => Promise<void>;
  resetChat: () => void;
}

/**
 * Hook for managing chat interactions with the AI tutor
 */
export const useChatFeedback = ({
  problemId,
  onError,
}: UseChatFeedbackOptions): UseChatFeedbackResult => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use a ref to store the current solution for validation
  const currentSolutionRef = useRef<string[]>([]);

  /**
   * Add a new user message and get AI response
   */
  const addUserMessage = useCallback(
    async (content: string, solution: string[]) => {
      if (!content.trim()) {
        return;
      }

      setIsLoading(true);
      setError(null);

      // Update solution ref
      currentSolutionRef.current = solution;

      // Create user message
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'student',
        content: content.trim(),
        timestamp: Date.now(),
        isTyping: false,
      };

      // Create initial AI message (loading state)
      const aiLoadingMessage: ChatMessage = {
        id: `ai_loading_${Date.now()}`,
        role: 'tutor',
        content: '',
        timestamp: Date.now(),
        isTyping: true,
      };

      // Update chat history with user message and loading AI message
      setChatHistory((prev) => [...prev, userMessage, aiLoadingMessage]);

      try {
        // Get current chat history without the loading message
        const historyWithoutLoading = [...chatHistory, userMessage];

        // Send chat feedback request
        const response = await feedbackApiService.generateFeedback({
          problemId,
          currentSolution: solution,
          chatHistory: historyWithoutLoading,
          context: {
            attempts: historyWithoutLoading.filter(
              (msg) => msg.role === 'student'
            ).length,
            timeSpent: 0, // Could track this separately
          },
        });

        // Handle error response
        if (!response.success) {
          throw new Error(
            response.error?.message || 'Failed to get AI feedback'
          );
        }

        // Create AI response message
        const aiResponseMessage: ChatMessage = {
          id: response.data?.feedback.id || `ai_${Date.now()}`,
          role: 'tutor',
          content:
            response.data?.feedback.content ||
            'Sorry, I could not generate a response.',
          timestamp: Date.now(),
          isTyping: false,
        };

        // Replace loading message with actual response
        setChatHistory((prev) =>
          prev.map((msg) =>
            msg.id === aiLoadingMessage.id ? aiResponseMessage : msg
          )
        );
      } catch (err) {
        // Handle error
        setError(
          err instanceof Error ? err : new Error('An unknown error occurred')
        );

        // Call error handler if provided
        if (onError && err instanceof Error) {
          onError(err);
        }

        // Replace loading message with error message
        const errorMessage =
          err instanceof Error ? err.message : 'An unknown error occurred';
        const fallbackMessage = generateFallbackResponse(
          content,
          solution,
          errorMessage
        );

        // Update chat history to remove loading and add fallback
        setChatHistory((prev) =>
          prev.map((msg) => {
            if (msg.id === aiLoadingMessage.id) {
              return {
                ...msg,
                content: fallbackMessage,
                isTyping: false,
              };
            }
            return msg;
          })
        );
      } finally {
        setIsLoading(false);
      }
    },
    [chatHistory, problemId, onError]
  );

  /**
   * Reset chat history
   */
  const resetChat = useCallback(() => {
    setChatHistory([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    chatHistory,
    isLoading,
    error,
    addUserMessage,
    resetChat,
  };
};

/**
 * Generate a fallback response for error cases
 */
const generateFallbackResponse = (
  userMessage: string,
  solution: string[],
  errorReason: string
): string => {
  const prefix =
    "I'm sorry, I couldn't generate a personalized response right now. ";

  // Check if solution is empty
  if (solution.length === 0) {
    return `${prefix}It looks like you haven't arranged any code blocks yet. Try dragging some code blocks to the solution area to get started.`;
  }

  // Check if message contains specific keywords
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('hint') || lowerMessage.includes('help')) {
    return `${prefix}Try thinking about the logical flow of the program. What should happen first? What conditions need to be checked?`;
  }

  if (lowerMessage.includes('explain') || lowerMessage.includes('why')) {
    return `${prefix}Consider the problem requirements and check if your code arrangement matches the expected logic.`;
  }

  if (lowerMessage.includes('indentation') || lowerMessage.includes('indent')) {
    return `${prefix}Remember that indentation in Python is important - code blocks that belong together should have the same indentation level.`;
  }

  // If the error has a specific code, provide more targeted feedback
  if (
    errorReason.includes(ApiErrorCode.SERVICE_UNAVAILABLE) ||
    errorReason.includes(ApiErrorCode.TIMEOUT) ||
    errorReason.includes('network')
  ) {
    return `${prefix}There seems to be a connection issue. Please check your internet connection and try again.`;
  }

  return `${prefix}Please try again in a moment, or try phrasing your question differently.`;
};
