import Link from "next/link";
import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import AuthShell, { AuthError, authButton, authInput, authLabel } from "../components/AuthShell";
import { apiPath, CONTACT_EMAIL } from "../lib/site";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(apiPath("/api/auth/forgot"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Could not send that email. Try again in a moment.");
        setSubmitting(false);
        return;
      }

      setDone(true);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

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
          {/*
            Deliberately says "if". The server answers the same way whether or
            not that address has an account, so this screen must not imply one
            exists. Saying "we sent it" would leak exactly what the endpoint
            refuses to.
          */}
          <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            If{" "}
            <strong className="text-neutral-700 dark:text-neutral-300">{email}</strong>{" "}
            has a Redock account, a reset link is on its way. It expires in an hour.
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed mt-4">
            Bought Redock but never made an account? Your licence key was emailed
            at the time of purchase. Write to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
              {CONTACT_EMAIL}
            </a>{" "}
            and we will send it again.
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
      title="Reset your Redock password"
      heading="Reset your password"
      intro="Type the address you signed up with and we will send a link to set a new password."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="text-accent font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={authLabel}>Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className={authInput}
            placeholder="you@example.com"
          />
        </div>

        {error && <AuthError>{error}</AuthError>}

        <button type="submit" disabled={submitting} className={authButton}>
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
