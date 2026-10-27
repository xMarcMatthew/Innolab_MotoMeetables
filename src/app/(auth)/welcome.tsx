import { router } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";

// The whole onboarding for commuters: no slides, the search box on Home carries the hint.
// Without `as: "driver"`, Sign in and Create account open as the commuter door.
export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 justify-center gap-10 bg-background p-6">
      <View className="items-center gap-4">
        <Wordmark width={240} />
        <Text className="text-center text-muted">Know the fare before you ride.</Text>
      </View>
      <View className="gap-3">
        <Button label="Register as commuter" onPress={() => router.push("/sign-up")} />
        <Button
          label="Apply as a driver"
          variant="outline"
          onPress={() => router.push("/for-drivers")}
        />
        <Button label="Sign in" variant="link" onPress={() => router.push("/sign-in")} />
      </View>
    </SafeAreaView>
  );
}
