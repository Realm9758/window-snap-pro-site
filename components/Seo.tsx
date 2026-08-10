import Head from "next/head";

/**
 * Per-page metadata.
 *
 * The tags that never vary by page (og:url, og:image, site name, card type)
 * live in _app.tsx, which has the router and so can build an absolute URL. This
 * component owns only what actually changes: the title, the description, and
 * the social copy that should mirror them.
 *
 * Before this existed, _document.tsx emitted a site-wide description alongside
 * each page's own, so every page shipped two competing <meta name="description">
 * tags and Google picked whichever it preferred.
 *
 * `noindex` is for pages that are useful to a customer and worthless in search:
 * the licence-key screen, account pages, the admin table. Thin, duplicated, or
 * private, and in the success page's case it puts a licence key in a URL that
 * should never be crawled.
 */
export default function Seo({
  title,
  description,
  noindex = false,
}: {
  title: string;
  description?: string;
  noindex?: boolean;
}) {
  return (
    <Head>
      <title>{title}</title>
      <meta property="og:title" content={title} key="og:title" />
      <meta name="twitter:title" content={title} key="twitter:title" />

      {description && (
        <>
          <meta name="description" content={description} key="description" />
          <meta property="og:description" content={description} key="og:description" />
          <meta name="twitter:description" content={description} key="twitter:description" />
        </>
      )}

      {noindex && <meta name="robots" content="noindex, follow" key="robots" />}
    </Head>
  );
}
