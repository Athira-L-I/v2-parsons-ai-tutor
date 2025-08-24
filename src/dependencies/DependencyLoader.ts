/**
 * Modern dependency loader using dynamic imports and proper error handling
 * Replaces the complex parsonsLoader.ts
 */

import { DependencyDefinition, DependencySource, DEPENDENCY_MANIFEST, CSS_DEPENDENCIES } from './manifest';

export interface LoadingOptions {
  timeout?: number;
  retries?: number;
  fallbackEnabled?: boolean;
  cache?: boolean;
}

export interface LoadingResult {
  success: boolean;
  loaded: string[];
  failed: string[];
  errors: string[];
  duration: number;
}

export class DependencyLoader {
  private loaded = new Set<string>();
  private loading = new Map<string, Promise<void>>();
  private cache = new Map<string, unknown>();

  constructor(private options: LoadingOptions = {}) {
    this.options = {
      timeout: 10000,
      retries: 3,
      fallbackEnabled: true,
      cache: true,
      ...options,
    };
  }

  /**
   * Load all required dependencies
   */
  async loadAll(): Promise<LoadingResult> {
    const startTime = Date.now();
    const result: LoadingResult = {
      success: true,
      loaded: [],
      failed: [],
      errors: [],
      duration: 0,
    };

    try {
      console.log('🔄 Starting dependency loading...');

      // Load CSS first
      await this.loadCSS();

      // Get dependency load order
      const loadOrder = this.resolveDependencyOrder();
      console.log('📋 Dependency load order:', loadOrder);

      // Load dependencies in order
      for (const depName of loadOrder) {
        try {
          await this.loadDependency(depName);
          result.loaded.push(depName);
          console.log(`✅ Loaded: ${depName}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result.failed.push(depName);
          result.errors.push(`${depName}: ${errorMessage}`);
          console.error(`❌ Failed to load: ${depName}`, error);
          
          // If this is a required dependency, fail the whole process
          const dep = DEPENDENCY_MANIFEST[depName];
          if (dep?.required) {
            result.success = false;
          }
        }
      }

      // Verify all dependencies are working
      const verificationResult = await this.verifyDependencies();
      if (!verificationResult.success) {
        result.success = false;
        result.errors.push(...verificationResult.errors);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.success = false;
      result.errors.push(`Loading process failed: ${errorMessage}`);
    }

    result.duration = Date.now() - startTime;
    console.log(`🏁 Dependency loading completed in ${result.duration}ms. Success: ${result.success}`);

    return result;
  }

  /**
   * Load a specific dependency
   */
  async loadDependency(name: string): Promise<void> {
    // Return if already loaded
    if (this.loaded.has(name)) {
      return;
    }

    // Return existing loading promise if in progress
    if (this.loading.has(name)) {
      return this.loading.get(name)!;
    }

    const dependency = DEPENDENCY_MANIFEST[name];
    if (!dependency) {
      throw new Error(`Unknown dependency: ${name}`);
    }

    // Check load condition
    if (dependency.loadCondition && !dependency.loadCondition()) {
      throw new Error(`Load condition not met for ${name}`);
    }

    // Load dependencies first
    if (dependency.dependencies) {
      for (const depName of dependency.dependencies) {
        await this.loadDependency(depName);
      }
    }

    // Create loading promise
    const loadingPromise = this.loadDependencyScript(dependency);
    this.loading.set(name, loadingPromise);

    try {
      await loadingPromise;
      
      // Run initialization function if provided
      if (dependency.initFunction) {
        await dependency.initFunction();
      }

      this.loaded.add(name);
      this.loading.delete(name);

    } catch (error) {
      this.loading.delete(name);
      throw error;
    }
  }

  /**
   * Check if dependencies are loaded and working
   */
  async verifyDependencies(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check jQuery
    if (!window.$ || !window.jQuery) {
      errors.push('jQuery not available');
    } else if (!window.$.fn || !window.$.fn.jquery) {
      errors.push('jQuery not properly initialized');
    }

    // Check jQuery UI
    if (!window.$.ui || !window.$.fn.sortable) {
      errors.push('jQuery UI not available or sortable not initialized');
    }

    // Check Lodash
    if (!window._) {
      errors.push('Lodash not available');
    } else if (typeof window._.each !== 'function') {
      errors.push('Lodash not properly initialized');
    }

    // Check LIS
    if (!window.LIS) {
      errors.push('LIS (Line Item Sorter) not available');
    }

    // Check ParsonsWidget
    if (!window.ParsonsWidget) {
      errors.push('ParsonsWidget not available');
    } else {
      // Test ParsonsWidget instantiation
      try {
        const testWidget = new window.ParsonsWidget({
          sortableId: 'test',
          trashId: 'test-trash',
        });
        if (!testWidget) {
          errors.push('ParsonsWidget cannot be instantiated');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`ParsonsWidget instantiation failed: ${errorMessage}`);
      }
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }

  /**
   * Get loading status for debugging
   */
  getStatus() {
    return {
      loaded: Array.from(this.loaded),
      loading: Array.from(this.loading.keys()),
      cache: this.options.cache ? this.cache.size : 0,
    };
  }

  /**
   * Reset loader state
   */
  reset() {
    this.loaded.clear();
    this.loading.clear();
    if (this.options.cache) {
      this.cache.clear();
    }
  }

  private async loadCSS(): Promise<void> {
    const promises = CSS_DEPENDENCIES.map(href => this.loadCSSFile(href));
    await Promise.all(promises);
  }

  private async loadCSSFile(href: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (document.querySelector(`link[href="${href}"]`)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
      
      document.head.appendChild(link);
    });
  }

  private resolveDependencyOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (name: string) => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }

      visiting.add(name);
      
      const dep = DEPENDENCY_MANIFEST[name];
      if (dep?.dependencies) {
        for (const depName of dep.dependencies) {
          visit(depName);
        }
      }

      visiting.delete(name);
      visited.add(name);
      order.push(name);
    };

    // Visit all dependencies
    for (const name of Object.keys(DEPENDENCY_MANIFEST)) {
      visit(name);
    }

    return order;
  }

  private async loadDependencyScript(dependency: DependencyDefinition): Promise<void> {
    let lastError: Error | null = null;

    // Try main source
    try {
      await this.loadScript(dependency.source);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Failed to load ${dependency.name} from main source:`, error);
    }

    // Try fallback if available and enabled
    if (this.options.fallbackEnabled && dependency.source.fallback) {
      try {
        console.log(`Trying fallback for ${dependency.name}...`);
        await this.loadScript(dependency.source.fallback);
        return;
      } catch (error) {
        console.warn(`Failed to load ${dependency.name} from fallback:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    throw lastError || new Error(`Failed to load ${dependency.name}`);
  }

  private async loadScript(source: DependencySource): Promise<void> {
    switch (source.type) {
      case 'cdn':
      case 'local':
        return this.loadScriptFromURL(source.url!);
      
      case 'dynamic':
        return this.loadDynamicModule(source.module!);
        
      default:
        throw new Error(`Unknown source type: ${source.type}`);
    }
  }

  private async loadScriptFromURL(url: string): Promise<void> {
    // Check cache first
    if (this.options.cache && this.cache.has(url)) {
      return;
    }

    return new Promise((resolve, reject) => {
      // Check if script already exists
      if (document.querySelector(`script[src="${url}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = url;
      script.async = true;

      // Set up timeout
      const timeout = setTimeout(() => {
        script.remove();
        reject(new Error(`Script loading timeout: ${url}`));
      }, this.options.timeout);

      script.onload = () => {
        clearTimeout(timeout);
        if (this.options.cache) {
          this.cache.set(url, true);
        }
        resolve();
      };

      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        reject(new Error(`Failed to load script: ${url}`));
      };

      document.head.appendChild(script);
    });
  }

  private async loadDynamicModule(moduleName: string): Promise<void> {
    try {
      const moduleImport = await import(moduleName);
      if (this.options.cache) {
        this.cache.set(moduleName, moduleImport);
      }
    } catch (error: unknown) {
      throw new Error(`Failed to load dynamic module: ${moduleName}`);
    }
  }
}

// Export singleton instance
export const dependencyLoader = new DependencyLoader();
