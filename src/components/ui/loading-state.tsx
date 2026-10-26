import { ActivityIndicator, View } from "react-native";

import { colors } from "@/lib/colors";

// Full-screen spinner for a screen's first load.
export function LoadingState() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
