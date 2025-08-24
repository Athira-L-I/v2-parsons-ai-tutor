/**
 * Updated Parsons Loader with modern dependency management
 * src/lib/parsonsLoader.ts
 * 
 * This file provides backwards compatibility with the old parsonsLoader API
 * while using the new dependency management system under the hood
 */

import { dependencyLoader } from '@/dependencies/DependencyLoader';
import { DEPENDENCY_MANIFEST } from '@/dependencies/manifest';

// Keep track of loading state for backward compatibility
let loadAttempts = 0;
let lastLoadError: Error | null = null;

/**
 * Loads all necessary dependencies for the Parsons widget
 * This function now delegates to the new dependency system
 */
export async function loadParsonsWidget(): Promise<void> {
  loadAttempts++;
  console.log(`🚀 Starting Parsons widget dependency loading (attempt ${loadAttempts})...`);

  try {
    const result = await dependencyLoader.loadAll();
    
    if (!result.success) {
      const error = new Error(`Failed to load dependencies: ${result.errors.join(', ')}`);
      lastLoadError = error;
      throw error;
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error(`❌ Error loading Parsons widget dependencies (attempt ${loadAttempts}):`, error);
    lastLoadError = error instanceof Error ? error : new Error(String(error));
    throw error;
  }
}

/**
 * Check if the Parsons widget is fully loaded and ready
 */
export function isParsonsWidgetLoaded(): boolean {
  const status = dependencyLoader.getStatus();
  const isLoaded = status.loaded.includes('parsonsWidget');
  
  if (!isLoaded) {
    return false;
  }
  
  // Additional verification
  return (
    typeof window !== 'undefined' &&
    typeof window.ParsonsWidget !== 'undefined' &&
    typeof window.jQuery !== 'undefined' &&
    typeof window.$ !== 'undefined' &&
    typeof window.$ === 'function' &&
    typeof window._ !== 'undefined' &&
    typeof window.LIS !== 'undefined'
  );
}

/**
 * Get the last error that occurred during loading
 */
export function getLastLoadError(): Error | null {
  return lastLoadError;
}

/**
 * Get detailed loading status for debugging
 */
export function getLoadingStatus() {
  const status = dependencyLoader.getStatus();
  
  return {
    isLoading: status.loading.length > 0,
    isLoaded: status.loaded.includes('parsonsWidget'),
    loadAttempts,
    lastError: lastLoadError,
    hasPromise: status.loading.includes('parsonsWidget'),
    dependencies: Object.entries(DEPENDENCY_MANIFEST).map(([key, dep]) => ({
      name: dep.name,
      basicCheck: status.loaded.includes(key),
      fullVerification: status.loaded.includes(key),
      src: dep.source.url || '',
    })),
    verification: status.loaded.includes('parsonsWidget') ? { 
      success: true,
      details: status.loaded.map(dep => `✅ ${dep}: Loaded`)
    } : null,
  };
}

/**
 * Reset the loader state (useful for testing or forcing reload)
 */
export function resetLoaderState(): void {
  console.log('🔄 Resetting Parsons loader state');
  dependencyLoader.reset();
  loadAttempts = 0;
  lastLoadError = null;
}

/**
 * Force reload of dependencies (useful for development)
 */
export async function forceReloadDependencies(): Promise<void> {
  console.log('🔄 Force reloading dependencies...');
  resetLoaderState();
  return loadParsonsWidget();
}

/**
 * Diagnose dependency issues and provide helpful error messages
 */
export function diagnoseDependencyIssues(): {
  issues: string[];
  suggestions: string[];
  canRetry: boolean;
} {
  const status = dependencyLoader.getStatus();
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check each dependency
  Object.entries(DEPENDENCY_MANIFEST).forEach(([key, dep]) => {
    if (!status.loaded.includes(key)) {
      issues.push(`${dep.name} is not loaded`);
      
      if (dep.source.url?.startsWith('/js/')) {
        suggestions.push(`Check that ${dep.source.url} exists in your public directory`);
        suggestions.push(`Verify the file is accessible at ${window.location.origin}${dep.source.url}`);
      } else if (dep.source.url?.startsWith('http')) {
        suggestions.push(`Check internet connection for external dependency: ${dep.name}`);
      }
    }
  });
  
  // Check for browser compatibility
  if (typeof window === 'undefined' || typeof Promise === 'undefined') {
    issues.push('Browser does not support required features');
    suggestions.push('Use a modern browser that supports ES6 features');
  }
  
  return { 
    issues, 
    suggestions, 
    canRetry: true 
  };
}

/**
 * Test all dependencies and log detailed results
 */
export function testDependencies(): void {
  console.log('🧪 Running comprehensive dependency tests...');

  const status = getLoadingStatus();
  console.log('📊 Current Status:', status);

  const diagnosis = diagnoseDependencyIssues();
  console.log('🔍 Diagnosis:', diagnosis);

  if (diagnosis.issues.length === 0) {
    console.log('✅ All dependency tests passed!');
  } else {
    console.log('❌ Dependency issues found:');
    diagnosis.issues.forEach((issue) => console.log(`  • ${issue}`));
    console.log('💡 Suggestions:');
    diagnosis.suggestions.forEach((suggestion) =>
      console.log(`  • ${suggestion}`)
    );
  }
}

// Note: These functions are already exported directly above
