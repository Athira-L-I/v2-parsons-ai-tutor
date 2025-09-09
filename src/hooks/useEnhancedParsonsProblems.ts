/**
 * Enhanced useParsonsProblems hook with integrated error handling
 */

import { useState, useEffect, useCallback, useTransition } from 'react';
import { problemApiService } from '@/api';
import { ProblemResponse, PaginatedResponse } from '@/api/types';
import { useErrorHandler } from '@/errors/useErrorHandler';
import { AppError } from '@/errors/types';

export interface UseParsonsProblemsOptions {
  initialDifficulty?: string;
  initialTags?: string[];
  pageSize?: number;
}

export interface UseParsonsProblemsResult {
  problems: ProblemResponse[];
  isLoading: boolean;
  error: AppError | null;
  page: number;
  totalPages: number;
  totalProblems: number;
  fetchNextPage: () => void;
  fetchPreviousPage: () => void;
  filterByDifficulty: (difficulty: string) => void;
  filterByTags: (tags: string[]) => void;
  searchProblems: (query: string) => void;
  refreshProblems: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for fetching and managing Parsons problems with error handling
 */
export const useEnhancedParsonsProblems = ({
  initialDifficulty,
  initialTags,
  pageSize = 10,
}: UseParsonsProblemsOptions = {}): UseParsonsProblemsResult => {
  const [problems, setProblems] = useState<ProblemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProblems, setTotalProblems] = useState(0);
  const [difficulty, setDifficulty] = useState<string | undefined>(
    initialDifficulty
  );
  const [tags, setTags] = useState<string[] | undefined>(initialTags);
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);

  // Use our error handling hook
  const { error, handleError, clearError } = useErrorHandler('useParsonsProblems');

  // Use useTransition for non-blocking UI updates
  const [isPending, startTransition] = useTransition();

  /**
   * Fetch problems with current filters
   */
  const fetchProblems = useCallback(async () => {
    setIsLoading(true);
    clearError();

    try {
      let result: PaginatedResponse<ProblemResponse> | undefined;

      // Use search endpoint if there's a query
      if (searchQuery && searchQuery.trim().length > 0) {
        const response = await problemApiService.searchProblems(searchQuery, {
          difficulty,
          tags,
        });
        
        if (response && response.success && response.data) {
          result = response.data;
        }
      } else {
        // Regular paginated fetch
        const response = await problemApiService.getAllProblems({
          page,
          limit: pageSize,
          difficulty,
          tags,
        });
        
        if (response && response.success && response.data) {
          result = response.data;
        }
      }

      // Update state with new data
      startTransition(() => {
        if (result && result.items) {
          setProblems(result.items || []);
          setTotalPages(result.pagination?.totalPages || 1);
          setTotalProblems(result.pagination?.total || 0);
        } else {
          setProblems([]);
        }
      });
    } catch (err) {
      // Use our error handler
      handleError(err, 'fetchProblems', { 
        page, 
        pageSize, 
        difficulty, 
        tags, 
        searchQuery 
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, difficulty, tags, searchQuery, handleError, clearError]);

  // Initial load and whenever dependencies change
  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  /**
   * Navigate to next page
   */
  const fetchNextPage = useCallback(() => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
    }
  }, [page, totalPages]);

  /**
   * Navigate to previous page
   */
  const fetchPreviousPage = useCallback(() => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  }, [page]);

  /**
   * Filter by difficulty level
   */
  const filterByDifficulty = useCallback((newDifficulty: string) => {
    setDifficulty(newDifficulty);
    setPage(1); // Reset to first page
  }, []);

  /**
   * Filter by tags
   */
  const filterByTags = useCallback((newTags: string[]) => {
    setTags(newTags.length > 0 ? newTags : undefined);
    setPage(1); // Reset to first page
  }, []);

  /**
   * Search problems
   */
  const searchProblems = useCallback((query: string) => {
    setSearchQuery(query.trim() ? query : undefined);
    setPage(1); // Reset to first page
  }, []);

  /**
   * Force refresh current page
   */
  const refreshProblems = useCallback(async () => {
    await fetchProblems();
  }, [fetchProblems]);

  return {
    problems,
    isLoading: isLoading || isPending,
    error,
    page,
    totalPages,
    totalProblems,
    fetchNextPage,
    fetchPreviousPage,
    filterByDifficulty,
    filterByTags,
    searchProblems,
    refreshProblems,
    clearError
  };
};
