# Overenie

Čísla z README a ako sa dajú zopakovať. Merané 30. 9. 2026 na MacBooku M1 Pro, ktorý bol zároveň zaťažený inou prácou, takže absolútne časy berte ako rád veľkosti. Tvary plánov dopytov, počty a pomery sú spoľahlivé.

## CI na čistom Linuxe

Všetkých 9 behov CI od 7. do 18. 9. 2026 zlyhalo (`gh run list`). Príčiny a oprava sú v commite `fix(ci)`: zámok súborov z macOS nemal `@emnapi/core` a `@emnapi/runtime` (voliteľné závislosti wasm32 zostavy sharpu a Tailwindu) a typy `PageProps` či `RouteContext` vznikajú až po `next typegen`.

Celý postup workflowu sa dá spustiť na čistom klone v Dockeri, bez GitHubu:

```bash
git clone . ../hackradar-ci && cd ../hackradar-ci
docker run --rm -v "$PWD":/work -w /work node:24-slim sh -c '
  npm ci && npm run typecheck && npm run lint && npm test &&
  NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54521 \
  NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-placeholder \
  NEXT_PUBLIC_SITE_URL=https://example.com npm run build'
```

Build prejde aj celkom bez premenných prostredia (`env -u NEXT_PUBLIC_SUPABASE_URL -u NEXT_PUBLIC_SUPABASE_ANON_KEY -u NEXT_PUBLIC_SITE_URL npm run build`): stránky miest a sitemap sa predgenerujú prázdne a doplnia sa pri prvej revalidácii. Pred opravou v `lib/hackathons/repo.ts` to padalo na `supabaseUrl is required`, čo zasiahne každého, kto čerstvý klon hneď zbuilduje, aj nasadenie bez premenných.

Výsledok tesne pred otvorením pull requestu: Node 24.21, npm 11.19, všetky kroky prešli, build vygeneroval 29 stránok. Chyba sa pred opravou reprodukovala rovnakým `npm ci` v tom istom obraze.

## Testy

| Sada | Počet | Príkaz |
|---|---|---|
| Jednotkové | 14 súborov, 134 testov | `npm test` |
| PostGIS a RLS | 19 testov | `npm run test:db` |

Databázové testy potrebujú bežiaci lokálny Supabase a tri premenné, ktoré vypíše `supabase status -o env`:

```bash
set -a
eval "$(supabase status -o env | sed -n 's/^API_URL=/NEXT_PUBLIC_SUPABASE_URL=/p; s/^ANON_KEY=/NEXT_PUBLIC_SUPABASE_ANON_KEY=/p; s/^SERVICE_ROLE_KEY=/SUPABASE_SERVICE_ROLE_KEY=/p')"
set +a
npm run test:db
```

Bez nich sa sada preskočí (19 skipped). Kryje polomer, výrez, poradie a vzdialenosť (nezávisle počítaná haversine s toleranciou 0,5 %), online podujatia, stav, dátumové a ostatné filtre, `max_rows`, čo vidí anonymný kľúč (len zverejnené riadky, žiadny zápis, žiadny pohľad `hackathons_admin`, žiadna funkcia `bump_rate_limit`) a obmedzenie, že zverejnené podujatie na mieste musí mať polohu.

## Kontrast

Meraný v headless Chromiu z vypočítaných štýlov: farba textu zložená cez priehľadnosť na skutočné pozadie, vzorec WCAG 2.x. Prah je 4,5:1 pre text pod 24 px (a pod 18,66 px tučne).

| Prvok | Predtým | Potom |
|---|---|---|
| Odkaz Detail a Pridať (oranžový text na bielej) | 3,57:1 | 4,65:1 |
| Rovnaké odkazy v tmavom režime | 5,54:1 | 5,54:1 |
| Tlačidlá Registrovať sa a Odoslať na schválenie (biely text na oranžovej) | 3,57:1 | 4,65:1 |
| Odznak s odpočtom registrácie, vybraný polomer a formát | 3,57:1 | 4,65:1 |
| Tlmený text, nadpisy, dáta | 6,69:1 až 19,8:1 | bez zmeny |

Pretekanie do šírky sa meralo porovnaním `scrollWidth` s šírkou okna pri 1440 × 900 a 393 × 660 (domov, detail, formulár, mesto, prihlásenie): nikde.

## Plán dopytu hľadania

Na 100 000 syntetických zverejnených podujatiach v jednej transakcii, ktorá sa vráti späť (nezostane nič):

