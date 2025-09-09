/**
 * Preloading strategy for better performance
 */

import { dependencyLoader } from './DependencyLoader';

export class DependencyPreloader {
  private preloadStarted = false;

  /**
   * Start preloading dependencies as early as possible
   */
  startPreloading() {
    if (this.preloadStarted) return;
    this.preloadStarted = true;

    console.log('🚀 Starting dependency preloading...');

    // Start loading immediately
    dependencyLoader.loadAll().then((result) => {
      if (result.success) {
        console.log('✅ Dependencies preloaded successfully');
        // Dispatch event for components that might be waiting
        window.dispatchEvent(new CustomEvent('dependencies-ready'));
      } else {
        console.warn('⚠️ Dependency preloading had issues:', result.errors);
      }
    });
  }

  /**
   * Wait for dependencies to be ready
   */
  async waitForDependencies(): Promise<boolean> {
    return new Promise((resolve) => {
      const status = dependencyLoader.getStatus();

      if (status.loaded.includes('parsonsWidget')) {
        resolve(true);
        return;
      }

      // Listen for ready event
      const handleReady = () => {
        window.removeEventListener('dependencies-ready', handleReady);
        resolve(true);
      };

      window.addEventListener('dependencies-ready', handleReady);

      // Timeout after 30 seconds
      setTimeout(() => {
        window.removeEventListener('dependencies-ready', handleReady);
        resolve(false);
      }, 30000);
    });
  }
}

export const dependencyPreloader = new DependencyPreloader();
