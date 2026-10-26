import { type Href, Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { SignOutButton } from "@/components/sign-out-button";
import { getWantsDriver, setWantsDriver } from "@/lib/onboarding";
import { supabase } from "@/lib/supabase";

const HOMES = { commuter: "/commuter", driver: "/driver", coop: "/coop" } as const;
type Role = keyof typeof HOMES;

// Signed-in users land here; send them to their role's home.
export default function Index() {
  const [target, setTarget] = useState<Href | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth.session) return; // the root layout's guard sends logged-out users to sign-in
      // Filter to our own row: a coop user can also read its drivers' profiles.
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.session.user.id)
        .single();
      if (error) return setError(error.message);
      if (!(data.role in HOMES)) return setError(`Unknown role: ${data.role}`);
      const role = data.role as Role;
      // A driver sign-up stays a commuter until the coop promotes it (Decisions D2).
      const wantsDriver = await getWantsDriver();
      if (role !== "commuter" && wantsDriver) await setWantsDriver(false);
      setTarget(role === "commuter" && wantsDriver ? "/waiting" : HOMES[role]);
    })();
  }, [attempt]);

  if (target) return <Redirect href={target} />;

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
      {error ? (
        <>
          <Text className="text-center text-destructive">Could not load your account: {error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setError(null);
              setAttempt((n) => n + 1);
            }}
          >
            <Text className="font-semibold text-primary">Retry</Text>
          </Pressable>
          <SignOutButton />
        </>
      ) : (
        <ActivityIndicator />
      )}
    </View>
  );
}
