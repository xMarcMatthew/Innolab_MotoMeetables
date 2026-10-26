# Competitors (revised plan): Naga commute app

Researched 2026-10-26 from public sources only, for the revised plan in `idea.md` (third-party QR payment, crowdsourced and LGU routes, driver-phone tracking with Mapbox). Raw facts with links: `competitors.csv`. The first run's map (payment-first version) is replaced by this one.

## 1. Who is out there (most direct first)

| Name | Type | What it does | Naga / Bicol | Status |
| --- | --- | --- | --- | --- |
| [Sakay.ph](https://apps.apple.com/app/id937998546) | Direct | A-to-B commute directions, fare estimates, live bus ETA where data exists | No Naga coverage found; Metro Manila and nearby provinces | Active. Started as a hackathon project on government open data ([Rappler](https://www.rappler.com/?p=86160)) |
| [Moovit](https://philstarlife.com/living/247681-apps-commuters-navigation-metro) | Direct | Route suggestions | No Naga coverage found | Not checked in-app |
| [Lakbayan](https://www.atlantis-press.com/article/126023796.pdf) (UP Diliman) | Direct | Users submit and verify routes, trip planning, real-time updates | Research only | 2025 prototype |
| [Mandaue Commuter Transport Map](https://philstar.com/cebu-news/2024/11/16/2400630/app-track-modern-pujs-) | Indirect | LGU-backed modern jeepney tracking with minutes away | Cebu only | Planned; unverified |
| [JeepniGo](https://iteapp.duckdns.org/jeepnigo) | Indirect | Live jeepney map | Unknown | Self-reported; unverified |
| [JeePS 2.0, JEEP-PS, JeepQTS](https://repository.upou.edu.ph/items/6382e51d-ef32-44fa-918e-3578931dcc81) | Indirect | Tracking and ETA prototypes; JeepQTS uses SMS so nobody spends mobile data | Research only | Small tests (JEEP-PS: 2 drivers, 10 commuters, [paper](https://journals-archive.smu.edu.ph/wp-content/uploads/2026/06/1.-Araos-et-al-1-16.docx.pdf)) |
| [beep](https://mirror.pia.gov.ph/press-releases/2022/12/20/beep-expands-in-bicol-region-with-new-transport-coop-partners) | Indirect | Tap card payment with a device in each modern jeepney | Gubat-Sorsogon coops; no Naga rollout found | Active |
| [GCash / Maya QR Ph](https://interaksyon.philstar.com/?p=191402) | Indirect (and our payment rail) | Driver's own QR, passenger pays from any wallet | National push to tricycle drivers (BSP-DILG Paleng-QR Ph) | Active |
| [Naga ordinances](https://www2.naga.gov.ph/proposed-ordinance/nb8_2025-1008-nc-public-transport-route-rationalization-hon-buenafe/) | Substitute | Official routes and fares in ordinances and scanned PDFs | Naga | Current, hard to read |
| [Asking the driver](https://newsinfo.inquirer.net/760430/lazy-ltfrb-leaves-drivers-passengers-arguing-over-fare) | Substitute | "Magkano po?" | Everywhere | The default |
| Google Maps | Substitute | Directions; no evidence found of jeepney transit data for provincial cities ([2013 GTFS notes](https://pleasantprogrammer.com/posts/jeepney-and-bus-routes.html)) | Naga jeepneys not covered as far as found | Active |

**Change from the first run:** with payment moved to GCash/Maya QR Ph, beep is no longer a head-on rival. QR Ph becomes the rail the app sits on.

## 2. Price range

All free to commuters. Payment rails are free to the payer (merchant terms not checked). Nobody competes on price.

## 3. Positioning map (text)

Axes that matter to a Naga commuter:
- **Covers Naga (jeepneys and tricycles)** vs **Metro Manila or elsewhere**
- **Data stays fresh (crowdsourced, live from drivers)** vs **static (one-time dataset, PDFs)**

```
                  Fresh, live data
                         |
   Lakbayan (research)   |    << revised plan: Naga, crowdsourced
   Mandaue map, JeepniGo |       routes + live driver location >>
 Elsewhere --------------+-------------- Naga / Bicol
   Sakay.ph, Moovit      |    Naga ordinances and PDFs
   Google Maps           |    Asking the driver
                         |
                  Static data
```

## 4. What goes wrong today (ranked)

1. **Route apps go stale.** A 2025 UP Diliman study: Sakay.ph and Moovit "suffer from outdated or incomplete data", "lack frequent updates, real-time information", and do not support "unregulated modes such as tricycles" ([paper](https://www.atlantis-press.com/article/126023796.pdf)). Sakay's own co-founder said updates and corrections became "harder to access" after the first government dataset, so they turned to collecting data themselves and to crowdsourcing ([Vulcan Post](https://vulcanpost.com/?p=628984)).
2. **Naga's official route and fare info is hard to use.** The 2025 route plan (8 routes, 282 PUJs) sits in a scanned PDF ([draft ordinance](https://www2.naga.gov.ph/proposed-ordinance/nb8_2025-1008-nc-public-transport-route-rationalization-hon-buenafe/)); the tricycle fare ordinance orders a fare matrix "to guide drivers and the riding public" ([Ord. 2024-002](https://www2.naga.gov.ph/wp-content/uploads/2024/01/Ordno-2024-002-Trimobile-Fare-P15.00.pdf)). No commuter complaint coverage was found, so the pain is inferred from the city's own actions.
3. **Tracking depends on drivers, and nobody has measured driver uptake.** Every tracking project found is a pilot or prototype; JEEP-PS tested with 2 drivers; JeepQTS chose SMS specifically so drivers spend no mobile data ([UPOU](https://repository.upou.edu.ph/items/6382e51d-ef32-44fa-918e-3578931dcc81)). Thin: no adoption, battery or data-cost study found.
4. **Card payment glitches.** beep app reviews: load not reflected, server errors ([reviews](https://mwm.ai/apps/beep/1364301693)). Less relevant now that payment uses QR Ph. Thin for Naga.

## 5. The gap

**Still open, and the revision targets it more squarely:** no one gives Naga commuters routes (including tricycles) that stay current, the correct fare, and live jeepney location.
- Sakay.ph and Moovit skip Naga and, per the 2025 study, go stale where they do operate. Crowdsourcing plus admin approval is exactly the fix Sakay's own team said they needed.
- The payment change removes the biggest conflict from the first run: GCash/Maya QR Ph is a rail to use, not a rival to beat.
- **New local lead:** Naga's 2025 route plan was prepared with the Bicol State College of Applied Sciences and Technology (BISCAST) ([draft ordinance](https://www2.naga.gov.ph/proposed-ordinance/nb8_2025-1008-nc-public-transport-route-rationalization-hon-buenafe/)). They likely hold the route data in a usable form and are a natural partner to name.

**The honest weak spot moved:** it is no longer payment, it is **supply of data**. Routes need someone to record or approve them, and live tracking needs drivers to keep a phone on the trip page with mobile data. No evidence was found on whether Naga drivers would.

## 6. The threat

1. **Sakay.ph**: same product category, already crowdsourcing; adding Naga is a data job for them.
2. **Naga City LGU or BISCAST**: they made the route plan and could publish it as a map themselves.
3. **Google Maps**: if anyone uploads Naga routes as transit data, Google shows them free.
4. **beep / AF Payments**: already works with Bicol coops; could add route info.

Defense: be the local, maintained source (approved by a coop, the city or BISCAST), cover tricycles, and show live driver data none of them have in Naga.

Next: `/court-skill:court --quick` retrial on the revised plan.
