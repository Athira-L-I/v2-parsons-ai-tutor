import '@/styles/globals.css';
import '@/styles/parsons.css';
import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { ParsonsProviders } from '@/contexts/ParsonsProviders';
import Layout from '@/components/Layout';
import { dependencyLoader } from '@/dependencies/DependencyLoader';
import { DependencyDebug } from '@/components/dev/DependencyDebug';

export default function App({ Component, pageProps }: AppProps) {
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
      <Layout>
        <Component {...pageProps} />
        {process.env.NODE_ENV === 'development' && <DependencyDebug />}
      </Layout>
    </ParsonsProviders>
  );
}
