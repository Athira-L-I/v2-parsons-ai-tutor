// Mock window object for tests
Object.defineProperty(global, 'window', {
  value: {
    $: {
      fn: {
        jquery: '3.6.0'
      },
      ui: {
        version: '1.13.2',
        sortable: true
      },
      sortable: () => ({
        sortable: jest.fn()
      })
    },
    jQuery: {
      fn: {
        jquery: '3.6.0'
      },
      ui: {
        version: '1.13.2',
        sortable: true
      }
    },
    _: {
      VERSION: '4.17.21',
      each: jest.fn(),
      filter: jest.fn(),
      map: jest.fn(),
      max: jest.fn(),
      last: jest.fn(),
      difference: jest.fn()
    },
    LIS: {
      patience_sort: jest.fn(() => []),
      find_lises: jest.fn(),
      best_lise: jest.fn(),
      best_lise_inverse: jest.fn(),
      best_lise_inverse_indices: jest.fn()
    },
    ParsonsWidget: jest.fn(() => ({
      init: jest.fn()
    })),
    location: {
      origin: 'http://localhost:3000'
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    setTimeout: jest.fn(),
    clearTimeout: jest.fn()
  },
  writable: true
});

// Mock document object
Object.defineProperty(global, 'document', {
  value: {
    head: {
      appendChild: jest.fn()
    },
    createElement: jest.fn(() => ({
      async: false,
      crossOrigin: null,
      onload: null,
      onerror: null,
      rel: null,
      href: null,
      src: null,
      remove: jest.fn()
    })),
    querySelector: jest.fn(() => null)
  },
  writable: true
});
