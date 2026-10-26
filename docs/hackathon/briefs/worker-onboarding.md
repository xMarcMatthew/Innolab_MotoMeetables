# Worker B brief: onboarding, driver wait, Trips and Account tabs

You are building the onboarding path and two small tabs of **Larga**, a Naga City terminal commute app (Expo SDK 56, Expo Router, NativeWind 4, Supabase). Read this whole file, then `docs/hackathon/plan-matt-nap.md` (sections Decisions and Onboarding). Do not read other chats; this file is your whole brief.

## Ground rules
- **Own only these files**: `src/app/(auth)/welcome.tsx`, `src/app/(auth)/driver.tsx`, `src/app/waiting.tsx`, `src/app/index.tsx`, `src/app/commuter/trips.tsx`, `src/app/commuter/account.tsx`, `src/lib/onboarding.ts`, `src/components/driver/first-trip-checklist.tsx`. The skeleton created placeholders for the screens; replace their contents.
- **Never edit**: `src/app/_layout.tsx`, `src/app/(auth)/sign-in.tsx`, `src/app/(auth)/sign-up.tsx`, anything under `src/app/commuter/(home)/`, `src/app/commuter/_layout.tsx`, anything under `src/app/driver/` or `src/app/coop/`, `src/lib/api/*`, `src/lib/supabase.ts`, `package.json`, `app.json`, `.env`.
- **No new packages, no native modules.** Everything you need is installed (`@react-native-async-storage/async-storage`, `expo-location`, `expo-notifications`, `@expo/vector-icons`).
- **No git commits.** Leave changes in the working tree. JM commits.
- Finish with `npx tsc --noEmit` (exit 0) and `npm run lint` (clean). If `npx` is refused in your shell, use `npx.cmd`.
- Append a `## Report` section to the bottom of this file: what you built, what you could not verify, and anything JM must know (especially the one-line change JM needs to make in `driver/index.tsx` to use your checklist). Under 15 lines.

