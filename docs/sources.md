# Zdroje dát

> **Automatické importéry boli 8. 9. 2026 zrušené.** Za celý čas, čo bežali,
> pridali jedno podujatie zo 106; ani MLH, ani Hack Club nemajú v strednej
> Európe prezenčné hackathony. Kód aj denný cron sú preč. Podujatia pribúdajú
> cez seed CSV, formulár `/pridat`, pull request a e-mail.
>
> Prieskum zdrojov nižšie zostáva, lebo hovorí, čo sa preverilo a s akým
> výsledkom. Ak sa k importu niekedy vrátime, netreba to robiť znova.

Stav overený 5. 9. 2026. Pri zmene ktoréhokoľvek zdroja aktualizujte aj fixture
v `tests/fixtures/` a test v `tests/importers/`.

## Preverené zdroje

### MLH
- `https://www.mlh.com/seasons/{season}/events` (mlh.io presmeruje sem).
- Inertia aplikácia. S hlavičkami `X-Inertia: true` a `X-Inertia-Version`
  vráti JSON, verzia sa číta z `<script data-page="app">` v HTML. Pri 409 sa
  verzia načíta znova.
- Polia: `id`, `name`, `startsAt`, `endsAt`, `formatType` (`physical` /
  `digital`), `venueAddress.{city,country}`, `websiteUrl`, `url`, `status`.
- `robots.txt` povoľuje `/seasons` (zakazuje `/graphql`, `/account`).
- Pokrytie k 5. 9. 2026: 70 nadchádzajúcich eventov, z toho US 51, CA 12, IN 3,
  GB 2, MX 1. **Stredná Európa 0.**

### Hack Club
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

Ani jeden preverený zdroj nedodá stredoeurópsky prezenčný hackathon. To je
dôvod, prečo importéry padli. Reálnym zdrojom dát pre región sú CSV súbory
v `scripts/seed/`, formulár `/pridat`, pull request a e-mail.

Pozor na jeden vedľajší účinok: denný cron zároveň držal Supabase free projekt
aktívny, ten sa po 7 dňoch nečinnosti pauzuje. Po nasadení to bude treba
vyriešiť inak.

## Geokódovanie

Používa ho `lib/geocode.ts` pri seede aj pri odoslaní formulára.
Photon (`https://photon.komoot.io/api/`), bez kľúča, CORS `*`. Nemá zverejnený
limit, len „extensive usage will be throttled“. Držíme ≤ 1 požiadavku za sekundu
a každý výsledok cachujeme v tabuľke `geocode_cache`.

## Mapové dlaždice

OpenFreeMap (`https://tiles.openfreemap.org/styles/liberty`), bez kľúča, bez
limitov, komerčné použitie povolené, atribúcia povinná (rieši ju attribution
control MapLibre). Bez SLA. Štýl je v premennej `NEXT_PUBLIC_MAP_STYLE_URL`.