```sql
BEGIN;
INSERT INTO hackathons (slug, name, name_normalized, start_at, end_at, timezone, format,
                        location, location_precision, themes, price_cents, source, status)
SELECT 'bench-' || t.g, 'Bench ' || t.g, 'bench' || t.g,
       t.s, t.s + (1 + random() * 3 || ' days')::interval,
       'Europe/Bratislava', 'onsite',
       ST_SetSRID(ST_MakePoint(9 + random() * 16, 45 + random() * 10), 4326)::geography,
       'venue', ARRAY['ai'], 0, 'manual', 'published'
FROM (SELECT g, now() + (random() * 365 || ' days')::interval AS s
      FROM generate_series(1, 100000) g) t;
ANALYZE hackathons;

-- samotný predikát polomeru
EXPLAIN (ANALYZE, COSTS OFF)
SELECT h.id FROM hackathons h
WHERE h.status = 'published' AND h.end_at >= now() AND h.location IS NOT NULL
  AND st_dwithin(h.location, st_setsrid(st_makepoint(17.1077, 48.1486), 4326)::geography, 50000);

-- WHERE tak, ako ho má funkcia: predikát polomeru OR online podujatia
EXPLAIN (ANALYZE, COSTS OFF)
SELECT h.id FROM hackathons h
WHERE h.status = 'published' AND h.end_at >= now()
  AND ((h.location IS NOT NULL
        AND st_dwithin(h.location, st_setsrid(st_makepoint(17.1077, 48.1486), 4326)::geography, 50000))
       OR h.format = 'online');
ROLLBACK;
```

| Dopyt | Plán | Čas vykonania |
|---|---|---|
| Samotný polomer 50 km (603 riadkov) | Bitmap Index Scan na `hackathons_location_idx` | 9,8 ms |
| Ako vo funkcii, s `OR` pre online | Parallel Seq Scan, filtrovaných 33 158 riadkov na pracovníka | 103 ms |

Index sa používa, ale `OR` s podmienkou, ktorú žiadny index nepokrýva, ho vyradí. Pri dnešných 107 riadkoch je to bezpredmetné. Ak by dáta narástli rádovo, funkciu treba rozdeliť na dva dopyty spojené `UNION ALL` (polomer cez index, online zvlášť) a nechať `order by` a `limit` nad spojením. 19 databázových testov by pritom strážilo význam.

Časy vyššie sú z `EXPLAIN ANALYZE`, teda zo strany servera. Čas celého volania funkcie z klienta tu neuvádzam: na tomto zaťaženom stroji trvá aj `count(*)` nad 107 riadkami desiatky milisekúnd, takže by meral skôr stroj než dopyt.

## JavaScript na trasu

Súčet veľkostí (gzip) skriptov, ktoré odkazuje HTML danej trasy, z lokálneho produkčného buildu:

| Trasa | Skriptov | gzip |
|---|---|---|
| `/pridat` | 10 | 184 KB |
| `/admin/login` | 9 | 174 KB |
| `/hackathon/[slug]` | 10 | 445 KB |
| `/` | 11 | 458 KB |

Rozdiel je MapLibre, jeden balík `269 KB` gzip (1,0 MB rozbalený), ktorý sa načíta len tam, kde je mapa. Pozor: Next po načítaní stránky na pozadí predvyťahuje aj skripty trás, na ktoré vedú odkazy (hlavička odkazuje na `/`), takže sieťový prenos vo vývojárskom paneli môže byť vyšší než súčet vyššie.

## Odozva

30 po sebe idúcich požiadaviek `curl` na lokálny `next start` s lokálnym Supabase v Dockeri. Každá požiadavka na API robí dva volania databázy (počítadlo limitu a samotné hľadanie).

| Požiadavka | min | medián | p95 |
|---|---|---|---|
| `/api/hackathons` polomer 50 km | 39,5 ms | 58,6 ms | 149,6 ms |
| polomer 200 km s filtrami | 33,9 ms | 52,1 ms | 108,2 ms |
| výrez `9,45,25,55` | 45,6 ms | 61,0 ms | 84,8 ms |
| `/hackathon/[slug]` (SSR) | 11,3 ms | 18,2 ms | 33,6 ms |
| `/hackathony/praha` (SSG) | 1,8 ms | 3,7 ms | 15,7 ms |

## Celá cesta cez administráciu

Na izolovanom lokálnom Supabase (inom projekte a portoch než vývojový), skriptom v headless Chromiu:

1. Verejný formulár `/pridat` prijme online podujatie (201), v hľadaní ho nie je vidieť.
2. `/admin` bez prihlásenia presmeruje na `/admin/login`.
3. Neoprávnená adresa dostane rovnakú odpoveď a žiadny e-mail.
4. Oprávnená adresa dostane odkaz do Mailpitu, odkaz v tom istom prehliadači prihlási a vráti na `/admin`.
5. Podanie čaká v záložke Na schválenie, po Schváliť je v API a v záložke Zverejnené.

Zvlášť: riadok zamietnutý v databáze zostal po `npm run seed` zamietnutý a ručne upravený názov (s `edited_at`) sa neprepísal.

## Čo som neoveril

- Beh workflowu priamo na GitHube. Simulácia v Dockeri používa rovnaký obraz Node a rovnaké príkazy, ale nie runner.
- Nasadenie a živú adresu.
- Doručenie magic linku cez skutočného poskytovateľa pošty a cez cloudový Supabase.
- Vykresľovanie v Safari a na skutočnom telefóne, skutočné GPS, čítačky obrazovky.
- Verejné služby (Photon, OpenFreeMap) pod záťažou.
