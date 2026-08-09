/** @type {import('next').NextConfig} */

// This project is served at bhopstudio.com/redock, not on its own
// domain. `basePath` prefixes every route, API handler, link and static asset,
// so the bhopstudio rewrite can forward the path through untouched.
//
// The slug is the brand, not a keyword — keyword targeting lives in page titles,
// H1s and the /redock/vs-* comparison pages instead.
const BASE_PATH = "/redock";

// Canonical URLs are emitted per-page in _app.tsx — a single site-wide value
// here would tell Google every page is the homepage.
const nextConfig = {
  reactStrictMode: true,
  basePath: BASE_PATH,
};

module.exports = nextConfig;
