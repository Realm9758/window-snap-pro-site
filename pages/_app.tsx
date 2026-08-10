import type { AppProps } from "next/app";
import Head from "next/head";
import { AuthProvider } from "../lib/auth-context";
import { canonicalUrl } from "../lib/site";
import "../styles/globals.css";

export default function App({ Component, pageProps, router }: AppProps) {
  // This project is reachable at two hosts: bhopstudio.com/mac-window-manager
  // (the real one) and the raw *.vercel.app deployment URL. Identical content on
  // two hosts splits ranking signals, so every page declares which one counts.
  // Per-page, not site-wide — a single canonical would claim every page is the
  // homepage and de-index the rest.
  const canonical = canonicalUrl(router.asPath);

  return (
    <AuthProvider>
      <Head>
        <link rel="canonical" href={canonical} />
      </Head>
      {/*
        No page-transition wrapper here on purpose. A framer-motion cross-fade
        used to sit at this level, and because it starts at opacity 0 it
        server-rendered the entire site inside <div style="opacity:0">. The page
        was therefore invisible until JavaScript hydrated it, blank for anyone
        without JS, and it read as hidden content to anything that inspects the
        initial HTML. The hero already carries an authored CSS entrance, which
        needs no JS and degrades cleanly.
      */}
      <Component {...pageProps} />
    </AuthProvider>
  );
}
