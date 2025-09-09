/**
 * Development component for debugging dependency loading
 */

import React, { useState, useEffect } from 'react';
import { dependencyLoader } from '@/dependencies/DependencyLoader';
import { useDependencyStatus } from '@/hooks/useDependencies';

// Type definitions for global dependencies
interface JQuery {
  fn?: { jquery?: string };
  ui?: { version?: string };
}

interface Lodash {
  VERSION?: string;
}

export const DependencyDebug: React.FC = () => {
  const status = useDependencyStatus();
  const [detailedStatus, setDetailedStatus] = useState<{
    loader: ReturnType<typeof dependencyLoader.getStatus>;
    window: {
      jquery: boolean;
      jqueryui: boolean;
      lodash: boolean;
      lis: boolean;
      parsonsWidget: boolean;
    };
    versions: {
      jquery: string | undefined;
      jqueryui: string | undefined;
      lodash: string | undefined;
    };
  } | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      // Use safe type assertions to prevent runtime errors
      const jquery = window.$ as JQuery;
      const lodash = window._ as Lodash;

      setDetailedStatus({
        loader: dependencyLoader.getStatus(),
        window: {
          jquery: !!window.$,
          jqueryui: !!(window.$ && jquery.ui),
          lodash: !!window._,
          lis: !!window.LIS,
          parsonsWidget: !!window.ParsonsWidget,
        },
        versions: {
          jquery: jquery?.fn?.jquery,
          jqueryui: jquery?.ui?.version,
          lodash: lodash?.VERSION,
        },
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="dependency-debug fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg text-xs max-w-md">
      <h4 className="font-bold mb-2">Dependencies Debug</h4>

      <div className="space-y-2">
        <div>
          <strong>Status:</strong> {status.ready ? '✅ Ready' : '⏳ Loading'}
        </div>

        <div>
          <strong>Loaded:</strong> {status.loaded.join(', ') || 'none'}
        </div>

        <div>
          <strong>Loading:</strong> {status.loading.join(', ') || 'none'}
        </div>

        {detailedStatus && (
          <>
            <div>
              <strong>Window Objects:</strong>
              <ul className="ml-2">
                <li>jQuery: {detailedStatus.window.jquery ? '✅' : '❌'}</li>
                <li>
                  jQuery UI: {detailedStatus.window.jqueryui ? '✅' : '❌'}
                </li>
                <li>Lodash: {detailedStatus.window.lodash ? '✅' : '❌'}</li>
                <li>LIS: {detailedStatus.window.lis ? '✅' : '❌'}</li>
                <li>
                  ParsonsWidget:{' '}
                  {detailedStatus.window.parsonsWidget ? '✅' : '❌'}
                </li>
              </ul>
            </div>

            <div>
              <strong>Versions:</strong>
              <ul className="ml-2">
                <li>jQuery: {detailedStatus.versions.jquery || 'N/A'}</li>
                <li>jQuery UI: {detailedStatus.versions.jqueryui || 'N/A'}</li>
                <li>Lodash: {detailedStatus.versions.lodash || 'N/A'}</li>
              </ul>
            </div>
          </>
        )}

        <div className="flex space-x-2 mt-2">
          <button
            onClick={() => dependencyLoader.reset()}
            className="px-2 py-1 bg-red-600 rounded text-xs"
          >
            Reset
          </button>
          <button
            onClick={() => dependencyLoader.loadAll()}
            className="px-2 py-1 bg-blue-600 rounded text-xs"
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
};
