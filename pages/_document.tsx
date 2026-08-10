import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        {/*
          No description or og tags here. This file renders on every page, so
          anything set here competed with each page's own <Seo> block and every
          page shipped two <meta name="description"> tags. Per-page metadata
          lives in components/Seo.tsx, the constant parts in _app.tsx.
        */}
        {/* _document has no router, so the basePath is literal here. */}
        <link rel="icon" href="/redock/icon.svg" type="image/svg+xml" />
      </Head>
      <body>
        {/* Prevent dark mode flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var stored = localStorage.getItem('theme');
                if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
