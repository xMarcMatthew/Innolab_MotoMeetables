import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";

import { colors } from "@/lib/colors";

type Tone = "success" | "destructive";

type Props = {
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  value?: string; // the current state or detail, under the label
  tone?: Tone; // colours the icon and the value when the state is clearly good or bad; the text still says it
  onPress?: () => void; // makes the row a 48 dp button with a chevron
  accessibilityLabel?: string; // when the tap does something the label does not say
  divider?: boolean; // hairline under the row; every row in a card but the last
};

const VALUE_CLASS: Record<Tone, string> = {
  success: "text-sm font-medium text-success",
  destructive: "text-sm font-medium text-destructive",
};

// One line of a settings card: icon, label, its current value, and a chevron only when it does something.
export function SettingsRow({
  icon,
  label,
  value,
  tone,
  onPress,
  accessibilityLabel,
  divider,
}: Props) {
  const box = `min-h-12 flex-row items-center gap-3 py-2 ${divider ? "border-b border-border" : ""}`;
  const body = (
    <>
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={tone ? colors[tone] : colors.muted}
        importantForAccessibility="no"
      />
      <View className="flex-1">
        <Text className="font-medium text-foreground">{label}</Text>
        {value && <Text className={tone ? VALUE_CLASS[tone] : "text-sm text-muted"}>{value}</Text>}
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
  if (!onPress) return <View className={box}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (value ? `${label}, ${value}` : label)}
      onPress={onPress}
      className={`${box} active:opacity-80`}
    >
      {body}
    </Pressable>
  );
}
