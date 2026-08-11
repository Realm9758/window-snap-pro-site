import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import AdminShell, { adminFetch } from "../../components/admin/AdminShell";
import {
  Card, CopyButton, PlanBadge, StatusDot,
  cardClass, formatDate, formatMoney, relativeDays,
} from "../../components/admin/ui";

/**
 * One person, everything about them, and the three things support needs to do.
 *
 * The information lives in three systems: the account in Supabase Auth, the
 * licence and its devices in Postgres, the payment in Stripe. Answering a
 * support email used to mean opening all three by hand.
 */

interface Device {
  id: string;
  device_id: string | null;
  device_name: string | null;
  activated_at: string;
  last_seen_at: string;
  app_version: string | null;
  os_version: string | null;
}

interface License {
  id: string;
  license_key: string;
  email: string;
  product_tier: string;
  subscription_status: string;
  active: boolean;
  created_at: string;
  current_period_end: string | null;
  activation_count: number;
  max_activations: number;
  amount_total: number | null;
  currency: string | null;
  stripe_customer_id: string | null;
}

interface Customer {
  found: boolean;
  email: string;
  account: { id: string; email: string; created_at: string; last_sign_in_at: string | null } | null;
  license: License | null;
  devices: Device[];
  stripeUrl: string | null;
}

type SearchResult = { email: string; license_key: string; product_tier: string; active: boolean };

