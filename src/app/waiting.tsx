import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { colors } from "@/lib/colors";
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
    // The stack header covers the top; only the bottom inset is ours.
    <SafeAreaView edges={["bottom"]} className="flex-1 justify-center gap-6 bg-background p-6">
      <View className="gap-2">
        {email ? (
          <Text selectable className="text-2xl font-semibold text-foreground">
            {email}
          </Text>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
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
        <Button
          label="Check again"
          loading={checking}
          loadingLabel="Checking..."
          onPress={checkAgain}
        />
        <Button
          label="I'm a commuter instead"
          variant="outline"
          onPress={async () => {
            await setWantsDriver(false);
            router.replace("/commuter");
          }}
        />
      </View>
      <View className="items-center">
        <SignOutButton />
      </View>
    </SafeAreaView>
  );
}
