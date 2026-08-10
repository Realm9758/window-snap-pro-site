/**
 * Where this site actually lives.
 *
 * It is served at bhopstudio.com/redock via a rewrite from the
 * bhopstudio project, so the public URL is NOT the deployment host. Anything
 * user-visible or crawler-visible — canonicals, Stripe return URLs, emailed
 * links, sitemap entries — has to use the public origin, or buyers get bounced
 * onto a raw *.vercel.app address mid-checkout.
 */

export const BASE_PATH = "/redock";

/** Public origin, e.g. https://bhopstudio.com — no trailing slash. */
export const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://bhopstudio.com"
).replace(/\/$/, "");

/** Public base, e.g. https://bhopstudio.com/redock */
export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`;

/**
 * The one address customers write to. Defined once because it appears in the
 * footer, the privacy policy, checkout error recovery and the licence email,
 * and those drifted apart before: the privacy page was pointing at
 * windowsnappro.com, a domain we do not own.
 */
export const CONTACT_EMAIL = "raf@bhopstudio.com";

/**
 * Absolute public URL for a route.
 *
 * `router.asPath` excludes basePath (Next strips it), so it is added back here.
 * Query strings and hashes are dropped: `?ref=` variants of one page are the
 * same page, and letting them through would create duplicates.
 */
/**
 * Client-side path to an API route.
 *
 * REQUIRED for every browser fetch. `basePath` rewrites Next's <Link> and the
 * server's routing table, but `fetch("/api/x")` is resolved by the browser
 * against the origin — so from /redock/pricing it silently hits
 * bhopstudio.com/api/x and 404s. Every call must go through here.
 */
export function apiPath(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Path to a file in /public.
 *
 * Same trap as apiPath: `basePath` rewrites next/link and next/image, but a raw
 * <a href> or <img src> is resolved against the origin, so /Redock.dmg 404s from
 * a page served under /redock. Every hand-written asset URL goes through here.
 */
export function assetPath(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

export function canonicalUrl(asPath: string): string {
  const pathOnly = asPath.split(/[?#]/)[0];
  const clean = pathOnly === "/" ? "" : pathOnly.replace(/\/$/, "");
  return `${SITE_URL}${clean}`;
}
