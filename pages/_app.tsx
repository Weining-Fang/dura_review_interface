import '../styles/globals.css';
import '@recogito/annotorious-openseadragon/dist/annotorious.min.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

