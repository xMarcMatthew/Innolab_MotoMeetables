import { Text, View } from "react-native";

import { SignOutButton } from "@/components/sign-out-button";

export default function DriverHome() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background">
      <Text className="text-foreground">PLACEHOLDER: driver home (owner: JM)</Text>
      <SignOutButton />
    </View>
  );
}
