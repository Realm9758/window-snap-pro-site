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
 * Absolute public URL for a route.
 *
 * `router.asPath` excludes basePath (Next strips it), so it is added back here.
 * Query strings and hashes are dropped: `?ref=` variants of one page are the
 * same page, and letting them through would create duplicates.
 */
export function canonicalUrl(asPath: string): string {
  const pathOnly = asPath.split(/[?#]/)[0];
  const clean = pathOnly === "/" ? "" : pathOnly.replace(/\/$/, "");
  return `${SITE_URL}${clean}`;
}
