import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "../lib/supabase-browser";
import AuthShell from "../components/AuthShell";
import { CONTACT_EMAIL } from "../lib/site";

type State = "working" | "failed";

/**
 * Where the links in our confirmation and reset emails land.
 *
 * Supabase can host this itself, at /auth/v1/verify, but that route bounces
 * through the redirect allow-list configured in the Supabase dashboard. This
 * site is served under /redock via a rewrite from another project, which is
 * exactly the kind of arrangement that allow-list gets wrong, and when it is
 * wrong the buyer lands somewhere that is not this site with no way back.
 *
 * Doing the exchange here keeps it in code: verifyOtp trades the one-time token
 * for a session, and the page then sends the visitor wherever that kind of
 * token was meant to take them.
 */
export default function Confirm() {
  const router = useRouter();
  const [state, setState] = useState<State>("working");

  useEffect(() => {
    // Query params are not populated on the first render of a static page.
    if (!router.isReady) return;

    const tokenHash = single(router.query.token_hash);
    const type = single(router.query.type);

    if (!tokenHash || (type !== "signup" && type !== "recovery")) {
      setState("failed");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { error } = await getSupabaseBrowser().auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });
        if (cancelled) return;

        if (error) {
          // Expired, already used, or tampered with. All three mean the same
          // thing to the person reading it: ask for a fresh link.
          console.warn("[confirm] verifyOtp:", error.message);
          setState("failed");
          return;
        }

        // replace, not push: the token is in this URL and the back button
        // should not walk into a link that has now been spent.
        router.replace(type === "recovery" ? "/reset-password" : "/profile");
      } catch (err) {
        if (cancelled) return;
        console.error("[confirm] verifyOtp threw:", err);
        setState("failed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (state === "working") {
    return (
      <AuthShell title="Confirming…">
        <div className="text-center py-6">
          <svg
            className="w-7 h-7 text-neutral-400 animate-spin mx-auto mb-4"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Confirming your link…
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="That link has expired">
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          That link no longer works
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          These links can only be used once, and they expire. Ask for a new one
          and it will work.
        </p>
        <div className="flex flex-col gap-2 mt-6">
          <Link href="/forgot-password" className="text-sm text-accent font-medium hover:underline">
            Send a new reset link
          </Link>
          <Link href="/login" className="text-sm text-neutral-500 dark:text-neutral-400 hover:underline">
            Back to log in
          </Link>
        </div>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed mt-6">
          Still stuck? Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    </AuthShell>
  );
}

function single(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}
