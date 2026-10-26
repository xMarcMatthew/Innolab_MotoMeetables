import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { signOut } from "@/components/sign-out-button";
import { shortName } from "@/lib/names";
import { supabase } from "@/lib/supabase";

type Account = { fullName: string | null; email: string; coopName: string | null };

// Same layout as the commuter Account tab, plus the coop; signOut also ends a running trip.
export default function DriverAccount() {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth.session) return; // the root layout's guard sends logged-out users to sign-in
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, coop:coops(name)")
        .eq("id", auth.session.user.id)
        .single();
      if (error) return setError(error.message);
      const coop = data.coop as unknown as { name: string } | null;
      setAccount({
        fullName: data.full_name,
        email: auth.session.user.email ?? "",
        coopName: coop?.name ?? null,
      });
    })();
  }, [attempt]);

  return (
    <View className="flex-1 gap-6 bg-background p-6">
      {error ? (
        <View className="items-center gap-4">
          <Text className="text-center text-destructive">Could not load your account: {error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setError(null);
              setAttempt((n) => n + 1);
            }}
            className="min-h-12 justify-center px-4 active:opacity-80"
          >
            <Text className="font-semibold text-primary">Retry</Text>
          </Pressable>
        </View>
      ) : account ? (
        <View className="gap-1">
          <Text className="text-2xl font-semibold text-foreground">
            {account.fullName ?? "No name set"}
          </Text>
          <Text className="text-muted">{account.email}</Text>
          <Text className="mt-2 text-foreground">{account.coopName ?? "No coop set"}</Text>
          <Text className="text-muted">Riders see you as {shortName(account.fullName)}</Text>
        </View>
      ) : (
        <ActivityIndicator />
      )}
      <Pressable
        accessibilityRole="button"
        onPress={signOut}
        className="min-h-12 items-center justify-center rounded-lg border border-muted bg-white active:opacity-80"
      >
        <Text className="font-semibold text-foreground">Sign out</Text>
      </Pressable>
    </View>
  );
}
