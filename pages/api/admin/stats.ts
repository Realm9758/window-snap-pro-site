import type { NextApiRequest, NextApiResponse } from "next";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { adminEnvError, getAdminClient, verifyAdmin } from "../../../lib/admin";

/**
 * Everything the overview page shows: accounts, downloads, revenue, the funnel,
 * and which versions are running in the wild.
 *
 * Each block is gathered independently and a failure in one is reported as null
 * rather than thrown, so a missing migration or an empty table degrades that
 * one card instead of blanking the whole dashboard.
 */

const DAILY_WINDOW_DAYS = 14;
const ACTIVE_DEVICE_DAYS = 30;

/** Statuses that mean the money went back. */
const REVERSED = ["refunded", "disputed"];

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** Zero-filled per-day buckets (UTC), so quiet days still appear in a chart. */
function emptyDailyBuckets(days: number): Map<string, number> {
  const counts = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) counts.set(daysAgoIso(i).slice(0, 10), 0);
  return counts;
}

function bucketByDay(
  rows: { created_at?: string | null }[] | null,
  counts: Map<string, number>,
  value: (row: never) => number = () => 1
) {
  for (const row of rows ?? []) {
    const day = String(row.created_at ?? "").slice(0, 10);
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + value(row as never));
  }
  return Array.from(counts, ([date, count]) => ({ date, count }));
}

// ─── Accounts ────────────────────────────────────────────────────────────────

interface RecentSignup {
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

/**
 * Supabase Auth has no count endpoint, so the only way to a total is to page
 * through. Cached briefly because a dashboard refresh should not repeat a walk
 * of every user.
 */
let userCache: { at: number; value: Awaited<ReturnType<typeof collectUsersUncached>> } | null = null;
const USER_CACHE_MS = 60_000;

async function collectUsersUncached(db: SupabaseClient) {
  const users: User[] = [];
  let reportedTotal: number | null = null;

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);

    users.push(...data.users);
    const pagination = data as unknown as { total?: number };
    if (typeof pagination.total === "number") reportedTotal = pagination.total;
    if (data.users.length < 1000) break;
  }

  const cutoff7 = daysAgoIso(7);
  const cutoff30 = daysAgoIso(30);

  const recent: RecentSignup[] = [...users]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 6)
    .map((u) => ({
      email: u.email ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
    }));

  return {
    total: reportedTotal ?? users.length,
    last7: users.filter((u) => u.created_at >= cutoff7).length,
    last30: users.filter((u) => u.created_at >= cutoff30).length,
    recent,
  };
}

async function collectUsers(db: SupabaseClient) {
  if (userCache && Date.now() - userCache.at < USER_CACHE_MS) return userCache.value;
  const value = await collectUsersUncached(db);
  userCache = { at: Date.now(), value };
  return value;
}

// ─── Downloads ───────────────────────────────────────────────────────────────

/**
 * A download event that was not a person.
 *
 * The download button is a plain link, so every crawler that reads the page
 * "downloads" the app: at the point this filter was written, 34 of the 46
 * recorded events were bots — index crawlers, a referer-spam scanner faking
 * MSIE 9, and one burst of 7 hits in 12 seconds under rotated Chrome UAs.
 * Steering the product by that number meant steering by crawler traffic.
 *
 * Raw rows are kept in the table untouched; bots are excluded at read time so
 * the classification can improve without losing history. MSIE is included
 * because no modern browser sends it — the only source here is the daily
 * referer-spam scanner.
 */
function isBotUA(ua: string | null): boolean {
  if (!ua) return true;
  return /bot|spider|crawl|curl|wget|python|scan|slurp|headless|monitor|probe|externalagent|msie/i.test(ua);
}

/**
 * Scrapers that rotate real-looking Chrome UAs still give themselves away in
 * the referer: real browsers on an https-only site never send a plain-http
 * referer, and never claim the download endpoint referred them to itself.
 * (The observed burst sent "http://bhopstudio.com/redock/api/download?..." as
 * its own referer, seven hits in twelve seconds.)
 */
function isBotRow(row: { user_agent: string | null; referer: string | null }): boolean {
  if (isBotUA(row.user_agent)) return true;
  if (row.referer) {
    if (row.referer.startsWith("http://")) return true;
    if (row.referer.includes("/api/download")) return true;
  }
  return false;
}

async function collectDownloads(db: SupabaseClient) {
  const empty = {
    available: false,
    total: 0,
    last7: 0,
    last30: 0,
    botsExcluded: 0,
    daily: [] as { date: string; count: number }[],
    sources: [] as { source: string; count: number }[],
    referrers: [] as { referrer: string; count: number }[],
  };

  // All-time rows, filtered in code: the bot test is one regex over a UA
  // string, which PostgREST cannot express cleanly, and the table grows by a
  // handful of rows a day — the 10k cap is years away.
  const { data: allRows, error: rowsError } = await db
    .from("download_events")
    .select("created_at, source, referer, user_agent")
    .order("created_at", { ascending: false })
    .limit(10000);

  // 42P01: table does not exist, i.e. the migration has not been run.
  if (rowsError) {
    if (rowsError.code === "42P01") return empty;
    throw new Error(`download_events fetch failed: ${rowsError.message}`);
  }

  const rows = allRows ?? [];
  const human = rows.filter((r) => !isBotRow(r));

  const cutoff7 = daysAgoIso(7);
  const cutoff30 = daysAgoIso(30);
  const recent = human.filter((r) => r.created_at >= cutoff30);

  const daily = bucketByDay(
    recent.filter((r) => r.created_at >= daysAgoIso(DAILY_WINDOW_DAYS)),
    emptyDailyBuckets(DAILY_WINDOW_DAYS)
  );

  const sourceCounts = new Map<string, number>();
  const referrerCounts = new Map<string, number>();

  for (const row of recent) {
    const source = row.source || "direct";
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);

    // Group by host. Full URLs would splinter one referring site across every
    // path and campaign parameter it ever linked from.
    if (row.referer) {
      let host = "unknown";
      try { host = new URL(row.referer).host; } catch { /* keep unknown */ }
      referrerCounts.set(host, (referrerCounts.get(host) ?? 0) + 1);
    }
  }

  const topOf = <K extends string>(m: Map<string, number>, key: K) =>
    Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ [key]: name, count })) as ({ [P in K]: string } & { count: number })[];

  return {
    available: true,
    total: human.length,
    last7: human.filter((r) => r.created_at >= cutoff7).length,
    last30: recent.length,
    botsExcluded: rows.length - human.length,
    daily,
    sources: topOf(sourceCounts, "source"),
    referrers: topOf(referrerCounts, "referrer"),
  };
}

