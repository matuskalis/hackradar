# Spec: curation tools and deploy (2026-09-14)

Roadmap items 1 to 4 from `docs/roadmap.md`: deploy, recurring events, add by URL,
moderation page. Online importer (item 5) is out of scope.

Owner decisions (2026-09-14):
- No Anthropic API key. Add-by-URL is deterministic parsing, no LLM call anywhere.
- Single admin: `m3kalis@gmail.com`. More admins later through an env allowlist.

Stack facts every implementer must respect:
- Next.js 16.3.4. Middleware is renamed to **`proxy.ts`** (export `proxy`). Read
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
  and the Server Actions docs under `node_modules/next/dist/docs/` before writing.
  Route and page `params` are Promises. `RouteContext<'/path'>` and
  `PageProps<'/path'>` are global types (run `npx next typegen`).
- Supabase via `@supabase/ssr` 0.12. Clients live in `lib/db/supabase.ts`:
  `createServerSupabaseClient()` (cookies), `createAnonClient()`, `createAdminClient()`
  (service role, server only). Fetch Supabase SSR auth docs through Context7 before
  writing the auth flow.
- Local Supabase ports: API 54521, DB 54522, Studio 54523, Mailpit (magic-link
  inbox) 54524. DB URL `postgresql://postgres:postgres@127.0.0.1:54522/postgres`.
- MapLibre is pinned to 5.x on purpose (6.x does not load under Turbopack). Import
  as `import maplibregl from 'maplibre-gl'`. Never use `Popup`, `setHTML` or
  `setDOMContent`: see `SECURITY.md`.
- CSP lives in `next.config.ts`. Anything new that loads from another origin must be
  added there, or it silently fails.
- Design system tokens are in `app/globals.css`. Use them (`bg-ink`, `text-accent`,
  `border-line`, `.label`, `.data`), square corners, no new colours. Copy the look of
  `components/submit/SubmitForm.tsx` and `components/explore/Filters.tsx`.
- UI copy is Slovak. Code, comments, commits are English.
- Every hackathon write goes through `lib/hackathons/upsert.ts` or a function in the
  same module. No second write path.
- Gate before reporting done: `npx tsc --noEmit`, `npm run lint`, `npm test`,
  `npm run build`. All four must pass.

---

## Part A: write path must not undo moderation

Problem: `upsertHackathon` rewrites the whole row on every match, including
`status`, and `scripts/seed/seed.ts` always sends `status: 'published'`. A rejected
row comes back on the next `npm run seed`; a hand-corrected name or pin is lost.

Required behaviour:
1. Migration adds `hackathons.edited_at timestamptz null`. Any admin edit sets it.
2. On an update path (match by `source_id` or same-source duplicate):
   - never write `status`; the existing row keeps its status
   - if `edited_at` is not null, only fill columns that are currently null (same
     rule as the existing cross-source merge, `MERGEABLE_COLUMNS`)
3. `status` from the input applies to inserts only.
4. New exported functions in `lib/hackathons/upsert.ts` (or a sibling
   `lib/hackathons/moderation.ts` if it keeps files small):
   `setStatus(db, id, status)`, `updateByAdmin(db, id, patch)` which sets
   `edited_at = now()` and recomputes `name_normalized` when `name` changes.
5. Tests: pure logic that decides which columns an update may write, covering
   "status never overwritten", "edited row only gets nulls filled", "unedited row
   gets full update". Keep DB calls out of the unit under test.

## Part B: moderation page (roadmap 4)

Auth:
- Supabase magic link. `/admin/login` page with an email field, sends
  `signInWithOtp` with `emailRedirectTo` `${NEXT_PUBLIC_SITE_URL}/auth/callback`.
- `app/auth/callback/route.ts` exchanges the code for a session, redirects to
  `/admin`.
- `proxy.ts` refreshes the session cookie and redirects unauthenticated requests
  for `/admin/**` (except `/admin/login`) to `/admin/login`. Matcher limited to
  `/admin/:path*` and `/auth/:path*`; public pages must not pay for it.
- Authorization is **not** the proxy's job. Every admin server action and admin
  data read calls one helper `requireAdmin()` in `lib/auth/admin.ts`: gets the user
  with `supabase.auth.getUser()` (not `getSession`), checks the email against
  `ADMIN_EMAILS` (comma-separated env var), throws or redirects otherwise.
- After `requireAdmin()` passes, reads and writes use `createAdminClient()`. No new
  RLS policy for `authenticated`; the anon key must still read only published rows.
- Local dev: set `site_url = "http://localhost:3000"` and add
  `http://localhost:3000/auth/callback` to `additional_redirect_urls` in
  `supabase/config.toml`, otherwise the callback cookie lands on the wrong host.
- Document `ADMIN_EMAILS` in the README env table.

Page `/admin` (server component, `requireAdmin()` first):
- Tabs by query string: `?tab=pending` (default), `published`, `attention`.
  `attention` is filled by Part C.
- Pending list: each row shows name, dates in the event timezone, format, city,
  source, organizer, url. Actions: approve (status published), reject
  (status rejected), edit.
- Published list: search by name, action cancel (status cancelled) and edit.
- Edit page `/admin/hackathon/[id]`: form for every editable column, reusing the
  validation in `lib/validation/schemas.ts` (extend with an admin schema if
  needed). Location picker: a small MapLibre map with one draggable
  `maplibregl.Marker`; dragging writes lat/lng and sets `location_precision` to
  `venue`. A "geocode address" button calls `lib/geocode.ts` server-side.
