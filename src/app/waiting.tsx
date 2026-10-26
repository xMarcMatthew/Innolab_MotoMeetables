import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { SignOutButton } from "@/components/sign-out-button";
import { setWantsDriver } from "@/lib/onboarding";
import { supabase } from "@/lib/supabase";

// A driver sign-up is a commuter until the coop promotes it (Decisions D2). The header shows the title.
export default function WaitingScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
  }, []);

  async function checkAgain() {
    setChecking(true);
    setMessage(null);
    try {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth.session) return; // the root layout's guard sends logged-out users to sign-in
      // Filter to our own row: a coop user can also read its drivers' profiles.
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.session.user.id)
        .single();
      if (error) return setMessage({ text: `Could not check: ${error.message}`, isError: true });
      if (data.role !== "driver")
        return setMessage({ text: "Your coop has not added you yet.", isError: false });
      await setWantsDriver(false);
      router.replace("/driver");
    } finally {
      setChecking(false);
    }
  }

  return (
    <View className="flex-1 justify-center gap-6 bg-background p-6">
      <View className="gap-2">
        {email ? (
          <Text selectable className="text-2xl font-semibold text-foreground">
            {email}
          </Text>
        ) : (
          <ActivityIndicator />
        )}
        <Text className="text-muted">
          Give this email to your coop. When they assign you a vehicle, tap Check again.
        </Text>
      </View>
      {message && (
        <Text className={message.isError ? "text-destructive" : "text-foreground"}>
          {message.text}
        </Text>
      )}
      <View className="gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: checking }}
          disabled={checking}
          onPress={checkAgain}
          className="min-h-12 items-center justify-center rounded-lg bg-primary active:opacity-80"
        >
          <Text className="font-semibold text-white">
            {checking ? "Checking..." : "Check again"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            await setWantsDriver(false);
            router.replace("/commuter");
          }}
          className="min-h-12 items-center justify-center rounded-lg border border-muted bg-white active:opacity-80"
        >
          <Text className="font-semibold text-foreground">I&apos;m a commuter instead</Text>
        </Pressable>
      </View>
      <View className="items-center">
        <SignOutButton />
      </View>
    </View>
  );
}
