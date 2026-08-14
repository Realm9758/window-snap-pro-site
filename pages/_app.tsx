import type { AppProps } from "next/app";
import Head from "next/head";
import { AuthProvider } from "../lib/auth-context";
import { canonicalUrl, SITE_URL } from "../lib/site";
import "../styles/globals.css";

export default function App({ Component, pageProps, router }: AppProps) {
  // This project is reachable at two hosts: bhopstudio.com/redock (the real one)
  // and the raw *.vercel.app deployment URL. Identical content on two hosts
  // splits ranking signals, so every page declares which one counts. Per-page,
  // not site-wide: a single canonical would claim every page is the homepage and
  // de-index the rest.
  const canonical = canonicalUrl(router.asPath);

  return (
    <AuthProvider>
      <Head>
        <link rel="canonical" href={canonical} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Was set on the homepage only, so every other page lost the tinted
            browser chrome. It does not vary by page, so it belongs here. */}
        <meta name="theme-color" content="#141619" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#f6f7f9" media="(prefers-color-scheme: light)" />

        {/*
          Everything here is constant across pages. The title, description and
          their social equivalents vary, so they live in <Seo> instead.

          og:image has to be absolute. A relative path is resolved by the
          scraper against its own host, not yours, so it silently yields no
          preview at all.
        */}
        <meta property="og:url" content={canonical} key="og:url" />
        <meta property="og:type" content="website" key="og:type" />
        <meta property="og:site_name" content="Redock" key="og:site_name" />
        <meta property="og:locale" content="en_GB" key="og:locale" />
        <meta property="og:image" content={`${SITE_URL}/og.png`} key="og:image" />
        <meta property="og:image:width" content="1200" key="og:image:width" />
        <meta property="og:image:height" content="630" key="og:image:height" />
        <meta
          property="og:image:alt"
          content="Redock: plug in your display and your workspace puts itself back."
          key="og:image:alt"
        />
        <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
        <meta name="twitter:image" content={`${SITE_URL}/og.png`} key="twitter:image" />
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
