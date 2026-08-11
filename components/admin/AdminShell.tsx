import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "../../lib/supabase-browser";
import { useAuth } from "../../lib/auth-context";
import { apiPath } from "../../lib/site";

/**
 * The frame every admin page sits in, and the gate that decides whether any of
 * it renders.
 *
 * Authorisation is a separate question from authentication, and the original
 * page conflated them: it drew the whole admin interface as soon as somebody
 * was signed in, then swapped to Access Denied once the API returned 403. Any
 * signed-in non-admin saw the interface for the length of that round trip.
 *
 * Nothing renders until the API has said yes. The state starts unresolved and
 * fails closed, so only "allowed" reaches the children. This lives in one place
 * precisely so three pages cannot drift into three versions of it.
 */

export type Access = "checking" | "allowed" | "denied" | "error";

/** Fetch with the caller's bearer token attached. Null if not signed in. */
export async function adminFetch(path: string, init?: RequestInit): Promise<Response | null> {
  const { data: { session } } = await getSupabaseBrowser().auth.getSession();
  if (!session) return null;
  return fetch(apiPath(path), {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${session.access_token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
}

/**
 * Resolves whether the signed-in user is the admin, by asking the API rather
 * than trusting anything the browser knows.
 */
export function useAdminGate() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [access, setAccess] = useState<Access>("checking");

  const check = useCallback(async () => {
    const res = await adminFetch("/api/admin/stats");
    // No session: the redirect effect below handles it. Access stays
    // unresolved so nothing renders in the meantime.
    if (!res) return;

    if (res.status === 403) return setAccess("denied");
    // Anything other than a success is treated as not-allowed, so a failing
    // API can never fall through into the admin interface.
    if (!res.ok) return setAccess("error");
    setAccess("allowed");
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/admin");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) check().catch(() => setAccess("error"));
  }, [user, check]);

  return { access, retry: () => { setAccess("checking"); check().catch(() => setAccess("error")); } };
}

const NAV = [
  { href: "/admin",           label: "Overview" },
  { href: "/admin/licenses",  label: "Licences" },
  { href: "/admin/customers", label: "Customers" },
];

export default function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { access, retry } = useAdminGate();

  if (loading || !user) return null;
  if (access === "checking") return null;

  if (access === "denied") {
    return (
      <Centered>
        <p className="text-4xl mb-4">⛔</p>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          You are not authorised to view this page.
        </p>
      </Centered>
    );
  }

  if (access === "error") {
    return (
      <Centered>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
          Could not reach the admin service
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
          Your permissions have not changed.
        </p>
        <button
          onClick={retry}
          className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-all duration-150 shadow-sm shadow-accent/25"
        >
          Try again
        </button>
      </Centered>
    );
  }

  return (
    <>
      <Head><title>{`${title} · Redock admin`}</title></Head>

      <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] transition-colors duration-300">
        <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white"/>
                  <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.7"/>
                  <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.7"/>
                  <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.4"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">Admin</span>
            </div>
            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono truncate">
              {user.email}
            </span>
          </div>

          <nav className="max-w-6xl mx-auto px-6 flex gap-1 -mb-px overflow-x-auto">
            {NAV.map((item) => {
              const active = router.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors duration-150 ${
                    active
                      ? "border-accent text-accent"
                      : "border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
      </div>
    </>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="text-center">{children}</div>
    </div>
  );
}
