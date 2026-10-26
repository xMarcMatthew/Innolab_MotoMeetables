# Terminal Pivot (decided) [AI: REFERENCE]

Rj's clarified version of the terminal pivot (2026-10-26). **Decided by the team on Oct 26**; the answers to the open questions below are in the Decisions Log, and the build details are in `tech-stack.md`.

## The idea

Focus on **terminals**: jeepney, bus and tricycle terminals where trips start from a known point, go to known destinations, and use a fixed fare matrix.

## Who uses it

- **Commuter:** finds the right vehicle and fare, and links themselves to the vehicle they board.
- **Driver:** shares the vehicle's live location, sets "now loading" or "departed", and may handle fares.
- **Coop or TODA / dispatcher:** manages the terminal and its fare matrix.

## Flow

1. The commuter picks a terminal and a destination.
2. The app shows the vehicle that serves it, the fare from the **fare matrix guide**, and whether a vehicle is **now loading** or has **departed**.
3. Live GPS tracking shows where vehicles are.
4. **Boarding:** each driver or vehicle has its own QR, issued by the app. The commuter scans it when boarding, which tells the app they are riding that vehicle. The QR is **reusable** because it is unique to each driver.
5. Fare: paid to the driver or the coop/TODA, through third-party QR or cash. We never hold money (this rule is unchanged).

## Kept

- **Live GPS tracking** (driver's phone shares its location; Mapbox shows it).
- **Status tracking:** "now loading" or "departed" per vehicle.
- **Fare matrix guide** in the app, so commuters can look up fares.
- Commuter and driver accounts.

## Dropped

- **Tap-in and tap-out (two-scan flow):** no longer needed.
- **Fare computed from distance:** the fare comes from the matrix instead. (Open: confirm this is what we want.)

## Out of scope (future)

- **Hail-anywhere jeeps** (boarding off the street, no terminal): hard to build now; pitch it as a next step.

## Open questions for the team

1. **What does linking to a vehicle do for the commuter?** For example: a trip record, letting family see the ride, a passenger count for the driver, or tying a payment to the ride.
2. **How is payment confirmed?** A static GCash or Maya QR does not tell the app someone paid. Options: the driver confirms, or the app does not track payment at all.
3. **Reusable QR misuse:** a photo of the driver's QR can be scanned from anywhere. Possible fix: accept the scan only if the commuter's phone is near the vehicle's live location.
4. **Who sets the status, the driver or a dispatcher?**
5. **Fare matrix:** is it per destination only, or does it also cover drop-off points along the way?
6. **Buses:** full flow, or information only (bus lines already sell tickets online)? (Answered later: full flow; see the Decisions Log, "Oct 26, core flow".)
7. **APK or web/PWA:** live GPS keeps background location in play, which was the reason for the APK. Reconfirm.