## What exists (reuse, do not rewrite)
- Auth: `src/app/(auth)/sign-in.tsx` and `sign-up.tsx` (react-hook-form + Zod, `FormField`, `supabase.auth.signUp` with `full_name` metadata). Every sign-up becomes a `commuter`; roles are changed only by the coop or JM in SQL. Email confirmation is off, so sign-up gives a session immediately.
- Routing: `src/app/_layout.tsx` has `Stack.Protected` groups. Logged out: `(auth)/welcome` is listed first, then `(auth)/driver`, `(auth)/sign-in`, `(auth)/sign-up`. Logged in: `index`, `commuter`, `driver/index`, `coop/*`, `waiting`. The skeleton already registered these; you only fill the screens.
- `src/app/index.tsx` today: reads `profiles.role` for the signed-in user and `Redirect`s to `/commuter`, `/driver` or `/coop`. Keep that logic; add the `wantsDriver` branch (below).
- `src/components/sign-out-button.tsx`, `src/components/form-field.tsx`, `src/lib/validation.ts`.
- `src/lib/names.ts`: `shortName("Marc Bagasbas")` → `"Marc B."`. Use it wherever a name is shown to someone other than its owner. The Account tab shows the owner's own full name.
- Palette A classes only: `bg-background`, `text-foreground`, `text-muted`, `bg-primary` (primary buttons, white text), `bg-accent` (never for text), `border-border`, `text-destructive`. Hex values are not allowed in className.
- Driver home `src/app/driver/index.tsx` (JM's, do not edit) uses `useMyVehicle()` which returns `{ vehicle, loading, error, reload }`; `vehicle` is null when no vehicle is assigned.

## Build these

### 1. Welcome, `src/app/(auth)/welcome.tsx`
- Centered: "Larga" in `text-4xl font-bold text-foreground`, one line under it "Know the fare before you ride." in `text-muted`.
- Primary button **Find a ride** → `router.push("/sign-up")`.
- Secondary button (white, `border border-muted`) **I drive for a coop** → `router.push("/driver")`.
- Small link **Sign in** → `/sign-in`.
- No slides, no skip logic; this is the whole onboarding for commuters.

### 2. Driver explainer, `src/app/(auth)/driver.tsx`
- Title "Driving for a coop?", body: "Your coop assigns you a vehicle in Larga. Create an account with the email your coop knows, or sign in if they already gave you one."
- Buttons: **Create account** and **Sign in**. Both first call `setWantsDriver(true)` from `src/lib/onboarding.ts`, then navigate.

### 3. `src/lib/onboarding.ts`
- `getWantsDriver(): Promise<boolean>` and `setWantsDriver(v: boolean): Promise<void>` over AsyncStorage key `larga.wantsDriver`. Wrap reads in try/catch and treat failure as `false`.

### 4. Redirect, `src/app/index.tsx`
- After loading the role: if role is `driver` or `coop`, redirect as today and call `setWantsDriver(false)` if it was set. If role is `commuter` and `getWantsDriver()` is true, `Redirect` to `/waiting`. Otherwise `/commuter`.

### 5. Waiting for your coop, `src/app/waiting.tsx`
- Title "Waiting for your coop". The signed-in email in `text-2xl font-semibold` (from `supabase.auth.getSession()`), then "Give this email to your coop. When they assign you a vehicle, tap Check again."
- **Check again** (primary): re-read `profiles.role`; if it is now `driver`, `router.replace("/driver")`.
- **I'm a commuter instead** (secondary): `setWantsDriver(false)` then `router.replace("/commuter")`.
- `SignOutButton` at the bottom.

### 6. Trips tab, `src/app/commuter/trips.tsx`
- Title "Trips". Empty state with an icon from `@expo/vector-icons` (MaterialCommunityIcons `bus-clock`), text "Your rides will show here after your first boarding scan." Boardings come after H10; leave a comment with the query: `supabase.from("boardings").select("id, boarded_at, vehicle:vehicles(plate, vehicle_type)").order("boarded_at", { ascending: false })`.

### 7. Account tab, `src/app/commuter/account.tsx`
- Title "Account". Full name and email from `profiles` (`full_name`) and the session. A line "Others see you as {shortName(fullName)}". `SignOutButton` as a full-width secondary button.

### 8. First-trip checklist component, `src/components/driver/first-trip-checklist.tsx`
- Export `FirstTripChecklist({ vehicleAssigned }: { vehicleAssigned: boolean })`. Three cards in a column, each with a title, one sentence, and a Done state (icon `check-circle` in primary plus the word "Done"):
  1. "Vehicle assigned" — done when `vehicleAssigned`; otherwise "Ask your coop to assign your plate to this account."
  2. "Location: Allow all the time" — "Larga shares where your jeep is while you are on a trip." Button **Allow** calls `expo-location` `requestForegroundPermissionsAsync()` then `requestBackgroundPermissionsAsync()`; if denied, the button becomes **Open settings** (`Linking.openSettings()`). Done when background permission is granted.
  3. "Notifications" — "Riders get told when you start loading." Button **Allow** calls `expo-notifications` `requestPermissionsAsync()`. Done when granted. (Push itself is after H10; this only asks.)
- A closing line: "Keep Larga open on the dashboard while on a trip."
- Returns `null` when all three are done. Do **not** wire it into `driver/index.tsx` (JM's file); in your Report, give JM the exact two lines to add.

## Quality bar
- Touch targets at least 48 dp; every `Pressable` has `accessibilityRole="button"` and pressed feedback (`active:opacity-80`).
- Safe areas via `react-native-safe-area-context` where a screen has no header.
- Loading and error states on anything that reads Supabase (follow `src/app/index.tsx`'s Retry pattern).
- Keep it small: `useState` and `useEffect`, no context, no store.
- Any shortcut with a known limit gets a one-line comment: `shortcut: <limit>, <when to upgrade>`.
- Do not change files outside your list even if you see a problem; write it in your Report instead.

## Report
(append here when done)
