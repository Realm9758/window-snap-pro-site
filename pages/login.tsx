import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, FormEvent } from "react";
import { getSupabaseBrowser } from "../lib/supabase-browser";
import { authErrorMessage, authErrorCode } from "../lib/auth-errors";
import { useAuth } from "../lib/auth-context";
import AuthShell, { AuthError, authButton, authInput, authLabel } from "../components/AuthShell";
import { apiPath } from "../lib/site";

export default function Login() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [code, setCode]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resent, setResent]     = useState<"idle" | "sending" | "sent">("idle");

  /*
    Where to go after signing in. The admin dashboard sends people here with
    ?redirect=/admin, and dropping them on /profile instead was a small daily
    annoyance. Only same-site paths are honoured: an absolute URL in a query
    string is how an open redirect starts.
  */
  const target = (() => {
    const raw = router.query.redirect;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value && value.startsWith("/") && !value.startsWith("//") ? value : "/profile";
  })();

  useEffect(() => {
    if (!loading && user) router.replace(target);
  }, [user, loading, router, target]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCode("");
    setResent("idle");
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
        setCode(authErrorCode(authError));
        setSubmitting(false);
        return;
      }

      router.push(target);
    } catch (err) {
      setError(authErrorMessage(err, "login"));
      setSubmitting(false);
    }
  }

  /*
    An unconfirmed account is a dead end unless the confirmation email can be
    sent again, and the original one may well have been eaten by the mail quota
    this site used to run into. The signup route re-issues the link for an
    account that is not confirmed yet, so it does the job here too, using the
    password already typed into the form.
  */
  async function handleResendConfirmation() {
    setResent("sending");
    try {
      const res = await fetch(apiPath("/api/auth/signup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setResent("sent");
        return;
      }

      // Already confirmed: the account is fine and the password is the problem.
      if (data.code === "email_exists") {
        setError("This account is already confirmed. Check the password, or reset it below.");
        setCode("invalid_credentials");
      } else {
        setError(data.error ?? "Could not send that email. Try again in a moment.");
      }
      setResent("idle");
    } catch {
      setError("Could not send that email. Check your connection and try again.");
      setResent("idle");
    }
  }

  if (loading) return null;

  return (
    <AuthShell
      title="Log in to Redock"
      heading="Welcome back"
      intro="Log in to manage your licence and activated Macs."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent font-medium hover:underline">
            Create one
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
            className={authInput}
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="password" className={authLabel}>Password</label>
            {/*
              There was no way out of a forgotten password at all: the form
              asked for one and offered nothing else. Anyone who had paid and
              could not remember theirs had no route to their own licence key.
            */}
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-accent hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={authInput}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="flex flex-col gap-2">
            <AuthError>{error}</AuthError>

            {code === "email_not_confirmed" && (
              resent === "sent" ? (
                <p className="text-xs text-green-600 dark:text-green-400">
                  Sent. Open the link in that email, then log in.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resent === "sending" || !email || !password}
                  className="self-start text-xs font-medium text-accent hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {resent === "sending" ? "Sending…" : "Send the confirmation email again"}
                </button>
              )
            )}
          </div>
        )}

        <button type="submit" disabled={submitting} className={authButton}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
