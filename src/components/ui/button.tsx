import { ActivityIndicator, Pressable, Text } from "react-native";

import { colors } from "@/lib/colors";

type Variant = "primary" | "accent" | "outline" | "link" | "destructive-text";

// Orange accent carries white text only, and large bold so it passes 3:1 (Palette A).
const STYLES: Record<Variant, { box: string; text: string }> = {
  primary: { box: "bg-primary", text: "font-semibold text-white" },
  accent: { box: "bg-accent", text: "text-lg font-bold text-white" },
  outline: { box: "border border-muted bg-white", text: "font-semibold text-foreground" },
  link: { box: "px-4", text: "font-semibold text-primary" },
  "destructive-text": {
    box: "border border-muted bg-white",
    text: "font-semibold text-destructive",
  },
};

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  loadingLabel?: string; // shown instead of label while loading
  disabled?: boolean;
  className?: string; // layout only, e.g. flex-1
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  loadingLabel,
  disabled,
  className = "",
}: Props) {
  const { box, text } = STYLES[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      onPress={onPress}
      className={`min-h-12 flex-row items-center justify-center gap-2 rounded-lg active:opacity-80 disabled:opacity-50 ${box} ${className}`}
    >
      {loading && (
        <ActivityIndicator
          color={variant === "primary" || variant === "accent" ? colors.white : colors.primary}
        />
      )}
      <Text className={text}>{loading && loadingLabel ? loadingLabel : label}</Text>
    </Pressable>
  );
}
