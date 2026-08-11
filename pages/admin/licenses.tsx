import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSupabaseBrowser } from "../../lib/supabase-browser";
import { useAuth } from "../../lib/auth-context";
import { apiPath } from "../../lib/site";

interface LicenseRow {
  id: string;
  license_key: string;
  email: string;
  product_tier: string;
  subscription_status: string;
  current_period_end: string | null;
  active: boolean;
  created_at: string;
}

interface RecentSignup {
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

interface SiteStats {
  users: {
    total: number;
    last7: number;
    last30: number;
    recent: RecentSignup[];
  };
  downloads: {
    /** false until the download_events migration has been run in Supabase */
    available: boolean;
    total: number;
    last7: number;
    last30: number;
    daily: { date: string; count: number }[];
  };
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${active ? "text-green-600 dark:text-green-400" : "text-neutral-400"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-neutral-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function PlanBadge({ tier }: { tier: string }) {
  const isPro = tier === "pro";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
      isPro
        ? "bg-accent/10 dark:bg-accent/20 text-accent"
        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
    }`}>
      {isPro ? "Pro" : "Free"}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="text-xs text-neutral-400 hover:text-accent transition-colors duration-100 ml-2"
      title="Copy"
    >
      {copied ? (
        <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="8" height="10" rx="1.5"/>
          <path d="M4 4V3a1 1 0 011-1h6a1 1 0 011 1v1"/>
        </svg>
      )}
    </button>
  );
}

const cardClass =
  "rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.04)]";

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className={`${cardClass} p-5`}>
      <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-neutral-900 dark:text-white tabular-nums">{value}</p>
      {sub && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{sub}</p>}
    </div>
  );
}

function formatDay(isoDate: string) {
  // Buckets are UTC days; format in UTC too, or the label can drift a day.
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function DownloadsChart({ daily }: { daily: { date: string; count: number }[] }) {
  const max = Math.max(...daily.map((d) => d.count), 0);
  const peakIndex = max > 0 ? daily.findIndex((d) => d.count === max) : -1;

  return (
    <div>
      <div className="flex items-end gap-[3px] h-28 border-b border-neutral-100 dark:border-neutral-800">
        {daily.map((d, i) => (
          <div key={d.date} className="relative flex-1 h-full flex items-end justify-center group">
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg bg-neutral-900 dark:bg-neutral-700 text-white text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-100 z-10">
              {d.count} {d.count === 1 ? "download" : "downloads"} · {formatDay(d.date)}
            </div>
            {i === peakIndex && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0.5 text-[10px] font-medium text-neutral-500 dark:text-neutral-400 tabular-nums group-hover:opacity-0 transition-opacity duration-100">
                {d.count}
              </span>
            )}
            {/* Zero days keep a faint 2px stub so the day stays visible */}
            <div
              className="w-full rounded-t-[4px] bg-accent"
              style={
                d.count === 0
                  ? { height: "2px", opacity: 0.15 }
                  : { height: `${Math.max((d.count / max) * 100, 4)}%` }
              }
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
          {daily.length > 0 ? formatDay(daily[0].date) : ""}
        </span>
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
          {daily.length > 0 ? formatDay(daily[daily.length - 1].date) : ""}
        </span>
      </div>
    </div>
  );
}

export default function AdminLicenses() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [licenses, setLicenses]     = useState<LicenseRow[]>([]);
  const [fetching, setFetching]     = useState(true);
  const [stats, setStats]           = useState<SiteStats | null>(null);

  /**
   * Authorisation is a separate question from authentication, and this page
   * used to conflate them: it rendered the whole admin shell as soon as someone
   * was signed in, then swapped to Access Denied once the API came back 403.
   * Any signed-in non-admin saw the interface for the length of that round trip.
   *
   * Nothing renders now until the API has actually said yes. Starts unresolved
   * and fails closed: only "allowed" reaches the admin UI.
   */
  const [access, setAccess] =
    useState<"checking" | "allowed" | "denied" | "error">("checking");

  // Create form
  const [formEmail, setFormEmail]       = useState("");
  const [formPlan, setFormPlan]         = useState<"free" | "pro">("pro");
  const [formExpiry, setFormExpiry]     = useState("");
  const [creating, setCreating]         = useState(false);
  const [createError, setCreateError]   = useState("");
  const [newKey, setNewKey]             = useState("");

  // Delete state
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState("");

  const getToken = useCallback(async () => {
    const { data: { session } } = await getSupabaseBrowser().auth.getSession();
    return session?.access_token ?? null;
  }, []);

  const fetchLicenses = useCallback(async () => {
    const token = await getToken();
    // No token means not signed in, which the redirect effect below handles.
    // Access stays unresolved, so nothing renders in the meantime.
    if (!token) return;

    setFetching(true);

    try {
      const res = await fetch(apiPath("/api/admin/licenses"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        setAccess("denied");
        return;
      }

      // Anything else that is not a success is treated as not-allowed too, so
      // a failing API can never fall through into the admin interface.
      if (!res.ok) {
        setAccess("error");
        return;
      }

      const data = await res.json();
      setLicenses(data.licenses ?? []);
      setAccess("allowed");
    } catch {
      setAccess("error");
    } finally {
      setFetching(false);
    }
  }, [getToken]);

  // Analytics ride alongside the licence list but never gate it: if this
  // call fails, the section shows placeholders and the rest still works.
  const fetchStats = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch(apiPath("/api/admin/stats"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setStats(await res.json());
    } catch {
      // Placeholders stay up; nothing else to do.
    }
  }, [getToken]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchLicenses();
      fetchStats();
    }
  }, [user, fetchLicenses, fetchStats]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setNewKey("");
    setCreating(true);

    const token = await getToken();
    const res = await fetch(apiPath("/api/admin/licenses"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: formEmail,
        plan: formPlan,
        expires_at: formExpiry || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setCreateError(data.error || "Failed to create license.");
    } else {
      setNewKey(data.license.license_key);
      setFormEmail("");
      setFormPlan("pro");
      setFormExpiry("");
      await fetchLicenses();
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this license? This cannot be undone.")) return;
    setDeletingId(id);

    const token = await getToken();
    await fetch(apiPath(`/api/admin/licenses?id=${id}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setLicenses((prev) => prev.filter((l) => l.id !== id));
    setDeletingId(null);
  }

