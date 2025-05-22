import axios from 'axios';
import { ParsonsSettings } from '@/@types/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
    const message = error.response.data?.detail || error.response.data?.message || fallbackMessage;
    throw new Error(`API Error: ${message}`);
  } else if (error.request) {
    // Request made but no response received
    throw new Error('Network Error: Unable to connect to server. Please check your connection.');
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
    const validatedProblems = response.data.map((problem: any, index: number) => {
      if (!problem.id || !problem.title) {
        throw new Error(`Invalid problem at index ${index}: Missing required fields (id, title)`);
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
    });
    
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

  if (id === 'demo-problem-1') {
    return {
      id: 'demo-problem-1',
      title: 'Demo: Print Even Numbers',
      description: 'Arrange the code blocks to print all even numbers from 1 to 10.',
      parsonsSettings: {
        initial: "start = 1\nend = 10\nfor i in range(start, end + 1):\n    if i % 2 == 0:\n        print(i)",
        options: {
          sortableId: 'sortable',
          trashId: 'sortableTrash',
          max_wrong_lines: 3,
          can_indent: true,
          grader: 'ParsonsWidget._graders.LineBasedGrader',
          exec_limit: 2500,
          show_feedback: true
        }
      }
    };
  }  

  try {
    const response = await apiClient.get(`/api/problems/${encodeURIComponent(id)}`);
    
    // Validate response structure
    const problem = response.data;
    if (!problem || typeof problem !== 'object') {
      throw new Error('Invalid response format: Expected problem object');
    }
    
    // Validate required fields
    if (!problem.id || !problem.title || !problem.parsonsSettings) {
      throw new Error('Invalid problem data: Missing required fields (id, title, parsonsSettings)');
    }
    
    // Validate parsonsSettings structure
    if (!problem.parsonsSettings.initial || !problem.parsonsSettings.options) {
      throw new Error('Invalid parsonsSettings: Missing initial code or options');
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
      solution: solution.filter(line => typeof line === 'string')
    });
    
    // Validate response structure
    const result = response.data;
    if (typeof result !== 'object' || result === null) {
      throw new Error('Invalid response format from server');
    }
    
    // Ensure required fields exist
    const validatedResult = {
      isCorrect: Boolean(result.isCorrect),
      details: typeof result.details === 'string' ? result.details : 'No details provided',
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
        throw new Error('Unable to validate solution: Server unavailable and local validation failed');
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
      throw new Error(`Local validation failed with status: ${response.status}`);
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
      details: 'Unable to validate solution properly. Please check your code arrangement and try again when the connection is restored.',
    };
  }
};


export const generateFeedback = async (problemId: string, solution: string[]) => {
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
      userSolution: solution.filter(line => typeof line === 'string')
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
    const errorMessage = error.response?.data?.detail || error.response?.data?.message;
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
    "Consider the structure of your code. Are the blocks in the right order?",
    "Take a look at your solution - does each step logically follow from the previous one?",
    "What is the main goal of this program? Does your current arrangement achieve that goal?",
    "Think about the control structures (if statements, loops). Are they positioned correctly?",
    "Consider the indentation - does it reflect the logical structure of the program?",
    "Review each line: does it make sense in its current position?"
  ];
  
  // Simple analysis to provide more specific feedback
  const hasControlStructures = solution.some(line => 
    line.includes('if') || line.includes('for') || line.includes('while')
  );
  
  const hasFunction = solution.some(line => 
    line.includes('def ') || line.includes('return')
  );
  
  const hasLoop = solution.some(line => 
    line.includes('for ') || line.includes('while ')
  );
  
  let specificFeedback = '';
  
  if (hasFunction) {
    specificFeedback = "I notice you have function-related code. Remember that function definitions usually come before the code that calls them.";
  } else if (hasLoop) {
    specificFeedback = "I see you're working with loops. Think about what needs to be set up before the loop runs, and what happens inside the loop.";
  } else if (hasControlStructures) {
    specificFeedback = "Your code includes conditional statements. Consider what conditions need to be checked and in what order.";
  } else {
    specificFeedback = feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)];
  }
  
  return `${specificFeedback} (Note: This is basic feedback - connect to the server for AI-powered personalized guidance.)`;
};

export const generateProblem = async (sourceCode: string) => {
  try {
    const response = await apiClient.post('/api/problems/generate', {
      sourceCode
    });
    return response.data;
  } catch (error) {
    console.error('Error generating problem:', error);
    throw error;
  }
};

export default apiClient;