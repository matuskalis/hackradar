# HackRadar

Mapa hackathonov v strednej Európe. Návštevník povolí polohu alebo zadá mesto a
vidí hackathony v okruhu 10 až 200 km na mape aj v zozname, s filtrami, detailom,
odkazom na registráciu a exportom do kalendára.

Pracovný názov. Región: SK, CZ, AT, HU, PL (+ DE ako susedný filter).

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, Supabase Postgres
s PostGIS, MapLibre GL JS 5 s dlaždicami OpenFreeMap, geokódovanie Photon.
Bez platených služieb.

## Rozbehnutie

```bash
npm install
supabase start          # lokálny Postgres + PostGIS v Dockeri
supabase db reset       # aplikuje migrácie zo supabase/migrations
npm run db:types        # vygeneruje lib/db/database.types.ts
cp .env.example .env.local   # hodnoty vypíše `supabase status`
npm run seed            # naplní databázu zo scripts/seed/hackathons.csv
npm run dev
```

Lokálny Supabase beží na neštandardných portoch (API 54521, databáza 54522,
Studio 54523), aby nekolidoval s inými projektmi na tom istom počítači.

## Skripty

| Príkaz | Čo robí |
|---|---|
| `npm run dev` | vývojový server |
| `npm run build` | produkčný build |
| `npm test` | jednotkové testy (Vitest) |
| `npm run lint` | ESLint |
| `npm run seed` | načíta `scripts/seed/hackathons.csv` |
| `npm run import -- mlh` | import z MLH |
| `npm run import -- hackclub` | import z Hack Club |
| `npm run db:types` | vygeneruje typy z lokálnej databázy |

## Ako sa dáta dostanú na mapu

Tri kanály, všetky idú cez jedinú zapisovaciu cestu `lib/hackathons/upsert.ts`,
ktorá rieši slug aj deduplikáciu:

1. **Seed CSV** — každý `.csv` v `scripts/seed/` sa načíta, takže výskumné
   dávky sa pridávajú ako samostatné súbory a prekryvy medzi nimi zlúči
   deduplikácia. Všetky riadky sa zverejnia. Stĺpec `date_confidence` hovorí, či bol termín
   potvrdený na stránke organizátora (`confirmed`), alebo je odhadnutý podľa
   minuloročného ročníka (`estimated`, `past`). Seed na konci vypíše zoznam
   riadkov s neovereným termínom, aby sa dali skontrolovať.
2. **Importéry** (`scripts/import/`) — MLH a Hack Club, denne cez GitHub
   Actions. Podrobnosti a stav zdrojov sú v `docs/sources.md`.
3. **Formulár** `/pridat` — verejné odoslanie, uloží sa ako `pending`.

Schvaľovanie zatiaľ nemá vlastné rozhranie. Riadok sa zverejní prepnutím
`status` na `published` v Supabase Studiu. Admin rozhranie je až fáza 2.

### Deduplikácia

Dva záznamy sú to isté podujatie, ak sa začínajú do 24 hodín od seba a zhodujú
sa v normalizovanom názve alebo v doméne registračného odkazu. Rôzne mestá sa
nikdy nezlúčia: jeden hackathon často beží paralelné mestské edície cez jednu
registračnú stránku.

## Štruktúra

```
app/                 stránky a route handlery
components/          map/, explore/, search/, submit/
lib/                 db/, hackathons/, validation/, hooks/, ics, taxonomy, cities
scripts/seed/        seed skript + CSV
scripts/import/      importéry a ich spoločná logika
supabase/migrations/ schéma, RLS, funkcie
docs/                sources.md (zdroje dát), seed-notes.md (overenie riadkov)
```

## Bezpečnosť dát

RLS je zapnuté na všetkých tabuľkách. Anonymný kľúč číta iba riadky so stavom
`published`, žiadna anonymná zapisovacia politika neexistuje. Všetky zápisy
prechádzajú service-role kľúčom na serveri. Poloha návštevníka sa nikam
neukladá.

## Známe obmedzenia

- MapLibre je zámerne verzia 5. Verzia 6.7 sa pod Turbopackom nenačíta
  (štýl zostane nenačítaný a nevyžiada si ani jednu dlaždicu).
- Importéry dnes nedodajú ani jeden stredoeurópsky prezenčný hackathon.
  Reálnym zdrojom pre región je seed CSV a formulár.
- Časť podujatí má odhadnutý termín, nie potvrdený. Ide o každoročné akcie,
  ktorým sa dal doložiť pravidelný termín, ale nový ročník ešte nebol
  vyhlásený. Na mape sa zobrazujú rovnako ako potvrdené. Dôvody sú v
  `docs/seed-notes*.md`.
- Podujatie, ktoré už skončilo, sa na mape nikdy nezobrazí. Vyhľadávanie
  filtruje `end_at >= now()`. Preto seed obsahuje len budúce termíny.
- Maďarsko a Rakúsko sú najslabšie pokryté. Maďarské zdroje boli počas
  výskumu zväčša nedostupné alebo blokované, rakúske firemné a univerzitné
  stránky verejné hackathony neuvádzali.
- Bez účtov, upozornení a admin rozhrania. To je fáza 2.
