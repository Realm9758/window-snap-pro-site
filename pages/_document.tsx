import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Redock saves the position of every window on every display and puts them back when you reconnect your monitor." />
        <meta property="og:title" content="Redock" />
        <meta property="og:description" content="Snap Windows. Stay Focused. The best window manager for macOS." />
        <meta property="og:type" content="website" />
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
