import type { GetServerSideProps } from "next";
import { SITE_URL } from "../lib/site";

/**
 * Sitemap for the Redock pages, served at /redock/sitemap.xml.
 *
 * Built as a page rather than a file in /public because every URL has to be
 * absolute and carry the basePath. Hardcoding bhopstudio.com/redock into a
 * static file would silently rot the moment the origin changed, and SITE_URL is
 * already the single source of truth for it.
 *
 * Only pages worth ranking are listed. Account, checkout and admin routes are
 * either thin, private, or duplicated per user, and the success page carries a
 * licence key in its URL. Those are marked noindex by <Seo> and left out here.
 *
 * Google reads robots.txt from the domain root, which this project does not own
 * (it is served through a rewrite from the bhopstudio app), so the reference to
 * this file lives in that project's robots.ts.
 */
const PAGES: { path: string; priority: string; changefreq: string }[] = [
  { path: "", priority: "1.0", changefreq: "weekly" },
  { path: "/pricing", priority: "0.9", changefreq: "monthly" },
  { path: "/download", priority: "0.9", changefreq: "weekly" },
  { path: "/changelog", priority: "0.6", changefreq: "weekly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
];

function buildSitemap(lastmod: string): string {
  const urls = PAGES.map(
    ({ path, priority, changefreq }) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const lastmod = new Date().toISOString().split("T")[0];

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  res.write(buildSitemap(lastmod));
  res.end();

  return { props: {} };
};

// Never rendered: getServerSideProps writes the response and ends it.
export default function Sitemap() {
  return null;
}
