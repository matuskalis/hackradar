# Research notes — SK/CZ hackathon seed (updated 2026-09-06, revision 2)

**Revision 2 summary:** The coordinator flagged that the app only shows events whose end
date is in the future, so 22 of the original 28 rows (all `past`) were invisible on the map.
Per the follow-up instructions, every past row was re-checked for genuine annual recurrence
(2+ editions in different years, an edition-numbered name, an archive/edition list, or an
explicit "next year" statement). Rows with that evidence were rolled forward to the next
edition's likely slot and marked `estimated`. Rows without that evidence were dropped
entirely rather than kept with a past date. The 9 individual Hacknime.to rows were dropped
as not being standalone attendable events (see below); no replacement programme-level row
was added because the programme itself has no confirmed/dated upcoming edition.

Net result: file went from 28 rows (6 confirmed + 22 past) to **10 rows (6 confirmed +
4 estimated, 0 past)**. This is intentionally shorter — per the coordinator, "a short
honest file beats a padded one."

WebSearch quota was still exhausted at the start of this revision (confirmed by a test
query at the top of this session) — all recurrence-checking below was done via WebFetch
only, against organiser URLs already collected or directly guessed. Rows/leads I could not
independently re-check with a fresh search are called out explicitly.

## Rows kept unchanged (6, `confirmed`, future — untouched per instruction)

- Startup Weekend Žilina — Oct 9–11 2026
- Hackday Slovensko.Digital — Oct 2–3 2026
- Hack jak Brno 2026 — Nov 27–29 2026
- Hackathon Olomouckého kraje 2026 — Nov 20–22 2026
- IDEA13 – Ideathon MČ Praha 13 — Sep 18–19 2026
- AimtecHackathon (HackIT) 2027 — Mar 19–21 2027

## Rows rolled forward to `estimated` (4)

### Global Game Jam Slovakia
- **Editions seen:** GGJ Slovakia has run at least 3 consecutive years — 2024 ("GGJ Slovakia
  2024"), 2025 ("GGJ Slovakia @TheSpot"), and 2026 (Jan 29–Feb 1 2026, confirmed directly
  via globalgamejam.sk). That is 3 different-year editions — clear recurrence evidence.
- **Slot used:** Global Game Jam is a fixed worldwide slot — the last weekend of January
  (this is the same rule the coordinator gave as the example). 2027's last Sunday of January
  is Jan 31, so the slot is **Jan 29–31, 2027** (Fri–Sun).
- Dropped the 2026 registration form link since it will not be valid for the next edition;
  no new registration link exists yet.
- Venue/city: no venue was ever given on the SK site itself; "Bratislava" is carried over
  from the 2024/2025 pattern (The Spot) as before — still an assumption, flagged again.

