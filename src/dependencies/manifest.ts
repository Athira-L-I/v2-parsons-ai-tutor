/**
 * Dependency manifest defining all external dependencies
 * This replaces the complex manual loading system
 */

export interface DependencyDefinition {
  name: string;
  version: string;
  source: DependencySource;
  required: boolean;
  loadCondition?: () => boolean;
  initFunction?: () => Promise<void>;
  dependencies?: string[]; // Other dependencies this depends on
}

export interface DependencySource {
  type: 'cdn' | 'npm' | 'local' | 'dynamic';
  url?: string;
  module?: string;
  fallback?: DependencySource;
}

export const DEPENDENCY_MANIFEST: Record<string, DependencyDefinition> = {
  jquery: {
    name: 'jQuery',
    version: '3.6.0',
    source: {
      type: 'cdn',
      url: 'https://code.jquery.com/jquery-3.6.0.min.js',
      fallback: {
        type: 'local',
        url: '/js/vendor/jquery.min.js'
      }
    },
    required: true,
    loadCondition: () => typeof window !== 'undefined',
  },

  jqueryui: {
    name: 'jQuery UI',
    version: '1.13.2',
    source: {
      type: 'cdn',
      url: 'https://code.jquery.com/ui/1.13.2/jquery-ui.min.js',
      fallback: {
        type: 'local',
        url: '/js/vendor/jquery-ui.min.js'
      }
    },
    required: true,
    dependencies: ['jquery'],
  },

  lodash: {
    name: 'Lodash',
    version: '4.17.21',
    source: {
      type: 'cdn',
      url: 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js',
      fallback: {
        type: 'local',
        url: '/js/vendor/lodash.min.js'
      }
    },
    required: true,
    dependencies: ['jquery'],
  },

  lis: {
    name: 'Line Item Sorter',
    version: '1.0.0',
    source: {
      type: 'local',
      url: '/js/lis.js'
    },
    required: true,
    dependencies: ['jquery', 'jqueryui', 'lodash'],
  },

  parsonsWidget: {
    name: 'Parsons Widget',
    version: '1.0.0',
    source: {
      type: 'local',
      url: '/js/parsons.js'
    },
    required: true,
    dependencies: ['jquery', 'jqueryui', 'lodash', 'lis'],
    initFunction: async () => {
      // Any initialization code needed after loading
      if (window.ParsonsWidget) {
        console.log('✅ ParsonsWidget initialized');
      }
    },
  },
};

export const CSS_DEPENDENCIES = [
  'https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css',
];

// Declare global types for TypeScript
declare global {
  interface Window {
    ParsonsWidget: unknown;
    jQuery: unknown;
    $: unknown;
    _: unknown;
    LIS: unknown;
  }
}
