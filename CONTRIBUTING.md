# Pridanie hackathonu

Sú tri cesty. Formulár na `/pridat` je pre organizátorov. Pull request je pre
každého, kto vie o podujatí a chce ho pridať aj s dôkazom. Ak sa vám ani jedno
nechce, napíšte na m3kalis@gmail.com a pridáme ho za vás.

## Cez pull request

1. Otvorte ktorýkoľvek `.csv` v `scripts/seed/`, alebo si založte nový.
   Seed načíta všetky súbory v tom priečinku, takže na názve nezáleží.
2. Pridajte riadok. Stĺpce sú:

```
name,description,start_at,end_at,timezone,format,venue_name,address,city,
country_code,url,registration_url,registration_deadline,themes,eligibility,
price_cents,prizes,capacity,organizer_name,source_url,date_confidence
```

3. Pravidlá pre hodnoty:

| Stĺpec | Hodnota |
|---|---|
| `start_at`, `end_at` | ISO 8601 s posunom, napr. `2027-04-16T09:00:00+02:00`. Koniec musí byť v budúcnosti, inak sa podujatie na mape nezobrazí. |
| `timezone` | IANA, napr. `Europe/Bratislava` |
| `format` | `onsite`, `online` alebo `hybrid` |
| `country_code` | `SK`, `CZ`, `AT`, `HU`, `PL` alebo `DE` |
| `address` | Ulica a číslo, ak sú známe. Bez nich sa pin kreslí ako plocha mesta, nie ako bod. |
| `themes` | Oddelené `|`, len zo zoznamu v `lib/taxonomy.ts` |
| `eligibility` | `open`, `students`, `university`, `highschool`, `women` alebo `company` |
| `price_cents` | `0` ak zadarmo |
| `source_url` | Stránka, z ktorej ste údaje prepísali |
| `date_confidence` | `confirmed` ak je termín na stránke organizátora, `estimated` ak ide o odhad podľa predchádzajúcich ročníkov |

4. Ak dávate `estimated`, napíšte do popisu pull requestu, ktoré ročníky ste
   videli a prečo ste zvolili práve tento termín.

## Čo nepridávať

- Podujatie, ktoré už skončilo. Vyhľadávanie ho nikdy nezobrazí.
- Údaje z útržku vo vyhľadávači. Otvorte stránku organizátora.
- Vymyslený termín. Radšej žiadny riadok než nesprávny.
- Jednorazovú výzvu vo vnútri väčšieho programu, na ktorú sa nedá prihlásiť.

## Overenie pred odoslaním

```bash
npm run seed    # vypíše, ktoré riadky neprešli validáciou
npm test
```
