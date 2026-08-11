# Redock admin dashboard

Date: 2026-08-11
Status: approved, not yet implemented

## Why

The admin dashboard answers one question today: which licences exist. Everything
else about the business is either invisible or lives in a table nobody looks at.

Three specific gaps prompted this:

1. `license_activations` is written on every licence check and has never been
   read. It knows which Macs each customer runs Redock on and when each was last
   seen, which is exactly what a support conversation needs.
2. `download_events.source` and `.referer` are recorded and never displayed, so
   there is no way to tell which download button or referring site actually
   produces customers.
3. No page anywhere shows money. Stripe holds it, the site never asks.

The dashboard should answer four questions: is this working as a business, what
is going on with this one customer who emailed, is the software healthy in the
wild, and does the whole thing read clearly.

## Non-goals

Deliberately excluded, to keep the build finite:

- **Trial tracking.** The 14 day trial clock is local to the app. Surfacing it
  server-side needs telemetry from free users, which was considered and
  declined.
- **Failed validation logging.** Recording rejected licence keys creates a
  privacy surface and yields weak signal at this scale.
- **Email deliverability.** Resend's own dashboard already reports bounces.
- **Multi-admin roles.** A single `ADMIN_EMAIL` is correct for a one person
  operation. Roles can come when there is a second person.
- **Realtime updates.** A refresh button is sufficient. Websockets are not.

## Architecture

### Pages

One shell, three pages, replacing the single 716 line `pages/admin/licenses.tsx`:

| Route | Purpose |
| --- | --- |
| `/admin` | Overview: revenue, funnel, downloads, version adoption |
| `/admin/licenses` | Licence table, create, delete. Keeps its existing URL |
| `/admin/customers` | Search a person, see and act on everything about them |

`/admin/licenses` keeps its path because it is already bookmarked and linked.

### Shared components

New `components/admin/`:

- `AdminShell`: top bar, navigation between the three pages, and the auth gate
- `StatTile`, `Card`, `DataTable`, `MiniBarChart`
- `useAdminGate()`: the authorisation hook

The gate deserves its own note. The current page starts in an unresolved state
and renders nothing at all until the API confirms the caller is the admin,
failing closed on every other outcome. That behaviour is correct and easy to get
wrong. Extracting it into one hook means three pages cannot drift into three
subtly different versions of it.

### Query limits

`GET /api/admin/licenses` currently selects every licence with no limit, and
`GET /api/admin/stats` pages through every auth user up to a 10,000 cap. Both
are fine at present volume and both degrade badly with growth. This work adds
server-side pagination and search to the licence list. Account counting keeps
paging the Auth admin API, because Supabase exposes no count endpoint for it,
but the page-through result is cached for 60 seconds so a dashboard refresh
does not repeat it.

## Data model

```sql
-- Money. `licenses` has never recorded what anyone paid.
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS amount_total INTEGER;  -- minor units, e.g. 1900
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS currency     TEXT;

-- Version telemetry, per device rather than per licence: someone with two Macs
-- can be running two different versions, and the per-licence answer would be
-- whichever one checked in last.
ALTER TABLE license_activations ADD COLUMN IF NOT EXISTS app_version TEXT;
ALTER TABLE license_activations ADD COLUMN IF NOT EXISTS os_version  TEXT;

CREATE INDEX IF NOT EXISTS idx_download_events_source ON download_events (source);
CREATE INDEX IF NOT EXISTS idx_licenses_subscription_status ON licenses (subscription_status);
```

Revenue for existing rows requires a one-time backfill script that reads the
Stripe account and writes `amount_total` and `currency` onto matching licences.
The script is read-only against Stripe and idempotent: it skips rows that
already carry an amount.

Going forward, the Stripe webhook stores the amount at purchase time, so the
dashboard never has to call Stripe to render.

Refunds need no new column. The webhook already sets `subscription_status` to
`refunded` or `disputed` and `active` to false, so net revenue is the sum of
`amount_total` over rows not in those two states.

## Phase 1: restructure

