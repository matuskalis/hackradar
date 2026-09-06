# Research notes — Austria + Central European hackathon series (revision 2)

Revision requested by coordinator on 2026-09-06: the app only shows events whose end date
is in the future, so the first draft's 28 past-dated rows (19 Hacknime.to + 9 series rows
with 2026 dates already behind "today") were invisible. This revision:
1. Drops all 19 Hacknime.to rows (per coordinator: independently confirmed to be completed
   municipal challenges, not registrable hackathons, with no dated upcoming edition).
2. Rolls every remaining past-dated row forward to its next evidenced annual slot, marked
   `estimated`, or drops the row if no slot could be justified.
3. Adds one new confirmed, future-dated Austria row (KI-Challenge Vienna) found by working
   through the coordinator's new list of angles.

Result: 14 rows, all with an end date after 2026-09-06 ("today"). By country: AT 5, CZ 4,
PL 3, HU 1, SK 1. By date_confidence: confirmed 6, estimated 8, past 0.

## Rows kept unchanged (already future-dated in the first draft, no action needed)

1. **NASA Space Apps Challenge Vienna (AT)** — Nov 14–15 2026, confirmed (global slot).
2. **NASA Space Apps Challenge Prague (CZ)** — Nov 14–15 2026, estimated off the same
   global slot; Prague-specific 2026 confirmation still not published.
3. **NASA Space Apps Challenge Kraków (PL)** — Nov 14–15 2026, estimated, same reasoning.
4. **NASA Space Apps Challenge Budapest (HU)** — Nov 14–15 2026, estimated, same reasoning.
5. **CASSINI Hackathon Prague (CZ)** — Nov 27–29 2026, confirmed via cassini.eu.
6. **CASSINI Hackathon Gdańsk (PL)** — Nov 27–29 2026, confirmed via cassini.eu.
7. **Vibecoding Hackathon Vienna (AT)** — Sept 22 2026, confirmed via its own Eventbrite page.
8. **HackYeah Kraków (PL)** — Oct 3–4 2026, confirmed via hackyeah.pl.

## Rows rolled forward (were past, now estimated)

9. **Global Game Jam Vienna (AT)** — Editions seen: TU Wien hosted GGJ 2022–2026 (2026 dates:
   Fri Jan 30–Sun Feb 1, confirmed via informatics.tuwien.ac.at). Slot used: GGJ's globally
   fixed "last full weekend of January" rule (per coordinator: 2027 edition is 29–31 Jan
   2027). Rolled start/end to **2027-01-29 / 2027-01-31**, kept TU Wien's 2026 hour pattern
   (Fri 17:00 start, Sun 18:00 end) as a placeholder since 2027 hours aren't published yet.
   Venue (Lecture Hall FAV 1, TU Wien) carried over from 2026 — TU Wien has run it 5 years
   running, but the 2027 site itself is not yet confirmed on globalgamejam.org.
10. **Red Bull Basement Austria (AT)** — Editions seen: only the single confirmed 2026
    national final (Graz, Wed 29 Apr 2026), but the wider programme is confirmed multi-year
    and annual (redbull.com/int-en/event-series/basement names a 2024 World Final in Tokyo
    and a 2026 World Final in San Francisco, i.e. at least 3 consecutive annual cycles with
    each country running a national final ahead of a June World Final). Slot used: no
    country-specific multi-year day pattern exists yet, so I shifted the single 2026 date by
    exactly 364 days (52 weeks) to preserve the same weekday (Wednesday) rather than an
    arbitrary +1 year: **2027-04-28**. Flagged lower-confidence than GGJ in this note because
    it rests on one country-year of data plus the programme-level recurrence evidence.
11. **Red Bull Basement Czech Republic (CZ)** — Same programme-level evidence as above.
    2026 national final: Brno, Wed 13 May 2026. Same 364-day weekday-preserving shift ->
    **2027-05-12** (Wednesday). Venue still "TBA" on Red Bull's own listing, as in the
    original draft.
12. **Red Bull Basement Slovakia (SK)** — Same programme-level evidence. 2026 national
    final: Bratislava, Mon 11 May 2026, The Spot cowork. Same 364-day shift ->
    **2027-05-10** (Monday).
13. **ETHPrague (CZ)** — Editions seen: 2025 (Tue 27–Thu 29 May, from 2025.ethprague.com)
    and 2026 (Fri 8–Sun 10 May, from ethprague.com). Both editions fall in May, but the exact
    day-of-month and day-of-week are not consistent between the two years, so there is no
    day-level slot to reuse — only a month-level one. Slot used: "May" only; I picked a
    representative Fri–Sun weekend, **2027-05-14 to 2027-05-16**, and marked this the
    weakest of the rolled-forward rows because the exact date is a placeholder, not a
    pattern match. Kept because the coordinator's brief explicitly asks for "any other
    rotating series edition where the organiser publishes a regular slot," and a month-level
    slot is real evidence even without day-level precision.

## New Austria row added

14. **KI-Challenge Vienna (AT)** — Found via TU Wien Informatics' own news page, which
    linked to sozialversicherung.at's own event page. Fully confirmed there: Nov 5–6 2026
    (already future), venue and street address (Dachverband der Sozialversicherungsträger,
    Kundmanngasse 21, 1030 Wien), registration deadline (25 Oct 2026, by email), prize tiers
    (€5,000/€3,000/€2,000). The page states this is the *second* edition, following a "Data
    Challenge 2023" — real recurrence evidence, though not annual/fixed enough to also
    project a 2027 date, so only the confirmed 2026 date is included.

## Rows dropped in this revision

