import { Link, router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { setWantsDriver } from "@/lib/onboarding";

// The whole onboarding for commuters: no slides, the search box on Home carries the hint.
export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 justify-center gap-10 bg-background p-6">
      <View className="items-center gap-2">
        <Text className="text-4xl font-bold text-foreground">Larga</Text>
        <Text className="text-center text-muted">Know the fare before you ride.</Text>
      </View>
      <View className="gap-3">
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            await setWantsDriver(false); // a commuter who first tapped "I drive" must not land on Waiting
            router.push("/sign-up");
          }}
          className="min-h-12 items-center justify-center rounded-lg bg-primary active:opacity-80"
        >
          <Text className="font-semibold text-white">Find a ride</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/for-drivers")}
          className="min-h-12 items-center justify-center rounded-lg border border-muted bg-white active:opacity-80"
        >
          <Text className="font-semibold text-foreground">I drive for a coop</Text>
        </Pressable>
        <Link
          href="/sign-in"
          onPress={() => setWantsDriver(false)} // drivers use the driver door's Sign in, which sets the flag
          className="py-4 text-center font-semibold text-primary"
        >
          Sign in
        </Link>
      </View>
    </SafeAreaView>
  );
}
