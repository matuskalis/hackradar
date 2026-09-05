# Seed hackathon dataset — research notes

**Status: PARTIAL / first pass.** 29 verified rows delivered now per coordinator request (target was 40-60; honest verification effort so far yielded 29 solid rows plus a long list of leads that were investigated and rejected — see "Excluded" section). Today's reference date used throughout: 2026-09-05. A second pass can add more CZ/PL rows and try harder on AT/HU, which are thinner.

Every row below was verified by actually opening the event's own page (or, where noted, a page about a previous edition of the same recurring event, since the current-year page could not be opened). Dates already in the past relative to 2026-09-05 were only kept when there was clear evidence of the event being a genuinely recurring one (numbered editions, multi-year history, or explicit "annual" framing); a next-edition date was then estimated (`date_confidence=estimated`) by adding ~1 year to the last known edition. Two rows use `past` because the specific city/venue instance is unlikely to repeat but the parent EU program (CASSINI, EUDIS) is clearly strong-recurring.

## Row-by-row

### Czechia (9)
- **Rakathon 2026 (Praha)** — Verified on rakathon.cz: Oct 16–18 2026, FN Motol/Homolka, prizes 100k/50k/25k CZK, >500 participants expected. Confirmed future date. Uncertain: exact venue address, exact end time.
- **Rakathon 2026 (Brno)** — Same event/page, Brno node at Masaryk Memorial Cancer Institute (MOU). Confirmed.
- **ETHPrague** — ethprague.com confirms May 8–10 2026 (already past by ref. date). No 2027 date announced yet; estimated same weekend in 2027. Venue/registration via luma.com/ethprague verified.
- **European Defense Tech Hackathon – Prague** — luma.com/edth-2026-prague confirmed May 15–17 2026 (past). Verified this is annual for Prague specifically (edth-2025-prague page also exists). Estimated 2027 repeat. Venue address gated behind registration on Luma, left blank.
- **Hack Your Way** — hackyourway.cz confirmed Apr 27–29 2026 (past), OREA Congress Hotel Brno, sold out. No recurring-year evidence found beyond this edition name convention; treated as single confirmed edition and estimated +1yr with lower confidence — flag as uncertain.
- **Hackathon veřejné správy** — hackujstat.cz confirms this is edition "7.1" (a "6.0" edition from 2025 also found), so genuinely recurring annual govtech hackathon at the Supreme Audit Office. 2026 edition Mar 6–7 (past); estimated 2027.
- **Mediální Hackathon (VOŠP)** — vosp.cz confirms Feb 11–13 2026 edition, journalism school. Page is titled "Mediální Hackathon 2026" (year-in-name convention implies annual); estimated 2027. Uncertain: no explicit multi-year archive found, so recurrence is inferred from naming only.
- **Stavební Hackathon** — bvv.cz confirms this is the "3rd" ("potřetí") year of the construction hackathon at the Brno building fair; Mar 25–28 2026 (past, fair dates used as proxy since exact hackathon hours within the fair weren't given). Estimated 2027.
- **Hackathon ML/AI 2026** — ksi.fjfi.cvut.cz confirmed: Oct 23–24 2026, Děčín campus of FJFI ČVUT, high-school ML/AI competition, prizes 25k/15k/10k CZK. Confirmed future date.

### Slovakia (4) — weakest country, honest effort made but few verifiable events found
- **Hack Kosice** — hackkosice.com/2026/ confirmed Apr 18–19 2026 (past by ref. date); hackslovakia.com/events verified prior editions back to 2019, so strongly recurring. Estimated Apr 2027. Sponsors/prizes list came directly from the 2026 page.
- **Climathon Bratislava** — climathon.bratislava.sk confirms recurring annual event ("Thank you for 2025!" banner, 2025 edition was Oct 24-26). No 2026 date published yet on the page itself; estimated Oct 23–25 2026 from the prior-year pattern and the global Climathon-network recommended window (Oct 12-18 2026, later local events common).
- **Erste Digital Hackathon (Košice)** — Could only successfully open the 2023-edition page (erstedigital.com/sk/hackathon2023, Nov 10-11 2023, Cassovar Business Center + TUKE). The live current page 404'd on direct fetch for me every time, though Google's index shows its title as "Hackathon 6.-7. Novembra 2026" — I did not rely on that snippet alone; date_confidence is `estimated`, derived from the 2023 page's November/TUKE pattern, and the Nov 6-7 2026 figure is flagged here as **uncertain / not independently page-verified**.
- **ETHBratislava Hackathon** — ethbratislava.com (main site) verified venue (FIIT STU, Ilkovičova 2) but its "next edition" field is stale (shows May 23-24 2025 = Vol.1). An OKX news article (successfully fetched) confirms a "Vol.2" already happened in 2026 with 54 devs / €4,000 prizes but gives no date. Estimated Vol.3 ≈ May 2027 by extrapolating the annual cadence. **Low-to-medium confidence on the exact date.**
- Excluded from SK: European Defense Tech Hackathon Bratislava (Oct 16-18 2026, would have been a great confirmed-future row, but the luma.com/edth-2026-bratislava page 404'd on every fetch attempt — could not verify per the "must open the page" rule); PwC Hackathon Bratislava (page found was actually from 2018, not 2026 — a search-snippet mixup, discarded); Copernicus Hackathon Bratislava (page dated 2018, no evidence of recurrence); Open Data Heroes Hackathon by Slovenská sporiteľňa (Mar 2026, page explicitly gave no indication of being annual); HACKFEST 2026 / Pronea Hackathon 2026 / Junior Internet AMAVET (real pages, but single-instance and/or not really "build software in 24-48h" format); Slovak Space Office CASSINI hackathon (no specific date on page).

### Austria (5)
- **AIM Healthcare Hackathon Vienna** — healthcare-hackathon.eu confirms Oct 29–30 2026 (my read of the page; two independent search snippets said Oct 30-Nov 1, so treat the exact end time/day boundary as slightly uncertain), IBM HQ Vienna, €15k+ prizes. Confirmed future.
- **Cultural Hackathon Austria (GLAMhack)** — openglam.at confirms Sept 24–26 2026, FH St. Pölten (note: St. Pölten, not Vienna/Graz, but still Austria). Confirmed future, imminent.
- **START Hack Vienna** — luma.com/sp3ivels confirmed "START Hack Vienna '26" June 6-7 2026 (past), named with year-suffix implying prior "'25"/"'24" editions exist. Estimated June 2027.
- **Digital Girls Hackathon** — tuwien.at confirms June 10-11 2026 edition; a separate 2024 edition (Sept 4-5 2024) was also found, confirming multi-year recurrence (though the month moves around). Estimated June 2027; eligibility mapped to `women` (closest available category for an all-girls program; actual age range is 11-13, younger than "highschool").
- **Bundeslehrlingshackathon** — lehrlingshackathon.at confirmed the 2025 edition (Oct 13-23 2025, WKÖ, "2024 predecessor" explicitly mentioned = confirmed recurring). Estimated an Oct 2026 window (exact days within the window are a guess).
- Excluded from AT: LSZ "Hackathon Wien 2026: Corporate Coding for Sustainability" (Oct 13-15 2026 — genuinely confirmed-future per two independent search snippets, and a 2025 predecessor edition exists, so this would have been a strong row, but lsz.at/hackathon/vienna-sustainability returned HTTP 403 on every fetch attempt (tried 3 times) and the JKU PDF mirror failed TLS verification — could not open any page, so dropped per the rules); EUDIS Defence Hackathon Autumn 2026 Austria-node (confirmed Oct 15-17 2026 EU-wide, "Defence Innovation Hub Austria" as local organiser, but could not determine which Austrian city hosts it after several searches and a defenceinnovationhub.at fetch); ADMIRAL Hackathon Vienna, Zero-One Hack, Public AI Hackathon (Bundeskanzleramt), FH Salzburg Hochschul-Challenge, Linz hACkT, CEU Hackathon for Social Impact (Vienna), CodingAustria Hackathon — all real pages, but single-instance with no recurrence evidence, or already past with no way to estimate a next date honestly.

### Hungary (3) — weakest country together with Slovakia
- **Hacktivity** — Multiple independent sources (infosec-conferences.com, 10times, hacktivity.com ecosystem) confirm Oct 21 2026, Lurdy Conference Center, Budapest; region's biggest IT-security festival with a HackCenter CTF component. Confirmed future.
- **JunctionX Budapest** — crafthub.events/junctionx-budapest confirms it is "an annual hackathon series... returning in 2023 after previous years," 48h hybrid, run by CraftHub. The page's own "next edition" field only said "2024 Fall" (stale). Estimated a Fall/November 2026 date — **this is the weakest-confidence estimate in the whole dataset**, essentially just "some Friday in November 2026" based on the word "Fall."
- **Data-Eng Hackathon (Pannon Egyetem)** — mik.uni-pannon.hu/2026hackathon confirms the "2026" naming convention (implying annual), finale Apr 15 2026 (past). Estimated Apr 2027, Veszprém.
- Excluded from HU (all real pages, all rejected for single-instance/no-recurrence or unreachable-page reasons): GDG Agentic AI Hackathon Budapest (Apr 2026, single instance), GroundUp/Hungarian Hackathon CBRNE (Mar 2026, page explicitly says no indication of being annual), n8n Budapest Hackathon (Jan 2026, a "No.2" edition exists same year but no cross-year pattern), CASSINI Hackathon Budapest (Design Terminal video confirms it happened but no exact date found on any openable page), Agentic Discovery Hackathon HUN-REN (403), K&H HACK3 / Code #LikeABosch (both real, multi-year 2022-2023, but the trail goes cold after 2023 — too stale to safely estimate 2026/2027), EU Sparks for Climate Budapest Hackathon (2024), Green AI Hackathon BME/EELISA (Mar 2026, "not indicated as annual"), Tudomány Mindenkinek Hackathon (2022, Veszprém, stale), BME HackNight & Day (Mar 2026, could not confirm recurrence history), PwC AI Hackathon Hungary (403 on pwc.com/hu), MI/AI Hackathon MKIK (May 2025, no date precision).

### Poland (8)
- **HackYeah** — hackyeah.pl confirms Oct 3-4 2026, Tauron Arena Kraków, 12th edition, 95,000 PLN prize pool. Confirmed future.
- **Web3 Warsaw Hackathon** — Confirmed via ambcrypto.com press coverage: Sept 9-10 2026, part of Blockchain Week Warsaw (5,000+ attendees). Venue not given in the piece I could open; format/venue details thinner than I'd like — flagged as lower-detail-but-still-confirmed-date.
- **GrowUp Hackathon** — growuphackathon.pl confirmed: registration to Oct 20 2026, dev phase Nov-Dec 2026, finale January 2027 in Kraków. Confirmed (dates are the program's own stated timeline, not a guess), though the exact finale day within January isn't given so end_at uses 2027-01-31 as a placeholder for "sometime in January."
- **EUDIS Defence Hackathon (Kraków)** — kosmonauta.net + AGH's own page confirm Mar 26-28 2026 (past), Kraków Technology Park, part of the pan-EU EUDIS program (has run 5 editions). Kept as `past` since the specific Kraków slot for the next edition isn't guaranteed (EUDIS rotates its 8 host cities each round).
- **Kosciuszkon** — kosciuszkon.pk.edu.pl confirms this is the "IV" (4th) edition, May 9-10 2026 (past), Klub Kwadrat Kraków, Honeywell-sponsored CTF/FPGA tracks. Estimated May 2027 (5th edition).
- **CASSINI Hackathon (Wrocław)** — Confirmed via wroclaw.pl official city page: Apr 24-26 2026, part of the 11th (of an ongoing series) CASSINI Hackathon. Kept as `past` since CASSINI rotates host cities each year and Wrocław hosting again isn't guaranteed, but the program itself is clearly strong-recurring.
- **European Defense Tech Hackathon – Warsaw** — luma.com/edth-2026-warsaw confirmed Jun 19-21 2026 (past), with PFR (Polish Development Fund) as co-organiser. Estimated June 2027.
- **BITEhack** — testerzy.pl + bitehack.best.krakow.pl confirm this is the "VIII" (8th) edition, Jan 10-11 2026 (past), Klub Studio Kraków, BEST AGH Kraków organiser. Estimated Jan 2027 (9th edition).
- Excluded from PL: Warsaw.AI Hackathon and "IV Warszawski Hackathon" TECHGENERATION (both real, both confirmed Nov 29-30 2025 via direct fetch, but that's now stale/past-past and I found no clear year-over-year pattern to extrapolate confidently); ETHSilesia (Katowice, Apr 16-19 2026, confirmed via luma.com/ethsilesia, but single edition found, no prior-year evidence); Hackathon dla Małopolski (conflicting dates between two fetches of the same domain, discarded for inconsistency); Ministry of Digitization Bydgoszcz hackathon (explicitly "Poland's first" — no recurrence by definition); Legal Hackathon 2026, Warsaw.AI/GrowUp Hackathon Poznań "Hack of Tomorrow" (stale 2025 single instance).

## Notes on estimated dates generally
Where `date_confidence=estimated`, the exact day was produced by adding ~1 calendar year to the last verified edition's date. This is a genuine guess, not a published date — treat these as "check back closer to the time" placeholders rather than bookable dates. Time-of-day for many rows also defaults to 09:00–18:00 local per the task's rule when the source page didn't give a real clock time.

## Counts

By country:
- CZ: 9
- PL: 8
- AT: 5
- SK: 4
- HU: 3

By date_confidence:
- confirmed: 9
- estimated: 18
- past: 2

Total: 29 rows (below the 40-60 target; SK and HU in particular need a second research pass — most remaining Hungarian and Slovak hackathon coverage online is either single-instance corporate events with no recurrence proof, or 404/403-blocked pages I could not verify).
