import { Text, View } from "react-native";

import { SignOutButton } from "@/components/sign-out-button";

export default function AccountScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
      <Text className="text-foreground">PLACEHOLDER: account (Worker B)</Text>
      <SignOutButton />
    </View>
  );
}
