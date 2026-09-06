# Notes: seed-ai-online.csv research

Date of research: 2026-09-06. WebSearch was unavailable for this session; all research done via WebFetch starting from the URLs supplied in the task, following links found on those pages.

## IMPORTANT CAVEAT UP FRONT

Only **11 rows** were produced, well short of the 25+ target. This is not for lack of trying (60+ WebFetch calls were made across every suggested source plus many additional ones). The honest finding is that, as of today, there are very few *currently listed, dated, genuinely online-or-hybrid* hackathons run by or with big AI/cloud companies with end dates after 2026-09-06. Most big-company "events" pages (Anthropic, Meta, NVIDIA, Google Cloud, AWS, Azure) list conferences, webinars and summits, not hackathons. The one platform that reliably lists dated, build-and-submit online/hybrid hackathons is **lablab.ai**, and its entire current catalog is only 12 events (verified exhaustively, see below), 5 of which don't qualify (3 already ended before 2026-09-06, 2 have TBA dates with no confirmed slot). MLH's dedicated Global Hack Week calendar (ghw.mlh.com) adds 3 more confirmed online slots. One more online hackathon (Geminithon 2026) was found via GitHub Education's community events calendar. Beyond that, extensive probing of NVIDIA, Hugging Face, Kaggle, W&B, Together AI, Modal, LangChain, LlamaIndex, Cohere, Mistral, IBM, Snowflake, Hack2Skill, AI Tinkerers, itch.io, Hack Club, Google Developer Groups, Imagine Cup, Call for Code, and several Microsoft Reactor/Azure pages turned up either (a) nothing dated, (b) past events only, (c) in-person-only events (excluded per the online-priority rule), or (d) pages that don't render list content to a text-only fetcher (Kaggle, NVIDIA main events page are JS-heavy and returned only nav chrome).

## Row-by-row verification

1. **Lablab x AMD AI Academy Challenge** (Sep 1 – Dec 1, 2026, online). Verified on its own lablab.ai event page: dates, "Online" format, $5,000 prize pool, organizers lablab.ai/AMD/NativelyAI. No explicit distinct registration URL or exact time/timezone was given on the page, so start/end times default to 09:00/18:00 UTC per task rules.

2. **AssemblyAI Voice Agent Hackathon** (Sep 1–30, 2026, online). Verified on its own page: "$10,000 ($5k cash + $5k AAI credits)" prize, 2,110 registrants shown, organizer lablab.ai in partnership with AssemblyAI.

3. **AI Infra Summit Hackathon** (Sep 10–17, 2026, hybrid). Verified: online build Sep 10–16, on-site Sep 15–17 at Santa Clara Convention Center (5001 Great America Pkwy, Santa Clara, CA, USA); organizer Kisaco Research + lablab.ai. No prize amount given on page.

4. **WeAreDevelopers Hackathon** (Sep 18–25, 2026, hybrid). Verified: online build Sep 18–24, on-site Sep 23–25 at WeAreDevelopers World Congress North America, San Jose, USA; 1,878 registrants shown. No prize amount given.

5. **IBM Bob 2.0 Hackathon** (Sep 25–27, 2026, online). Verified: 48-hour fully online build, $10,000 total prize pool, 8,565 registrants shown, organizer lablab.ai with IBM.

6. **AMD Developer Hackathon: ACT III** (Oct 12–18, 2026, hybrid). Verified: online build Oct 12–18, on-site Oct 17–18 across Rome/Milan/Imperia, Italy (multiple cities, so city field left blank, country_code=IT); prize pool "$5,000+"; 1,784 registrants shown.

7. **TechEx Amsterdam Hackathon** (Oct 16–20, 2026, hybrid). Verified: online build Oct 16–19, on-site Oct 19–20 at RAI Amsterdam (Europaplein 24, 1078 GZ Amsterdam, Netherlands), part of AI & Big Data Expo Europe; organizer TechEx Events + lablab.ai. 581 registrants shown, no prize amount given.

8–10. **MLH Global Hack Week: Data Week / Hacktoberfest / Builders Week**. Verified directly on https://ghw.mlh.com/, which lists exactly these three upcoming digital editions with dates (Sep 11–17, Oct 9–15, Nov 6–12, 2026 respectively), all free, all "online," registration via https://mlh.link/ghw for all three. Cross-checked against https://www.mlh.com/seasons/2026/events and /seasons/2027/events, which show the same series (older editions from May/Jun 2026 are already past and were excluded).

