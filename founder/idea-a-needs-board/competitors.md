# Competitors: evacuation center needs board (Bicol)

Researched 2026-10-26 from public sources only. Many sources are a few years old; where a tool's current status could not be confirmed, it says so. Raw facts are in `competitors.csv`.

## 1. Who is out there (most direct first)

| Name | Type | What it does | Bicol / PH use | Status |
| --- | --- | --- | --- | --- |
| [NeedsList](https://digitalx.undp.org/respondlocal-by-needslist_1.html) | Direct | Nonprofits post needs (supplies, volunteers, funds); donors fill them like a registry | None found in PH | Global; sources 2019 to 2023, current status unverified |
| [iVolunteer Philippines](https://www.ivolunteer.com.ph/about-us) | Indirect | Matches volunteers to NGO opportunities; runs donation drives | National; 8,528 volunteers and 40 NGOs in 2024 ([review](https://blog.ivolunteer.com.ph/2025/02/20/ivolunteer-ph-2024-year-in-review-celebrating-15-years-of-connecting-volunteers-with-opportunities/)) | Active |
| [Angat Buhay / Angat Bayanihan Network](https://interaksyon.philstar.com/trends-spotlights/2024/10/23/285911/angat-buhay-ngo-donation-naga-city-areas-bicol/) | Indirect | NGO drives with posted urgent-needs lists, drop-off points, hot meals | Naga and Bicol, Kristine 2024 | Active NGO, no needs-matching tool |
| DSWD DROMIC ([via news](https://mb.com.ph/2024/11/26/21-492-families-remain-in-evacuation-centers)) | Indirect | Official counts of evacuees and open centers | National | Active; headcounts only, no donor-facing needs list found |
| [Rappler Project Agos](https://www.rappler.com/?p=110050) | Indirect | Crowdsourced map of rescue and relief requests from SMS and #ReliefPH | National | Coverage 2013 to 2015; current status unverified |
| [APSEMO Infoboard and Albay emergency app](https://technology.inquirer.net/26653/albay-turns-to-emergency-mobile-app) | Indirect | Warnings pushed to officials; 2011 app for officials | Albay | Warnings only, no needs or donor side |
| [Sahana Eden](https://www.quezon.ph/2009/09/29/alerts-and-information-updated/) | Indirect | Open-source disaster management system, adopted by NDCC in 2009 | National (2009) | Current PH use unverified |
| Facebook pages and group chats | Substitute | Centers and NGOs post needs; donors message or show up | Everywhere | The default today |
| LGU / DSWD donation desks ([example](https://cebudailynews.inquirer.net/?p=195956)) | Substitute | One desk takes all donations and publishes a list | Per LGU | Common |
| Cash to a trusted NGO ([guide](https://www.tatlerasia.com/power-purpose/philanthropy/kristine-ph-how-to-donate)) | Substitute | The NGO decides what to buy | Everywhere | Common |

## 2. Price range

Everything here is free to the people who use it. The only business model found is NeedsList's commission on enterprise users ([Hypepotamus](https://www.hypepotamus.com/needslist/)). Price is not where anyone competes; adoption and trust are.

## 3. Positioning map (text)

Axes that matter to a center manager and a donor:
- **Specific (per center, right now)** vs **general (national counts or one NGO's campaign)**
- **Two-way (pledge, then confirm received)** vs **broadcast only (post and hope)**

```
                     Two-way (pledge + confirm)
                              |
               NeedsList      |      << gap: per-center, Bicol,
               iVolunteer     |         goods + volunteer hands >>
   General  ------------------+------------------  Specific
               DROMIC         |      Facebook posts
               Agos           |      Donation desks
               APSEMO         |      Angat Buhay needs lists
                              |
                      Broadcast only
```

## 4. What goes wrong today (ranked)

These are not app reviews (none of these tools has public star ratings); they are reported problems from news and official statements.

1. **Donations do not match needs.** Unusable or wrong items create extra sorting work.
   - DSWD keeps a "no used clothing donation" policy and lists what evacuees actually need: hygiene kits, milk, diapers, new clothes ([Inquirer](https://newsinfo.inquirer.net/?p=1036722)).
   - Naga City, **Cebu** landslide 2018: "some donated items included stained clothes", "an added burden to social workers and volunteers" ([Cebu Daily News](https://cebudailynews.inquirer.net/?p=195956)).
   - Taal 2020: donated gowns and security guard uniforms ([Malay Mail](https://www.malaymail.com/news/life/2020/01/21/costume-party-philippines-taal-volcano-evacuees-play-dress-up-in-unsuitable/1830062)).
   - Davao City fire: donors told to use drop-off points, "not directly to the evacuation center", to avoid commotion ([Davao City](https://davaocity.gov.ph/social-services/cswdo-urges-public-to-donate-useful-items-to-fire-victims/)).
2. **Centers' basic needs go unmet for months.** Mayon 2023: about 20,000 people in centers "not built to be evacuation centers"; water and sanitation the core unmet need ([Inquirer](https://newsinfo.inquirer.net/?p=1789391), [Manila Times](https://manilatimes.net/2023/06/25/regions/mayon-evacuation-centers-crowded/1897690/amp)).
3. **Relief data is contested.** Kristine 2024: Robredo called Naga City's report of her group's relief "irresponsible" and "does not reflect correct data"; the report was taken down ([Inquirer](https://newsinfo.inquirer.net/1999331/robredo-calls-out-irresponsible-naga-city-data-on-relief-ops)). Thin: one clear case (a 2023 headline also says Albay's evacuee list was being screened after it ballooned: [Radyo Inquirer](https://radyo.inquirer.net/?p=100620)).
4. **Supply sits while distribution lags.** Mayon 2015: half a million noodle packs shipped two months before expiry ([Inquirer Opinion](https://opinion.inquirer.net/88615/what-went-wrong-2)); Bohol 2013: goods "stacked there", volunteers not mobilized ([Inquirer](https://newsinfo.inquirer.net/510911/relief-goods-for-bohol-stuck-at-town-proper-distribution-problem-surfaces/amp)). Thin: two cases, older.
5. **Volunteers cannot find where to help.** iVolunteer was founded because, after Ondoy 2009, volunteers struggled to find groups that could take them ([about](https://blog.ivolunteer.com.ph/about/)). Thin: one source.

## 5. The gap

Nobody found gives a **single evacuation center** a live, self-updated list of what it needs **right now**, covering both goods and volunteer hands, where donors and volunteers **pledge against a specific item** and the center **marks it received**.

- DROMIC and APSEMO know how many people are in a center, not what it is short of.
- Angat Buhay and Facebook posts say what is needed, but as one-way posts that go stale; nobody sees what is already pledged, so donors double up or bring the wrong thing (complaint 1).
- iVolunteer matches volunteers to NGOs, not to a center's shift on Saturday.
- NeedsList is the closest model, but no Philippine or Bicol use was found.
- The "marked received" step also answers complaint 3: a public record of what reached each center.

**The honest weak spot:** Facebook is free, already used by every center, and good enough for many. The pitch has to show why a structured board beats a post: no duplicates, always current, shows what is already covered.

## 6. The threat (who could copy this fastest)

1. **Angat Buhay / Angat Bayanihan Network**: already has the Bicol network, volunteers and donor trust; adding a needs board to their site would beat us on reach. They are also the most natural first partner.
2. **iVolunteer Philippines**: already has volunteers and NGO accounts; adding "goods needed" to a posting is a small step.
3. **DSWD**: could add needs to DROMIC data, but government tools move slowly.
4. **Facebook itself**: a fundraiser or group post format is the default; we only win where structure matters.

**Biggest adoption risk (not a competitor):** center managers are overloaded during a disaster. If updating the board is slower than a Facebook post, they will not do it.

Next: `/court-skill:court --quick` on the chosen idea, then `/grill-me` after locking. (`/founder-consumer` is blocked for Claude in this repo on purpose.)