export default function AdminCustomers() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const openCustomer = useCallback(async (email: string) => {
    setLoading(true);
    setNotFound(false);
    setCustomer(null);
    setResults([]);
    try {
      const res = await adminFetch(`/api/admin/customer?q=${encodeURIComponent(email)}`);
      if (res?.status === 404) return setNotFound(true);
      if (!res?.ok) return setNotFound(true);
      setCustomer(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  // Deep-linked from the licence table, so a row click lands straight on the
  // person rather than on an empty search box.
  useEffect(() => {
    const q = router.query.q;
    if (typeof q === "string" && q) {
      setQuery(q);
      openCustomer(q);
    }
  }, [router.query.q, openCustomer]);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setNotFound(false);
    setCustomer(null);
    try {
      const res = await adminFetch(`/api/admin/customer?list=1&q=${encodeURIComponent(query.trim())}`);
      if (!res?.ok) return setNotFound(true);
      const data = await res.json();
      const rows: SearchResult[] = data.results ?? [];

      // One hit is almost always the intended one, so skip the list.
      if (rows.length === 1) return openCustomer(rows[0].email);
      if (rows.length === 0) return openCustomer(query.trim());
      setResults(rows);
    } finally {
      setLoading(false);
    }
  }

  async function act(action: string, confirmText?: string) {
    if (!customer?.license) return;
    if (confirmText && !confirm(confirmText)) return;

    setBusy(action);
    setToast(null);
    try {
      const res = await adminFetch("/api/admin/customer-action", {
        method: "POST",
        body: JSON.stringify({ email: customer.license.email, action }),
      });
      const data = await res?.json();
      if (!res?.ok) {
        setToast({ ok: false, text: data?.error ?? "That did not work." });
      } else {
        setToast({ ok: true, text: data.message });
        await openCustomer(customer.license.email);
      }
    } finally {
      setBusy(null);
    }
  }

  const license = customer?.license;

  return (
    <AdminShell title="Customers">
      <form onSubmit={runSearch} className="mb-6 flex gap-2 max-w-xl">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Email address or licence key…"
          className="flex-1 px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 disabled:opacity-50 transition-all duration-150 shadow-sm shadow-accent/25"
        >
          Search
        </button>
      </form>

      {toast && (
        <div className={`mb-6 px-5 py-3 rounded-xl text-sm ${
          toast.ok
            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50"
            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50"
        }`}>
          {toast.text}
        </div>
      )}

      {loading && <div className={`${cardClass} p-6 animate-pulse h-32`} />}

      {/* Multiple matches */}
      {!loading && results.length > 0 && (
        <Card title={`${results.length} matches`}>
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {results.map((r) => (
              <li key={r.license_key}>
                <button
                  onClick={() => openCustomer(r.email)}
                  className="w-full py-3 flex items-center justify-between gap-3 text-left hover:opacity-70 transition-opacity"
                >
                  <span className="text-sm text-neutral-900 dark:text-white truncate">{r.email || "(no email)"}</span>
                  <span className="flex items-center gap-3 flex-shrink-0">
                    <PlanBadge tier={r.product_tier} />
                    <StatusDot active={r.active} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {!loading && notFound && (
        <Card>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Nothing found for <span className="font-medium text-neutral-900 dark:text-white">{query}</span>.
            No account and no licence under that address.
          </p>
        </Card>
      )}

      {!loading && customer?.found && (
        <div className="flex flex-col gap-4">

          {/* Header */}
          <div className={`${cardClass} p-6`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
                  {customer.email}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {license && <PlanBadge tier={license.product_tier} />}
                  {license && <StatusDot active={license.active} />}
                  {license?.subscription_status && (
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                      {license.subscription_status}
                    </span>
                  )}
                </div>
              </div>
              {customer.stripeUrl && (
                <a
                  href={customer.stripeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-accent hover:underline whitespace-nowrap"
                >
                  Open in Stripe →
                </a>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Account */}
            <Card title="Account">
              {customer.account ? (
                <dl className="flex flex-col gap-2.5">
                  <Row label="Signed up" value={formatDate(customer.account.created_at)} />
                  <Row label="Last sign-in" value={relativeDays(customer.account.last_sign_in_at)} />
                </dl>
              ) : (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed">
                  No website account. They bought without creating one, which is possible since
                  checkout does not require signing up. They can still activate the app.
                </p>
              )}
            </Card>

            {/* Licence */}
            <Card title="Licence">
              {license ? (
                <dl className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-xs text-neutral-500 dark:text-neutral-400">Key</dt>
                    <dd className="flex items-center min-w-0">
                      <code className="font-mono text-xs font-medium text-neutral-900 dark:text-white truncate">
                        {license.license_key}
                      </code>
                      <CopyButton text={license.license_key} />
                    </dd>
                  </div>
                  <Row label="Issued" value={formatDate(license.created_at)} />
                  <Row label="Expires" value={license.current_period_end ? formatDate(license.current_period_end) : "Never"} />
                  <Row
                    label="Paid"
                    value={license.amount_total != null
                      ? formatMoney(license.amount_total, license.currency ?? "GBP")
                      : "Not recorded"}
                  />
                  <Row
                    label="Devices"
                    value={`${license.activation_count} of ${license.max_activations}`}
                    warn={license.activation_count >= license.max_activations}
                  />
                </dl>
              ) : (
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  This person has an account but has never bought a licence.
                </p>
              )}
            </Card>
          </div>

          {/* Devices */}
          <Card title="Devices" aside={`${customer.devices.length} activated`}>
            {customer.devices.length === 0 ? (
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                No Mac has activated this licence yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800">
                      {["Mac", "App version", "macOS", "First activated", "Last seen"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-neutral-400 dark:text-neutral-500 first:pl-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/60">
                    {customer.devices.map((d) => (
                      <tr key={d.id}>
                        <td className="px-3 py-2.5 pl-0 text-xs text-neutral-900 dark:text-white">
                          {d.device_name || "Unknown Mac"}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                          {d.app_version || <Unknown />}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                          {d.os_version || <Unknown />}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-neutral-400 dark:text-neutral-500">
                          {formatDate(d.activated_at, false)}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-neutral-400 dark:text-neutral-500">
                          {relativeDays(d.last_seen_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Actions */}
          {license && (
            <Card title="Actions">
              <div className="flex flex-wrap gap-2.5">
                <ActionButton onClick={() => act("resend")} busy={busy === "resend"}>
                  Resend licence email
                </ActionButton>

                <ActionButton
                  onClick={() => act("reset_activations",
                    "Reset activations? Every device slot is freed and all Macs must activate again.")}
                  busy={busy === "reset_activations"}
                >
                  Reset activations
                </ActionButton>

                {license.active ? (
                  <ActionButton
                    danger
                    onClick={() => act("revoke", "Revoke this licence? The app will stop unlocking Pro.")}
                    busy={busy === "revoke"}
                  >
                    Revoke licence
                  </ActionButton>
                ) : (
                  <ActionButton onClick={() => act("reactivate")} busy={busy === "reactivate"}>
                    Reactivate licence
                  </ActionButton>
                )}
              </div>
              <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed">
                Resetting activations is the fix when someone has replaced a Mac and is locked out
                at their device limit. Nothing in the app can release an old slot on its own.
              </p>
            </Card>
          )}
        </div>
      )}

      {!loading && !customer && !notFound && results.length === 0 && (
        <Card>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Search an email address or licence key to see the account, the purchase, and every Mac
            it is activated on.
          </p>
        </Card>
      )}
    </AdminShell>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className={`text-xs font-medium tabular-nums ${
        warn ? "text-amber-600 dark:text-amber-500" : "text-neutral-900 dark:text-white"
      }`}>
        {value}
      </dd>
    </div>
  );
}

function Unknown() {
  return <span className="text-neutral-300 dark:text-neutral-600">not reported</span>;
}

function ActionButton({
  onClick, busy, danger, children,
}: {
  onClick: () => void; busy: boolean; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-150 disabled:opacity-50 ${
        danger
          ? "border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          : "border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-accent/50 hover:text-accent"
      }`}
    >
      {busy ? "Working…" : children}
    </button>
  );
}
