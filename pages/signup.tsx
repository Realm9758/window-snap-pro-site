import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, FormEvent } from "react";
import { motion } from "framer-motion";
import { getSupabaseBrowser } from "../lib/supabase-browser";
import { useAuth } from "../lib/auth-context";

export default function Signup() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/profile");
  }, [user, loading, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);

    const { error: authError } = await getSupabaseBrowser().auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/profile`,
      },
    });

    if (authError) {
      setError(authError.message);
      setSubmitting(false);
    } else {
      setDone(true);
    }
  }

  if (loading) return null;

  return (
    <>
      <Head>
        <title>Create Account — Window Snap Pro</title>
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
              Window Snap Pro
            </span>
          </Link>

          <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-8">
            {done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Check your email</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  We sent a confirmation link to <strong className="text-neutral-700 dark:text-neutral-300">{email}</strong>. Click it to activate your account.
                </p>
                <Link
                  href="/login"
                  className="inline-block mt-6 text-sm text-accent font-medium hover:underline"
                >
                  Back to log in
                </Link>
              </motion.div>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-neutral-900 dark:text-white mb-1">
                  Create your account
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-7">
                  Manage your license and subscription in one place.
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
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all duration-150"
                      placeholder="Min. 8 characters"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      Confirm password
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all duration-150"
                      placeholder="••••••••"
                    />
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg"
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
                    {submitting ? "Creating account…" : "Create account"}
                  </motion.button>
                </form>
              </>
            )}
          </div>

          {!done && (
            <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-5">
              Already have an account?{" "}
              <Link href="/login" className="text-accent font-medium hover:underline">
                Log in
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </>
  );
}
