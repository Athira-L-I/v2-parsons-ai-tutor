import axios from 'axios';
import { ParsonsSettings } from '@/@types/types';
import { ChatMessage } from '@/@types/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ChatFeedbackRequest {
  problemId: string;
  userSolution: string[];
  chatHistory: ChatMessage[];
  currentMessage: string;
}

interface ChatFeedbackResponse {
  success: boolean;
  message: string;
  chatMessage: ChatMessage;
  traditionalFeedback?: string;
  solutionValidation?: {
    isCorrect: boolean;
    details: string;
  };
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Enhanced error handling for API responses
const handleApiError = (error: any, fallbackMessage: string) => {
  if (error.response) {
    // Server responded with error status
    const message =
      error.response.data?.detail ||
      error.response.data?.message ||
      fallbackMessage;
    throw new Error(`API Error: ${message}`);
  } else if (error.request) {
    // Request made but no response received
    throw new Error(
      'Network Error: Unable to connect to server. Please check your connection.'
    );
  } else {
    // Something else happened
    throw new Error(`Request Error: ${error.message || fallbackMessage}`);
  }
};

export const fetchProblems = async () => {
  try {
    const response = await apiClient.get('/api/problems');

    // Validate response structure
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid response format: Expected array of problems');
    }

    // Validate each problem has required fields
    const validatedProblems = response.data.map(
      (problem: any, index: number) => {
        if (!problem.id || !problem.title) {
          throw new Error(
            `Invalid problem at index ${index}: Missing required fields (id, title)`
          );
        }

        return {
          id: problem.id,
          title: problem.title,
          description: problem.description || '',
          difficulty: problem.difficulty || 'medium',
          tags: Array.isArray(problem.tags) ? problem.tags : [],
          completed: Boolean(problem.completed),
          parsonsSettings: problem.parsonsSettings,
          createdAt: problem.createdAt,
          updatedAt: problem.updatedAt,
        };
      }
    );

    return validatedProblems;
  } catch (error) {
    console.error('Error fetching problems:', error);
    handleApiError(error, 'Failed to fetch problems');
  }
};

export const fetchProblemById = async (id: string) => {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid problem ID provided');
  }
  
  return getProblem(id);
};

export const getProblem = async (id: string) => {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid problem ID provided');
  }

  if (id === 'demo-problem-1') {
    return {
      id: 'demo-problem-1',
      title: 'Demo: Print Even Numbers',
      description:
        'Arrange the code blocks to print all even numbers from 1 to 10.',
      parsonsSettings: {
        initial:
          'start = 1\nend = 10\nfor i in range(start, end + 1):\n    if i % 2 == 0:\n        print(i)',
        options: {
          sortableId: 'sortable',
          trashId: 'sortableTrash',
          max_wrong_lines: 3,
          can_indent: true,
          grader: 'ParsonsWidget._graders.LineBasedGrader',
          exec_limit: 2500,
          show_feedback: true,
        },
      },
    };
  }

  try {
    const response = await apiClient.get(
      `/api/problems/${encodeURIComponent(id)}`
    );

    // Validate response structure
    const problem = response.data;
    if (!problem || typeof problem !== 'object') {
      throw new Error('Invalid response format: Expected problem object');
    }

    // Validate required fields
    if (!problem.id || !problem.title || !problem.parsonsSettings) {
      throw new Error(
        'Invalid problem data: Missing required fields (id, title, parsonsSettings)'
      );
    }

    // Validate parsonsSettings structure
    if (!problem.parsonsSettings.initial || !problem.parsonsSettings.options) {
      throw new Error(
        'Invalid parsonsSettings: Missing initial code or options'
      );
    }

    return {
      id: problem.id,
      title: problem.title,
      description: problem.description || '',
      difficulty: problem.difficulty || 'medium',
      tags: Array.isArray(problem.tags) ? problem.tags : [],
      parsonsSettings: problem.parsonsSettings,
      createdAt: problem.createdAt,
      updatedAt: problem.updatedAt,
    };
  } catch (error) {
    console.error(`Error fetching problem ${id}:`, error);
    handleApiError(error, `Failed to fetch problem with ID: ${id}`);
  }
};

