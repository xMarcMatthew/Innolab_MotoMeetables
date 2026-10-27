import { Text } from "react-native";

// Small uppercase label over a group of cards or list rows (Trips day headers, Account sections).
export function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="text-xs font-semibold uppercase tracking-wider text-muted">{children}</Text>
  );
}