  const filtered = licenses.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.license_key.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.product_tier.toLowerCase().includes(q)
    );
  });

  if (loading || !user) return null;

  // Signed in is not the same as allowed. Until the API has confirmed it,
  // nothing of this page exists, not even its shell.
  if (access === "checking") return null;

  if (access === "denied") {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">⛔</p>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">You are not authorised to view this page.</p>
        </div>
      </div>
    );
  }

  if (access === "error") {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Could not load licenses</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
            The license service did not respond. Your permissions have not changed.
          </p>
          <button
            onClick={() => {
              setAccess("checking");
              fetchLicenses();
            }}
            className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-all duration-150 shadow-sm shadow-accent/25"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin dashboard</title>
      </Head>

      <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] transition-colors duration-300">
        {/* Top bar */}
        <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white"/>
                  <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.7"/>
                  <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.7"/>
                  <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.4"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">Admin</span>
              <span className="text-neutral-300 dark:text-neutral-700">/</span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Dashboard</span>
            </div>
            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">{user.email}</span>
          </div>
        </div>

        <main className="max-w-6xl mx-auto px-6 py-10">

          {/* ── Site analytics ── */}
          <motion.section
            custom={0} variants={fadeUp} initial="hidden" animate="show"
            className="mb-6"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <StatTile
                label="Accounts"
                value={stats ? String(stats.users.total) : "—"}
                sub={stats ? `+${stats.users.last7} this week` : undefined}
              />
              <StatTile
                label="New accounts · 30 days"
                value={stats ? String(stats.users.last30) : "—"}
              />
              <StatTile
                label="Downloads"
                value={stats?.downloads.available ? String(stats.downloads.total) : "—"}
                sub={stats?.downloads.available ? `+${stats.downloads.last7} this week` : undefined}
              />
              <StatTile
                label="Downloads · 30 days"
                value={stats?.downloads.available ? String(stats.downloads.last30) : "—"}
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              {/* Daily downloads */}
              <div className={`${cardClass} p-5 lg:col-span-2`}>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Downloads</h2>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">Last 14 days</span>
                </div>
                {stats === null ? (
                  <div className="h-28 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
                ) : stats.downloads.available ? (
                  <DownloadsChart daily={stats.downloads.daily} />
                ) : (
                  <div className="h-28 flex items-center justify-center px-6 text-center">
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed">
                      Download tracking is not set up yet. Run the download_events
                      section of sql/schema.sql in the Supabase SQL editor, then
                      reload this page.
                    </p>
                  </div>
                )}
              </div>

              {/* Recent signups */}
              <div className={`${cardClass} p-5`}>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Recent signups</h2>
                {stats === null ? (
                  <div className="flex flex-col gap-2 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-7 bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
                    ))}
                  </div>
                ) : stats.users.recent.length === 0 ? (
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">No accounts yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2.5">
                    {stats.users.recent.map((u) => (
                      <li key={`${u.email}-${u.created_at}`} className="flex items-center justify-between gap-3">
                        <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                          {u.email ?? <span className="text-neutral-300 dark:text-neutral-600">no email</span>}
                        </span>
                        <span className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap tabular-nums">
                          {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.section>

          <div className="grid lg:grid-cols-3 gap-6">

            {/* ── Create License Form ── */}
            <motion.div
              custom={1} variants={fadeUp} initial="hidden" animate="show"
              className="lg:col-span-1"
            >
              <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-6">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-5">Generate License</h2>

                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                      Email <span className="text-neutral-400">(optional)</span>
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Plan</label>
                    <div className="flex gap-2">
                      {(["free", "pro"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormPlan(p)}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all duration-150 capitalize ${
                            formPlan === p
                              ? "bg-accent text-white border-accent shadow-sm shadow-accent/25"
                              : "bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-accent/50"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                      Expiry date <span className="text-neutral-400">(optional)</span>
                    </label>
                    <input
                      type="date"
                      value={formExpiry}
                      onChange={(e) => setFormExpiry(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                    />
                  </div>

                  {createError && (
                    <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                      {createError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2 shadow-sm shadow-accent/25"
                  >
                    {creating ? (
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 1.5a.75.75 0 01.75.75v4h4a.75.75 0 010 1.5h-4v4a.75.75 0 01-1.5 0v-4h-4a.75.75 0 010-1.5h4v-4A.75.75 0 018 1.5z"/>
                      </svg>
                    )}
                    Create License
                  </button>
                </form>

                {/* New key display */}
                <AnimatePresence>
                  {newKey && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl"
                    >
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1.5">
                        License created
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono font-bold text-neutral-900 dark:text-white tracking-wider flex-1 break-all">
                          {newKey}
                        </code>
                        <CopyButton text={newKey} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Stats card */}
              <motion.div
                custom={2} variants={fadeUp} initial="hidden" animate="show"
                className="mt-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">Overview</p>
                <div className="flex flex-col gap-2.5">
                  {[
                    { label: "Total licenses", value: licenses.length },
                    { label: "Pro licenses", value: licenses.filter((l) => l.product_tier === "pro").length },
                    { label: "Active", value: licenses.filter((l) => l.active).length },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">{stat.label}</span>
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* ── License Table ── */}
            <motion.div
              custom={3} variants={fadeUp} initial="hidden" animate="show"
              className="lg:col-span-2"
            >
              <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-[0_4px_24px_rgba(0,0,0,0.04)] overflow-hidden">
                {/* Table header */}
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4">
                  <h2 className="text-sm font-semibold text-neutral-900 dark:text-white whitespace-nowrap">
                    All Licenses
                    <span className="ml-2 text-xs font-normal text-neutral-400 dark:text-neutral-500">
                      ({filtered.length})
                    </span>
                  </h2>
                  <input
                    type="text"
                    placeholder="Search key, email, plan…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  />
                </div>

                {fetching ? (
                  <div className="px-6 py-12 flex flex-col gap-3 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <p className="text-sm text-neutral-400 dark:text-neutral-500">
                      {search ? "No licenses match your search." : "No licenses yet."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-neutral-100 dark:border-neutral-800">
                          {["License Key", "Email", "Plan", "Status", "Expires", "Created", ""].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-neutral-400 dark:text-neutral-500 first:pl-6 last:pr-6">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/60">
                        {filtered.map((license) => (
                          <motion.tr
                            key={license.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors duration-100 group"
                          >
                            <td className="px-4 py-3 pl-6">
                              <div className="flex items-center">
                                <span className="font-mono text-xs font-medium text-neutral-900 dark:text-white tracking-wider">
                                  {license.license_key}
                                </span>
                                <CopyButton text={license.license_key} />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-neutral-600 dark:text-neutral-400 max-w-[140px] truncate block">
                                {license.email || <span className="text-neutral-300 dark:text-neutral-600">—</span>}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <PlanBadge tier={license.product_tier} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusDot active={license.active} />
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {license.current_period_end
                                  ? new Date(license.current_period_end).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                                  : <span className="text-neutral-300 dark:text-neutral-600">—</span>}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                {new Date(license.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </td>
                            <td className="px-4 py-3 pr-6 text-right">
                              <button
                                onClick={() => handleDelete(license.id)}
                                disabled={deletingId === license.id}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition-all duration-150"
                                title="Delete license"
                              >
                                {deletingId === license.id ? (
                                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                    <path d="M10 11v6M14 11v6"/>
                                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                                  </svg>
                                )}
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </main>
      </div>
    </>
  );
}
