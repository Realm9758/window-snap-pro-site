import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, FormEvent } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth-context";
import AuthShell, { AuthError, authButton, authInput, authLabel } from "../components/AuthShell";
import { apiPath, CONTACT_EMAIL } from "../lib/site";
import { issueFormToken } from "../lib/signupGuard";

/**
 * Account creation.
 *
 * This form used to call supabase.auth.signUp from the browser, which handed
 * the confirmation email to Supabase's built-in mailer and its two-an-hour cap.
 * It now posts to /api/auth/signup, which generates the link server-side and
 * sends it through Resend. See that route for the full account of what was
 * failing and why the failure was unreadable.
 *
 * Two of the fields below are not for the person filling it in. `formToken` is
 * a signed timestamp proving this page was actually rendered, and `website` is
 * a honeypot that only a bot will fill. lib/signupGuard.ts explains what each
 * one caught.
 */
export default function Signup({ formToken }: { formToken: string }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);
  const [website, setWebsite]   = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/profile");
  }, [user, loading, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setErrorCode("");

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
      const res = await fetch(apiPath("/api/auth/signup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          formToken,
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Could not create the account. Try again.");
        setErrorCode(data.code ?? "");
        setSubmitting(false);
        return;
      }

      setDone(true);
    } catch {
      // The request never landed: offline, or the deployment is down.
      setError(
        `We could not reach the server. Check your connection and try again, ` +
          `or email ${CONTACT_EMAIL}.`
      );
      setSubmitting(false);
    }
  }

  if (loading) return null;

  if (done) {
    return (
      <AuthShell title="Check your email">
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
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            Check your email
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            We sent a confirmation link to{" "}
            <strong className="text-neutral-700 dark:text-neutral-300">{email}</strong>.
            Click it to activate your account.
          </p>
          {/*
            Every "check your email" screen needs the sentence that follows,
            because the one thing it cannot promise is that the mail arrived.
          */}
          <p className="text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed mt-4">
            Nothing after a few minutes? Look in spam, then write to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
              {CONTACT_EMAIL}
            </a>{" "}
            and we will confirm the account by hand.
          </p>
          <Link href="/login" className="inline-block mt-6 text-sm text-accent font-medium hover:underline">
            Back to log in
          </Link>
        </motion.div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create a Redock account"
      heading="Create your account"
      intro="Manage your licence, key and activated Macs in one place."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/*
          Off-screen rather than display:none, because a bot that reads
          computed styles skips a hidden input but still fills a positioned
          one. aria-hidden and tabIndex keep it away from screen readers and
          the tab order, so nobody filling this form in earnest ever meets it.
        */}
        <div aria-hidden="true" className="absolute left-[-9999px] w-px h-px overflow-hidden">
          <label htmlFor="website">Leave this field empty</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={authLabel}>Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={authInput}
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className={authLabel}>Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={authInput}
            placeholder="Min. 8 characters"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm" className={authLabel}>Confirm password</label>
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

        {error && (
          <div className="flex flex-col gap-2">
            <AuthError>{error}</AuthError>
            {/*
              An error that names the way out is worth twice one that does not.
              "That email already has an account" is only useful next to the
              two links that resolve it.
            */}
            {errorCode === "email_exists" && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                <Link href="/login" className="text-accent font-medium hover:underline">
                  Log in
                </Link>
                {" or "}
                <Link href="/forgot-password" className="text-accent font-medium hover:underline">
                  reset your password
                </Link>
                .
              </p>
            )}
          </div>
        )}

        <button type="submit" disabled={submitting} className={authButton}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}

/**
 * Mints the signed timestamp the API route checks. Rendering per request is
 * the point: a token baked in at build time would be one value shared by
 * everyone and would age out within hours of a deploy.
 */
export function getServerSideProps() {
  return { props: { formToken: issueFormToken() } };
}
