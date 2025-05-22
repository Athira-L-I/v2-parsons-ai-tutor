import { ParsonsSettings } from '@/@types/types';

// Keys for localStorage
const STORAGE_KEYS = {
  PROBLEM_PROGRESS: 'parsons_problem_progress',
  USER_SOLUTIONS: 'parsons_user_solutions',
  PROBLEM_ATTEMPTS: 'parsons_problem_attempts',
  COMPLETED_PROBLEMS: 'parsons_completed_problems',
  CURRENT_SESSION: 'parsons_current_session',
} as const;

// Types for stored data
export interface ProblemProgress {
  problemId: string;
  currentSolution: string[];
  attempts: number;
  isCompleted: boolean;
  lastAttemptTime: number;
  timeSpent: number; // in milliseconds
}

export interface UserSolution {
  problemId: string;
  solution: string[];
  isCorrect: boolean;
  timestamp: number;
}

export interface SessionData {
  sessionId: string;
  startTime: number;
  currentProblemId?: string;
  totalProblemsAttempted: number;
  totalTimeSpent: number;
}

export class LocalStorageService {
  private static instance: LocalStorageService;
  
  private constructor() {}
  
  static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  // Check if localStorage is available
  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Safe JSON parse with error handling
  private safeJsonParse<T>(data: string | null, defaultValue: T): T {
    if (!data) return defaultValue;
    
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      console.warn('Failed to parse localStorage data:', error);
      return defaultValue;
    }
  }

  // Safe localStorage operations
  private setItem(key: string, value: any): boolean {
    if (!this.isLocalStorageAvailable()) {
      console.warn('localStorage not available');
      return false;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  }

  private getItem<T>(key: string, defaultValue: T): T {
    if (!this.isLocalStorageAvailable()) {
      return defaultValue;
    }

    try {
      const data = localStorage.getItem(key);
      return this.safeJsonParse(data, defaultValue);
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return defaultValue;
    }
  }

  // Problem Progress Methods
  saveProblemProgress(progress: ProblemProgress): boolean {
    const allProgress = this.getAllProblemProgress();
    allProgress[progress.problemId] = progress;
    return this.setItem(STORAGE_KEYS.PROBLEM_PROGRESS, allProgress);
  }

  getProblemProgress(problemId: string): ProblemProgress | null {
    const allProgress = this.getAllProblemProgress();
    return allProgress[problemId] || null;
  }

  getAllProblemProgress(): Record<string, ProblemProgress> {
    return this.getItem(STORAGE_KEYS.PROBLEM_PROGRESS, {});
  }

  updateProblemSolution(problemId: string, solution: string[]): boolean {
    const existing = this.getProblemProgress(problemId) || {
      problemId,
      currentSolution: [],
      attempts: 0,
      isCompleted: false,
      lastAttemptTime: Date.now(),
      timeSpent: 0,
    };

    const updated: ProblemProgress = {
      ...existing,
      currentSolution: [...solution],
      lastAttemptTime: Date.now(),
    };

    return this.saveProblemProgress(updated);
  }

  incrementProblemAttempts(problemId: string): boolean {
    const existing = this.getProblemProgress(problemId);
    if (!existing) return false;

    const updated: ProblemProgress = {
      ...existing,
      attempts: existing.attempts + 1,
      lastAttemptTime: Date.now(),
    };

    return this.saveProblemProgress(updated);
  }

  markProblemCompleted(problemId: string, finalSolution: string[]): boolean {
    const existing = this.getProblemProgress(problemId) || {
      problemId,
      currentSolution: [],
      attempts: 0,
      isCompleted: false,
      lastAttemptTime: Date.now(),
      timeSpent: 0,
    };

    const updated: ProblemProgress = {
      ...existing,
      currentSolution: [...finalSolution],
      isCompleted: true,
      lastAttemptTime: Date.now(),
    };

    // Also add to completed problems list
    const completedProblems = this.getCompletedProblems();
    if (!completedProblems.includes(problemId)) {
      completedProblems.push(problemId);
      this.setItem(STORAGE_KEYS.COMPLETED_PROBLEMS, completedProblems);
    }

    return this.saveProblemProgress(updated);
  }

  // User Solutions Methods
  saveUserSolution(solution: UserSolution): boolean {
    const allSolutions = this.getAllUserSolutions();
    const key = `${solution.problemId}_${solution.timestamp}`;
    allSolutions[key] = solution;
    
    // Keep only the last 10 solutions per problem to prevent storage bloat
    this.cleanupOldSolutions(solution.problemId);
    
    return this.setItem(STORAGE_KEYS.USER_SOLUTIONS, allSolutions);
  }

  getUserSolutions(problemId: string): UserSolution[] {
    const allSolutions = this.getAllUserSolutions();
    return Object.values(allSolutions)
      .filter(solution => solution.problemId === problemId)
      .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  }

  getAllUserSolutions(): Record<string, UserSolution> {
    return this.getItem(STORAGE_KEYS.USER_SOLUTIONS, {});
  }

  private cleanupOldSolutions(problemId: string): void {
    const allSolutions = this.getAllUserSolutions();
    const problemSolutions = Object.entries(allSolutions)
      .filter(([_, solution]) => solution.problemId === problemId)
      .sort(([_, a], [__, b]) => b.timestamp - a.timestamp);

    // Keep only the most recent 10 solutions for this problem
    if (problemSolutions.length > 10) {
      const toDelete = problemSolutions.slice(10);
      toDelete.forEach(([key]) => {
        delete allSolutions[key];
      });
      this.setItem(STORAGE_KEYS.USER_SOLUTIONS, allSolutions);
    }
  }

  // Completed Problems Methods
  getCompletedProblems(): string[] {
    return this.getItem(STORAGE_KEYS.COMPLETED_PROBLEMS, []);
  }

  iseProblemCompleted(problemId: string): boolean {
    return this.getCompletedProblems().includes(problemId);
  }

  // Session Management
  startSession(): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionData: SessionData = {
      sessionId,
      startTime: Date.now(),
      totalProblemsAttempted: 0,
      totalTimeSpent: 0,
    };
    
    this.setItem(STORAGE_KEYS.CURRENT_SESSION, sessionData);
    return sessionId;
  }

  getCurrentSession(): SessionData | null {
    return this.getItem(STORAGE_KEYS.CURRENT_SESSION, null);
  }

  updateSession(updates: Partial<SessionData>): boolean {
    const current = this.getCurrentSession();
    if (!current) return false;

    const updated = { ...current, ...updates };
    return this.setItem(STORAGE_KEYS.CURRENT_SESSION, updated);
  }

  endSession(): boolean {
    const current = this.getCurrentSession();
    if (!current) return false;

    const endTime = Date.now();
    const totalTime = endTime - current.startTime;
    
    // Update session with final data
    const finalSession = {
      ...current,
      totalTimeSpent: totalTime,
    };

    // Could save to a sessions history here if needed
    
    // Clear current session
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    }
    
    return true;
  }

  // Statistics Methods
  getProgressStatistics() {
    const allProgress = this.getAllProblemProgress();
    const completedProblems = this.getCompletedProblems();
    
    const stats = {
      totalProblemsAttempted: Object.keys(allProgress).length,
      totalProblemsCompleted: completedProblems.length,
      totalAttempts: Object.values(allProgress).reduce((sum, p) => sum + p.attempts, 0),
      averageAttemptsPerProblem: 0,
      totalTimeSpent: Object.values(allProgress).reduce((sum, p) => sum + p.timeSpent, 0),
      completionRate: 0,
    };

    if (stats.totalProblemsAttempted > 0) {
      stats.averageAttemptsPerProblem = stats.totalAttempts / stats.totalProblemsAttempted;
      stats.completionRate = stats.totalProblemsCompleted / stats.totalProblemsAttempted;
    }

    return stats;
  }

  // Utility Methods
  exportAllData() {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    return {
      problemProgress: this.getAllProblemProgress(),
      userSolutions: this.getAllUserSolutions(),
      completedProblems: this.getCompletedProblems(),
      currentSession: this.getCurrentSession(),
      exportedAt: Date.now(),
    };
  }

  importData(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    try {
      if (data.problemProgress) {
        this.setItem(STORAGE_KEYS.PROBLEM_PROGRESS, data.problemProgress);
      }
      if (data.userSolutions) {
        this.setItem(STORAGE_KEYS.USER_SOLUTIONS, data.userSolutions);
      }
      if (data.completedProblems) {
        this.setItem(STORAGE_KEYS.COMPLETED_PROBLEMS, data.completedProblems);
      }
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  clearAllData(): boolean {
    if (!this.isLocalStorageAvailable()) {
      return false;
    }

    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  clearProblemData(problemId: string): boolean {
    try {
      // Remove from progress
      const allProgress = this.getAllProblemProgress();
      delete allProgress[problemId];
      this.setItem(STORAGE_KEYS.PROBLEM_PROGRESS, allProgress);

      // Remove from solutions
      const allSolutions = this.getAllUserSolutions();
      Object.keys(allSolutions).forEach(key => {
        if (allSolutions[key].problemId === problemId) {
          delete allSolutions[key];
        }
      });
      this.setItem(STORAGE_KEYS.USER_SOLUTIONS, allSolutions);

      // Remove from completed
      const completed = this.getCompletedProblems();
      const filtered = completed.filter(id => id !== problemId);
      this.setItem(STORAGE_KEYS.COMPLETED_PROBLEMS, filtered);

      return true;
    } catch (error) {
      console.error('Failed to clear problem data:', error);
      return false;
    }
  }
}

// Export singleton instance
export default LocalStorageService.getInstance();