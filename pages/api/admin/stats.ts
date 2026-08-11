import type { NextApiRequest, NextApiResponse } from "next";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { adminEnvError, getAdminClient, verifyAdmin } from "../../../lib/admin";

/**
 * Site analytics for the admin dashboard: how many accounts exist and how many
 * times the app has been downloaded, with 7/30-day windows and a daily series
 * for the chart. Same auth model as /api/admin/licenses.
 */

const DAILY_WINDOW_DAYS = 14;

interface RecentSignup {
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function collectUsers(db: SupabaseClient) {
  // Auth users live in Supabase Auth, not a queryable table, so counting means
  // paging through the admin API. Capped at 10k users, far beyond current
  // scale; the cap only exists so a runaway loop is impossible.
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

async function collectDownloads(db: SupabaseClient) {
  const empty = {
    available: false,
    total: 0,
    last7: 0,
    last30: 0,
    daily: [] as { date: string; count: number }[],
  };

  const { count: total, error: totalError } = await db
    .from("download_events")
    .select("id", { count: "exact", head: true });

  // 42P01 = relation does not exist: the migration has not been run yet.
  // The dashboard shows a hint for this instead of a hard error.
  if (totalError) {
    if (totalError.code === "42P01") return empty;
    throw new Error(`download_events count failed: ${totalError.message}`);
  }

  const [{ count: last7 }, { count: last30 }, { data: recentRows, error: rowsError }] =
    await Promise.all([
      db.from("download_events").select("id", { count: "exact", head: true })
        .gte("created_at", daysAgoIso(7)),
      db.from("download_events").select("id", { count: "exact", head: true })
        .gte("created_at", daysAgoIso(30)),
      db.from("download_events").select("created_at")
        .gte("created_at", daysAgoIso(DAILY_WINDOW_DAYS))
        .limit(10000),
    ]);

  if (rowsError) throw new Error(`download_events fetch failed: ${rowsError.message}`);

  // Zero-filled per-day buckets (UTC) so quiet days still appear in the chart.
  const counts = new Map<string, number>();
  for (let i = DAILY_WINDOW_DAYS - 1; i >= 0; i--) {
    counts.set(daysAgoIso(i).slice(0, 10), 0);
  }
  for (const row of recentRows ?? []) {
    const day = String(row.created_at).slice(0, 10);
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  return {
    available: true,
    total: total ?? 0,
    last7: last7 ?? 0,
    last30: last30 ?? 0,
    daily: Array.from(counts, ([date, count]) => ({ date, count })),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") return res.status(405).end();

    const envError = adminEnvError();
    if (envError) return res.status(500).json({ error: envError });

    const adminEmail = await verifyAdmin(req);
    if (!adminEmail) return res.status(403).json({ error: "Forbidden" });

    const db = getAdminClient();
    const [users, downloads] = await Promise.all([collectUsers(db), collectDownloads(db)]);

    return res.status(200).json({ users, downloads });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[admin/stats]", message);
    return res.status(500).json({ error: message });
  }
}
