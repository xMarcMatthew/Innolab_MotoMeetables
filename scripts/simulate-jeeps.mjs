// Demo simulator: moves the 4 demo jeeps (supabase/seed/demo.sql) along their route lines, so the commuter
// map is alive without four driver phones. Runs on a laptop only; the pitch says these jeeps are simulated.
// It signs in as demo driver accounts and calls the same RPCs as the app (update_my_location,
// set_vehicle_status) with the public anon key. No service key.
//
//   npm run simulate -- --setup   creates demo.driver1..4@example.com (then run supabase/seed/demo.sql again)
//   npm run simulate              moves the jeeps; Ctrl+C stops, and they leave the map within 15 s
//
// Needs in .env: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, DEMO_DRIVER_PASSWORD.
// Plain fetch, not supabase-js: its Realtime client refuses Node 20, and nothing here needs Realtime.

import assert from "node:assert/strict";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const PASSWORD = process.env.DEMO_DRIVER_PASSWORD;
const EMAILS = [1, 2, 3, 4].map((i) => `demo.driver${i}@example.com`);

const TICK_MS = 5000; // same rate as a real driver phone
const SPEED_KMH = 25; // a jeep in town traffic
const LOAD_MS = 60_000; // time spent "Now loading" at the terminal before departing

// ---------------------------------------------------------------- route geometry

// Metres between two [lng, lat] points (haversine).
function metres([lng1, lat1], [lng2, lat2]) {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lng2 - lng1) * rad) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

// Cumulative distance at each point, so pointAt can find its segment.
function measure(coords) {
  const cum = [0];
  for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + metres(coords[i - 1], coords[i]));
  return { coords, cum, total: cum.at(-1) };
}

// The [lng, lat] point `d` metres along the line (clamped to its ends).
function pointAt({ coords, cum, total }, d) {
  if (d <= 0) return coords[0];
  if (d >= total) return coords.at(-1);
  let i = 1;
  while (cum[i] < d) i++;
  const t = (d - cum[i - 1]) / (cum[i] - cum[i - 1]);
  const [a, b] = [coords[i - 1], coords[i]];
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// Self-check of the geometry on every run (no network).
{
  const line = measure([
    [123.0, 13.0],
    [123.001, 13.0],
    [123.001, 13.001],
  ]);
  assert.deepEqual(pointAt(line, 0), [123.0, 13.0]);
  assert.deepEqual(pointAt(line, line.total + 50), [123.001, 13.001]);
  const mid = pointAt(line, line.cum[1] / 2);
  assert.ok(Math.abs(mid[0] - 123.0005) < 1e-9 && mid[1] === 13.0);
}

// ---------------------------------------------------------------- Supabase over plain fetch

async function call(path, { token, method = "POST", body } = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${token ?? KEY}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.msg ?? data?.message ?? data?.error_description ?? res.statusText);
    err.status = res.status;
    err.code = data?.code;
    throw err;
  }
  return data;
}

const signIn = (email) =>
  call("/auth/v1/token?grant_type=password", { body: { email, password: PASSWORD } });

// ---------------------------------------------------------------- --setup

async function setup() {
  for (const [i, email] of EMAILS.entries()) {
    try {
      await call("/auth/v1/signup", {
        body: { email, password: PASSWORD, data: { full_name: `Demo Driver ${i + 1}` } },
      });
      console.log(`created ${email}`);
    } catch (e) {
      if (/already registered/i.test(e.message)) console.log(`${email} already exists`);
      else throw e;
    }
  }
  console.log("\nNow run supabase/seed/demo.sql again in the SQL Editor, then: npm run simulate");
}

// ---------------------------------------------------------------- one simulated jeep

async function startJeep(email, index) {
  let session = await signIn(email);
  const [vehicle] = await call(
    `/rest/v1/vehicles?select=plate,route:routes(route_line)&driver_id=eq.${session.user.id}`,
    { token: session.access_token, method: "GET" },
  );
  if (!vehicle) return console.log(`${email}: no jeep assigned, run supabase/seed/demo.sql again`);
  const coords = vehicle.route?.route_line?.coordinates;
  if (!coords || coords.length < 2)
    return console.log(`${vehicle.plate}: route has no line, skipped`);

  const line = measure(coords);
  const step = (SPEED_KMH / 3.6) * (TICK_MS / 1000);
  // Jeep 1 starts loading at its terminal; the others start part way along, so they are spread out.
  let state =
    index === 0 ? { loadingUntil: Date.now() + LOAD_MS, d: 0 } : { d: line.total * 0.2 * index };

  const rpc = async (fn, body) => {
    try {
      return await call(`/rest/v1/rpc/${fn}`, { token: session.access_token, body });
    } catch (e) {
      if (e.status !== 401) throw e;
      session = await signIn(email); // the access token lasts an hour; sign in again once it expires
      return call(`/rest/v1/rpc/${fn}`, { token: session.access_token, body });
    }
  };

  await rpc("set_vehicle_status", { p_status: state.loadingUntil ? "loading" : "departed" });
  console.log(
    `${vehicle.plate}: ${(line.total / 1000).toFixed(1)} km line, ${state.loadingUntil ? "loading" : "on the way"}`,
  );

  // The next tick is scheduled only after this one finishes, so on a slow network an older position
  // can never land after a newer one and pull the dot backward.
  const tick = async () => {
    try {
      if (state.loadingUntil && Date.now() >= state.loadingUntil) {
        state = { d: 0 };
        await rpc("set_vehicle_status", { p_status: "departed" });
        console.log(`${vehicle.plate}: departed`);
      } else if (!state.loadingUntil) {
        state.d += step;
        if (state.d >= line.total) {
          state = { loadingUntil: Date.now() + LOAD_MS, d: 0 }; // back at the terminal for the next trip
          await rpc("set_vehicle_status", { p_status: "loading" });
          console.log(`${vehicle.plate}: back at the terminal, loading`);
        }
      }
      const [lng, lat] = pointAt(line, state.d);
      await rpc("update_my_location", { p_lat: lat, p_lng: lng });
    } catch (e) {
      console.warn(`${vehicle.plate}: ${e.message}`);
      if (e.code === "42501") {
        // Unassigned or no longer a driver: every later call would fail too, so stop scheduling.
        return console.warn(`${vehicle.plate}: stopped`);
      }
    }
    setTimeout(tick, TICK_MS);
  };
  setTimeout(tick, TICK_MS);
}

// ---------------------------------------------------------------- main

if (!SUPABASE_URL || !KEY || !PASSWORD) {
  console.error(
    "Missing EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY or DEMO_DRIVER_PASSWORD in .env",
  );
  process.exit(1);
}

if (process.argv.includes("--setup")) {
  await setup();
} else {
  // Sequential sign-ins keep the console readable; one failing driver does not stop the others.
  for (const [i, email] of EMAILS.entries()) {
    await startJeep(email, i).catch((e) => console.error(`${email}: ${e.message}`));
  }
  console.log("\nSimulating. Ctrl+C to stop.");
}
