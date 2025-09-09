import { useState } from 'react';
import { dependencyLoader } from '@/dependencies/DependencyLoader';
import { DEPENDENCY_MANIFEST } from '@/dependencies/manifest';
import { DependencyLoader } from '@/components/DependencyLoader';
import * as parsonsLoader from '@/lib/parsonsLoader';

export default function DependencyTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  interface TestResult {
    name: string;
    passed: boolean;
    message: string;
  }

  const addResult = (name: string, passed: boolean, message: string) => {
    setTestResults((prev) => [...prev, { name, passed, message }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runTests = async () => {
    clearResults();
    setIsRunning(true);

    // Test 1: Check dependency manifest structure
    try {
      addResult('Test 1', true, 'Dependency manifest loaded successfully');

      const requiredDeps = [
        'jquery',
        'jqueryui',
        'lodash',
        'lis',
        'parsonsWidget',
      ];
      const missingDeps = requiredDeps.filter(
        (dep) => !DEPENDENCY_MANIFEST[dep]
      );

      if (missingDeps.length > 0) {
        addResult(
          'Test 1.1',
          false,
          `Missing dependencies in manifest: ${missingDeps.join(', ')}`
        );
      } else {
        addResult(
          'Test 1.1',
          true,
          'Manifest contains all required dependencies'
        );
      }

      // Check dependency structure
      const invalidDeps = [];
      for (const [key, dep] of Object.entries(DEPENDENCY_MANIFEST)) {
        if (!dep.name || !dep.source || dep.required === undefined) {
          invalidDeps.push(key);
        }
      }

      if (invalidDeps.length > 0) {
        addResult(
          'Test 1.2',
          false,
          `Dependencies with invalid structure: ${invalidDeps.join(', ')}`
        );
      } else {
        addResult('Test 1.2', true, 'All dependencies have valid structure');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addResult(
        'Test 1',
        false,
        `Dependency manifest test failed: ${errorMessage}`
      );
    }

    // Test 2: Load jQuery directly
    try {
      await dependencyLoader.loadDependency('jquery');

      if (window.$ && window.jQuery) {
        const $ = window.$ as { fn: { jquery: string } };
        addResult('Test 2', true, `jQuery loaded successfully: ${$.fn.jquery}`);
      } else {
        addResult('Test 2', false, 'jQuery not available after loading');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addResult('Test 2', false, `jQuery loading test failed: ${errorMessage}`);
    }

    // Test 3: Load all dependencies
    try {
      const result = await dependencyLoader.loadAll();

      if (result.success) {
        addResult('Test 3', true, 'All dependencies loaded successfully');

        // Check if dependencies are actually available
        const $ = window.$ as Record<string, unknown>;
        const deps = {
          jQuery: window.$ && window.jQuery,
          'jQuery UI': $ && $.ui,
          Lodash: window._,
          LIS: window.LIS,
          ParsonsWidget: window.ParsonsWidget,
        };

        const missingDeps = Object.entries(deps)
          .filter(([, val]) => !val)
          .map(([name]) => name);

        if (missingDeps.length > 0) {
          addResult(
            'Test 3.1',
            false,
            `Missing window objects: ${missingDeps.join(', ')}`
          );
        } else {
          addResult('Test 3.1', true, 'All global objects are available');
        }

        // Test ParsonsWidget instantiation
        if (window.ParsonsWidget) {
          try {
            // Only test instantiation if we have a DOM element
            const testElements = document.querySelectorAll('.test-container');
            if (testElements.length > 0) {
              const ParsonsWidget = window.ParsonsWidget as new (
                options: Record<string, string>
              ) => unknown;
              const widget = new ParsonsWidget({
                sortableId: 'test-sortable',
                trashId: 'test-trash',
              });

              if (widget) {
                addResult(
                  'Test 3.2',
                  true,
                  'ParsonsWidget instantiated successfully'
                );
              }
            } else {
              addResult(
                'Test 3.2',
                true,
                'ParsonsWidget available (skipped instantiation)'
              );
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            addResult(
              'Test 3.2',
              false,
              `ParsonsWidget instantiation failed: ${errorMessage}`
            );
          }
        }
      } else {
        addResult(
          'Test 3',
          false,
          `Some dependencies failed to load: ${result.errors.join(', ')}`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addResult(
        'Test 3',
        false,
        `Dependencies loading failed: ${errorMessage}`
      );
    }

    // Test 4: Test backward compatibility
    try {
      if (
        parsonsLoader.loadParsonsWidget &&
        typeof parsonsLoader.loadParsonsWidget === 'function'
      ) {
        addResult('Test 4', true, 'Legacy loadParsonsWidget function exists');

        await parsonsLoader.loadParsonsWidget();

        if (window.ParsonsWidget) {
          addResult(
            'Test 4.1',
            true,
            'Legacy API loads ParsonsWidget successfully'
          );
        } else {
          addResult(
            'Test 4.1',
            false,
            'Legacy API fails to load ParsonsWidget'
          );
        }

        const isParsonsLoaded = parsonsLoader.isParsonsWidgetLoaded();
        if (isParsonsLoaded) {
          addResult(
            'Test 4.2',
            true,
            'isParsonsWidgetLoaded reports correctly'
          );
        } else {
          addResult(
            'Test 4.2',
            false,
            'isParsonsWidgetLoaded reports incorrectly'
          );
        }

        const status = parsonsLoader.getLoadingStatus();
        if (status.isLoaded) {
          addResult('Test 4.3', true, 'getLoadingStatus reports correctly');
        } else {
          addResult('Test 4.3', false, 'getLoadingStatus reports incorrectly');
        }
      } else {
        addResult(
          'Test 4',
          false,
          'Legacy loadParsonsWidget function not found'
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addResult(
        'Test 4',
        false,
        `Backward compatibility test failed: ${errorMessage}`
      );
    }

    setIsRunning(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">
        Dependency Management System Test
      </h1>

      <div className="mb-6">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
          onClick={runTests}
          disabled={isRunning}
        >
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Test Results</h2>

        {testResults.length === 0 && !isRunning ? (
          <div className="text-gray-500">No tests have been run yet.</div>
        ) : (
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-md ${
                  result.passed
                    ? 'bg-green-100 border-green-300'
                    : 'bg-red-100 border-red-300'
                } border`}
              >
                <div className="flex items-center">
                  <span
                    className={`mr-2 ${
                      result.passed ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {result.passed ? '✓' : '✗'}
                  </span>
                  <span className="font-medium">{result.name}</span>
                </div>
                <div className="mt-1 text-sm">{result.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Test DOM Elements</h2>
        <div className="test-container border border-gray-300 p-4 rounded-md">
          <div
            id="test-sortable"
            className="min-h-[100px] bg-gray-100 mb-4 p-4 rounded-md"
          >
            Sortable Container
          </div>
          <div
            id="test-trash"
            className="min-h-[100px] bg-gray-200 p-4 rounded-md"
          >
            Trash Container
          </div>
        </div>
      </div>

      <DependencyLoader showDetails>
        <div className="bg-blue-50 p-4 rounded-md">
          <h3 className="font-semibold">DependencyLoader Component Test</h3>
          <p>If you can see this, the DependencyLoader component is working!</p>
        </div>
      </DependencyLoader>
    </div>
  );
}
