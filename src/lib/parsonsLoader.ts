/**
 * Updated Parsons Loader with comprehensive dependency management
 * src/lib/parsonsLoader.ts
 */

// Keep track of loading state
let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;
let lastLoadError: Error | null = null;
let loadAttempts = 0;

// Dependencies required by the Parsons widget in correct order
const dependencies = [
  // JQuery (must be first)
  {
    name: 'jQuery',
    src: 'https://code.jquery.com/jquery-3.6.0.min.js',
    check: () => typeof window.jQuery !== 'undefined',
    verify: () => {
      return (
        typeof window.jQuery !== 'undefined' &&
        typeof window.jQuery.fn !== 'undefined' &&
        window.jQuery.fn.jquery !== undefined
      );
    },
  },
  // jQuery UI (must come after jQuery)
  {
    name: 'jQuery UI',
    src: 'https://code.jquery.com/ui/1.13.2/jquery-ui.min.js',
    check: () =>
      typeof window.jQuery !== 'undefined' &&
      typeof window.jQuery.ui !== 'undefined' &&
      typeof window.jQuery.fn.sortable === 'function',
    verify: () => {
      return (
        typeof window.jQuery !== 'undefined' &&
        typeof window.jQuery.ui !== 'undefined' &&
        typeof window.jQuery.fn.sortable === 'function' &&
        typeof window.jQuery.ui.sortable !== 'undefined'
      );
    },
  },
  // Lodash
  {
    name: 'Lodash',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js',
    check: () => typeof window._ !== 'undefined',
    verify: () => {
      return (
        typeof window._ !== 'undefined' &&
        typeof window._.toArray === 'function' &&
        typeof window._.filter === 'function' &&
        typeof window._.map === 'function' &&
        typeof window._.max === 'function' &&
        typeof window._.last === 'function' &&
        typeof window._.difference === 'function'
      );
    },
  },
  // LIS module (must come before parsons.js)
  {
    name: 'LIS',
    src: '/js/lis.js',
    check: () => typeof window.LIS !== 'undefined',
    verify: () => {
      return (
        typeof window.LIS !== 'undefined' &&
        typeof window.LIS.patience_sort === 'function' &&
        typeof window.LIS.find_lises === 'function' &&
        typeof window.LIS.best_lise === 'function' &&
        typeof window.LIS.best_lise_inverse === 'function' &&
        typeof window.LIS.best_lise_inverse_indices === 'function'
      );
    },
  },
  // Parsons widget (must be last)
  {
    name: 'ParsonsWidget',
    src: '/js/parsons.js',
    check: () => typeof window.ParsonsWidget !== 'undefined',
    verify: () => {
      return (
        typeof window.ParsonsWidget !== 'undefined' &&
        typeof window.ParsonsWidget === 'function' &&
        window.ParsonsWidget._graders !== undefined
      );
    },
  },
];

// CSS dependencies
const cssDependencies = [
  'https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css',
];

/**
 * Loads a JavaScript file and verifies it loaded correctly
 */
function loadScript(dep: (typeof dependencies)[0]): Promise<void> {
  return new Promise((resolve, reject) => {
    const { name, src, check, verify } = dep;

    // Check if already loaded and verified
    if (verify && verify()) {
      console.log(`✓ ${name} already loaded and verified`);
      resolve();
      return;
    }

    console.log(`📥 Loading ${name} from ${src}...`);

    const script = document.createElement('script');
    script.src = src;
    script.async = false; // Important: load scripts in order
    script.crossOrigin = 'anonymous'; // Help with CORS issues

    script.onload = () => {
      console.log(`✓ ${name} script loaded from ${src}`);

      // Give script time to execute and set up globals
      setTimeout(() => {
        // First check if basic globals are available
        if (check && !check()) {
          const error = new Error(
            `${name} script loaded but basic check failed: expected globals not found`
          );
          console.error(`❌ ${name} basic check failed:`, error);
          reject(error);
          return;
        }

        // Then do comprehensive verification
        if (verify && !verify()) {
          const error = new Error(
            `${name} script loaded but comprehensive verification failed: some methods/properties missing`
          );
          console.error(`❌ ${name} verification failed:`, error);
          reject(error);
          return;
        }

        console.log(`✅ ${name} loaded and fully verified`);
        resolve();
      }, 150); // Wait 150ms for script execution and setup
    };

    script.onerror = (event) => {
      const error = new Error(`Failed to load ${name} from ${src}`);
      console.error(`❌ Script loading failed for ${name}:`, error, event);
      reject(error);
    };

    // Handle timeout
    setTimeout(() => {
      if (!verify || !verify()) {
        const error = new Error(
          `${name} loading timeout: script took too long to load or initialize`
        );
        console.error(`⏰ ${name} timeout:`, error);
        reject(error);
      }
    }, 10000); // 10 second timeout

    document.head.appendChild(script);
  });
}

