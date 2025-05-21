// src/lib/api.ts
import axios from 'axios';
import { ParsonsSettings } from '@/@types/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

export const fetchProblems = async () => {
  try {
    const response = await apiClient.get('/api/problems');
    return response.data;
  } catch (error) {
    console.error('Error fetching problems:', error);
    throw error;
  }
};

export const fetchProblemById = async (id: string) => {
  // Demo mode for local development
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
    const response = await apiClient.get(`/api/problems/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching problem ${id}:`, error);
    throw error;
  }
};

export const checkSolution = async (problemId: string, solution: string[]) => {
  try {
    const response = await apiClient.post(`/api/solutions/validate`, {
      problemId,
      solution
    });
    return response.data;
  } catch (error) {
    console.error('Error checking solution:', error);
    throw error;
  }
};

export const generateFeedback = async (problemId: string, solution: string[]) => {
  try {
    const response = await apiClient.post(`/api/feedback`, {
      problemId,
      userSolution: solution
    });
    return response.data.feedback;
  } catch (error) {
    console.error('Error generating feedback:', error);
    throw error;
  }
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