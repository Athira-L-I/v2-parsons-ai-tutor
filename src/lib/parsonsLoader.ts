/**
 * Fixed Parsons Loader with improved dependency management
 * src/lib/parsonsLoader.ts
 */

// Keep track of loading state
let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

// Dependencies required by the Parsons widget in correct order
const dependencies = [
  // JQuery (must be first)
  {
    src: 'https://code.jquery.com/jquery-3.6.0.min.js',
    check: () => typeof window.jQuery !== 'undefined',
  },
  // jQuery UI (must come after jQuery)
  {
    src: 'https://code.jquery.com/ui/1.13.2/jquery-ui.min.js',
    check: () =>
      typeof window.jQuery !== 'undefined' &&
      typeof window.jQuery.ui !== 'undefined',
  },
  // Lodash
  {
    src: 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js',
    check: () => typeof window._ !== 'undefined',
  },
  // LIS module (must come before parsons.js)
  {
    src: '/js/lis.js',
    check: () => typeof window.LIS !== 'undefined',
  },
  // Parsons widget (must be last)
  {
    src: '/js/parsons.js',
    check: () => typeof window.ParsonsWidget !== 'undefined',
  },
];

// CSS dependencies
const cssDependencies = [
  'https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css',
];

/**
 * Loads a JavaScript file and verifies it loaded correctly
 */
function loadScript(src: string, check?: () => boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (check && check()) {
      console.log(`✓ ${src} already loaded`);
      resolve();
      return;
    }

    console.log(`📥 Loading ${src}...`);

    const script = document.createElement('script');
    script.src = src;
    script.async = false; // Important: load scripts in order

    script.onload = () => {
      console.log(`✓ ${src} loaded successfully`);

      // Verify the script loaded what we expected
      if (check && !check()) {
        reject(new Error(`Script loaded but verification failed: ${src}`));
        return;
      }

      resolve();
    };

    script.onerror = () => {
      console.error(`❌ Failed to load ${src}`);
      reject(new Error(`Failed to load script: ${src}`));
    };

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

    link.onload = () => {
      console.log(`✓ CSS ${href} loaded successfully`);
      resolve();
    };

    link.onerror = () => {
      console.error(`❌ Failed to load CSS ${href}`);
      reject(new Error(`Failed to load CSS: ${href}`));
    };

    document.head.appendChild(link);
  });
}

/**
 * Loads all necessary dependencies for the Parsons widget
 */
export async function loadParsonsWidget(): Promise<void> {
  console.log('🚀 Starting Parsons widget dependency loading...');

  // Return existing promise if already loading
  if (isLoading && loadPromise) {
    console.log('⏳ Already loading, returning existing promise');
    return loadPromise;
  }

  // Return resolved promise if already loaded
  if (isLoaded) {
    console.log('✅ Already loaded, returning immediately');
    return Promise.resolve();
  }

  isLoading = true;

  loadPromise = (async () => {
    try {
      // Load CSS first
      console.log('📋 Loading CSS dependencies...');
      await Promise.all(cssDependencies.map((css) => loadCSS(css)));

      // Load JavaScript dependencies in order
      console.log('📋 Loading JavaScript dependencies in order...');
      for (const dep of dependencies) {
        await loadScript(dep.src, dep.check);
        // Small delay to ensure script execution completes
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Final verification
      console.log('🔍 Performing final verification...');
      const allLoaded = dependencies.every((dep) => dep.check());

      if (!allLoaded) {
        throw new Error(
          'Final verification failed - not all dependencies loaded correctly'
        );
      }

      // Additional verification for jQuery UI sortable
      if (!window.jQuery.fn.sortable) {
        throw new Error('jQuery UI sortable not available');
      }

      isLoaded = true;
      isLoading = false;

      console.log('✅ All Parsons widget dependencies loaded successfully!');
      console.log('📊 Loaded dependencies:', {
        jQuery: typeof window.jQuery,
        jQueryUI: typeof window.jQuery.ui,
        lodash: typeof window._,
        LIS: typeof window.LIS,
        ParsonsWidget: typeof window.ParsonsWidget,
        sortable: typeof window.jQuery.fn.sortable,
      });
    } catch (error) {
      console.error('❌ Error loading Parsons widget dependencies:', error);
      isLoading = false;
      loadPromise = null;
      throw error;
    }
  })();

  return loadPromise;
}

/**
 * Check if the Parsons widget is fully loaded and ready
 */
export function isParsonsWidgetLoaded(): boolean {
  const loaded =
    isLoaded &&
    typeof window.ParsonsWidget !== 'undefined' &&
    typeof window.jQuery !== 'undefined' &&
    typeof window.jQuery.ui !== 'undefined' &&
    typeof window.jQuery.fn.sortable === 'function' &&
    typeof window._ !== 'undefined' &&
    typeof window.LIS !== 'undefined';

  if (!loaded && isLoaded) {
    console.warn(
      '⚠️ isLoaded is true but dependencies not available - resetting state'
    );
    isLoaded = false;
  }

  return loaded;
}

/**
 * Reset the loader state (useful for testing)
 */
export function resetLoaderState(): void {
  console.log('🔄 Resetting Parsons loader state');
  isLoading = false;
  isLoaded = false;
  loadPromise = null;
}

// Declare global types
declare global {
  interface Window {
    ParsonsWidget: any;
    jQuery: any;
    $: any;
    _: any;
    LIS: any;
  }
}
