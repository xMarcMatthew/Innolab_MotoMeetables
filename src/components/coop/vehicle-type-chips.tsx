import { Pressable, Text, View } from "react-native";

import type { VehicleType } from "@/lib/api/coop";
import { VEHICLE_TYPES } from "@/lib/validation";

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  jeepney: "Jeepney",
  tricycle: "Tricycle",
  bus: "Bus",
};

type ChipsProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

// One row of text-label chips; the selected one is filled. Never color alone.
export function Chips<T extends string>({ options, value, onChange, disabled }: ChipsProps<T>) {
  return (
    <View className="flex-row gap-2">
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="button"
          accessibilityState={{ selected: o.value === value, disabled }}
          disabled={disabled}
          onPress={() => onChange(o.value)}
          className={`flex-1 items-center rounded-lg py-3 ${
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
      <Chips options={TYPE_OPTIONS} value={value} onChange={onChange} />
    </View>
  );
}
