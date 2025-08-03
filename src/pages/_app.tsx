import '@/styles/globals.css';
import '@/styles/parsons.css';
import type { AppProps } from 'next/app';
import { ParsonsProviders } from '@/contexts/ParsonsProviders';
import Layout from '@/components/Layout';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ParsonsProviders>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ParsonsProviders>
  );
}