export const checkSolution = async (problemId: string, solution: string[]) => {
  // Input validation
  if (!problemId || typeof problemId !== 'string') {
    throw new Error('Invalid problem ID provided');
  }

  if (!Array.isArray(solution)) {
    throw new Error('Solution must be an array of strings');
  }

  if (solution.length === 0) {
    throw new Error('Solution cannot be empty');
  }

  try {
    const response = await apiClient.post('/api/solutions/validate', {
      problemId: problemId.trim(),
      solution: solution.filter((line) => typeof line === 'string'),
    });

    // Validate response structure
    const result = response.data;
    if (typeof result !== 'object' || result === null) {
      throw new Error('Invalid response format from server');
    }

    // Ensure required fields exist
    const validatedResult = {
      isCorrect: Boolean(result.isCorrect),
      details:
        typeof result.details === 'string'
          ? result.details
          : 'No details provided',
    };

    return validatedResult;
  } catch (error) {
    console.error('Error checking solution:', error);

    // If it's a network error or server is down, provide local fallback
    if (error.request && !error.response) {
      console.warn('Server unavailable, attempting local validation fallback');
      try {
        const localResult = await checkSolutionLocally(problemId, solution);
        return localResult;
      } catch (localError) {
        console.error('Local validation also failed:', localError);
        throw new Error(
          'Unable to validate solution: Server unavailable and local validation failed'
        );
      }
    }

    handleApiError(error, 'Failed to validate solution');
  }
};

