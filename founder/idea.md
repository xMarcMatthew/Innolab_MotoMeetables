# Idea (locked by the team, revised): Naga commute app (working name TransCo, rebrand pending)

**One line:** a commute app for Naga City, Bicol, that shows commuters which jeepney or tricycle to take, where to wait and get off, the fare, and where the jeepney is now, with cashless payment handled by third-party QR services.

**Pain points it targets (unchanged)**
- Payment convenience
- The fare question
- Route trouble
- Not knowing where the next jeep is or when it arrives

## How each feature works now (team decisions, 2026-10-26)

1. **Payment / QR: third-party services.** The app never holds or moves money. Real use: each driver uploads their own GCash or Maya QR Ph code and the app shows "Pay P__" with the computed fare next to it. Demo option: PayMongo QR Ph in test mode.
2. **Fare computation:** distance along the route between pickup and drop-off, then the fare rule (minimum fare plus a rate per extra km); rates editable by an admin.
3. **Route information: crowdsourced, plus LGUs.** Drivers record routes by driving them (GPS trace snapped to roads with Mapbox Map Matching); LGUs are approached to pinpoint where routes run; an admin approves routes before commuters see them. Stored as the team's own route list.
4. **PUJ tracking: driver accounts.** Two account types, driver and commuter. A driver starts a trip and their phone shares its GPS location every few seconds through the web app; Mapbox shows the jeepney moving on the commuter's map and helps estimate arrival time.
5. **Commute guide A to B:** set where you are and where you are going; the app finds routes that pass near both.

**Stack (decided Oct 26):** Android APK in Expo SDK 56 + NativeWind, Supabase as the whole backend, Mapbox via @rnmapbox/maps. See `docs/hackathon/tech-stack.md`. The feature list above is the earlier A-to-B version; the terminal pivot (`docs/hackathon/terminal-pivot.md`) replaces it.

**Name and selling point:** being reworked with the team's designer; not decided yet.

**Who benefits (team's words)**
- Daily commuters: easier payment and automatic fare computation
- PUJ operators and drivers: no making change or handling cash while driving
- Travelers: know the routes and where to wait

## History
- v1 (earlier today): payment via the team's own QR/NFC beep-style system was the main novelty, with all five features in scope. A Court trial voted 6 to 0 against v1 as scoped; this revision answers its points on payment and data sources. The v1 competitor map is replaced by the current `competitors.md`.
