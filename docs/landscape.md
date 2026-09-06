# Konkurencia a zdroje dát

Overené 6. 9. 2026 priamym načítaním stránok a API, nie z útržkov vo
vyhľadávači. Pri každom zdroji je uvedené, čo reálne vrátil.

## Priama konkurencia

| Projekt | Čo je | Pokrytie strednej Európy | Poznámka |
|---|---|---|---|
| [hackamaps.com](https://hackamaps.com) | Globálna mapa hackathonov | neoverené | Najbližší konkurent. Stránka sa vykresľuje cez JavaScript, automaticky sa nedá prečítať. Treba pozrieť ručne. |
| [TAIKAI](https://taikai.network/hackathons) | Platforma, 350+ organizácií, 90 tis. používateľov | neuvedené | Má verejné GraphQL API na `api.taikai.network/api/graphql` a výslovne vyzýva agentov, aby ho používali namiesto scrapovania. Introspekcia je vypnutá a dokumentácia na `/api-catalog` je 404, takže schému treba získať od nich. |
| [lablab.ai](https://lablab.ai/event) | AI hackathony | 0 | 13 podujatí, väčšina online. V Európe jedno, Amsterdam. |
| [Devpost](https://devpost.com/hackathons) | Najväčšia platforma | slabé | JSON endpoint funguje, RSS vracia 406. Podmienky použitia zakazujú automatizovaný prístup. |
| Devfolio, Unstop, HackerEarth, DoraHacks | Platformy | 0 | Zamerané na Indiu. |
| [ETHGlobal](https://ethglobal.com/events) | Web3 | občas | Zastávky v Európe, ale málo a nepravidelne. |
| [allhackathons.com](https://allhackathons.com/hackathons/?status=upcoming) | Agregátor | 1 | Bez API, len e-mailový odber. Ten jeden už máme. |
| [Hackalist](https://github.com/Hackalist/Hackalist.github.io) | JSON API na GitHube | 0 | Mŕtvy, posledné dáta marec 2025. |

## Komunitné projekty, ktoré fungujú

| Projekt | Model | Pokrytie |
|---|---|---|
| [developers.events](https://github.com/scraly/developers-conferences-agenda) | Markdown v GitHub repozitári, príspevky cez pull request, zoznam plus kalendár plus mapa | Konferencie, nie hackathony. PL 38, CZ 32, AT 17, HU 7, **SK 1**. Beží od 2017, commit dnes. |
| [Hack Club](https://hackathons.hackclub.com/) | Otvorený adresár stredoškolských hackathonov | Celý archív 903 podujatí, v strednej Európe **1**, z roku 2019. |
| [junior.guru](https://junior.guru) | Honza Javorek, český kurátor. Discord klub, newsletter, [otvorený zdroj](https://github.com/juniorguru/) | České podujatia pre začiatočníkov. |
| [crossweb.pl](https://crossweb.pl) | Poľský zoznam IT podujatí vrátane hackathonov | Robotom vracia 403, treba pozrieť ručne. |

## Čo z toho vyplýva

Ani jeden agregátor nepokrýva strednú Európu. Nejde o odhad, je to zmerané:
Devpost blokuje, dev.events má v regióne nula hackathonov, allhackathons jeden,
Hack Club za celý svoj archív jeden z roku 2019.

Naproti tomu komunitne budovaný developers.events má pre konferencie v regióne
slušné pokrytie. Rozdiel nie je v tom, že by sa podujatia nedali nájsť, ale
v tom, že ich nikto nescrapuje, lebo nie sú na jednom mieste. Zbierajú ich ľudia.

Slovensko je pritom slabé aj tam. V zozname konferencií má jednu zmienku oproti
38 poľským. To je príležitosť aj varovanie zároveň.

## Kam sa pozerať ďalej

Kanály, kde sa stredoeurópske hackathony reálne ohlasujú, nie agregátory:
Česko.Digital, Slovensko.Digital, Progressbar Bratislava, Paralelní Polis,
Impact Hub, crossweb.pl, startitup.sk, touchit.sk, hwsw.hu, bitport.hu,
newslettery a Discord servery lokálnych komunít, univerzitné študentské spolky.
