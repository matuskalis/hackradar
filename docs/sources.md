# Zdroje dát

Stav overený 5. 9. 2026. Pri zmene ktoréhokoľvek zdroja aktualizujte aj fixture
v `tests/fixtures/` a test v `tests/importers/`.

## Aktívne importéry

### MLH — `scripts/import/mlh.ts`
- `https://www.mlh.com/seasons/{season}/events` (mlh.io presmeruje sem).
- Inertia aplikácia. S hlavičkami `X-Inertia: true` a `X-Inertia-Version`
  vráti JSON, verzia sa číta z `<script data-page="app">` v HTML. Pri 409 sa
  verzia načíta znova.
- Polia: `id`, `name`, `startsAt`, `endsAt`, `formatType` (`physical` /
  `digital`), `venueAddress.{city,country}`, `websiteUrl`, `url`, `status`.
- `robots.txt` povoľuje `/seasons` (zakazuje `/graphql`, `/account`).
- Pokrytie k 5. 9. 2026: 70 nadchádzajúcich eventov, z toho US 51, CA 12, IN 3,
  GB 2, MX 1. **Stredná Európa 0.**

### Hack Club — `scripts/import/hackclub.ts`
- `https://hackathons.hackclub.com/api/events/upcoming/` (koncová lomka je
  povinná, inak 308). Dokumentované na `/data`.
- Polia vrátane `latitude` a `longitude`, takže tieto riadky netreba geokódovať.
- Vyžaduje atribúciu. Detail eventu ju zobrazuje pri `source = 'hackclub'`.
- Pokrytie k 5. 9. 2026: 14 eventov, US 8, AU 1, CN 1, EG 1, 3 bez krajiny.
  **Stredná Európa 0.**

## Nezaradené

### Devpost
- `https://devpost.com/api/hackathons?status[]=upcoming&challenge_type[]=in-person`
  funguje a vracia JSON (`per_page` je fixne 9). `robots.txt` nič nezakazuje.
- **Podmienky použitia (§4) však zakazujú automatizovaný prístup.** Preto sa
  importér nepíše. Hodnota `devpost` zostáva v enume `hackathon_source`, takže
  doplnenie je aditívne, ak sa rozhodne inak.

### Eventbrite, Meetup
- Verejné vyhľadávanie cez API zrušené resp. spoplatnené. Použiteľné len pre
  vlastné organizácie. Nezaradené.

## Dôsledok pre projekt

Importéry dnes nedodajú ani jeden stredoeurópsky prezenčný hackathon. Reálnym
zdrojom dát pre región je `scripts/seed/hackathons.csv` a formulár `/pridat`.
Importéry pridávajú online eventy a denným zápisom do `import_runs` držia
Supabase free projekt aktívny (pauzuje po 7 dňoch nečinnosti).

## Geokódovanie

Photon (`https://photon.komoot.io/api/`), bez kľúča, CORS `*`. Nemá zverejnený
limit, len „extensive usage will be throttled“. Držíme ≤ 1 požiadavku za sekundu
a každý výsledok cachujeme v tabuľke `geocode_cache`.

## Mapové dlaždice

OpenFreeMap (`https://tiles.openfreemap.org/styles/liberty`), bez kľúča, bez
limitov, komerčné použitie povolené, atribúcia povinná (rieši ju attribution
control MapLibre). Bez SLA. Štýl je v premennej `NEXT_PUBLIC_MAP_STYLE_URL`.
