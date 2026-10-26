import { router } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
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
        <Button
          label="Find a ride"
          onPress={async () => {
            await setWantsDriver(false); // a commuter who first tapped "I drive" must not land on Waiting
            router.push("/sign-up");
          }}
        />
        <Button
          label="I drive for a coop"
          variant="outline"
          onPress={() => router.push("/for-drivers")}
        />
        <Button
          label="Sign in"
          variant="link"
          onPress={async () => {
            await setWantsDriver(false); // drivers use the driver door's Sign in, which sets the flag
            router.push("/sign-in");
          }}
        />
      </View>
    </SafeAreaView>
  );
}
