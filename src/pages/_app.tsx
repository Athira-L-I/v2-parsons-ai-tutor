import '@/styles/globals.css';
import '@/styles/parsons.css';
import type { AppProps } from 'next/app';
import { ParsonsProvider } from '@/contexts/ParsonsContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ParsonsProvider>
      <Component {...pageProps} />
    </ParsonsProvider>
  );
}