# Payment Flow (superseded) [AI: REFERENCE]

**Superseded on Oct 26 by the terminal pivot.** The two-scan flow is dropped; the decided payment and boarding flow is in `tech-stack.md`. Kept as history.

The team's two-scan QR fare idea, an assessment of it, and simpler alternatives. Nothing here is decided yet: once the team picks, the decision goes in the Decisions Log in prep-plan.md and the flow moves into tech-stack.md.

## The team's idea: two QR scans, like beep tap-in and tap-out

1. **Boarding:** the passenger scans a QR placed near the jeepney entrance. This records where they got on.
2. **Getting off:** the passenger scans a QR shown by the driver. This records where they got off, computes the fare from the distance, and completes payment.

The driver's QR protects the driver from passengers trying to cheat the fare. Same idea as how beep computes MRT/LRT fares from tap-in and tap-out.

**What it looks like:**
1. Passenger scans the sticker: "Ride started on Jeep ABC-123, Centro to Pacol."
2. Passenger scans the driver's phone when getting off: "Centro to Magsaysay, 5.2 km, P18. Pay now."
3. Passenger pays; the driver's screen shows the fare.

## Verdict: the fare part works, with 5 fixes

| # | Problem | What could go wrong | Fix |
| --- | --- | --- | --- |
| 1 | The boarding QR is a sticker | Someone photographs it and "boards" from anywhere, or scans a jeep they never rode | Take the pickup point from the **jeep's own tracked location** (the driver's phone already sends GPS). Optionally check the passenger is near the jeep. At drop-off, reject the scan if the driver's QR belongs to a different jeep than the boarding one. |
| 2 | The driver's QR can be screenshotted | Passenger screenshots it after boarding and scans it two stops later to pay less | Make the driver's QR **change every 30 to 60 seconds** (a Laravel signed link that expires), so a screenshot goes stale. |
| 3 | Whose GPS decides the fare | A passenger's phone can be wrong, have location off, or be faked | Use the **jeep's tracked position** at both scan times, never the passenger's. The server records the time, not the phone. |
| 4 | Passenger never scans out | Dead phone, forgot, or skipped on purpose | Auto-close the ride when the driver ends the trip and charge to the end of the route (beep does the same for a missing tap-out). Say so in the app. |
| 5 | No signal, or no smartphone | Either side has no data; older riders have no phone | Cash always stays allowed. The app is optional, never the only way to pay. |

Bonus: the driver's trip page already has to stay on screen for live tracking, so it can keep showing the changing QR. The driver does nothing extra per passenger.

## The part that breaks: actually paying

beep works because riders **load money onto the card first** and the system deducts from that balance. Holding riders' balances needs a central bank e-money license (not checked in detail). That breaks our decision that the app never holds or moves money, and it cannot be done in 24 hours.

So after the second scan, the realistic options are:
- **Show the computed fare next to the driver's own GCash or Maya QR.** Passenger pays in their own wallet app. Real and simple, but we cannot confirm the payment happened; the driver checks their GCash notification.
- **PayMongo QR Ph in test mode, for the demo only.** Shows "Paid" automatically. Its test QR codes are real codes: never scan one with a real wallet, it processes a real payment. In live use the money lands in whoever owns the PayMongo account, which would be us unless each cooperative has its own.

## Alternatives if the two-scan flow is too much

| Option | How it works | Effort | Cheat risk |
| --- | --- | --- | --- |
| **A. Two scans + the 5 fixes** | Boarding sticker, then the driver's changing QR, fare from the jeep's GPS | High; depends on live tracking working first | Low |
| **B. One scan at drop-off** | Passenger scans the driver's changing QR and picks where they boarded from the stops on the map | Medium | Passenger can lie about where they boarded; the driver sees it on screen, much like cash today |
| **C. Plan first, pay on board** | Passenger plans the trip in the guide, sees the fare, pays at boarding through the driver's QR | Low; reuses the guide we are building anyway | Riding past the declared stop, same as cash today |

## Recommendation

1. Build the route guide and fare lookup first. Every option needs it.
2. Then **C**: payment is the guide's fare shown next to the driver's QR, about an hour of work.
3. Build **A** only if live tracking works by about hour 10. It is the most impressive demo and closest to beep, but it stacks on tracking plus the 5 fixes.
4. Either way, pitch A as the vision: "tap-in, tap-out like beep, for Naga jeepneys, with no card reader."

## Data it needs (if A or B is built)

`rides`: passenger, jeep, driver trip, pickup point and time, drop-off point and time, distance, fare, status (open, completed, auto-closed), payment status.

## Decisions for the team

1. Flow: A, B, C, or C first and A if there is time?
2. After the fare is computed: the driver's own GCash/Maya QR only, or also PayMongo test mode for the demo?
3. Student, senior and PWD discounts: self-declared in the app, with the driver checking ID like today?

Not yet checked: the Laravel 13 signed-link API for the changing QR, and the e-money licensing rules in detail.
