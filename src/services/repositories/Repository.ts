/**
 * Generic repository interface for data access
 */

export interface Repository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: ID, updates: Partial<T>): Promise<T>;
  delete(id: ID): Promise<boolean>;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

export interface RepositoryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    totalCount?: number;
    hasMore?: boolean;
  };
}