### Hackathon CampFire Bratislava
- **Editions seen:** Only one — Feb 27–Mar 1 2026 — but the organiser page (spsehalova.sk)
  explicitly calls it "historicky prvý ročník" (historically first edition/season) **and**
  explicitly closes with "Tešíme sa na budúci ročník!" ("We look forward to next year's
  edition!") — this is the "explicit next-year statement" evidence bar from the
  instructions, even though it's a first edition with no second data point yet.
- **Slot used:** same calendar weekend as the 2026 edition (last Friday of Feb–first Sunday
  of March) → **Feb 26–28, 2027** (Fri–Sun).
- No registration link was ever published for 2026 either, so none carried forward.

### Hackathon 2027 – Pronea
- **Editions seen:** Confirmed 2 distinct editions on the organiser's own site: "Hackathon
  2024" (pronea.sk/hackathon-2024/, Feb 28–Mar 1 2024) and "Hackathon 2026"
  (pronea.sk/en/hackathon-2026/, Mar 18–20 2026). Both editions run **Wed–Fri** (school-week
  format, matching the high-school eligibility) even though the calendar gap between the two
  known editions is 2 years, not 1 — I could not find a 2025 edition on pronea.sk itself, so
  the exact cadence (annual vs. biennial) is not fully certain, only that it recurs.
- **Slot used:** kept the Wed–Fri weekday-triplet pattern, one year after the last known
  edition → **Mar 17–19, 2027** (Wed–Fri, verified against the 2027 calendar).
- `source_url` updated to the 2024 edition page (pronea.sk/hackathon-2024/), since that is
  the page that supplied the actual multi-year recurrence evidence.
- Uncertain: exact 2027 slot could plausibly instead land in late Feb (matching the 2024
  timing) rather than mid-March (matching 2026) — flagged as a genuine estimate, not a
  confirmed pattern.

### Studentský Hardware Hackathon 2027
- **Editions seen:** hwhackathon.cz explicitly frames this as an edition-numbered series —
  "1st edition" (2025, pilot, exact date not given on the page), "2nd edition" (Apr 24–25
  2026, confirmed), and states a "3rd edition" is being planned for 2027 ("dates TBA... we
  will let you know as soon as we launch registrations"). Two dated/named editions plus an
  explicit statement that a next one is in planning meets the evidence bar.
  Note: 1 edition earlier report already flagged edition 3 as "planning stage, dates TBA" —
  that's the organiser's own explicit forward-looking statement.
- **Slot used:** same Fri–Sat weekend as the 2nd edition (co-located with Maker Faire
  Prague), shifted one year → **Apr 23–24, 2027**.
- Uncertain: Maker Faire Prague's own 2027 calendar date was not independently verified
  (could not find/fetch a dedicated Maker Faire Prague 2027 page), so this is a same-weekend
  estimate, not a confirmed co-location date.

## Rows dropped (18) — could not justify rolling forward

- **Hackathon Žilina 2026 (UNIZA)** — Re-checked hackathon.uniza.sk directly for any
  edition-numbering or past-year references; found none ("no mention of previous editions
  ... presented as a standalone 2026 edition"). Dropped.
- **Open Data Heroes Hackathon** (Slovenská sporiteľňa) — Re-checked the akcnezeny.sk
  article specifically for evidence of a prior-year "Open Data Heroes" or similar
  Sporiteľňa hackathon; none found. Dropped.
- **U&C UAS Hackathon 2026** — Re-checked fs.cvut.cz; page gives no historical context, no
  edition number, no prior-year mention. Dropped.
- **Tvoř dopad: Hackathon ENGETO & KBC** — Re-checked engeto.cz; the page contains one
  ambiguous line, "Náš poslední hackathon stál za to!" ("our last hackathon was worth it"),
  which could refer to a *different*, differently-branded ENGETO hackathon (ENGETO runs
  hackathons with rotating corporate partners), not evidence that this specific
  ENGETO×KBC-branded event recurs. Judged insufficient to name a defensible next slot.
  Dropped.
- **Mobility Hackathon 2026** (SIT Port, Plzeň) — Re-checked sitport.cz; no reference to
  2024/2025 editions or edition numbering. Dropped.
- **AI Hackathon Prague** — Re-checked aihackathon.cz specifically for a past-years archive;
  page explicitly frames itself as "Summer 2026" only, future-tense language throughout, no
  2024/2025 archive, reads as a new initiative. The 5 dates found are multiple sittings
  within one season, not multi-year recurrence, so it does not meet the "different years"
  bar. Dropped.
- **Nucleic Acid Structure Annotation & Prediction Hackathon 2026** (Institute of
  Biotechnology, Czech Academy of Sciences) — Re-checked ibt.cas.cz; no reference to a prior
  edition. Dropped.
- **Komerční banka Hackathon** — original Deloitte source already noted "not indicated as an
  annual event ... without mention of future scheduled hackathons." Dropped.
- **Bohemia Game Jam 2026** — Re-checked bohemia.net specifically for an explicit
  next-edition statement; the only forward-looking line is "we can't wait to see what future
  game jams will bring" — vague optimism, not a specific commitment or "next year"
  statement, and no second edition exists yet. Judged this does not clear the bar (contrast
  with CampFire Bratislava's explicit "Tešíme sa na budúci ročník!"). Dropped.
- **9× Hacknime.to individual entries** (Smart Sports Facilities Petržalka, Digital
  Infrastructure in the Kysuce Microregion, HackniCity, Innovations for Trnava's Dynamic
  Traffic using AI, Regional Development Portal, Digital Citizen, Building a City with a
  Clear Investment System, Digital Fair Portal of the City, Intelligent Event Guide) —
  Agreed with the coordinator's read: these are individual, differently-themed,
  differently-hosted municipal challenges inside one government programme, not separately
  attendable recurring hackathons in their own right — each ran exactly once, in a
  different town, on a different topic. Dropped as individual rows.
  - **Considered adding one consolidated "Hacknime.to programme" row instead**, per the
    coordinator's fallback instruction. Checked both mirri.gov.sk (the funding ministry's
    own programme page) and hacknime.to's own site directly:
    - mirri.gov.sk describes the programme ("Investícia 5: Hackathony") as active, with a
      target of 17 hackathons through 2026 and mentions a "next call for proposals," but
      that page's own language ("s veľkou pravdepodobnosťou v Q1 2024") reads as stale/
      unmaintained copy rather than a current schedule.
    - hacknime.to's own listing (checked directly, most recent fetch) shows **all editions
      marked "Completed,"** the most recent being Oct 10–11 2025 (11 months before today's
      date), and explicitly **no open registration or announced 2026/2027 hackathon** — only
      a generic "join the upcoming hackathon" call-to-action with no date attached.
    - Since the programme has no confirmed, dated, openable "next edition" page, it does
      not meet the coordinator's condition ("if it has an upcoming or annually recurring
      edition with its own page"). No replacement row was added. If the programme resumes
      with a dated call, it would be worth re-adding as a single row pointing at that call's
      page.

## Rows/leads not independently re-checked this round (WebSearch quota exhausted)

All recurrence checks above were done via direct WebFetch of pages already on file from the
first pass, or of directly-guessed URLs (e.g. pronea.sk/hackathon-2024/, hacknime.to/en/,
mirri.gov.sk). No new discovery search was possible, so this revision only re-examined the
28 rows already found — it did not go looking for additional future-dated SK/CZ events that
might exist. If the coordinator wants the row count back above 10, a fresh WebSearch pass
(new session or raised quota) would likely surface more confirmed-future events than this
revision could recover purely by rolling forward past ones.

## Final counts

- Total rows: 10 (down from 28)
- By country: SK = 5, CZ = 5
- By date_confidence: confirmed = 6, estimated = 4, past = 0
- Combined with the pre-existing coverage (4 SK + 9 CZ = 13 rows not re-included here per
  the original instructions), total combined dataset ≈ 23 rows, all with end dates in the
  future.