- The DB constraint `hackathons_published_needs_location` rejects publishing an
  on-site row without coordinates. Approve must show a clear Slovak error in that
  case, not a 500.
- All mutations are Server Actions (built-in origin check), each starting with
  `requireAdmin()`, each followed by `revalidatePath` for `/`, the affected
  `/hackathon/[slug]` and the city pages.
- Header link to `/admin` only when the viewer is an admin. Do not show it to
  the public.
- `robots.ts` disallows `/admin` and `/auth`.

Acceptance:
- Logged out, `/admin` redirects to `/admin/login`.
- Logged in as a non-allowlisted email, `/admin` shows 403, and a crafted server
  action call is refused.
- Magic link from Mailpit logs in `m3kalis@gmail.com`.
- Submitting `/pridat`, then approving in `/admin`, makes the event appear on the
  map without touching the database by hand.
- Reject, then `npm run seed`: the row stays rejected. Edit a name, then
  `npm run seed`: the edited name survives.

## Part C: recurring events (roadmap 2)

- Migration: `hackathons.recurrence text not null default 'none' check (recurrence in ('none','annual'))`,
  `hackathons.parent_id uuid null references hackathons(id) on delete set null`,
  unique index on `parent_id` where not null.
- `lib/hackathons/recurrence.ts`: pure function `nextEdition(event)` returns start
  and end shifted by 52 weeks (364 days), which keeps the weekday; hackathons are
  weekend events. Registration deadline shifts the same way if present.
- `rollRecurringEvents(db, now)`: for every `annual` event with `end_at < now`, no
  child row, and status `published` or `cancelled`, insert a child through the
  write path with `status: 'pending'`, `parent_id`, `recurrence: 'annual'`, the
  shifted dates, same venue, url and themes, name with a trailing 4-digit year
  replaced by the new year when present. Idempotent: running twice creates nothing
  new. Returns counts.
- Trigger: `app/api/cron/recurring/route.ts`, GET, requires header
  `Authorization: Bearer ${CRON_SECRET}` (constant-time compare), otherwise 401.
  `vercel.json` schedules it daily. This is also the only scheduled job, so it keeps
  the free Supabase project from pausing.
- Admin: "run now" button on the `attention` tab. `attention` lists pending rows
  with a `parent_id` ("next edition, confirm the date") and published events that
  ended more than 14 days ago with `recurrence = 'none'` and no child ("did this
  happen again?"). Edit page gets a recurrence toggle.
- Seed: CSV column `recurrence` optional. In the existing seed files, rows with
  `date_confidence` `estimated` were rolled forward precisely because annual
  recurrence was evidenced, so the seed maps `estimated` to `annual` when the column
  is absent. Everything else defaults to `none`.
- Document `CRON_SECRET` in the README env table.
- Tests: `nextEdition` (weekday kept, year rollover, deadline shift, name year
  replacement) and the idempotency decision logic.

## Part D: add by URL (roadmap 3)

No LLM. Deterministic extraction.

- `lib/extract/event-from-html.ts`: pure function taking an HTML string and the page
  URL, returning a partial submit-shaped object plus a list of fields it could not
  find. Sources in priority order:
  1. JSON-LD `<script type="application/ld+json">` objects of `@type` `Event` or any
     subtype (`Hackathon`, `EducationEvent`, `SocialEvent`...), including inside
     `@graph` and arrays. Map `name`, `description`, `startDate`, `endDate`,
     `eventAttendanceMode` (Online/Offline/Mixed to online/onsite/hybrid),
     `location` (`Place.name`, `PostalAddress.streetAddress`, `addressLocality`,
     `addressCountry` normalized to ISO alpha-2), `organizer.name`, `url`,
     `offers.price` + `priceCurrency`, `image` ignored.
  2. OpenGraph and standard meta: `og:title`, `og:description`, `og:url`,
     `event:start_time` / `event:end_time` if present, `<title>`, meta description.
  3. `<time datetime>` elements as a last resort for dates.
  Never execute the page. Parse with a real HTML parser already in the tree if one
  exists; otherwise add one small, well-known dependency (`node-html-parser` or
  `cheerio`) and verify it exists on npm before installing.
- `lib/extract/fetch-page.ts`: SSRF-safe fetch. Only `http:` and `https:`. Resolve
  the hostname and refuse private, loopback, link-local and metadata ranges
  (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, ::1,
  fc00::/7, fe80::/10, 0.0.0.0). Re-check after every redirect, max 3 redirects.
  8 s timeout, 2 MB body cap, `User-Agent: HackRadar/0.1`. Only `text/html`.
- Admin page `/admin/new`: URL input, server action fetches and extracts, then
  renders the edit form prefilled, with the missing fields highlighted. Save goes
  through the write path with `source: 'manual'`, `source_url` = the URL, status
  chosen by the admin (default `published`), then geocodes when on-site.
- Tests with saved HTML fixtures in `tests/fixtures/extract/`: a page with nested
  `@graph` Event JSON-LD, a page with only OpenGraph, a page with no event data,
  country name to ISO mapping, attendance mode mapping. Plus unit tests for the IP
  range guard.

## Part E: deploy (roadmap 1)

Done by the orchestrator with the owner, not by an implementer:
- Supabase cloud project (needs `supabase login` by the owner), `supabase link`,
  `supabase db push`, seed against cloud, auth site URL and redirect URLs set to the
  production domain.
- Vercel project linked to the GitHub repo, env vars: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAILS`, `CRON_SECRET`.
- Preview deploy first; the owner promotes to production.
- Verify: security headers present, map loads under CSP, magic link works on the
  production domain, cron route returns 401 without the secret.