/**
 * Loads CSS file
 */
function loadCSS(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) {
      console.log(`✓ CSS ${href} already loaded`);
      resolve();
      return;
    }

    console.log(`📥 Loading CSS ${href}...`);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.crossOrigin = 'anonymous'; // Help with CORS issues

    link.onload = () => {
      console.log(`✓ CSS ${href} loaded successfully`);
      resolve();
    };

    link.onerror = (event) => {
      const error = new Error(`Failed to load CSS: ${href}`);
      console.error(`❌ CSS loading failed for ${href}:`, error, event);
      reject(error);
    };

    document.head.appendChild(link);
  });
}

/**
 * Performs comprehensive verification of all dependencies
 */
function performFinalVerification(): { success: boolean; details: string[] } {
  console.log('🔍 Performing comprehensive dependency verification...');

  const results: string[] = [];
  let allPassed = true;

  for (const dep of dependencies) {
    const basicCheck = dep.check();
    const fullVerification = dep.verify();

    if (basicCheck && fullVerification) {
      results.push(`✅ ${dep.name}: Fully verified and ready`);
    } else if (basicCheck && !fullVerification) {
      results.push(
        `⚠️ ${dep.name}: Basic check passed but verification failed - some features missing`
      );
      allPassed = false;
    } else {
      results.push(`❌ ${dep.name}: Not available`);
      allPassed = false;
    }
  }

  // Additional comprehensive checks
  try {
    // Test jQuery UI sortable specifically
    if (window.jQuery && window.jQuery.fn.sortable) {
      const $testDiv = window.jQuery('<div>');
      $testDiv.sortable();
      $testDiv.sortable('destroy');
      results.push(`✅ jQuery UI Sortable: Functional test passed`);
    } else {
      results.push(`❌ jQuery UI Sortable: Not available or non-functional`);
      allPassed = false;
    }

    // Test LIS algorithms
    if (window.LIS && typeof window.LIS.patience_sort === 'function') {
      const testResult = window.LIS.patience_sort([1, 2, 3]);
      if (Array.isArray(testResult)) {
        results.push(`✅ LIS Algorithms: Functional test passed`);
      } else {
        results.push(`❌ LIS Algorithms: Function calls failed`);
        allPassed = false;
      }
    } else {
      results.push(`❌ LIS Algorithms: Not available`);
      allPassed = false;
    }

    // Test ParsonsWidget constructor
    if (window.ParsonsWidget && typeof window.ParsonsWidget === 'function') {
      // Test that we can create an instance (without DOM)
      try {
        const testOptions = { sortableId: 'test', trashId: 'test2' };
        const testWidget = new window.ParsonsWidget(testOptions);
        if (testWidget && typeof testWidget.init === 'function') {
          results.push(`✅ ParsonsWidget Constructor: Functional test passed`);
        } else {
          results.push(
            `❌ ParsonsWidget Constructor: Created but missing methods`
          );
          allPassed = false;
        }
      } catch (constructorError) {
        results.push(
          `❌ ParsonsWidget Constructor: Failed to create instance - ${constructorError}`
        );
        allPassed = false;
      }
    } else {
      results.push(`❌ ParsonsWidget Constructor: Not available`);
      allPassed = false;
    }
  } catch (testError) {
    results.push(`❌ Functional Testing: Error during tests - ${testError}`);
    allPassed = false;
  }

  console.log('📊 Comprehensive Verification Results:');
  results.forEach((result) => console.log(`  ${result}`));

  if (allPassed) {
    console.log('🎉 All dependencies verified and fully functional!');
  } else {
    console.error('❌ Some dependencies failed comprehensive verification');
  }

  return { success: allPassed, details: results };
}

