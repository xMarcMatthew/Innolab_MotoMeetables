import { type Href, router } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { setWantsDriver } from "@/lib/onboarding";

// The flag makes index.tsx send a still-commuter account to Waiting instead of commuter Home.
async function go(href: Href) {
  await setWantsDriver(true);
  router.push(href);
}

export default function DriverExplainerScreen() {
  return (
    // The stack header covers the top; only the bottom inset is ours.
    <SafeAreaView edges={["bottom"]} className="flex-1 gap-6 bg-background p-6">
      <View className="gap-2">
        <Text className="text-2xl font-bold text-foreground">Driving for a coop?</Text>
        <Text className="text-muted">
          Your coop assigns you a vehicle in Larga. Create an account with the email your coop
          knows, or sign in if they already gave you one.
        </Text>
      </View>
      <View className="gap-3">
        <Button label="Create account" onPress={() => go("/sign-up")} />
        <Button label="Sign in" variant="outline" onPress={() => go("/sign-in")} />
      </View>
    </SafeAreaView>
  );
}
