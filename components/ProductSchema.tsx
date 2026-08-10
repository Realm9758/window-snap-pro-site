import Head from "next/head";
import { SITE_URL } from "../lib/site";

/**
 * SoftwareApplication schema for the homepage.
 *
 * This is how Google learns that the page is a paid Mac application rather than
 * an article about one: the price, the currency, the platform and the operating
 * system requirement all become machine-readable, which is what makes the page
 * eligible for a richer result than a plain blue link.
 *
 * Every value here has to match what a visitor actually sees on the page.
 * Marking up a price the page does not show is a structured-data violation and
 * a manual-action risk, so the £19 here is the same £19 in the hero and on the
 * pricing page.
 *
 * Deliberately no aggregateRating. There are no reviews yet, and inventing one
 * is exactly the kind of thing that earns a penalty.
 */
const SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Redock",
  applicationCategory: "UtilitiesApplication",
  applicationSubCategory: "Window manager",
  operatingSystem: "macOS 13.0 or later",
  processorRequirements: "Apple Silicon or Intel",
  softwareVersion: "1.3",
  url: SITE_URL,
  downloadUrl: `${SITE_URL}/download`,
  installUrl: `${SITE_URL}/download`,
  softwareHelp: `${SITE_URL}/changelog`,
  screenshot: `${SITE_URL}/og.png`,
  description:
    "Redock saves the size and position of every open window on every display and puts them back when you reconnect that setup. It also snaps windows to halves and corners and keeps a clipboard history.",
  featureList: [
    "Save a window layout and restore it on demand",
    "Layouts bound to a monitor setup restore themselves when you reconnect",
    "Drag a window to an edge to snap it, with a preview of where it lands",
    "Keyboard snapping to halves, corners and full screen",
    "Per-app rules for a default position on launch",
    "Clipboard history with search and pinning",
  ],
  offers: {
    "@type": "Offer",
    price: "19.00",
    priceCurrency: "GBP",
    availability: "https://schema.org/InStock",
    url: `${SITE_URL}/pricing`,
  },
  publisher: {
    "@type": "Organization",
    name: "bhopstudio",
    url: "https://bhopstudio.com",
  },
};

export default function ProductSchema() {
  return (
    <Head>
      <script
        type="application/ld+json"
        key="product-schema"
        // The object is a module constant with no user input in it, so there is
        // nothing here that could carry an injection.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }}
      />
    </Head>
  );
}
