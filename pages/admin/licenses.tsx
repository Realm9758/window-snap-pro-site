import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminShell, { adminFetch } from "../../components/admin/AdminShell";
import {
  CopyButton, PlanBadge, StatusDot,
  cardClass, formatDate, formatMoney,
} from "../../components/admin/ui";

interface LicenseRow {
  id: string;
  license_key: string;
  email: string;
  product_tier: string;
  subscription_status: string;
  current_period_end: string | null;
  active: boolean;
  created_at: string;
  amount_total: number | null;
  currency: string | null;
  activation_count: number;
  max_activations: number;
}

const PER_PAGE = 50;

export default function AdminLicenses() {
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  // Searching hits the database now, so it is debounced rather than filtering
  // an array that was already in memory.
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [formEmail, setFormEmail] = useState("");
  const [formPlan, setFormPlan] = useState<"free" | "pro">("pro");
  const [formExpiry, setFormExpiry] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newKey, setNewKey] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchLicenses = useCallback(async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) });
      if (debouncedSearch) params.set("q", debouncedSearch);

      const res = await adminFetch(`/api/admin/licenses?${params}`);
      if (!res?.ok) return;

      const data = await res.json();
      setLicenses(data.licenses ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
    } finally {
      setFetching(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchLicenses(); }, [fetchLicenses]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setNewKey("");
    setCreating(true);

    try {
      const res = await adminFetch("/api/admin/licenses", {
        method: "POST",
        body: JSON.stringify({
          email: formEmail,
          plan: formPlan,
          expires_at: formExpiry || undefined,
        }),
      });
      if (!res) return setCreateError("Your session has expired. Please sign in again.");

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
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this licence? This cannot be undone.")) return;
    setDeletingId(id);
    await adminFetch(`/api/admin/licenses?id=${id}`, { method: "DELETE" });
    setLicenses((prev) => prev.filter((l) => l.id !== id));
    setDeletingId(null);
  }

  return (
    <AdminShell title="Licences">
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Create */}
        <div className="lg:col-span-1">
          <div className={`${cardClass} p-6`}>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-5">Generate licence</h2>

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
                  className={inputClass}
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
                  className={inputClass}
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
                {creating ? <Spinner /> : (
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1.5a.75.75 0 01.75.75v4h4a.75.75 0 010 1.5h-4v4a.75.75 0 01-1.5 0v-4h-4a.75.75 0 010-1.5h4v-4A.75.75 0 018 1.5z"/>
                  </svg>
                )}
                Create licence
              </button>
            </form>

            <AnimatePresence>
              {newKey && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl"
                >
                  <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1.5">Licence created</p>
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
        </div>

        {/* Table */}
        <div className="lg:col-span-2">
          <div className={`${cardClass} overflow-hidden`}>
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white whitespace-nowrap">
                All licences
                <span className="ml-2 text-xs font-normal text-neutral-400 dark:text-neutral-500">({total})</span>
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
            ) : licenses.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm text-neutral-400 dark:text-neutral-500">
                  {debouncedSearch ? "No licences match your search." : "No licences yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800">
                      {["Licence key", "Email", "Plan", "Status", "Devices", "Paid", "Created", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-neutral-400 dark:text-neutral-500 first:pl-6 last:pr-6">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/60">
                    {licenses.map((license) => (
                      <tr
                        key={license.id}
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
                          {license.email ? (
                            // next/link so basePath is applied. A hand-written
                            // href has to hardcode /redock and breaks the day
                            // that prefix changes.
                            <Link
                              href={`/admin/customers?q=${encodeURIComponent(license.email)}`}
                              className="text-xs text-neutral-600 dark:text-neutral-400 max-w-[140px] truncate block hover:text-accent"
                              title={`Open ${license.email}`}
                            >
                              {license.email}
                            </Link>
                          ) : (
                            <span className="text-neutral-300 dark:text-neutral-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3"><PlanBadge tier={license.product_tier} /></td>
                        <td className="px-4 py-3"><StatusDot active={license.active} /></td>
                        <td className="px-4 py-3">
                          <span className={`text-xs tabular-nums ${
                            license.activation_count >= license.max_activations
                              ? "text-amber-600 dark:text-amber-500 font-medium"
                              : "text-neutral-500 dark:text-neutral-400"
                          }`}>
                            {license.activation_count}/{license.max_activations}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                            {license.amount_total != null
                              ? formatMoney(license.amount_total, license.currency ?? "GBP")
                              : <span className="text-neutral-300 dark:text-neutral-600">—</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-neutral-400 dark:text-neutral-500">
                            {formatDate(license.created_at)}
                          </span>
                        </td>
                        <td className="px-4 py-3 pr-6 text-right">
                          <button
                            onClick={() => handleDelete(license.id)}
                            disabled={deletingId === license.id}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition-all duration-150"
                            title="Delete licence"
                          >
                            {deletingId === license.id ? <Spinner /> : (
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                              </svg>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <PageButton onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>Previous</PageButton>
                  <PageButton onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>Next</PageButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

const inputClass =
  "w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all";

function PageButton({ onClick, disabled, children }: {
  onClick: () => void; disabled: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-accent/50 hover:text-accent disabled:opacity-40 disabled:hover:border-neutral-200 disabled:hover:text-neutral-600 dark:disabled:hover:border-neutral-700 transition-all duration-150"
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}
