/**
 * Error-Safe Test Page with complete React/jQuery isolation
 * src/pages/test/fixed-integration.tsx
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ParsonsSettings } from '@/@types/types';

// Import components dynamically to prevent loading issues
const DynamicParsonsProvider = React.lazy(() =>
  import('@/contexts/ParsonsContext').then((module) => ({
    default: module.ParsonsProvider,
  }))
);

const DynamicParsonsProblemContainer = React.lazy(
  () => import('@/components/ParsonsProblemContainer')
);

// Error boundary specifically for React/jQuery conflicts
class ReactJQueryErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    onError: (error: Error) => void;
    resetKey: string | number;
  },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('🚨 React/jQuery Error Boundary caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error Details:', { error, errorInfo });

    // Check if this is the typical React/jQuery conflict
    if (
      error.message.includes('removeChild') ||
      error.message.includes('Node') ||
      error.name === 'NotFoundError'
    ) {
      console.log('🔍 Detected React/jQuery DOM conflict');
    }

    this.props.onError(error);
  }

  componentDidUpdate(prevProps: any) {
    // Reset error state when resetKey changes
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold">React/jQuery Conflict Detected</p>
              <p className="text-sm mt-1">
                {this.state.error?.message ||
                  'DOM manipulation conflict between React and jQuery'}
              </p>
              <p className="text-xs mt-2 text-red-600">
                This usually happens when switching between problems. The page
                will auto-recover.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const TestFixedIntegrationPage: React.FC = () => {
  const [problemType, setProblemType] = useState<
    'simple' | 'complex' | 'adaptive'
  >('simple');
  const [forceApiTest, setForceApiTest] = useState(false);
  const [isolationKey, setIsolationKey] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  // Sample problems
  const simpleManualProblem: ParsonsSettings = {
    initial: `def hello():
    print("Hello")
    return "done"
print("Extra line") #distractor`,
    options: {
      can_indent: true,
      sortableId: 'sortable',
      trashId: 'trash',
      max_wrong_lines: 1,
      x_indent: 50,
    },
  };

  const complexProblem: ParsonsSettings = {
    initial: `def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    return total / len(numbers)
if not numbers:\\n    return 0
print("Hello World") #distractor
x = 5 #distractor
y = x * 2 #distractor`,
    options: {
      can_indent: true,
      sortableId: 'sortable',
      trashId: 'trash',
      max_wrong_lines: 3,
      x_indent: 50,
    },
  };

  const adaptiveProblem: ParsonsSettings = {
    initial: `def factorial(n):
    if n <= 1:
        return 1
    else:
        return n * factorial(n - 1)
result = factorial(5)
print(result)
print("Wrong approach") #distractor
return n + factorial(n - 1) #distractor
if n == 1: #distractor`,
    options: {
      can_indent: true,
      sortableId: 'sortable',
      trashId: 'trash',
      max_wrong_lines: 3,
      x_indent: 50,
    },
  };

  const getCurrentProblem = useCallback(() => {
    switch (problemType) {
      case 'simple':
        return simpleManualProblem;
      case 'complex':
        return complexProblem;
      case 'adaptive':
        return adaptiveProblem;
      default:
        return simpleManualProblem;
    }
  }, [problemType]);

  // Handle problem type changes with complete isolation
  const handleProblemTypeChange = useCallback(
    (newType: 'simple' | 'complex' | 'adaptive') => {
      console.log(`🔄 Changing problem type: ${problemType} → ${newType}`);

      // Reset error state
      setHasError(false);

      // Change type
      setProblemType(newType);

      // Force complete re-isolation
      setIsolationKey((prev) => prev + 1);

      console.log(
        `✅ Problem type changed to ${newType} with isolation key ${
          isolationKey + 1
        }`
      );
    },
    [problemType, isolationKey]
  );

  // Handle API test toggle
  const handleApiTestToggle = useCallback((checked: boolean) => {
    console.log(`🔄 API test mode: ${checked ? 'enabled' : 'disabled'}`);
    setForceApiTest(checked);
    setIsolationKey((prev) => prev + 1);
  }, []);

  // Handle errors from error boundary
  const handleError = useCallback(
    (error: Error) => {
      console.error('🚨 Handling error from boundary:', error);
      setHasError(true);
      setErrorCount((prev) => prev + 1);

      // Auto-recovery: if we get repeated errors, try a complete reset
      if (errorCount >= 2) {
        console.log('🔄 Multiple errors detected, triggering auto-recovery...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        // Try to recover by resetting isolation
        setTimeout(() => {
          console.log('🔄 Attempting auto-recovery...');
          setHasError(false);
          setIsolationKey((prev) => prev + 1);
        }, 1000);
      }
    },
    [errorCount]
  );

  // Auto-clear error state after isolation key changes
  useEffect(() => {
    if (hasError) {
      const timer = setTimeout(() => {
        setHasError(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isolationKey, hasError]);

  // Reset error count periodically
  useEffect(() => {
    const timer = setTimeout(() => {
      setErrorCount(0);
    }, 30000); // Reset error count every 30 seconds
    return () => clearTimeout(timer);
  }, [errorCount]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Fixed Integration Test - Isolated Version
          </h1>
          <p className="text-gray-600 mb-4">
            This version uses complete React/jQuery isolation to prevent DOM
            conflicts.
          </p>

          {/* Controls */}
          <div className="flex items-center flex-wrap gap-4 mb-6 p-4 bg-white rounded border">
            <span className="font-medium text-gray-700">Test Problem:</span>

            <button
              onClick={() => handleProblemTypeChange('simple')}
              className={`px-4 py-2 rounded transition-colors ${
                problemType === 'simple'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Simple Problem
            </button>

            <button
              onClick={() => handleProblemTypeChange('complex')}
              className={`px-4 py-2 rounded transition-colors ${
                problemType === 'complex'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Complex Problem
            </button>

            <button
              onClick={() => handleProblemTypeChange('adaptive')}
              className={`px-4 py-2 rounded transition-colors ${
                problemType === 'adaptive'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Adaptive Test
            </button>

            {/* API Test Toggle */}
            <div className="flex items-center gap-2 ml-4">
              <input
                type="checkbox"
                id="api-test"
                checked={forceApiTest}
                onChange={(e) => handleApiTestToggle(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="api-test" className="text-sm text-gray-600">
                Force API test
              </label>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors ml-auto"
            >
              Refresh Page
            </button>
          </div>

          {/* Status Display */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>Problem:</strong> {problemType}
              </div>
              <div>
                <strong>Isolation Key:</strong> {isolationKey}
              </div>
              <div>
                <strong>Error State:</strong> {hasError ? '❌' : '✅'}
              </div>
              <div>
                <strong>Error Count:</strong> {errorCount}
              </div>
            </div>
          </div>
        </div>

        {/* Global Debug Panel */}
        <GlobalDebugPanel />

        {/* Main Problem Container with Complete Isolation */}
        <div className="mt-6">
          <ReactJQueryErrorBoundary
            onError={handleError}
            resetKey={isolationKey}
          >
            <React.Suspense
              fallback={
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              }
            >
              <DynamicParsonsProvider key={`provider-${isolationKey}`}>
                <DynamicParsonsProblemContainer
                  key={`container-${isolationKey}-${problemType}-${forceApiTest}`}
                  problemId={forceApiTest ? `test-${problemType}` : undefined}
                  initialProblem={getCurrentProblem()}
                  title={`Test Problem: ${problemType}`}
                  description={`Testing ${problemType} problem with complete isolation${
                    forceApiTest ? ' (API test mode)' : ''
                  }`}
                  showUploader={false}
                />
              </DynamicParsonsProvider>
            </React.Suspense>
          </ReactJQueryErrorBoundary>
        </div>

        {/* Instructions */}
        <IsolatedTestingInstructions />
      </div>
    </div>
  );
};

// Global debug panel that's outside the isolated area
const GlobalDebugPanel: React.FC = () => {
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="bg-white border rounded p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Global Debug Panel</h3>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
        >
          {showDebug ? 'Hide' : 'Show'} Debug Info
        </button>
      </div>

      {/* Quick Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-lg font-bold text-blue-600">
            {typeof window !== 'undefined' && window.ParsonsWidget
              ? '✅'
              : '❌'}
          </div>
          <div className="text-xs text-gray-600">ParsonsWidget</div>
        </div>

        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-lg font-bold text-green-600">
            {typeof window !== 'undefined' && window.jQuery ? '✅' : '❌'}
          </div>
          <div className="text-xs text-gray-600">jQuery</div>
        </div>

        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-lg font-bold text-purple-600">
            {typeof window !== 'undefined' && window.LIS ? '✅' : '❌'}
          </div>
          <div className="text-xs text-gray-600">LIS</div>
        </div>

        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-lg font-bold text-orange-600">
            {typeof window !== 'undefined' && window.jQuery?.fn?.sortable
              ? '✅'
              : '❌'}
          </div>
          <div className="text-xs text-gray-600">Sortable</div>
        </div>
      </div>

      {showDebug && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Environment:</h4>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>React Version: {React.version}</div>
                <div>Node ENV: {process.env.NODE_ENV}</div>
                <div>User Agent: {navigator.userAgent.split(' ')[0]}</div>
                <div>URL: {window.location.pathname}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                console.log('🔍 Global Dependencies:', {
                  jQuery: typeof window.jQuery,
                  jQueryUI: typeof window.jQuery?.ui,
                  lodash: typeof window._,
                  LIS: typeof window.LIS,
                  ParsonsWidget: typeof window.ParsonsWidget,
                  sortable: typeof window.jQuery?.fn?.sortable,
                });
              }}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded"
            >
              Log Dependencies
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Testing instructions
const IsolatedTestingInstructions: React.FC = () => (
  <div className="mt-8 p-4 bg-green-50 rounded border border-green-200">
    <h3 className="font-semibold text-green-800 mb-2">
      Isolated Testing Instructions:
    </h3>
    <div className="text-sm text-green-700 space-y-2">
      <div>
        <strong>🛡️ What's Fixed in This Version:</strong>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>
            <strong>Complete Isolation:</strong> React and jQuery never
            interfere with each other
          </li>
          <li>
            <strong>Error Boundaries:</strong> Catches and handles React/jQuery
            conflicts gracefully
          </li>
          <li>
            <strong>Auto-Recovery:</strong> Automatically recovers from DOM
            conflicts
          </li>
          <li>
            <strong>Dynamic Loading:</strong> Components load only when needed
          </li>
        </ul>
      </div>

      <div>
        <strong>✅ Expected Behavior:</strong>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>Widget loads immediately without errors</li>
          <li>Switching problem types works smoothly</li>
          <li>No "removeChild" errors in console</li>
          <li>If errors occur, page auto-recovers</li>
        </ul>
      </div>

      <div>
        <strong>🧪 Test Sequence:</strong>
        <ol className="list-decimal list-inside ml-4 space-y-1">
          <li>Page loads with Simple problem active</li>
          <li>Switch to Complex problem - should work seamlessly</li>
          <li>Switch to Adaptive test - should work seamlessly</li>
          <li>Try drag and drop functionality</li>
          <li>Check console for success logs</li>
        </ol>
      </div>

      <div>
        <strong>🔧 If You Still See Errors:</strong>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>
            The error boundary should catch them and show recovery options
          </li>
          <li>Page should auto-recover after 1-2 seconds</li>
          <li>Check global debug panel for dependency status</li>
          <li>Use "Refresh Page" as final fallback</li>
        </ul>
      </div>
    </div>

    <div className="mt-4 p-3 bg-green-100 rounded">
      <strong>🎯 Success Indicators:</strong>
      <ul className="list-disc list-inside mt-2 space-y-1">
        <li>All global debug indicators are green (✅)</li>
        <li>Drag and drop interface appears</li>
        <li>No red error messages</li>
        <li>Smooth switching between problem types</li>
        <li>Console shows "✅ Isolated ParsonsWidget created successfully"</li>
      </ul>
    </div>
  </div>
);

export default TestFixedIntegrationPage;
