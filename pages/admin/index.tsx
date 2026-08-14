import { useCallback, useEffect, useState } from "react";
import AdminShell, { adminFetch } from "../../components/admin/AdminShell";
import {
  BreakdownList, Card, MiniBarChart, StatTile,
  formatDate, formatMoney,
} from "../../components/admin/ui";

interface Stats {
  users: { total: number; last7: number; last30: number;
           recent: { email: string | null; created_at: string; last_sign_in_at: string | null }[] } | null;
  downloads: { available: boolean; total: number; last7: number; last30: number;
               botsExcluded: number;
               daily: { date: string; count: number }[];
               sources: { source: string; count: number }[];
               referrers: { referrer: string; count: number }[] } | null;
  revenue: { available: boolean; gross: number; net: number; reversed: number; last30: number;
             currency: string; daily: { date: string; count: number }[]; untracked: number } | null;
  health: { available: boolean; devices: number;
            versions: { version: string; count: number }[];
            osVersions: { version: string; count: number }[];
            atActivationLimit?: { license_key: string; email: string; activation_count: number; max_activations: number }[];
            staleCount?: number } | null;
  licenses: { total: number; active: number; purchased30: number } | null;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const res = await adminFetch("/api/admin/stats");
      if (!res?.ok) return setFailed(true);
      setStats(await res.json());
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loading = stats === null && !failed;
  const money = (n: number) => formatMoney(n, stats?.revenue?.currency ?? "GBP");

