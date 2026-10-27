import { Text, View } from "react-native";

import { Chips } from "@/components/coop/vehicle-type-chips";

export type AuthRole = "commuter" | "driver";

const OPTIONS = [
  { value: "commuter", label: "Commuter" },
  { value: "driver", label: "Driver" },
] as const;

const HINTS: Record<AuthRole, string> = {
  commuter: "Find what to ride, where to board and the fare.",
  driver: "Use the email your coop knows. Your coop puts you on a vehicle.",
};

/** The `as` route param set by the Welcome and For drivers doors; anything but "driver" is a commuter. */
export function roleFromParam(as?: string): AuthRole {
  return as === "driver" ? "driver" : "commuter";
}

// Shows which door the user came through on Sign in and Create account, and lets them switch in place.
export function RoleSwitch({
  value,
  onChange,
}: {
  value: AuthRole;
  onChange: (r: AuthRole) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="font-medium text-foreground">I am a</Text>
      <Chips options={OPTIONS} value={value} onChange={onChange} />
      <Text className="text-muted">{HINTS[value]}</Text>
    </View>
  );
}
