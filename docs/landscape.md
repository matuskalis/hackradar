# Konkurencia

Každý riadok je overený priamym načítaním stránky alebo API, nie z útržku vo
vyhľadávači. Pri každom je dátum, kedy to platilo. Kde sa niečo nedalo prečítať,
je to napísané, nie dohadované.

## A. Priama konkurencia: objavovanie hackathonov na mape

### Hackamaps — https://hackamaps.com
Overené 9. 9. 2026. **Najbližší konkurent, aký existuje.**

- 642 podujatí, vlastnými slovami „live now", globálne.
- Mapa, druhé zobrazenie „Face Map", Discord komunita.
- Filtre: kategória (AI, Web3, FinTech, Defense, Social, Cloud) a **kontinent**.
- Platený model: zadarmo, Premium 10 $ mesačne, Founder Lifetime 49 $ jednorazovo.
- Pozicionovanie: „Plan Your Coding Vacation", hľadanie spoluzakladateľa
  a investorov. Stránka tlačí na konverziu odpočtami typu „ONLY 7 SPOTS LEFT".

**Ako sa líšime.** Oni filtrujú podľa kontinentu, my podľa okruhu od tvojej
polohy. To je iná otázka: „kam sa oplatí letieť" oproti „čo je odtiaľto do
hodiny cesty". Oni sú globálni a plytkí, my úzki a hlbokí. A my sme zadarmo.
Koľko toho majú konkrétne v strednej Európe sa mi zistiť nepodarilo, zoznam
podujatí sa na stránke `discover` nevykreslil ani po načítaní.

### Hackalist — https://github.com/Hackalist/Hackalist.github.io
Overené 6. 9. 2026. **Mŕtvy.** JSON API po rokoch a mesiacoch priamo na GitHube,
posledné dáta marec 2025. Model zbierania cez pull request stojí za pozretie,
prevzali sme ho do `CONTRIBUTING.md`.

## B. Platformy, ktoré hackathony hostia

Nesúperia s nami o návštevníka, ale o organizátora. Kto podujatie založí u nich,
nemá dôvod pridať ho aj k nám, takže ich zoznamy sú zároveň náš zdroj.

| Platforma | Veľkosť | Prístup k dátam | Overené |
|---|---|---|---|
| [Devpost](https://devpost.com/hackathons) | najväčšia | JSON endpoint funguje, `robots.txt` povoľuje, **podmienky zakazujú automatizovaný prístup** | 5. 9. 2026 |
| [Unstop](https://unstop.com/hackathons) | 168 otvorených, ~35 % online | `robots.txt` má **výslovne `Allow: /api/public/*`**, API funguje | 8. 9. 2026 |
| [TAIKAI](https://taikai.network/hackathons) | 350+ organizácií, 90 tis. používateľov | verejné GraphQL, v dokumentácii priamo vyzýva agentov, aby ho použili; introspekcia vypnutá | 6. 9. 2026 |
| [lablab.ai](https://lablab.ai/event) | 13 podujatí, prevažne online | stránka sa vykresľuje na klientovi, dá sa čítať cez prehliadač | 6. 9. 2026 |
| [ETHGlobal](https://ethglobal.com/events) | web3 | stránka funguje, detail 500 | 6. 9. 2026 |
| Devfolio, HackerEarth, DoraHacks | India a web3 | čisto klientske aplikácie, robotom nič nevrátia | 6. 9. 2026 |

## C. Agregátory a zoznamy

| Zdroj | Čo má | Stredná Európa | Overené |
|---|---|---|---|
| [allhackathons.com](https://allhackathons.com) | zoznam, bez API, len e-mailový odber | 1 podujatie, ktoré už máme | 6. 9. 2026 |
| [dev.events](https://dev.events) | RSS so 100 položkami | **0 hackathonov**, samé konferencie | 6. 9. 2026 |
| [MLH](https://mlh.io) | 70 nadchádzajúcich | **0** | 5. 9. 2026 |
| [Hack Club](https://hackathons.hackclub.com) | 903 podujatí za celú históriu | **1**, z roku 2019 | 6. 9. 2026 |

## D. Komunitné projekty, ktoré fungujú

Tu je poučenie, nie hrozba. Model zbierania ľuďmi pokrýva strednú Európu
mnohonásobne lepšie než čokoľvek automatické.

| Projekt | Model | Pokrytie |
|---|---|---|
| [developers.events](https://github.com/scraly/developers-conferences-agenda) | markdown v GitHub repozitári, príspevky cez pull request, zoznam plus kalendár plus mapa, beží od 2017 | konferencie: PL 38, CZ 32, AT 17, HU 7, **SK 1** |
| [junior.guru](https://junior.guru) | jeden človek, Discord klub, newsletter, [otvorený zdroj](https://github.com/juniorguru/) | české podujatia pre začiatočníkov |
| [crossweb.pl](https://crossweb.pl) | poľský zoznam IT podujatí vrátane hackathonov | Poľsko; robotom vracia 403, treba pozerať ručne |

## Čo z toho vyplýva

**Ani jeden agregátor nepokrýva strednú Európu.** Nie je to odhad, je to
zmerané: Devpost blokuje, dev.events má v regióne nula hackathonov,
allhackathons jeden, Hack Club za celú históriu jeden z roku 2019, MLH nula.

**Komunitne budovaný zoznam ten istý región pokrýva slušne.** Rozdiel nie je
v tom, že by sa podujatia nedali nájsť, ale v tom, že nie sú na jednom mieste
a nikto ich nescrapuje. Zbierajú ich ľudia.

**Slovensko je slabé aj tam.** V zozname konferencií má jednu zmienku oproti 38
poľským. To je zároveň príležitosť aj varovanie.

**Naša odlišnosť je okruh, nie kontinent.** Hackamaps sa pýta, kam letieť. My sa
pýtame, čo je odtiaľto na dosah. To je jediná vec, ktorú nikto iný nerobí,
a stojí a padá s hustotou dát v regióne.

## Kanály, kde sa stredoeurópske hackathony reálne ohlasujú

Nie agregátory, ale komunity: Česko.Digital, Slovensko.Digital, Progressbar
Bratislava, Paralelní Polis, Impact Hub, crossweb.pl, startitup.sk, touchit.sk,
hwsw.hu, bitport.hu, newslettery a Discord servery lokálnych komunít,
univerzitné študentské spolky.