// ─── Revenue ─────────────────────────────────────────────────────────────────

async function collectRevenue(db: SupabaseClient) {
  const { data, error } = await db
    .from("licenses")
    .select("amount_total, currency, subscription_status, created_at")
    .not("amount_total", "is", null)
    .limit(10000);

  // 42703: column does not exist, i.e. the migration has not been run.
  if (error) {
    if (error.code === "42703") {
      return { available: false, gross: 0, net: 0, reversed: 0, last30: 0, currency: "GBP", daily: [], untracked: 0 };
    }
    throw new Error(`revenue fetch failed: ${error.message}`);
  }

  const rows = data ?? [];
  const paid = rows.filter((r) => !REVERSED.includes(r.subscription_status));
  const reversedRows = rows.filter((r) => REVERSED.includes(r.subscription_status));

  const sum = (list: typeof rows) => list.reduce((t, r) => t + (r.amount_total ?? 0), 0);
  const cutoff30 = daysAgoIso(30);

  // Licences with no recorded amount are either manually issued or predate the
  // webhook change. Surfaced so a low revenue figure is explainable rather than
  // mysterious.
  const { count: untracked } = await db
    .from("licenses")
    .select("id", { count: "exact", head: true })
    .is("amount_total", null)
    .not("stripe_customer_id", "is", null);

  return {
    available: true,
    gross: sum(rows),
    net: sum(paid),
    reversed: sum(reversedRows),
    last30: sum(paid.filter((r) => r.created_at >= cutoff30)),
    currency: (rows.find((r) => r.currency)?.currency ?? "gbp").toUpperCase(),
    daily: bucketByDay(
      paid.filter((r) => r.created_at >= daysAgoIso(DAILY_WINDOW_DAYS)),
      emptyDailyBuckets(DAILY_WINDOW_DAYS),
      (r: { amount_total: number | null }) => r.amount_total ?? 0
    ),
    untracked: untracked ?? 0,
  };
}

// ─── Product health ──────────────────────────────────────────────────────────

async function collectHealth(db: SupabaseClient) {
  const { data, error } = await db
    .from("license_activations")
    .select("app_version, os_version, last_seen_at")
    .gte("last_seen_at", daysAgoIso(ACTIVE_DEVICE_DAYS))
    .limit(10000);

  if (error) {
    if (error.code === "42703") return { available: false, versions: [], osVersions: [], devices: 0 };
    throw new Error(`activations fetch failed: ${error.message}`);
  }

  const rows = data ?? [];
  const tally = (key: "app_version" | "os_version") => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const v = row[key] || "unknown";
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([version, count]) => ({ version, count }));
  };

  // Licences that cannot activate another Mac. This is the support ticket
  // arriving before the email does.
  const { data: atLimit } = await db
    .from("licenses")
    .select("license_key, email, activation_count, max_activations")
    .eq("active", true)
    .limit(1000);

  const capped = (atLimit ?? []).filter((l) => l.activation_count >= l.max_activations);

  // Active licences that stopped checking in. Reads as uninstalled.
  const { count: stale } = await db
    .from("licenses")
    .select("id", { count: "exact", head: true })
    .eq("active", true)
    .lt("last_validated_at", daysAgoIso(30));

  return {
    available: true,
    devices: rows.length,
    versions: tally("app_version"),
    osVersions: tally("os_version"),
    atActivationLimit: capped,
    staleCount: stale ?? 0,
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

/** Runs a block, returning null instead of throwing so one failure is local. */
async function safely<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[admin/stats] ${label}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") return res.status(405).end();

    const envError = adminEnvError();
    if (envError) return res.status(500).json({ error: envError });

    const adminEmail = await verifyAdmin(req);
    if (!adminEmail) return res.status(403).json({ error: "Forbidden" });

    const db = getAdminClient();

    const [users, downloads, revenue, health, licenseCounts] = await Promise.all([
      safely("users", () => collectUsers(db)),
      safely("downloads", () => collectDownloads(db)),
      safely("revenue", () => collectRevenue(db)),
      safely("health", () => collectHealth(db)),
      safely("licenses", async () => {
        const [{ count: total }, { count: active }, { count: purchased30 }] = await Promise.all([
          db.from("licenses").select("id", { count: "exact", head: true }),
          db.from("licenses").select("id", { count: "exact", head: true }).eq("active", true),
          db.from("licenses").select("id", { count: "exact", head: true })
            .gte("created_at", daysAgoIso(30)).not("stripe_customer_id", "is", null),
        ]);
        return { total: total ?? 0, active: active ?? 0, purchased30: purchased30 ?? 0 };
      }),
    ]);

    return res.status(200).json({ users, downloads, revenue, health, licenses: licenseCounts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[admin/stats]", message);
    return res.status(500).json({ error: message });
  }
}
