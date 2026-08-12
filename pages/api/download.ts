import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { assetPath } from "../../lib/site";
import { checkRateLimit } from "../../lib/rateLimit";

/**
 * Serves the .dmg through a redirect so each download leaves a row in
 * download_events for the admin dashboard. The file itself stays a static
 * asset; this route only counts and forwards.
 *
 * Why a redirect and not the bytes: /public is not part of the serverless
 * bundle, so this function cannot read the file, and streaming 3MB through a
 * function per download would be paid for twice over. The attachment behaviour
 * lives on the target instead, as Content-Disposition in next.config.js, which
 * is what stops the browser treating the response as a page to navigate to.
 *
 * Recording is strictly best-effort. Whatever goes wrong, from missing env
 * vars to a missing table to a Supabase outage, the response is still the
 * redirect. A visitor must never lose the download to analytics.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    await recordDownload(req);
  } catch (err) {
    console.error("[api/download] failed to record:", err instanceof Error ? err.message : err);
  }

  // A cached redirect would be followed without ever reaching this function,
  // and the count would quietly stop moving.
  res.setHeader("Cache-Control", "no-store");

  // Nothing here is a page. Keeping it out of the index also keeps crawlers
  // from pulling the installer on every recrawl.
  res.setHeader("X-Robots-Tag", "noindex");

  return res.redirect(302, assetPath("/Redock.dmg"));
}

async function recordDownload(req: NextApiRequest) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  // Per-IP cap so a curl loop cannot flood the table. Over the cap the
  // download still works; it just stops being counted.
  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";
  if (!checkRateLimit(`download:${ip}`, 10, 60_000).allowed) return;

  const rawSource = req.query.source;
  const source =
    typeof rawSource === "string" && /^[a-z0-9-]{1,32}$/.test(rawSource) ? rawSource : null;

  const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { error } = await db.from("download_events").insert([{
    source,
    user_agent: req.headers["user-agent"]?.slice(0, 512) ?? null,
    referer: (req.headers.referer as string | undefined)?.slice(0, 512) ?? null,
  }]);
  if (error) console.error("[api/download] insert error:", error.message);
}
