import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";

// Inline: the caller decides the layout (centered full screen, or above a list).
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="gap-2">
      <Text className="text-destructive">{message}</Text>
      <Button label="Try again" variant="link" onPress={onRetry} className="self-start" />
    </View>
  );
}
