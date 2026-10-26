import { type Href, router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { setWantsDriver } from "@/lib/onboarding";

// The flag makes index.tsx send a still-commuter account to Waiting instead of commuter Home.
async function go(href: Href) {
  await setWantsDriver(true);
  router.push(href);
}

export default function DriverExplainerScreen() {
  return (
    <View className="flex-1 gap-6 bg-background p-6">
      <View className="gap-2">
        <Text className="text-2xl font-bold text-foreground">Driving for a coop?</Text>
        <Text className="text-muted">
          Your coop assigns you a vehicle in Larga. Create an account with the email your coop
          knows, or sign in if they already gave you one.
        </Text>
      </View>
      <View className="gap-3">
        <Pressable
          accessibilityRole="button"
          onPress={() => go("/sign-up")}
          className="min-h-12 items-center justify-center rounded-lg bg-primary active:opacity-80"
        >
          <Text className="font-semibold text-white">Create account</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => go("/sign-in")}
          className="min-h-12 items-center justify-center rounded-lg border border-muted bg-white active:opacity-80"
        >
          <Text className="font-semibold text-foreground">Sign in</Text>
        </Pressable>
      </View>
    </View>
  );
}