- **All 19 Hacknime.to rows (SK)** — Dropped per coordinator instruction: a second
  researcher independently reached the same conclusion I had flagged in the first draft —
  these are individual completed municipal challenges with no dated upcoming edition, not
  hackathons a person can register for. This took Slovakia from 20 rows to 0; I could not
  find a replacement Slovak row in the time available (Red Bull Basement Slovakia is the only
  SK row left).
- **Global Game Jam Kraków (Zabłocie Space), Global Game Jam Kraków Junior, Global Game Jam
  Warszawa/Polyjam (all PL)** — Dropped per coordinator instruction ("skip the Polish ones to
  avoid churn" — another researcher already dated the Polish GGJ sites to 2027-01-29
  independently). Not re-added to avoid duplicate/conflicting entries.
- **ETHSilesia Katowice (PL)** — Re-checked ethsilesia.pl directly for any mention of a prior
  edition: found none. The page frames 2026 as bringing "the energy of ETHWarsaw... to
  Silesia," which reads as an inaugural edition, not a recurring one. Per the coordinator's
  rule to drop anything that can't be justified as a roll-forward, this row is dropped rather
  than guessing a 2027 date for what may be a one-off.
- **Climathon (all countries)** — Retried under the assumption it has a fixed annual autumn
  slot. climathon.co no longer resolves (DNS failure); climate-kic.org's current community
  hub (climate-hive.org/events/) lists Climate-KIC's live event calendar and it contains no
  Climathon-branded event at all, in any country, past or upcoming. I could not open a single
  page confirming a live Climathon edition anywhere, so there is nothing to roll forward —
  this is not "found but stale," it is "not found this session at all."

## New Austria angles tried (per coordinator's list) that did not produce a usable row

- **derstandard.at** — the tag/search page served only a cookie/ad-blocker notice, no event
  listing content reachable via WebFetch.
- **futurezone.at** — both the tag page and homepage returned 403/no event content.
- **Vienna Business Agency / Wirtschaftsagentur Wien** (viennabusinessagency.at) — the full
  events page loaded; only real "challenge" format found was **Biofabrique Vienna Challenge**
  ("Applied Colours" / "Colours at Work", 25 Sep–4 Oct 2026, Nordwestbahnhof Areal, Wien).
  Excluded: this is a bio-material design open call with a multi-day submission deadline, not
  a hackathon sprint — same reasoning as excluding SoCraTes as an unconference in the first
  draft.
- **Impact Hub Vienna** — impacthub.net's global page has no event detail; impacthubvienna.com
  does not resolve (DNS failure). No hackathon content found.
- **weXelerate** — opened their live event calendar directly (35 events listed for autumn
  2026). The only recurring "code" event is "Vibe Code Wednesday," which its own event page
  describes explicitly as a no-agenda, no-registration, drop-in co-working session ("No
  sign-up. No agenda. No keynote.") — not a hackathon, excluded as out of scope.
- **Talent Garden Vienna** — main campus page loaded with no hackathon content; the
  /events sub-path 404'd.
- **sektor5** — certificate expired, page could not be opened.
- **Metalab / Chaos Computer Club Vienna (c3w.at)** — both opened directly; c3w.at mentions
  a "Hacktours Wien" nav item with no event detail behind it, and Metalab's own public
  calendar for the relevant months lists meetups/workshops but no hackathon.
- **TU Wien Informatics event calendar** — informatics.tuwien.ac.at/events 404s, but its news
  page (informatics.tuwien.ac.at/news) does render and is what surfaced both the GGJ Vienna
  history and the KI-Challenge Vienna row above.
- **FH Campus Wien** (now branded Hochschule Campus Wien, hcw.ac.at) — opened directly, no
  hackathon content.
- **FH St. Pölten** (now branded USTP, ustp.at) — opened directly, only non-hackathon events
  listed (a summit, a wellbeing-systems talk, bachelor.day).
- **Salzburg Research** — opened directly, no hackathon content in the events list.
- **Ars Electronica Linz** — opened the 2026 festival programme directly; found workshops and
  "open labs" ("create your world" at MED CAMPUS) but nothing framed as a competitive
  hackathon.
- **Austrian NASA Space Apps beyond Vienna** — tried the 2026 local-event slugs for Graz,
  Linz, Salzburg and Innsbruck directly on spaceappschallenge.org: all four returned the
  same generic "third-party redirect" placeholder that Bratislava/Košice returned in the
  first draft (i.e., not real, live pages), unlike Vienna's page which renders real content.
  No other Austrian Space Apps city could be confirmed.
- Also tried and found nothing: WKO Wien / Wirtschaftskammer event calendar, AustrianStartups
  events page (lists only undated nav items), ISTA (Institute of Science and Technology
  Austria) events, Complexity Science Hub events through year-end 2026, Frequentis careers
  page (404), meetup.com's Vienna hackathon topic page (no server-rendered content), AI
  Factory Austria's own site (the Vibecoding Hackathon venue/co-organizer — no other events
  listed).

## Why Austria is still thin

5 rows, all now future-dated, is the honest result of directly opening every lead the
coordinator suggested plus the ones from the first pass. The pattern across nearly every
corporate/university page checked (both rounds) is the same: these organisations run
plenty of conferences, meetups, "challenges" with week-long submission windows, and
unconferences, but very few run an actual sprint-format, register-and-show-up hackathon with
a public page. The two new Austria finds this round (KI-Challenge Vienna, and ruling out
Vibe Code Wednesday / Biofabrique as out-of-format) came from following links inside pages
already in hand (TU Wien's own news feed, Wirtschaftsagentur's events page) rather than from
guessing fresh domains, which suggests further gains would come from a similar "follow the
links from real Austrian tech-event calendars" pass rather than more direct domain guessing.
