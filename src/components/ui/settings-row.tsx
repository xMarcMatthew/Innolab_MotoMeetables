import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";

import { colors } from "@/lib/colors";

type Props = {
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  value?: string; // the current state or detail, under the label
  onPress?: () => void; // makes the row a 48 dp button with a chevron
  accessibilityLabel?: string; // when the tap does something the label does not say
};

// One line of a settings card: icon, label, its current value, and a chevron only when it does something.
export function SettingsRow({ icon, label, value, onPress, accessibilityLabel }: Props) {
  const body = (
    <>
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={colors.muted}
        importantForAccessibility="no"
      />
      <View className="flex-1">
        <Text className="text-foreground">{label}</Text>
        {value && <Text className="text-muted">{value}</Text>}
      </View>
      {onPress && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={colors.muted}
          importantForAccessibility="no"
        />
      )}
    </>
  );
  if (!onPress) return <View className="min-h-12 flex-row items-center gap-3 py-1">{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (value ? `${label}, ${value}` : label)}
      onPress={onPress}
      className="min-h-12 flex-row items-center gap-3 py-1 active:opacity-80"
    >
      {body}
    </Pressable>
  );
}
