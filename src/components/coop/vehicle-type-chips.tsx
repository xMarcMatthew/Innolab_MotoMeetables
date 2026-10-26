import { Pressable, Text, View } from "react-native";

import type { VehicleType } from "@/lib/api/coop";
import { VEHICLE_TYPES } from "@/lib/validation";

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  jeepney: "Traditional jeepney",
  modern_jeepney: "Modern jeepney",
  tricycle: "Tricycle",
  bus: "Bus",
};

type ChipsProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  wrap?: boolean; // two per row, for long labels
};

// One row of text-label chips; the selected one is filled. Never color alone.
export function Chips<T extends string>({
  options,
  value,
  onChange,
  disabled,
  wrap,
}: ChipsProps<T>) {
  return (
    <View className={`flex-row gap-2 ${wrap ? "flex-wrap" : ""}`}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="button"
          accessibilityState={{ selected: o.value === value, disabled }}
          disabled={disabled}
          onPress={() => onChange(o.value)}
          className={`min-h-12 flex-1 items-center justify-center rounded-lg active:opacity-80 disabled:opacity-50 ${wrap ? "min-w-[45%]" : ""} ${
            o.value === value ? "bg-primary" : "border border-muted bg-white"
          }`}
        >
          <Text className={`font-semibold ${o.value === value ? "text-white" : "text-foreground"}`}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const TYPE_OPTIONS = VEHICLE_TYPES.map((t) => ({ value: t, label: VEHICLE_TYPE_LABELS[t] }));

export function VehicleTypeChips({
  value,
  onChange,
}: {
  value: VehicleType;
  onChange: (value: VehicleType) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="font-medium text-foreground">Vehicle type</Text>
      <Chips options={TYPE_OPTIONS} value={value} onChange={onChange} wrap />
    </View>
  );
}
