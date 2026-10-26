import { Text, View } from "react-native";

import { SignOutButton } from "@/components/sign-out-button";

export default function CoopHome() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background">
      <Text className="text-foreground">PLACEHOLDER: coop home (owner: Rj)</Text>
      <SignOutButton />
    </View>
  );
}
