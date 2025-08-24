import { Solution, ValidationResult, BlockArrangement } from '@/types/domain';
import { Repository, QueryOptions } from './Repository';
import { DataModelConverter } from '@/types/legacy';
import axios, { AxiosInstance } from 'axios';

// This will allow us to easily mock the client in tests
const createApiClient = (): AxiosInstance => {
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
  });
};

export interface SolutionQueryOptions extends QueryOptions {
  problemId?: string;
  userId?: string;
  isCorrect?: boolean;
}

export class SolutionRepository implements Repository<Solution> {
  private apiClient: AxiosInstance;

  constructor(apiClient?: AxiosInstance) {
    this.apiClient = apiClient || createApiClient();
  }

  async findById(id: string): Promise<Solution | null> {
    try {
      const response = await this.apiClient.get(`/api/solutions/${id}`);

      // Type check and convert if needed
      if (!response.data) {
        return null;
      }

      // Return the data
      return response.data as Solution;
    } catch (error) {
      console.error(`Error fetching solution ${id}:`, error);
      return null;
    }
  }

  async findAll(options: SolutionQueryOptions = {}): Promise<Solution[]> {
    try {
      // Build query params
      const params: Record<string, string> = {};

      if (options.problemId) params.problemId = options.problemId;
      if (options.userId) params.userId = options.userId;
      if (options.isCorrect !== undefined)
        params.isCorrect = options.isCorrect.toString();
      if (options.limit) params.limit = options.limit.toString();
      if (options.offset) params.offset = options.offset.toString();

      const response = await this.apiClient.get('/api/solutions', { params });

      // Return solutions
      return response.data as Solution[];
    } catch (error) {
      console.error('Error fetching solutions:', error);
      return [];
    }
  }

  async create(
    solutionData: Omit<Solution, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Solution> {
    try {
      // Create solution
      const response = await this.apiClient.post(
        '/api/solutions',
        solutionData
      );
      return response.data;
    } catch (error) {
      console.error('Error creating solution:', error);
      throw new Error(`Failed to create solution: ${(error as Error).message}`);
    }
  }

  async update(id: string, updates: Partial<Solution>): Promise<Solution> {
    try {
      const response = await this.apiClient.put(
        `/api/solutions/${id}`,
        updates
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating solution ${id}:`, error);
      throw new Error(`Failed to update solution: ${(error as Error).message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.apiClient.delete(`/api/solutions/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting solution ${id}:`, error);
      return false;
    }
  }

  // Solution-specific methods

  /**
   * Validate a solution without saving it
   */
  async validate(
    problemId: string,
    arrangement: BlockArrangement
  ): Promise<ValidationResult> {
    try {
      // Get the blocks from the problem to get their content
      // For now, we'll just map the blocks and use an empty string if we can't find the content
      const solution = arrangement.blocks.map((block) => {
        // Calculate indentation
        const indentStr = ' '.repeat(block.indentationLevel * 4);
        // Since we don't have direct access to block content here,
        // we'd need to look it up from problem definition
        // For now, we'll just send the indentation with an empty placeholder
        // The backend should use blockId to identify the actual content
        return `${indentStr}PLACEHOLDER_${block.blockId}`;
      });

      const response = await this.apiClient.post('/api/solutions/validate', {
        problemId,
        solution,
        solutionContext: {
          attemptNumber: arrangement.attemptNumber || 1,
          timestamp: arrangement.timestamp,
          blockArrangement: arrangement, // Include the full block arrangement for additional context
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error validating solution:', error);
      throw new Error(
        `Failed to validate solution: ${(error as Error).message}`
      );
    }
  }

  /**
   * Submit a final solution for a problem
   */
  async submit(
    problemId: string,
    arrangement: BlockArrangement,
    sessionId?: string
  ): Promise<Solution> {
    try {
      const response = await this.apiClient.post('/api/solutions/submit', {
        problemId,
        arrangement,
        sessionId,
      });

      return response.data.solution;
    } catch (error) {
      console.error('Error submitting solution:', error);
      throw new Error(`Failed to submit solution: ${(error as Error).message}`);
    }
  }

  /**
   * Find all solutions for a specific problem
   */
  async findByProblemId(problemId: string): Promise<Solution[]> {
    return this.findAll({ problemId });
  }

  /**
   * Find all solutions submitted by a user
   */
  async findByUserId(userId: string): Promise<Solution[]> {
    return this.findAll({ userId });
  }
}
