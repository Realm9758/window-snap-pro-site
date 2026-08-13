import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, FormEvent } from "react";
import { getSupabaseBrowser } from "../lib/supabase-browser";
import { authErrorMessage } from "../lib/auth-errors";
import { useAuth } from "../lib/auth-context";
import AuthShell, { AuthError, authButton, authInput, authLabel } from "../components/AuthShell";

/**
 * Set a new password.
 *
 * Only reachable with the session that /confirm establishes from a recovery
 * link, which is what makes it safe: the session is proof the visitor can read
 * the mailbox on the account. Landing here without one means the link was never
 * followed, so the page says so rather than showing a form that cannot work.
 */
export default function ResetPassword() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);

  useEffect(() => {
    if (done) {
      const timer = setTimeout(() => router.replace("/profile"), 1600);
      return () => clearTimeout(timer);
    }
  }, [done, router]);

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
    try {
      const { error: authError } = await getSupabaseBrowser().auth.updateUser({ password });
      if (authError) {
        setError(authErrorMessage(authError, "signup"));
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch (err) {
      setError(authErrorMessage(err, "signup"));
      setSubmitting(false);
    }
  }

  if (loading) return null;

  if (!user) {
    return (
      <AuthShell title="Reset your Redock password" heading="Open the link in your email">
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          This page needs the reset link we emailed you. Open that link and it
          will bring you straight back here.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block mt-6 text-sm text-accent font-medium hover:underline"
        >
          Send me a reset link
        </Link>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password changed">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            Password changed
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Taking you to your account…
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      heading="Choose a new password"
      intro={<>Signed in as <strong className="text-neutral-700 dark:text-neutral-300">{user.email}</strong>.</>}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className={authLabel}>New password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            className={authInput}
            placeholder="Min. 8 characters"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm" className={authLabel}>Confirm new password</label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className={authInput}
            placeholder="••••••••"
          />
        </div>

        {error && <AuthError>{error}</AuthError>}

        <button type="submit" disabled={submitting} className={authButton}>
          {submitting ? "Saving…" : "Save new password"}
        </button>
      </form>
    </AuthShell>
  );
}
