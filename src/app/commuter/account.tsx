import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { shortName } from "@/lib/names";
import { supabase } from "@/lib/supabase";

// The tab header shows the title. The owner sees their own full name; others see shortName().
export default function AccountScreen() {
  const [account, setAccount] = useState<{ fullName: string | null; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth.session) return; // the root layout's guard sends logged-out users to sign-in
      // Filter to our own row: a coop user can also read its drivers' profiles.
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", auth.session.user.id)
        .single();
      if (error) setError(error.message);
      else setAccount({ fullName: data.full_name, email: auth.session.user.email ?? "" });
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
          <Text className="mt-2 text-muted">Others see you as {shortName(account.fullName)}</Text>
        </View>
      ) : (
        <ActivityIndicator />
      )}
      {/* Own button, not SignOutButton: that one is a text link with no className prop, too small for a full-width target. */}
      <Pressable
        accessibilityRole="button"
        onPress={() => supabase.auth.signOut()}
        className="min-h-12 items-center justify-center rounded-lg border border-muted bg-white active:opacity-80"
      >
        <Text className="font-semibold text-foreground">Sign out</Text>
      </Pressable>
    </View>
  );
}