/**
 * Loads all necessary dependencies for the Parsons widget
 */
export async function loadParsonsWidget(): Promise<void> {
  loadAttempts++;
  console.log(
    `🚀 Starting Parsons widget dependency loading (attempt ${loadAttempts})...`
  );

  // Return existing promise if already loading
  if (isLoading && loadPromise) {
    console.log('⏳ Already loading, returning existing promise');
    return loadPromise;
  }

  // Quick check if already loaded and verified
  if (isLoaded) {
    const verification = performFinalVerification();
    if (verification.success) {
      console.log('✅ Already loaded and verified, returning immediately');
      return Promise.resolve();
    } else {
      console.warn(
        '⚠️ Was marked as loaded but verification failed, reloading...'
      );
      isLoaded = false;
    }
  }

  isLoading = true;
  lastLoadError = null;

  loadPromise = (async () => {
    try {
      console.log('📋 Step 1: Loading CSS dependencies...');
      await Promise.all(cssDependencies.map((css) => loadCSS(css)));
      console.log('✅ All CSS dependencies loaded');

      console.log('📋 Step 2: Loading JavaScript dependencies in sequence...');
      for (let i = 0; i < dependencies.length; i++) {
        const dep = dependencies[i];
        console.log(
          `📦 Loading dependency ${i + 1}/${dependencies.length}: ${dep.name}`
        );

        await loadScript(dep);

        // Small delay to ensure script execution completes
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log(
          `✅ Dependency ${i + 1}/${dependencies.length} ready: ${dep.name}`
        );
      }

      console.log('🔍 Step 3: Performing final comprehensive verification...');
      const verification = performFinalVerification();

      if (!verification.success) {
        throw new Error(
          `Final verification failed:\n${verification.details
            .filter((d) => d.includes('❌'))
            .join('\n')}`
        );
      }

      isLoaded = true;
      isLoading = false;

      console.log(
        '🎉 All Parsons widget dependencies loaded and comprehensively verified!'
      );
      console.log('📊 Final dependency state:', {
        jQuery: window.jQuery?.fn?.jquery || 'N/A',
        jQueryUI: window.jQuery?.ui?.version || 'N/A',
        lodash: window._?.VERSION || 'Available',
        LIS: typeof window.LIS,
        ParsonsWidget: typeof window.ParsonsWidget,
        totalAttempts: loadAttempts,
      });
    } catch (error) {
      console.error(
        `❌ Error loading Parsons widget dependencies (attempt ${loadAttempts}):`,
        error
      );
      isLoading = false;
      isLoaded = false;
      loadPromise = null;
      lastLoadError = error instanceof Error ? error : new Error(String(error));
      throw error;
    }
  })();

  return loadPromise;
}

/**
 * Check if the Parsons widget is fully loaded and ready
 */
export function isParsonsWidgetLoaded(): boolean {
  // Quick basic check first
  const basicCheck =
    isLoaded &&
    typeof window !== 'undefined' &&
    typeof window.ParsonsWidget !== 'undefined' &&
    typeof window.jQuery !== 'undefined' &&
    typeof window.jQuery?.ui !== 'undefined' &&
    typeof window.jQuery?.fn?.sortable === 'function' &&
    typeof window._ !== 'undefined' &&
    typeof window.LIS !== 'undefined';

  if (!basicCheck) {
    if (isLoaded) {
      console.warn(
        '⚠️ isParsonsWidgetLoaded: isLoaded is true but basic check failed - resetting state'
      );
      isLoaded = false;
    }
    return false;
  }

  // Comprehensive verification if basic check passes
  const verification = performFinalVerification();

  if (!verification.success && isLoaded) {
    console.warn(
      '⚠️ isParsonsWidgetLoaded: Basic check passed but comprehensive verification failed - resetting state'
    );
    isLoaded = false;
    return false;
  }

  return verification.success;
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
  return {
    isLoading,
    isLoaded,
    loadAttempts,
    lastError: lastLoadError,
    hasPromise: loadPromise !== null,
    dependencies: dependencies.map((dep) => ({
      name: dep.name,
      basicCheck: dep.check(),
      fullVerification: dep.verify(),
      src: dep.src,
    })),
    verification: isLoaded ? performFinalVerification() : null,
  };
}