Split the existing page into the shell and the three routes above, moving the
current analytics section and licence table across unchanged in behaviour. No
new data. This phase exists so the remaining three have somewhere to live.

Done when: all three routes render, the auth gate still fails closed on every
one of them, and the licence table paginates.

## Phase 2: customer support

The most used page in daily life. Search by email, partial match, then a detail
view in four blocks:

- **Account**: whether a Supabase Auth user exists, created date, last sign-in
- **Licence**: key, tier, status, created, expiry, activations used against max
- **Purchase**: amount, date, and a deep link to the customer in Stripe
- **Devices**: each Mac by name, first activated, last seen, app version, macOS

Three actions, because a read-only support tool only does half the job:

| Action | Why it exists |
| --- | --- |
| Resend licence email | The single most common request |
| Reset activations | Customer replaced their Mac and is locked out at 3 of 3 |
| Revoke / reactivate | Manual correction when a refund or dispute needs undoing |

Reset activations deletes the device rows for that licence and zeroes
`activation_count`. It is the fix for a real and otherwise unrecoverable dead
end, and it is destructive, so it confirms before running.

## Phase 3: money and growth

Overview page. Total revenue, last 30 days, refunded, and net. Revenue over
time as a daily bar chart. Download sources broken down by the `source` tag
already attached to each button, plus top referrers.

The funnel shows downloads, then new accounts, then purchases, over a shared
window.

**This is not a cohort funnel and must not be labelled as a conversion rate.**
Downloads are anonymous, so these are three independent counts over the same
period rather than the same people followed through the steps. The ratio is
directionally useful for spotting a change and it will mislead anyone who reads
it as "X% of downloaders buy". The UI states this in place, next to the number,
not in a tooltip.

## Phase 4: product health

Requires an app change: `/api/license/validate` accepts optional `app_version`
and `os_version`, and the app sends both on the licence check it already makes.
Roughly three lines on each side. Both fields are optional so older builds keep
validating exactly as they do now.

Coverage is paying customers only, by choice. Free users never contact the
server and this design does not change that.

Shows:

- Version adoption across devices seen in the last 30 days
- macOS version spread, which is what tells you when dropping macOS 13 is safe
- Licences sitting at their activation limit, a support signal before the email
- Licences active but not validated in 30 or more days, an uninstall signal

## API surface

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/admin/licenses` | GET, POST, DELETE | Existing, plus pagination and search |
| `/api/admin/stats` | GET | Existing, extended with revenue and funnel |
| `/api/admin/customer` | GET | Everything about one email |
| `/api/admin/customer/resend` | POST | Resend licence email |
| `/api/admin/customer/activations` | DELETE | Reset device activations |
| `/api/admin/customer/status` | POST | Revoke or reactivate |

Every one of these goes through `verifyAdmin` from `lib/admin.ts`. The rule
established during the security review holds without exception: an admin route
derives identity from the bearer token and never from a field in the request
body.

## Error handling

Each dashboard section fetches independently and fails independently. A section
whose request fails shows an inline retry in its own card and does not blank the
page, because a broken revenue query should not hide the licence table.

Admin endpoints may return internal error text, since the only reader is the
admin. Public routes must not, and none of these are public.

Destructive actions (reset activations, revoke, delete licence) confirm first
and report the outcome rather than silently succeeding.

## Testing

- Auth: every new endpoint returns 403 without a token, with a non-admin token,
  and with an expired token. This is the test that matters most and it is
  cheap to write.
- Revenue: net total excludes refunded and disputed rows.
- Backfill: running it twice produces the same result as running it once.
- Version adoption: a validate call without `app_version` still succeeds.
- Funnel: a window with zero downloads does not divide by zero.

## Coordination notes

Two things need care rather than code:

1. **Phase 4 edits the macOS app**, which a parallel session is actively
   working in. The `validate.ts` change is site-side and safe. The app-side
   change must be handed to whoever holds the app, not applied blind.
2. **The Stripe backfill reads the live payment account.** It is read-only and
   idempotent, but it should be run deliberately and its output checked against
   the Stripe dashboard before the revenue figures are trusted.
