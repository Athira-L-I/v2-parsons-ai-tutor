import '@/styles/globals.css';
import '@/styles/parsons.css';
import { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import { ParsonsProviders } from '@/contexts/ParsonsProviders';
import Layout from '@/components/Layout';
import { dependencyLoader } from '@/dependencies/DependencyLoader';
import { DependencyDebug } from '@/components/dev/DependencyDebug';
import { GlobalErrorHandler } from '@/errors/GlobalErrorHandler';
import { StandardErrorDisplay } from '@/components/StandardErrorDisplay';

export default function App({ Component, pageProps }: AppProps) {
  // State for global app-level errors
  const [globalError, setGlobalError] = useState<Error | null>(null);

  // Handler for global errors
  const handleGlobalError = (error: Error) => {
    console.error('Global error caught by error boundary:', error);
    setGlobalError(error);
  };

  // Clear the global error
  const handleRetry = () => {
    setGlobalError(null);
  };

  // Preload dependencies when app starts
  useEffect(() => {
    console.log('🚀 Preloading dependencies...');

    // Start loading dependencies in background
    dependencyLoader.loadAll().then((result) => {
      if (result.success) {
        console.log('✅ Dependencies preloaded successfully');
      } else {
        console.warn('⚠️ Some dependencies failed to preload:', result.errors);
      }
    });
  }, []);

  return (
    <ParsonsProviders>
      {/* Global error handler for uncaught errors */}
      <GlobalErrorHandler onError={handleGlobalError} />
      
      <Layout>
        {/* Show global error if there is one */}
        {globalError ? (
          <StandardErrorDisplay 
            error={globalError} 
            onRetry={handleRetry} 
            className="m-6 p-4 rounded-lg" 
          />
        ) : (
          <Component {...pageProps} />
        )}
        
        {process.env.NODE_ENV === 'development' && <DependencyDebug />}
      </Layout>
    </ParsonsProviders>
  );
}