/**
 * Reset the loader state (useful for testing or forcing reload)
 */
export function resetLoaderState(): void {
  console.log('🔄 Resetting Parsons loader state');
  isLoading = false;
  isLoaded = false;
  loadPromise = null;
  lastLoadError = null;
  loadAttempts = 0;
}

/**
 * Force reload of dependencies (useful for development)
 */
export async function forceReloadDependencies(): Promise<void> {
  console.log('🔄 Force reloading dependencies...');

  resetLoaderState();

  // Remove existing script tags
  dependencies.forEach((dep) => {
    const existingScript = document.querySelector(`script[src="${dep.src}"]`);
    if (existingScript) {
      console.log(`🗑️ Removing existing script: ${dep.name}`);
      existingScript.remove();
    }
  });

  // Remove existing CSS
  cssDependencies.forEach((href) => {
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) {
      console.log(`🗑️ Removing existing CSS: ${href}`);
      existingLink.remove();
    }
  });

  // Clear globals (be careful with this)
  try {
    if (window.ParsonsWidget) {
      delete (window as any).ParsonsWidget;
    }
    if (window.LIS) {
      delete (window as any).LIS;
    }
  } catch (clearError) {
    console.warn('⚠️ Could not clear some globals:', clearError);
  }

  // Wait a bit for cleanup
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Reload
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
  const issues: string[] = [];
  const suggestions: string[] = [];
  let canRetry = true;

  // Check for common issues
  dependencies.forEach((dep) => {
    if (!dep.check()) {
      issues.push(`${dep.name} is not loaded`);

      if (dep.src.startsWith('/js/')) {
        suggestions.push(
          `Check that ${dep.src} exists in your public directory`
        );
        suggestions.push(
          `Verify the file is accessible at ${window.location.origin}${dep.src}`
        );
      } else {
        suggestions.push(
          `Check internet connection for external dependency: ${dep.name}`
        );
      }
    } else if (!dep.verify()) {
      issues.push(`${dep.name} is partially loaded but missing some features`);
      suggestions.push(
        `${dep.name} may be corrupted or incomplete - try reloading`
      );
    }
  });

  // Check for browser compatibility
  if (typeof Promise === 'undefined') {
    issues.push('Browser does not support Promises');
    suggestions.push('Use a modern browser that supports ES6 features');
    canRetry = false;
  }

  // Check for network issues
  if (loadAttempts > 3) {
    issues.push('Multiple loading attempts have failed');
    suggestions.push('Check network connectivity and firewall settings');
    suggestions.push('Try refreshing the page or clearing browser cache');
  }

  // Check for specific missing files
  const missingLocalFiles = dependencies
    .filter((dep) => dep.src.startsWith('/js/') && !dep.check())
    .map((dep) => dep.src);

  if (missingLocalFiles.length > 0) {
    issues.push(`Missing local files: ${missingLocalFiles.join(', ')}`);
    suggestions.push(
      'Download the missing files from the Runestone Interactive project'
    );
    suggestions.push('For lis.js, you can use a minimal version');
    suggestions.push(
      'For parsons.js, download from: https://github.com/RunestoneInteractive/RunestoneComponents'
    );
  }

  return { issues, suggestions, canRetry };
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

// Declare global types for TypeScript
declare global {
  interface Window {
    ParsonsWidget: any;
    jQuery: any;
    $: any;
    _: any;
    LIS: any;
  }
}

// Export additional utilities for debugging
export { diagnoseDependencyIssues, testDependencies, forceReloadDependencies };
