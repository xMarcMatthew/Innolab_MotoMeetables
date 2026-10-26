import "../global.css";

import type { Session } from "@supabase/supabase-js";
import { Link, SplashScreen, Stack } from "expo-router";
import { cssInterop } from "nativewind";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
// Defines the driver's background GPS task at startup, as Android requires.
import "@/lib/trip";

// NativeWind only styles core components on native; without this, className on Link works on web but not on the phone.
cssInterop(Link, { className: "style" });

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // undefined = still reading the saved session.
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    // Fires INITIAL_SESSION first, then every sign-in, sign-out and token refresh.
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session !== undefined) SplashScreen.hide();
  }, [session]);

  // The splash covers the screen until the session is known. Signing out flips the guards, so the router moves to sign-in by itself.
  return (
    <Stack>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="commuter" options={{ headerShown: false }} />
        <Stack.Screen name="waiting" options={{ title: "Waiting for your coop" }} />
        <Stack.Screen name="driver" options={{ headerShown: false }} />
        <Stack.Screen name="coop/index" />
        <Stack.Screen name="coop/terminal" />
        <Stack.Screen name="coop/routes" />
        <Stack.Screen name="coop/route" />
        <Stack.Screen name="coop/vehicles" />
        <Stack.Screen name="coop/vehicle" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        {/* Welcome is first so logged-out users land on it, not on Sign in. */}
        <Stack.Screen name="(auth)/welcome" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/for-drivers" options={{ title: "Driving for a coop" }} />
        <Stack.Screen name="(auth)/sign-in" options={{ title: "Sign in" }} />
        <Stack.Screen name="(auth)/sign-up" options={{ title: "Create account" }} />
      </Stack.Protected>
    </Stack>
  );
}
