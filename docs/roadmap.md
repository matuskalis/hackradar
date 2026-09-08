# HackRadar – roadmapa (2026-09-07)

Poradie etáp nie je zoznam prianí. Vychádza z čísel nameraných v databáze
a z auditu kódu, obe z 7. 9. 2026.

## Východisko

HackRadar má hotové MVP aj vlastný vizuál. Repozitár je verejný na
https://github.com/matuskalis/hackradar. Na mape je 106 podujatí. Nikde ale
nebeží a čísla hovoria, že bez zásahu sa sám vyprázdni.

### Čo hovoria dáta (merané 7. 9. 2026)

| Zistenie | Číslo | Prečo je to dôležité |
|---|---|---|
| Podujatí skončí do 90 dní | 69 zo 106 | Do decembra zmizne dve tretiny obsahu |
| Podujatí skončí do 30 dní | 34 | Prvá vlna už o mesiac |
| Prínos automatických importérov | 1 zo 106 | Preto boli 8. 9. 2026 zrušené |
| Odhadnuté termíny v seed dátach | 42 zo 119 | Tretinu dátumov sme uhádli a tvárime sa, že sú isté |
| Piny s presnou adresou | 25 zo 74 | Zvyšok je stred mesta, nie miesto konania |
| Podujatí s termínom registrácie | 9 zo 106 | Odpočet na detaile sa zobrazí na 8 % podujatí |
| Najväčšia krajina | Poľsko, 30 | Rozhranie je pritom len po slovensky |

Z toho vyplýva jediné možné poradie: **najprv nasadiť, potom zastaviť
vyprázdňovanie mapy, až potom stavať funkcie.** Účty a upozornenia sú
zbytočné nad mapou, ktorá o tri mesiace nebude mať čo ukázať.

### Čo našiel audit kódu

Tri veci nie sú nedostatky, ale chyby, ktoré treba opraviť skôr než sa na
ne postaví čokoľvek ďalšie:

1. **Seed prepíše rozhodnutia moderátora.** `lib/hackathons/upsert.ts` pri
   zhode prepisuje celý riadok vrátane `status`, a `scripts/seed/seed.ts` vždy
   posiela `status: 'published'`. Riadok, ktorý niekto označí ako `rejected`
   alebo `cancelled`, sa pri ďalšom `npm run seed` vráti späť na published
   a každá ručná oprava názvu, popisu či súradníc zmizne. Zrušenie nočného
   importu problém zmenšilo, ale neodstránilo: admin rozhranie postavené nad
   takouto zapisovacou cestou by stále nedávalo zmysel.
2. **Čas podujatia sa vykresľuje v pásme servera, nie podujatia.** Stĺpec
   `timezone` sa ukladá aj validuje, ale `app/hackathon/[slug]/page.tsx` ho
   pri formátovaní nepoužije. Lokálne to nevidno, na Verceli beží UTC, takže
   po nasadení budú všetky časy o hodinu až dve vedľa.
3. **`.env.example` nie je v gite.** `.gitignore` ignoruje `.env*`, ale README
   hovorí `cp .env.example .env.local`. Čerstvý klon verejného repozitára sa
   nedá rozbehnúť.

### Rozhodnutia (7. 9. 2026)

- **Regionálny produkt pre celú strednú Európu.** Cieľom sú reální používatelia
  v PL, CZ, SK, AT a HU. Jazykové verzie, účty, upozornenia, organizátorské
  profily a verejné API sú preto v hre.
- **Devpost nie.** Ich podmienky zakazujú automatizovaný prístup, tak to
  rešpektujeme. Hackathony veľkých AI firiem sa budú brať odinakiaľ.

---

## Etapa 0 — Nasadiť (blokuje všetko, ~1 deň)

Dnes to nevie otvoriť nikto okrem teba. Kým to neplatí, nemá zmysel merať nič
a spätná väzba neexistuje.

Najprv opraviť to, čo sa pokazí až nasadením:

- `timezone` doplniť do `Intl.DateTimeFormat` v `app/hackathon/[slug]/page.tsx`
  a v `components/explore/HackathonList.tsx`. Inak budú časy po nasadení zle.
