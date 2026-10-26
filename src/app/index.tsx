import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { SignOutButton } from "@/components/sign-out-button";
import { supabase } from "@/lib/supabase";

const HOMES = { commuter: "/commuter", driver: "/driver", coop: "/coop" } as const;
type Role = keyof typeof HOMES;

// Signed-in users land here; send them to their role's home.
export default function Index() {
  const [role, setRole] = useState<Role | null>(null);
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
      if (error) setError(error.message);
      else if (data.role in HOMES) setRole(data.role as Role);
      else setError(`Unknown role: ${data.role}`);
    })();
  }, [attempt]);

  if (role) return <Redirect href={HOMES[role]} />;

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
