import { router } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";

// `as: "driver"` marks the driver door: Sign in and Create account show it and set the Waiting flag at submit.
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
        <Button
          label="Create account"
          onPress={() => router.push({ pathname: "/sign-up", params: { as: "driver" } })}
        />
        <Button
          label="Sign in"
          variant="outline"
          onPress={() => router.push({ pathname: "/sign-in", params: { as: "driver" } })}
        />
      </View>
    </SafeAreaView>
  );
}
