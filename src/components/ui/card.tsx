import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { colors } from "@/lib/colors";

const BOX = "rounded-lg border border-border bg-white p-4 shadow-sm";

type Props = {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  chevron?: boolean; // only with onPress: shows the row is tappable
};

export function Card({ children, onPress, accessibilityLabel, chevron }: Props) {
  if (!onPress) return <View className={`gap-2 ${BOX}`}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className={`flex-row items-center gap-3 active:opacity-80 ${BOX}`}
    >
      <View className="flex-1 gap-2">{children}</View>
      {chevron && <MaterialCommunityIcons name="chevron-right" size={24} color={colors.muted} />}
    </Pressable>
  );
}
