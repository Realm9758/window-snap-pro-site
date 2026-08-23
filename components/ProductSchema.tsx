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
 * a manual-action risk, so the £19.99 here is the same £19.99 in the hero and on the
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
  softwareVersion: "1.9.2",
  url: SITE_URL,
  downloadUrl: `${SITE_URL}/download`,
  installUrl: `${SITE_URL}/download`,
  softwareHelp: `${SITE_URL}/changelog`,
  screenshot: `${SITE_URL}/og.png`,
  description:
    "Redock saves complete Mac workspaces, routes apps automatically and restores every window across displays when a monitor setup reconnects.",
  featureList: [
    "Save complete multi-display workspaces",
    "Restore layouts automatically when displays reconnect",
    "Route apps to a chosen display and position on launch",
    "Restore windows on demand with a workspace shortcut",
    "Local clipboard history with search, images and pinning",
    "Window snapping by keyboard, menu or configurable drag zones",
  ],
  offers: {
    "@type": "Offer",
    price: "19.99",
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
