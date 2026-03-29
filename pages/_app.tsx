import type { AppProps } from "next/app";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "../lib/auth-context";
import "../styles/globals.css";

export default function App({ Component, pageProps, router }: AppProps) {
  return (
    <AuthProvider>
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