- `.env.example` vyňať z `.gitignore` a commitnúť.
- `hackathons_public` doplniť o filter na neskončené podujatia, alebo
  `app/sitemap.ts` filtrovať priamo. Dnes sitemap navrhuje Googlu aj podujatia,
  ktoré už prebehli, a detail ich vykresľuje ako nadchádzajúce.
- `tsconfig.tsbuildinfo` odstrániť z gitu.
- Pridať CI workflow: `tsc --noEmit`, `lint`, `test`, `build` na každý push.
  Dnes je v `.github/workflows/` len import.

Potom samotné nasadenie:

- Supabase cloud projekt v EÚ regióne, `supabase link`, `db push`, `npm run seed`.
- GitHub secrets `SUPABASE_URL` a `SUPABASE_SERVICE_ROLE_KEY` pre denný cron.
- Vercel projekt, premenné vrátane `NEXT_PUBLIC_SITE_URL` (sitemap, canonical,
  ICS aj OG z nej čítajú).
- Doména. Názov HackRadar je stále pracovný, treba overiť dostupnosť.
- Zvážiť, čo sa má stať, keď je databáza pri builde nedostupná. Dnes celý build
  spadne, lebo stránky miest sa predgenerovávajú z databázy. Na Verceli to
  znamená, že výpadok Supabase zhodí nasadenie. Overené 7. 9. 2026: build padol
  s `ECONNREFUSED` na lokálnej databáze.

**Hotové, keď** cudzí človek otvorí adresu na mobile a nájde hackathon.

---

## Etapa 1 — Aby sa mapa nevyprázdnila (~2 týždne)

Najdôležitejšia etapa a najmenej viditeľná, lebo dnes je mapa plná ručne
naseedovanými dátami. O tri mesiace nebude.

**1.1 Opraviť zapisovaciu cestu.** Predchádza všetkému ostatnému v tejto etape.
- Seed nesmie posielať `status`; existujúci riadok si svoj stav ponechá.
- Pridať `locked_fields text[]` alebo `edited_at`, aby ručná oprava prežila
  ďalší import. Merge už dnes vie plniť len prázdne stĺpce
  (`MERGEABLE_COLUMNS` v `lib/hackathons/upsert.ts`), rovnaká logika sa použije
  aj pre zhodu podľa `source_id`.
- `cancelled` a `rejected` musia niečo nastavovať. Dnes tie hodnoty v enume
  existujú a nikto ich nepoužíva.
- Testy na tieto cesty. `upsert.ts` má dnes otestovanú len funkciu
  `isSameEvent`, nie samotný insert, update ani merge.

**1.2 Admin a moderačná fronta.**
- Prihlásenie cez magic link, prístup podľa allowlistu e-mailov. Supabase Auth
  je už zapnutá, `createServerSupabaseClient()` s cookies existuje a dnes ju
  nikto nepoužíva na to, na čo je.
- RLS politika pre admina, ktorý číta základnú tabuľku, nie pohľad
  `hackathons_public`.
- Fronta čakajúcich, úprava priamo v zozname, schválenie a zamietnutie.
- **Výber polohy ťahaním pinu.** Nie je to ozdoba: constraint
  `hackathons_published_needs_location` nedovolí zverejniť prezenčné podujatie
  bez súradníc, takže keď geokódovanie zlyhá, moderátor to musí vedieť opraviť.
- Bez tohto sú formulár `/pridat` aj cesta cez pull request slepé uličky.
  Obe pritom sľubujú, že podanie niekto pozrie.

**1.3 Pridanie podujatia cez URL.** Vložím odkaz, server stiahne stránku, model
vráti polia v tvare CSV riadku, admin ich potvrdí. Skracuje pridanie z piatich
minút na pol minúty. Pri jednom kurátorovi je to najväčšia páka na priepustnosť.

**1.4 Opakujúce sa podujatia.** Nové stĺpce `recurrence` a `parent_id`. Keď
ročník skončí, úloha založí ďalší ako `pending` s odhadnutým termínom. Tým sa
jednorazová rešerš mení na majetok, ktorý sa obnovuje sám. Bez toho každá
hodina hľadania o rok vyprchá.

