import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, FormEvent } from "react";
import { motion } from "framer-motion";
import { getSupabaseBrowser } from "../lib/supabase-browser";
import { authErrorMessage } from "../lib/auth-errors";
import { useAuth } from "../lib/auth-context";

export default function Login() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) router.replace("/profile");
  }, [user, loading, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // try/catch as well as the returned error: a build with no Supabase keys,
    // or a dropped connection, throws here instead of answering. Without this
    // the button sat on "Logging in…" for ever and said nothing.
    try {
      const { error: authError } = await getSupabaseBrowser().auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError(authErrorMessage(authError, "login"));
        setSubmitting(false);
        return;
      }

      router.push("/profile");
    } catch (err) {
      setError(authErrorMessage(err, "login"));
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <>
      <Head>
        <title>Log in to Redock</title>
      </Head>
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 justify-center mb-10 group">
            <div className="w-8 h-8 rounded-[10px] bg-accent flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" />
                <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.7" />
                <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.7" />
                <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.4" />
              </svg>
            </div>
            <span className="font-semibold text-base tracking-tight text-neutral-900 dark:text-white">
              Redock
            </span>
          </Link>

          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-8">
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-7">
              Log in to manage your license and subscription.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all duration-150"
                  placeholder="you@example.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Password
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all duration-150"
                  placeholder="••••••••"
                />
              </div>

              {/*
                role="alert" so a screen reader announces the failure: the
                message appears below the fields, after focus has already moved
                on, and is otherwise silent. red-600 rather than red-500 clears
                4.5:1 against the tinted background at this size.
              */}
              {error && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm leading-relaxed text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2.5 rounded-lg"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: submitting ? 1 : 1.02 }}
                whileTap={{ scale: submitting ? 1 : 0.98 }}
                className="w-full py-3 bg-accent text-white font-semibold text-sm rounded-xl shadow-sm shadow-accent/30 hover:bg-accent/90 transition-all duration-150 disabled:opacity-60 mt-1"
              >
                {submitting ? "Logging in…" : "Log in"}
              </motion.button>
            </form>
          </div>

          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-5">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-accent font-medium hover:underline">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </>
  );
}
