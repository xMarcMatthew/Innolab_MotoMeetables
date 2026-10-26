import { Text, View } from "react-native";

import { SignOutButton } from "@/components/sign-out-button";

export default function WaitingScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
      <Text className="text-foreground">PLACEHOLDER: waiting for your coop (Worker B)</Text>
      <SignOutButton />
    </View>
  );
}