**1.5 Kontrola čerstvosti.** Po zrušení importérov v projekte nebeží žiadna
pravidelná úloha, takže toto je zároveň jediná vec, ktorá bude Supabase free
projekt držať pri živote.
- Týždenná úloha overí `registration_url` a označí mŕtve odkazy.
- Nahlási podujatia, ktoré skončili a nemajú nasledovníka.
- Tabuľka `import_runs` zostala v schéme, ale po zrušení importérov do nej už
  nikto nezapisuje. Buď ju zahodiť migráciou, alebo ju použiť na záznam
  o behoch kontroly čerstvosti.

**1.6 Podujatia pribúdajú ručne.** Importéry boli 8. 9. 2026 zrušené; za celý
čas dodali jedno podujatie zo 106. Kanály sú teraz seed CSV, formulár, pull
request a e-mail na m3kalis@gmail.com. Ak sa niekto ozve s dobrým zdrojom,
importér sa dá napísať vtedy. Prieskum preverených zdrojov zostáva
v `docs/sources.md`.

Vedľajší účinok, na ktorý treba myslieť pri nasadení: denný cron zároveň držal
Supabase free projekt aktívny. Bez neho sa po 7 dňoch nečinnosti pauzuje.

**Hotové, keď** podanie z formulára vieš schváliť v prehliadači do minúty,
nočný import už nič neprepíše a existuje zoznam podujatí, ktorým vypršal termín.

---

## Etapa 2 — Povedať, čo vieme a čo sme odhadli (~3 dni)

Dnes tvrdíme veci, ktoré nevieme. To je najrýchlejší spôsob, ako stratiť dôveru.

- **Uložiť a zobraziť `date_confidence`.** Stĺpec je v každom seed CSV,
  `CONTRIBUTING.md` ho pýta od prispievateľov, a `csvRowSchema` ho zahodí. 42
  zo 119 riadkov má odhadnutý termín a používateľ ich nerozozná. Na karte
  a detaile štítok „termín neoverený", pri rovnakej vzdialenosti radiť
  potvrdené vyššie.
- **Priznať presnosť polohy.** 49 zo 74 prezenčných pinov je stred mesta. Mapa
  ich už kreslí ako plochu, zoznam a detail o tom mlčia.
- **Stav „skončilo"** na detaile namiesto vykreslenia ako nadchádzajúce.
- **Nahlásiť problém** na detaile, tabuľka `reports`, do rovnakej admin fronty.
  Lacná cesta, ako nechať používateľov opravovať dáta za nás.

---

## Etapa 3 — Dôvod vrátiť sa (~2 týždne)

Až teraz, keď je čo ukazovať a dáta sa dopĺňajú samy.

- Účty: GitHub OAuth a magic link cez Supabase Auth.
- Uložené podujatia a stav „Idem".
- **Upozornenia sú vlastný ťahák produktu.** Vyberiem miesto a okruh, príde
  e-mail, keď tam pribudne niečo nové, plus týždenný súhrn. Resend.
- **Odber kalendára.** Osobná ICS adresa pre môj okruh. Generovanie ICS pre
  jedno podujatie už máme, feed je malý krok a dostane HackRadar natrvalo do
  kalendára, kam sa človek pozerá aj tak.

---

## Etapa 4 — Von zo slovenčiny (~1 týždeň)

Poľsko má najviac podujatí a rozhranie je po slovensky. To je dnes najväčší
nepomer medzi dátami a dosahom.

- Jazyky SK, CS, PL, EN. `lib/taxonomy.ts` je jediné miesto s doménovými
  reťazcami; reťazce rozhrania sú roztrúsené v komponentoch a treba ich
  vytiahnuť.
- Cesty podľa jazyka, `hreflang`, stránky miest v každom jazyku. Dnes nevieme
  uspieť v poľskom ani českom vyhľadávaní, hoci tam máme najviac obsahu.
- OG obrázky pre jednotlivé podujatia, aby zdieľaný odkaz niečo ukázal.

---

## Etapa 5 — Ekosystém (až keď chodia ľudia)

- Organizátorský profil, prevzatie podujatia, overený odznak.
- Verejné API a vkladateľný widget. Univerzita, ktorá si ho dá na stránku, je
  zároveň spätný odkaz aj dátový partner.
