import { Problem } from '@/types/domain';
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

export interface ProblemQueryOptions extends QueryOptions {
  difficulty?: string;
  language?: string;
  tags?: string[];
  userId?: string;
}

export class ProblemRepository implements Repository<Problem> {
  private apiClient: AxiosInstance;
  
  constructor(apiClient?: AxiosInstance) {
    this.apiClient = apiClient || createApiClient();
  }
  
  async findById(id: string): Promise<Problem | null> {
    try {
      const response = await this.apiClient.get(`/api/problems/${id}`);
      
      // Check if we got valid data
      if (!response.data || !response.data.parsonsSettings) {
        console.error('Invalid problem data received:', response.data);
        return null;
      }
      
      // Convert from legacy format to our new domain model
      return DataModelConverter.legacySettingsToProblem(
        response.data.parsonsSettings,
        {
          id: response.data.id,
          title: response.data.title,
          description: response.data.description || '',
        }
      );
    } catch (error) {
      console.error('Error fetching problem:', error);
      return null;
    }
  }

  async findAll(options: ProblemQueryOptions = {}): Promise<Problem[]> {
    try {
      // Build query params
      const params: Record<string, string> = {};
      
      if (options.difficulty) params.difficulty = options.difficulty;
      if (options.language) params.language = options.language;
      if (options.tags && options.tags.length > 0) params.tags = options.tags.join(',');
      if (options.userId) params.userId = options.userId;
      if (options.limit) params.limit = options.limit.toString();
      if (options.offset) params.offset = options.offset.toString();
      
      const response = await this.apiClient.get('/api/problems', { params });
      
      // Validate and convert each problem
      return response.data.map((problemData: Record<string, any>) => {
        if (!problemData.parsonsSettings) {
          console.warn(`Problem ${problemData.id} is missing parsonsSettings, skipping`);
          return null;
        }
        
        return DataModelConverter.legacySettingsToProblem(
          problemData.parsonsSettings,
          {
            id: problemData.id,
            title: problemData.title,
            description: problemData.description || '',
          }
        );
      }).filter(Boolean); // Filter out nulls
    } catch (error) {
      console.error('Error fetching problems:', error);
      return [];
    }
  }

  async create(problemData: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>): Promise<Problem> {
    try {
      // Convert to legacy format for API compatibility
      const legacySettings = DataModelConverter.problemToLegacySettings(
        problemData as Problem // Type cast since we're only missing the omitted fields
      );
      
      // Prepare payload for API
      const payload = {
        title: problemData.title,
        description: problemData.description,
        difficulty: problemData.difficulty,
        tags: problemData.tags,
        parsonsSettings: legacySettings
      };
      
      const response = await this.apiClient.post('/api/problems', payload);
      
      // Convert response back to our domain model
      return DataModelConverter.legacySettingsToProblem(
        response.data.parsonsSettings,
        {
          id: response.data.id,
          title: response.data.title,
          description: response.data.description,
        }
      );
    } catch (error) {
      console.error('Error creating problem:', error);
      throw new Error(`Failed to create problem: ${(error as Error).message}`);
    }
  }

  async update(id: string, updates: Partial<Problem>): Promise<Problem> {
    try {
      // First get the existing problem
      const existingProblem = await this.findById(id);
      if (!existingProblem) {
        throw new Error(`Problem with ID ${id} not found`);
      }
      
      // Merge updates with existing problem
      const updatedProblem = {
        ...existingProblem,
        ...updates,
        id, // Ensure ID doesn't change
      };
      
      // Convert to legacy format for API compatibility
      const legacySettings = DataModelConverter.problemToLegacySettings(updatedProblem);
      
      // Prepare payload
      const payload = {
        title: updatedProblem.title,
        description: updatedProblem.description,
        difficulty: updatedProblem.difficulty,
        tags: updatedProblem.tags,
        parsonsSettings: legacySettings
      };
      
      const response = await this.apiClient.put(`/api/problems/${id}`, payload);
      
      // Convert response back to our domain model
      return DataModelConverter.legacySettingsToProblem(
        response.data.parsonsSettings,
        {
          id: response.data.id,
          title: response.data.title,
          description: response.data.description,
        }
      );
    } catch (error) {
      console.error(`Error updating problem ${id}:`, error);
      throw new Error(`Failed to update problem: ${(error as Error).message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.apiClient.delete(`/api/problems/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting problem ${id}:`, error);
      return false;
    }
  }

  // Problem-specific methods
  async findByDifficulty(difficulty: string): Promise<Problem[]> {
    return this.findAll({ filters: { difficulty } });
  }
}
