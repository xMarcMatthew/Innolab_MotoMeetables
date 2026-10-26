import { Stack } from "expo-router";

// Home tab: map and search, then Options, then Route, as pushed screens.
export default function HomeStack() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="options" options={{ title: "Rides" }} />
      <Stack.Screen name="route" options={{ title: "Route" }} />
    </Stack>
  );
}