- PWA a push.
- Hľadanie tímu a hodnotenia. Oboje potrebuje kritické množstvo ľudí; stavať to
  pri nulovej návštevnosti je vyhodená práca.

---

## Priebežný dlh

Nie samostatná etapa, zapracovať do tej, ktorá sa daného súboru dotkne.

| Vec | Kde |
|---|---|
| `rate_limits` sa nikdy nemaže, tabuľka rastie donekonečna | migrácia + cron |
| ICS endpoint nemá žiadny limit | `app/api/hackathons/[slug]/ics/route.ts` |
| Geokódovanie cachuje aj prázdny výsledok natrvalo | `app/api/geocode/route.ts` |
| `hackathons_public` je `select h.*`, anon číta aj interné stĺpce | `supabase/migrations/*_schema.sql` |
| `CitySearch` importuje typ z modulu, ktorý volá service role | presunúť `CitySuggestion` do `lib/` |
| `createClient()` (browser) nikto nepoužíva | `lib/db/supabase.ts` |
| Farby formátov sú na dvoch miestach | `app/globals.css` + `components/map/mapStyle.ts` |
| Vitest beží v node, komponentové testy sa nedajú spustiť | `vitest.config.mts` + jsdom |
| Žiadne hlásenie chýb ani analytika | Sentry a Plausible pri nasadení |

---

## Čo zámerne nerobíme

- **Devpost.** Ich podmienky to zakazujú. Rozhodnutie z 7. 9. 2026.
- **Automatické importéry.** Zrušené 8. 9. 2026. Dodali jedno podujatie zo 106,
  pretože preverené zdroje v strednej Európe nič nemajú. Vrátiť sa k tomu má
  zmysel len ak sa objaví zdroj, ktorý región reálne pokrýva.
- **Monetizácia.** Vyradená skôr, nič sa nemení.
- **Natívna aplikácia.** PWA stačí.
- **Hľadanie tímu a hodnotenia teraz.** Bez používateľov to nemá čo hodnotiť.
- **Prepínač svetlého a tmavého režimu.** Systémové nastavenie stačí, kým to
  niekto nevypýta.

---

## Overenie

Každá etapa končí rovnakou bránou: `tsc --noEmit`, `npm run lint`, `npm test`,
`npm run build`, a build musí naďalej predgenerovať stránky miest ako SSG.

Nad rámec toho po etapách:

- **0** Produkčná adresa otvorená na mobile ukáže podujatia. Čas na detaile sedí
  s časom na stránke organizátora. Sitemap neobsahuje skončené podujatia.
  Čerstvý klon repozitára sa rozbehne podľa README.
- **1** Podanie z `/pridat` prejde frontou a objaví sa na mape bez zásahu do
  databázy. Riadok označený `rejected` prežije nočný import. Ručná oprava
  súradníc prežije nočný import. Seed s opakujúcim sa podujatím po skončení
  ročníka založí ďalší ako `pending`.
- **2** Podujatie s odhadnutým termínom je v zozname aj na detaile viditeľne
  označené. Skončené podujatie sa tvári ako skončené.
- **3** Upozornenie doručené reálnemu človeku. ICS feed sa naimportuje do
  kalendára a po pridaní nového podujatia v okruhu sa v ňom objaví.
- **4** `/pl/hackathony/krakow` existuje, je po poľsky a je v sitemape
  s `hreflang`.

## Kritické súbory

- `lib/hackathons/upsert.ts` – jediná zapisovacia cesta; kým sa neopraví
  prepisovanie, nemá zmysel stavať moderáciu
- `supabase/migrations/` – nové stĺpce pre `date_confidence`, `recurrence`,
  `parent_id`, tabuľka `reports`, admin RLS politika
- `app/hackathon/[slug]/page.tsx` – časové pásmo, stav „skončilo", štítok
  neovereného termínu
- `lib/taxonomy.ts` – jediné miesto s doménovými reťazcami, základ pre jazyky
- `lib/db/supabase.ts` – klienti pre anon, cookies a service role; admin sa
  oprie o cookie klienta, ktorý dnes leží ladom
