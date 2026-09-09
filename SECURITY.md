# Bezpečnosť

Audit z 9. 9. 2026 podľa checklistu [vibe-check](https://github.com/benavlabs/vibe-check),
ktorý pomenúva 17 kategórií chýb typických pre kód písaný s pomocou AI. Nižšie
je stav každej z nich a čo sa opravilo. Overené na bežiacej aplikácii, nie
prečítaním kódu.

## Nájdené a opravené

### Únik zo `<script>` tagu v štruktúrovaných dátach (bolo vážne)

Detail podujatia vkladá JSON-LD cez `dangerouslySetInnerHTML`. `JSON.stringify`
neescapuje `<`, takže podujatie s názvom `Zlý </script><img src=x onerror=...>`
predčasne zavrelo tag a zvyšok sa vyhodnotil ako HTML. Názvy podujatí chodia
z verejného formulára a z pull requestov, čiže hodnotu ovplyvňuje cudzí človek.

Opravené v `lib/json-ld.ts`, ktoré escapuje `<`, `>` a `&` na `\uXXXX`. Výstup
zostáva platný JSON a v HTML je inertný. Kryté testom aj overené naostro:
podujatie s takým názvom sa vykreslí ako `</script>` a žiadny `<img>`
v stránke nevznikne.

### Žiadne bezpečnostné hlavičky

`next.config.ts` bol prázdny, takže nechodila ani jedna z piatich odporúčaných
hlavičiek. Doplnené globálne pre všetky odpovede: `Content-Security-Policy`,
`Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy` a `Permissions-Policy`.

CSP je napísané tak, aby mapa fungovala: `connect-src` a `img-src` púšťajú
dlaždice OpenFreeMap, `worker-src` púšťa blob, lebo MapLibre parsuje dlaždice
vo workeri. Overené, že stránka nehlási ani jedno porušenie CSP a dlaždice sa
načítajú. `unsafe-eval` sa pridáva len vo vývoji, kde ho vyžaduje vývojový
build Reactu; produkčný build ho nikdy nepoužije.

### Formulár prijímal odoslanie z cudzej stránky

`POST /api/hackathons/submit` nemal kontrolu pôvodu. Session ani cookie tam nie
je, takže útočník sa nemohol vydávať za nikoho, ale dala sa cez to tlačiť spam
do moderačnej fronty z cudzej stránky. Doplnená kontrola `Origin`; cudzí pôvod
dostane 403. Overené.

### Export do kalendára nemal žiadny limit

Jediný endpoint bez obmedzenia. Doplnených 60 požiadaviek za minútu.

### Verejný pohľad odhaľoval interné stĺpce

`hackathons_public` bol `select h.*`, takže anonymný kľúč čítal aj
`name_normalized`, `source_id`, `extra_sources`, `created_at` a surovú
geometriu. Nič z toho nie je tajné, ale ani to nikomu nič nehovorí. Pohľad teraz
stĺpce vymenúva, takže sa doň ďalší interný stĺpec nedostane sám.

## Nájdené a neopravené

### MapLibre GL JS: kritická zraniteľnosť bez použiteľnej opravy

`npm audit` hlási [GHSA-jrc7-96c5-q579](https://github.com/advisories/GHSA-jrc7-96c5-q579),
obídenie sanitizéra v `DOM.sanitize()`, pre všetky verzie do 6.4.0 vrátane.
Používame 5.24.0.

Oprava je verzia 6.9.0. Vyskúšal som ju: **pod Turbopackom sa mapa vôbec
nenačíta**, štýl zostane nedokončený a nevyžiada si ani jednu dlaždicu, presne
ako 6.7.0 pri prvom pokuse v septembri. Upgrade teda nie je možný bez zmeny
bundlera.

Čo sme namiesto toho urobili. Zraniteľná funkcia sa volá pri vykresľovaní HTML
z cudzieho zdroja. `Popup` ani `setHTML` nepoužívame vôbec, takže jediná cesta
k nej viedla cez atribúciu, ktorú MapLibre renderuje z JSON štýlu OpenFreeMap.
Vypli sme jeho atribučný ovládač a atribúciu, ktorú OpenFreeMap vyžaduje,
vykresľujeme sami ako React text. Tým do sanitizéra neprechádza žiadne cudzie
HTML.

Zvyškové riziko: knižnica môže mať ďalšie cesty k tej funkcii, ktoré sme
neobjavili. Sledovať, či niektorá verzia 6.x začne pod Turbopackom fungovať.

### Rate limit sa dá obísť podvrhnutím hlavičky

`lib/rate-limit/limiter.ts` kľúčuje podľa prvého skoku v `X-Forwarded-For`, čo
sa dá podvrhnúť, a viacero ľudí za jednou NAT bránou zdieľa jeden limit. Pri
nasadení na Vercel treba použiť jeho vlastnú hlavičku s reálnou adresou.
Tabuľka `rate_limits` sa navyše nikdy nemaže.

### Bez prihlásenia niet čo chrániť

Kategórie o heslách, reláciách a prístupe k cudzím dátam sa zatiaľ netýkajú,
lebo aplikácia nemá účty. Pri zavedení prihlásenia treba celý checklist
prejsť znova.

## Nepodstatné pre tento projekt

Platobné webhooky a nahrávanie súborov aplikácia nemá. SSRF sa netýka: jediné
volanie von má pevný cieľ (`photon.komoot.io`), používateľ ovplyvňuje len
hodnotu parametra, nie adresu. SQL injection sa netýka: všetko ide cez
parametrizované RPC volania Supabase, nikde sa nespája dopyt zo znakov.

## Čo skontrolovať pred nasadením

1. `npm audit --omit=dev` a rozhodnúť o každom náleze.
2. Servisný kľúč Supabase nesmie byť v žiadnej premennej s prefixom
   `NEXT_PUBLIC_` a nesmie sa dostať do klientskeho balíka.
3. Overiť, že všetkých šesť hlavičiek chodí aj z produkcie.
4. Zapnúť hlásenie chýb, aby sa serverové chyby nestrácali v logu.
