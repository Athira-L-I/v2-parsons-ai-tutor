/**
 * Development page for testing dependency loading
 */

import React from 'react';
//import { DependencyDebug } from '@/components/dev/DependencyDebug';
import { DependencyLoader } from '@/components/DependencyLoader';
import { useDependencies } from '@/hooks/useDependencies';

const DependencyTestComponent: React.FC = () => {
  const { isLoading, isLoaded, hasError, error, result, retry } =
    useDependencies();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dependency Loading Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Loading Status</h2>
          <div className="space-y-2">
            <div>Loading: {isLoading ? '✅' : '❌'}</div>
            <div>Loaded: {isLoaded ? '✅' : '❌'}</div>
            <div>Has Error: {hasError ? '❌' : '✅'}</div>
            {error && <div>Error: {error}</div>}
          </div>

          {result && (
            <div className="mt-4">
              <h3 className="font-semibold">Result Details:</h3>
              <div className="text-sm">
                <div>Success: {result.success ? '✅' : '❌'}</div>
                <div>Duration: {result.duration}ms</div>
                <div>Loaded: {result.loaded.join(', ')}</div>
                <div>Failed: {result.failed.join(', ')}</div>
              </div>
            </div>
          )}

          <button
            onClick={retry}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Retry Loading
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Dependency Test</h2>

          {isLoaded ? (
            <div className="space-y-2">
              <div>
                jQuery Available:{' '}
                {typeof window !== 'undefined' && window.$ ? '✅' : '❌'}
              </div>
              <div>
                jQuery UI Available:{' '}
                {typeof window !== 'undefined' && window.$.ui ? '✅' : '❌'}
              </div>
              <div>
                Lodash Available:{' '}
                {typeof window !== 'undefined' && window._ ? '✅' : '❌'}
              </div>
              <div>
                LIS Available:{' '}
                {typeof window !== 'undefined' && window.LIS ? '✅' : '❌'}
              </div>
              <div>
                ParsonsWidget Available:{' '}
                {typeof window !== 'undefined' && window.ParsonsWidget
                  ? '✅'
                  : '❌'}
              </div>

              {typeof window !== 'undefined' && window.ParsonsWidget && (
                <button
                  onClick={() => {
                    try {
                      /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
                      const testWidget = new window.ParsonsWidget({
                        sortableId: 'test',
                        trashId: 'test-trash',
                      });
                      alert('ParsonsWidget instantiation successful!');
                    } catch (err) {
                      const errorMessage =
                        err instanceof Error ? err.message : String(err);
                      alert(
                        `ParsonsWidget instantiation failed: ${errorMessage}`
                      );
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Test ParsonsWidget
                </button>
              )}
            </div>
          ) : (
            <div>Dependencies not loaded yet...</div>
          )}
        </div>
      </div>
    </div>
  );
};

const DependencyTestPage: React.FC = () => {
  return (
    <>
      <DependencyLoader>
        <DependencyTestComponent />
      </DependencyLoader>
    </>
  );
};

export default DependencyTestPage;