// Local fallback validation function
const checkSolutionLocally = async (problemId: string, solution: string[]) => {
  try {
    // Try to use the Next.js API route for local validation
    const response = await fetch('/api/local-validation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problemId,
        solution,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Local validation failed with status: ${response.status}`
      );
    }

    const result = await response.json();
    return {
      isCorrect: Boolean(result.isCorrect),
      details: result.details || 'Local validation completed',
    };
  } catch (error) {
    // Final fallback - basic validation
    console.warn('Local API validation failed, using basic validation');
    return {
      isCorrect: false,
      details:
        'Unable to validate solution properly. Please check your code arrangement and try again when the connection is restored.',
    };
  }
};

export const generateFeedback = async (
  problemId: string,
  solution: string[]
) => {
  // Input validation
  if (!problemId || typeof problemId !== 'string') {
    throw new Error('Invalid problem ID provided');
  }

  if (!Array.isArray(solution)) {
    throw new Error('Solution must be an array of strings');
  }

  if (solution.length === 0) {
    return 'Please arrange some code blocks before requesting feedback.';
  }

  try {
    const response = await apiClient.post('/api/feedback', {
      problemId: problemId.trim(),
      userSolution: solution.filter((line) => typeof line === 'string'),
    });

    // Validate response
    const feedback = response.data?.feedback;
    if (typeof feedback !== 'string') {
      throw new Error('Invalid feedback response format');
    }

    return feedback;
  } catch (error) {
    console.error('Error generating feedback:', error);

    // If server is unavailable, provide local fallback feedback
    if (error.request && !error.response) {
      console.warn('Server unavailable, generating local fallback feedback');
      return generateLocalFallbackFeedback(solution);
    }

    // If API key issues or other server errors, provide helpful fallback
    if (error.response?.status === 500) {
      console.warn('Server error, generating local fallback feedback');
      return generateLocalFallbackFeedback(solution);
    }

    // If problem not found
    if (error.response?.status === 404) {
      return 'Problem not found. Please try refreshing the page or selecting a different problem.';
    }

    // For other API errors, try to provide meaningful feedback
    const errorMessage =
      error.response?.data?.detail || error.response?.data?.message;
    if (errorMessage) {
      return `Unable to generate personalized feedback: ${errorMessage}. Please try again later.`;
    }

    // Final fallback
    return generateLocalFallbackFeedback(solution);
  }
};

// Local fallback feedback generator
const generateLocalFallbackFeedback = (solution: string[]): string => {
  const feedbackTemplates = [
    "Let's think about the logical flow of your program. What should happen first?",
    'Consider the structure of your code. Are the blocks in the right order?',
    'Take a look at your solution - does each step logically follow from the previous one?',
    'What is the main goal of this program? Does your current arrangement achieve that goal?',
    'Think about the control structures (if statements, loops). Are they positioned correctly?',
    'Consider the indentation - does it reflect the logical structure of the program?',
    'Review each line: does it make sense in its current position?',
  ];

  // Simple analysis to provide more specific feedback
  const hasControlStructures = solution.some(
    (line) =>
      line.includes('if') || line.includes('for') || line.includes('while')
  );

  const hasFunction = solution.some(
    (line) => line.includes('def ') || line.includes('return')
  );

  const hasLoop = solution.some(
    (line) => line.includes('for ') || line.includes('while ')
  );

  let specificFeedback = '';

  if (hasFunction) {
    specificFeedback =
      'I notice you have function-related code. Remember that function definitions usually come before the code that calls them.';
  } else if (hasLoop) {
    specificFeedback =
      "I see you're working with loops. Think about what needs to be set up before the loop runs, and what happens inside the loop.";
  } else if (hasControlStructures) {
    specificFeedback =
      'Your code includes conditional statements. Consider what conditions need to be checked and in what order.';
  } else {
    specificFeedback =
      feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)];
  }

  return `${specificFeedback} (Note: This is basic feedback - connect to the server for AI-powered personalized guidance.)`;
};

export const generateProblem = async (sourceCode: string) => {
  try {
    const response = await apiClient.post('/api/problems/generate', {
      sourceCode,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating problem:', error);
    throw error;
  }
};

export const sendChatMessage = async (
  problemId: string,
  message: string,
  chatHistory: any[],
  currentSolution: string[],
  solutionContext?: {
    isCorrect: boolean | null;
    indentationHints: any[];
    solutionStatus: string;
  }
) => {
  // Input validation
  if (!problemId || typeof problemId !== 'string') {
    throw new Error('Invalid problem ID provided');
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new Error('Message cannot be empty');
  }

  if (!Array.isArray(chatHistory)) {
    throw new Error('Chat history must be an array');
  }

  if (!Array.isArray(currentSolution)) {
    throw new Error('User solution must be an array');
  }

  try {
    // Serialize chat history for API - ensure all messages have required fields
    const serializedChatHistory = chatHistory.map((msg, index) => ({
      id: msg.id || `msg_${Date.now()}_${index}`,
      role: msg.role,
      content: msg.content || '',
      timestamp: msg.timestamp || Date.now(),
      isTyping: msg.isTyping || false,
    }));

    const requestData = {
      problemId: problemId.trim(),
      currentMessage: message.trim(),
      chatHistory: serializedChatHistory,
      // IMPORTANT: Don't filter or trim solution lines to preserve indentation
      userSolution: currentSolution.filter((line) => typeof line === 'string'),
      // Add solutionContext to the request data
      solutionContext: solutionContext,
    };

    console.log('📤 Sending chat message:', {
      problemId,
      messageLength: message.length,
      historyLength: chatHistory.length,
      solutionLength: currentSolution.length,
      hasSolutionContext: !!solutionContext,
    });

    const response = await apiClient.post('/api/feedback/chat', requestData);

    // Validate response structure
    const result = response.data;
    if (typeof result !== 'object' || result === null) {
      throw new Error('Invalid response format from server');
    }

    // Ensure required fields exist with proper defaults
    const validatedResult: ChatFeedbackResponse = {
      success: Boolean(result.success),
      message:
        typeof result.message === 'string'
          ? result.message
          : 'Response received',
      chatMessage: {
        id: result.chatMessage?.id || `response_${Date.now()}`,
        role: result.chatMessage?.role || 'tutor',
        content:
          result.chatMessage?.content ||
          'I apologize, but I received an empty response.',
        timestamp: result.chatMessage?.timestamp || Date.now(),
        isTyping: Boolean(result.chatMessage?.isTyping),
      },
      traditionalFeedback: result.traditionalFeedback || undefined,
      solutionValidation: result.solutionValidation
        ? {
            isCorrect: Boolean(result.solutionValidation.isCorrect),
            details:
              result.solutionValidation.details ||
              'No validation details provided',
          }
        : undefined,
    };

    console.log('📥 Chat response received:', {
      success: validatedResult.success,
      messageLength: validatedResult.chatMessage.content.length,
      hasTraditionalFeedback: !!validatedResult.traditionalFeedback,
      hasSolutionValidation: !!validatedResult.solutionValidation,
    });

    return validatedResult;
  } catch (error) {
    console.error('❌ Error sending chat message:', error);

    // Enhanced error handling based on error type
    if (error.request && !error.response) {
      // Network error - server unavailable
      console.warn('🌐 Server unavailable, providing offline response');

      return {
        success: false,
        message: 'Server unavailable - offline response provided',
        chatMessage: {
          id: `offline_${Date.now()}`,
          role: 'tutor',
          content: generateOfflineChatResponse(message, currentSolution),
          timestamp: Date.now(),
          isTyping: false,
        },
      };
    }

    if (error.response?.status === 404) {
      throw new Error(
        'Problem not found. Please try refreshing the page or selecting a different problem.'
      );
    }

    if (error.response?.status === 400) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Invalid request format';
      throw new Error(`Request error: ${errorMessage}`);
    }

    if (error.response?.status >= 500) {
      // Server error - provide helpful fallback
      console.warn('🔧 Server error, providing fallback response');

      return {
        success: false,
        message: 'Server error - fallback response provided',
        chatMessage: {
          id: `fallback_${Date.now()}`,
          role: 'tutor',
          content: generateFallbackChatResponse(message, currentSolution),
          timestamp: Date.now(),
          isTyping: false,
        },
      };
    }

    // For other API errors, try to provide meaningful feedback
    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message;
    throw new Error(`Failed to send message: ${errorMessage}`);
  }
};

// Helper function for offline responses
const generateOfflineChatResponse = (
  message: string,
  userSolution: string[]
): string => {
  const messageLower = message.toLowerCase();

  if (messageLower.includes('indent')) {
    return "I'm currently offline, but I can tell you that indentation in Python is crucial! Lines that belong to the same block (like inside functions or if statements) should have the same indentation level. Try using 4 spaces for each indent level.";
  }

  if (messageLower.includes('order') || messageLower.includes('sequence')) {
    return "While I'm offline, here's a tip: think about the logical flow of your program. What needs to happen first? Usually, that's setting up variables, then the main logic, and finally any output or return statements.";
  }

  if (messageLower.includes('start') || messageLower.includes('begin')) {
    return "I'm currently offline, but here's some guidance: start by identifying what your program is supposed to do, then think about the first step. Look for variable declarations or function definitions that might need to come first.";
  }

  if (userSolution.length === 0) {
    return "I'm currently offline, but I can suggest starting by dragging some code blocks to the solution area. Try to think about what should happen first in the program!";
  }

  return "I'm currently offline and can't provide personalized help right now. Try thinking about the logical flow of your program - what should happen first, second, and so on. When I'm back online, I'll be able to give you more specific guidance!";
};

// Helper function for server error fallbacks
const generateFallbackChatResponse = (
  message: string,
  userSolution: string[]
): string => {
  const messageLower = message.toLowerCase();

  if (messageLower.includes('help') || messageLower.includes('stuck')) {
    return "I'm experiencing some technical difficulties, but I'm still here to help! Try breaking down the problem step by step. What do you think should be the very first line of code to execute?";
  }

  if (messageLower.includes('correct') || messageLower.includes('right')) {
    return "I'm having trouble connecting to my full analysis tools, but I can suggest checking: 1) Are the lines in logical order? 2) Is the indentation correct? 3) Do all the necessary pieces seem to be included?";
  }

  return "I'm experiencing some technical issues but want to help! Can you be more specific about what you're trying to figure out? I can try to give you some general guidance even with my limited capabilities right now.";
};

export default apiClient;
