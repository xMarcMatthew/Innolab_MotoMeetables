import { Stack } from "expo-router";

// Home tab: map, search and the rides sheet, then Route as a pushed screen.
export default function HomeStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="route" options={{ title: "Route" }} />
    </Stack>
  );
}
