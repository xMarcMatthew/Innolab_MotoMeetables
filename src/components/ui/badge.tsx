import { Text, View } from "react-native";

// The label is always text; orange only adds emphasis (Palette A: accent for "now loading").
export function Badge({
  label,
  variant = "accent",
}: {
  label: string;
  variant?: "accent" | "neutral";
}) {
  return (
    <View
      className={`self-start rounded-full px-3 py-1 ${
        variant === "accent" ? "bg-accent" : "border border-muted bg-white"
      }`}
    >
      <Text
        className={
          variant === "accent" ? "text-lg font-bold text-white" : "font-semibold text-foreground"
        }
      >
        {label}
      </Text>
    </View>
  );
}