  return (
    <AdminShell title="Overview">
      {failed && (
        <div className="mb-6 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-sm text-red-700 dark:text-red-400">Could not load the dashboard.</p>
          <button onClick={load} className="text-sm font-semibold text-red-700 dark:text-red-400 hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* Money */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatTile
          label="Net revenue"
          value={stats?.revenue?.available ? money(stats.revenue.net) : "—"}
          sub={stats?.revenue?.available && stats.revenue.reversed > 0
            ? `${money(stats.revenue.reversed)} refunded`
            : undefined}
          loading={loading}
        />
        <StatTile
          label="Revenue · 30 days"
          value={stats?.revenue?.available ? money(stats.revenue.last30) : "—"}
          loading={loading}
        />
        <StatTile
          label="Accounts"
          value={stats?.users ? String(stats.users.total) : "—"}
          sub={stats?.users ? `+${stats.users.last7} this week` : undefined}
          loading={loading}
        />
        <StatTile
          label="Downloads"
          value={stats?.downloads?.available ? String(stats.downloads.total) : "—"}
          // The bot figure stays visible so a sudden gap between the two
          // numbers reads as "scanner", not "the counter broke".
          sub={stats?.downloads?.available
            ? `+${stats.downloads.last7} this week · ${stats.downloads.botsExcluded} bot hits excluded`
            : undefined}
          loading={loading}
        />
      </div>

      {/*
        Revenue has a setup state of its own. The column only exists after the
        migration, and past purchases only carry an amount after the backfill,
        so an empty chart here is far more likely to mean "not set up yet" than
        "nobody bought anything".
      */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card title="Revenue" aside="Last 14 days" className="lg:col-span-2">
          {loading ? (
            <Skeleton />
          ) : !stats?.revenue?.available ? (
            <SetupHint>
              Revenue tracking is not set up yet. Run <Code>sql/admin-dashboard.sql</Code> in the
              Supabase SQL editor, then <Code>node scripts/backfill-stripe-amounts.mjs</Code> to
              fill in past purchases.
            </SetupHint>
          ) : (
            <>
              <MiniBarChart data={stats.revenue.daily} format={(n) => money(n)} />
              {stats.revenue.untracked > 0 && (
                <p className="mt-3 text-xs text-neutral-400 dark:text-neutral-500">
                  {stats.revenue.untracked} purchase{stats.revenue.untracked === 1 ? "" : "s"} have
                  no recorded amount and are missing from these totals. Run the backfill script to
                  include them.
                </p>
              )}
            </>
          )}
        </Card>

        <Card title="Funnel" aside="Last 30 days">
          {loading ? <Skeleton /> : (
            <>
              <ul className="flex flex-col gap-3">
                <FunnelRow label="Downloads" value={stats?.downloads?.available ? stats.downloads.last30 : null} />
                <FunnelRow label="Accounts created" value={stats?.users?.last30 ?? null} />
                <FunnelRow label="Purchases" value={stats?.licenses?.purchased30 ?? null} />
              </ul>
              {/*
                Stated here, next to the numbers, rather than hidden in a
                tooltip. These are three independent counts over the same
                window: downloads are anonymous, so nobody is followed from one
                step to the next. Read as a conversion rate it would be wrong.
              */}
              <p className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs leading-relaxed text-neutral-400 dark:text-neutral-500">
                Three separate counts over the same period, not the same people
                followed through. Downloads are anonymous, so this shows the
                shape of the month, not a conversion rate.
              </p>
            </>
          )}
        </Card>
      </div>

      {/* Downloads */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card title="Downloads" aside="Last 14 days" className="lg:col-span-2">
          {loading ? <Skeleton /> : !stats?.downloads?.available ? (
            <SetupHint>
              Download tracking is not set up yet. Run <Code>sql/download-events.sql</Code> in the
              Supabase SQL editor.
            </SetupHint>
          ) : (
            <MiniBarChart data={stats.downloads.daily} unit=" downloads" />
          )}
        </Card>

        <Card title="Where from" aside="Last 30 days">
          {loading ? <Skeleton /> : (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 mb-2.5">Button</p>
                <BreakdownList
                  rows={(stats?.downloads?.sources ?? []).map((s) => ({ label: s.source, count: s.count }))}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 mb-2.5">Referrer</p>
                <BreakdownList
                  rows={(stats?.downloads?.referrers ?? []).map((r) => ({ label: r.referrer, count: r.count }))}
                  empty="No referrers recorded. Most downloads are direct."
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Product health */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="App versions" aside={stats?.health?.available ? `${stats.health.devices} devices · 30 days` : undefined}>
          {loading ? <Skeleton /> : !stats?.health?.available ? (
            <SetupHint>Run <Code>sql/admin-dashboard.sql</Code> to enable version tracking.</SetupHint>
          ) : stats.health.versions.length === 0 ? (
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              No devices have checked in yet. Versions appear once customers run a build that
              reports one.
            </p>
          ) : (
            <BreakdownList rows={stats.health.versions.map((v) => ({ label: v.version, count: v.count }))} />
          )}
        </Card>

        <Card title="macOS versions" aside="Active devices">
          {loading ? <Skeleton /> : (
            <BreakdownList
              rows={(stats?.health?.osVersions ?? []).map((v) => ({ label: v.version, count: v.count }))}
              empty="Nothing reported yet."
            />
          )}
        </Card>

        <Card title="Needs attention">
          {loading ? <Skeleton /> : (
            <ul className="flex flex-col gap-3">
              <AttentionRow
                label="At activation limit"
                value={stats?.health?.atActivationLimit?.length ?? 0}
                hint="Cannot activate another Mac"
              />
              <AttentionRow
                label="Not seen in 30 days"
                value={stats?.health?.staleCount ?? 0}
                hint="Active licence, app stopped checking in"
              />
            </ul>
          )}
        </Card>
      </div>

      {/* Recent signups */}
      <div className="mt-4">
        <Card title="Recent signups">
          {loading ? <Skeleton /> : !stats?.users?.recent.length ? (
            <p className="text-xs text-neutral-400 dark:text-neutral-500">No accounts yet.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {stats.users.recent.map((u) => (
                <li key={`${u.email}-${u.created_at}`} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                    {u.email ?? <span className="text-neutral-300 dark:text-neutral-600">no email</span>}
                  </span>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap tabular-nums">
                    {formatDate(u.created_at, false)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}

function FunnelRow({ label, value }: { label: string; value: number | null }) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-neutral-500 dark:text-neutral-400">{label}</span>
      <span className="text-lg font-semibold text-neutral-900 dark:text-white tabular-nums">
        {value === null ? "—" : value}
      </span>
    </li>
  );
}

function AttentionRow({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <li className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">{label}</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">{hint}</p>
      </div>
      <span className={`text-lg font-semibold tabular-nums ${
        value > 0 ? "text-neutral-900 dark:text-white" : "text-neutral-300 dark:text-neutral-600"
      }`}>
        {value}
      </span>
    </li>
  );
}

function Skeleton() {
  return <div className="h-28 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />;
}

function SetupHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-28 flex items-center justify-center px-4 text-center">
      <p className="text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed">{children}</p>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">
      {children}
    </code>
  );
}