11. **Geminithon 2026** (Sep 19, 2026, online). Found via https://education.github.com/events (GitHub Education's community events calendar), which explicitly tagged it "Online," in Pakistan, described as "a hybrid AI and cloud innovation hackathon...focused on Google Gemini, Google Cloud, and AWS." NOTE: its own page (https://luma.com/5o2ogdww) returned HTTP 404 on both fetch attempts — the event itself was described in detail on a real, opened page (the GitHub Education calendar), but its dedicated registration page may have been taken down or the slug may be stale. Flagging this as the weakest-verified row in the set; a follow-up pass should re-check this URL or drop the row if it still 404s.

## Excluded — found but did not qualify (with reasons)

- **AI GENESIS** (lablab.ai/ai-hackathons/ai-genesis-2026) — hybrid, Dubai, "Largest AI Hackathon in the Middle East," but dates are explicitly "TBA." No prior edition exists to establish a cadence to roll forward from, so per the task rules this was excluded rather than guessing a date.
- **The Rise of AI Agents Hackathon** (lablab.ai/ai-hackathons/ai-agents-ai-week-hackathon) — hybrid, Dubai AI Week, "$60,000+ prize pool," but dates are "Fall 2026 (TBA)." Same reasoning as above — excluded, not invented.
- **Alpaca AI Trading Agents Hackathon** (Aug 28–Sep 4, 2026), **AI Factory / NativeBuilder** (Aug 3–10, 2026), **AMD Developer Hackathon: ACT II** (Jul 6–13, 2026) — all on lablab.ai, all online, but all ended before 2026-09-06 (today). No evidence of a fixed monthly/quarterly cadence for these specific one-off names that would justify rolling forward an estimated next date.
- **CoreWeave Hacks: Agent Loops Hackathon** (W&B events page) — in-person only, San Francisco, Sep 12, 2026. Excluded (not online/hybrid).
- **Boston Computational Biology Hackathon with Anthropic, Modal, and Flagship Pioneering** (Modal's Luma page) — in-person only, Cambridge MA. Excluded.
- **AI Tinkerers "Agents, Everywhere: Global Hackathon"** (Sep 12, 2026) — runs simultaneously across ~10 cities (Seoul, Hong Kong, Singapore, Da Nang, Kuala Lumpur, Dhaka, Hyderabad, Pune, Puducherry, Islamabad, Tashkent, Abu Dhabi) but every single city instance is in-person, not online. Excluded.
- **Hack the North** (Cohere events page, Sep 18, 2026, Waterloo) — in-person student hackathon Cohere sponsors. Excluded (in-person).
- **Microsoft AI Agents Hackathon** (microsoft.github.io/AI_Agents_Hackathon) — was a genuine free 3-week virtual hackathon with $20,000 top prize, but only one edition exists (April 2025) and the GitHub repo is now archived (Mar 29, 2026) with no announced 2026 edition. Not included as no confirmed or clearly-cadenced future date exists.
- **Call for Code AI 2026** (callforcode.org) — IBM's own page states "not a hackathon" (framed as ongoing infrastructure/program); also its 2026 window (launched June 11, winners announced July 30) already ended before today. Excluded on both counts.
- **Gemini API Developer Competition** (ai.google.dev/competition) — real event but ran May–Aug 2024; no 2026 edition found on the same URL. Excluded (past, no current edition).
- **Mistral AI Fine-tuning Hackathon** (mistral.ai/news) — dated June 2024, no newer edition found on mistral.ai/news. Excluded (past).

## Pages checked that had NO qualifying (or no) events — so a later pass does not repeat them

- https://www.anthropic.com/events — lists only conferences/summits/startup house events, no hackathons at all.
- https://ai.meta.com/events/ and https://ai.meta.com/blog/ — no events/hackathons listed at all.
- https://www.nvidia.com/en-us/events/ (and /events/hackathon/) — JS-heavy, text fetch returns only nav chrome, no event listing content came through. https://developer.nvidia.com/blog/tag/hackathon/ showed only past 2025 hackathons (Blackwell NVFP4, AWS & NVIDIA Agentic AI, NeMo Agent Toolkit), nothing dated 2026.
- https://developer.microsoft.com/en-us/reactor/ and /reactor/events/ — reactor's own listing pages returned almost no content (single generic Azure webinar); /reactor/events/ and /reactor/search/?q=hackathon returned 404.
- https://azure.microsoft.com/en-us/community/events — no specific hackathon list, just links to a search catalog.
- https://aws.amazon.com/events/, /events/explore-aws-events/, /gameday/, /deepracer/ — no hackathon-specific events with dates; GameDay page only showed a past Terraform GameDay in Montreal (May 2026, in-person) and an AWS Summit (in-person).
- https://cloud.google.com/events — only webinars/TechBytes and one Google Cloud Summit (Doha, in-person) and a "Google Cloud Labs: Agentic space quest" (Sep 22, online, but a guided lab/workshop, not a build-and-submit hackathon — excluded on format grounds).
- https://developers.google.com/community/gdsc-solution-challenge and https://solutionchallenge.withgoogle.com/ — 404 / no Solution Challenge details found; https://developers.google.com/community/build-with-ai — describes the "Build with AI" GDG workshop series generically, no specific dated hackathon instance.
- https://huggingface.co/events, /spaces?q=hackathon, /hackathons, /MCP-Hackathon, /search/full-text?q=hackathon, /blog?tags=hackathon — all either empty or show only past (2023–2025) hackathon spaces.
- https://github.com/github/GitHub-Copilot-Dev-Days — series is "closed for new events" for its 2026 round (Mar–May 2026, already past), in-person community-led format, no online editions found; its Luma calendar (luma.com/githubcopilotdevdays) rendered no visible events.
- https://mlh.io / https://www.mlh.com — homepage itself lists no dated events; season pages needed (see above).
- https://www.together.ai/events, https://modal.com/events (redirects to Luma), https://www.langchain.com/events, https://www.llamaindex.ai/events (404), https://wandb.ai/site/resources/events/ — no online hackathons; all conferences/webinars/meetups or in-person-only hackathons.
- https://www.kaggle.com/competitions and variant query URLs — Kaggle's competitions listing is JS-rendered; WebFetch could not retrieve actual competition rows, only the page title. Unresolved — a later pass with a JS-capable fetch would be needed.
- https://cohere.com/events — only in-person events + 2 online webinars (not hackathons).
- https://groq.com/events (blog), https://www.perplexity.ai/hackathon (403), https://elevenlabs.io/blog/worldwide-hackathon (404) — no accessible content.
- https://hack2skill.com/ and /hackathons-listing — page did not render usable event content via WebFetch.
- https://imaginecup.microsoft.com/ — 2027 edition "Coming soon," no dated 2026 online hackathon window found.
- https://developer.microsoft.com/en-us/reactor/events/25323/ (Microsoft AI Agents Hackathon registration link) not re-checked directly; the GitHub repo confirms no active 2026 edition.
- https://education.github.com/events — the one useful discovery (Geminithon 2026); the other 52 events listed there are in-person (mostly student/campus events across Pakistan, India, Nigeria, Uganda, Mexico, etc.) or a webinar; only Geminithon 2026 and "GDG Devfest Modena" (Oct 3, "online" per the calendar tag) were tagged online — Devfest Modena's own site confirmed it's a talks/workshops conference with no hackathon component, so it was excluded.
- https://developers.googleblog.com/en/search/?q=hackathon — 2,806 results but none of the visible ones were dated hackathon announcements.
- https://www.together.ai/blog — request timed out (60s), not retried.
- https://lablab.ai/tech/{aws, openai, microsoft, nvidia, anthropic, hugging-face, google-cloud, cohere, mistral-ai, github-copilot, azure-openai-service (404), groq} — all tag pages are filtered views of the same 12-event catalog (confirmed via direct comparison), no additional events beyond the main /ai-hackathons list.

## Counts

By organizer:
- lablab.ai (with various partners: AMD x2, AssemblyAI, IBM, WeAreDevelopers, Kisaco Research, TechEx Events): 7
- Major League Hacking: 3
- GitHub Education (community-organized): 1

By date_confidence:
- confirmed: 11
- estimated: 0
- past: 0 (none included, per instructions)

Total rows: 11 (target was 25+; see caveat above for why).
