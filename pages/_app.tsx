import type { AppProps } from "next/app";
import Head from "next/head";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "../lib/auth-context";
import { canonicalUrl } from "../lib/site";
import "../styles/globals.css";

export default function App({ Component, pageProps, router }: AppProps) {
  // This project is reachable at two hosts: bhopstudio.com/mac-window-manager
  // (the real one) and the raw *.vercel.app deployment URL. Identical content on
  // two hosts splits ranking signals, so every page declares which one counts.
  // Per-page, not site-wide — a single canonical would claim every page is the
  // homepage and de-index the rest.
  const canonical = canonicalUrl(router.asPath);

  return (
    <AuthProvider>
      <Head>
        <link rel="canonical" href={canonical} />
      </Head>
      <AnimatePresence mode="wait">
        <motion.div
          key={router.route}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <Component {...pageProps} />
        </motion.div>
      </AnimatePresence>
    </AuthProvider>
  );
}
