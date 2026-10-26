import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { colors } from "@/lib/colors";

type Props = {
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  message: string;
  action?: { label: string; onPress: () => void };
};

export function EmptyState({ icon, message, action }: Props) {
  return (
    <View className="items-center gap-4 p-6">
      <MaterialCommunityIcons name={icon} size={48} color={colors.muted} />
      <Text className="text-center text-muted">{message}</Text>
      {action && <Button label={action.label} onPress={action.onPress} />}
    </View>
  );
}
