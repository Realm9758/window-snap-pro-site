/** @type {import('next').NextConfig} */

// This project is served at bhopstudio.com/redock, not on its own
// domain. `basePath` prefixes every route, API handler, link and static asset,
// so the bhopstudio rewrite can forward the path through untouched.
//
// The slug is the brand, not a keyword — keyword targeting lives in page titles,
// H1s and the /redock/vs-* comparison pages instead.
const BASE_PATH = "/redock";

const isDev = process.env.NODE_ENV === "development";

// Read from the same variable the browser client uses, so the policy cannot
// drift from the project the app actually talks to. Realtime uses wss on the
// same host, which counts as a separate connect-src entry.
const supabaseOrigin = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const supabaseSocket = supabaseOrigin.replace(/^https:/, "wss:");

/**
 * Content Security Policy.
 *
 * script-src carries 'unsafe-inline', and that is a deliberate limit rather
 * than an oversight. Almost every page here is statically prerendered, and Next
 * inlines its hydration payload into that HTML at build time. Nonces are issued
 * per request, so a nonce-based policy would either not match the prebuilt
 * markup or force every page to be server-rendered on each hit. The strong
 * anti-XSS form of CSP is therefore not available without changing how the site
 * renders, which is not a trade worth making for a site with no user-generated
 * content.
 *
 * What this policy does buy: script, frame, image and connection targets are
 * restricted to an allowlist, so injected markup cannot pull code from an
 * attacker's host, exfiltrate to one, or post a form off-site. object-src and
 * base-uri close the two classic sinks that survive most policies.
 *
 * 'unsafe-eval' is added in dev only, because Next's hot reloader needs it.
 * Shipping it to production would hand back a chunk of what the policy is for.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com`,
  // framer-motion writes animation state to element style attributes.
  "style-src 'self' 'unsafe-inline'",
  // data: covers the inline SVG icons; the one remote image is the VCL badge.
  "img-src 'self' data: https://vibecodinglist.com",
  "font-src 'self'",
  ["connect-src 'self' https://api.stripe.com", supabaseOrigin, supabaseSocket]
    .filter(Boolean)
    .join(" "),
  // Stripe.js mounts iframes even when checkout is a full-page redirect.
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "form-action 'self' https://checkout.stripe.com",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
].join("; ");

/**
 * Response headers applied to everything this app serves.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },

  // Stops the browser second-guessing Content-Type, which is what turns an
  // uploaded or user-shaped response into executable script.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // No third-party framing, so the UI cannot be layered under an invisible
  // overlay and clicked on the user's behalf. frame-ancestors in the CSP above
  // is the modern equivalent; this stays for older browsers that ignore it.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },

  // Send the full URL only to ourselves. Licence keys and Stripe session ids
  // travel in query strings, and those must not ride outbound in a Referer.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Nothing here needs hardware. Denying it costs nothing and removes the
  // permission prompts entirely as an avenue.
  //
  // payment=() is safe only because checkout is a full-page redirect to
  // checkout.stripe.com, so the Payment Request API is never used on this
  // origin. Moving to on-page Stripe Elements with Apple Pay would need this
  // relaxed to payment=(self "https://js.stripe.com").
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },

  // HTTPS only from here on. No includeSubDomains or preload: this app is one
  // path on bhopstudio.com and must not commit sibling subdomains it does not
  // control to a policy they cannot opt out of.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

// Canonical URLs are emitted per-page in _app.tsx — a single site-wide value
// here would tell Google every page is the homepage.
const nextConfig = {
  reactStrictMode: true,
  basePath: BASE_PATH,

  // Version banner in responses; free reconnaissance for anyone fingerprinting.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
