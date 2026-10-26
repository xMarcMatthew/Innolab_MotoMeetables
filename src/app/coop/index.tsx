import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { SignOutButton } from "@/components/sign-out-button";
import { useMyTerminals } from "@/hooks/use-my-terminals";

export default function CoopHome() {
  const router = useRouter();
  const { terminals, loading, error, reload } = useMyTerminals();

  // Coming back from the form must show the saved change.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-6">
      <Text className="text-2xl font-bold text-foreground">Terminals</Text>

      {error && (
        <View className="gap-2">
          <Text className="text-destructive">{error}</Text>
          <Pressable accessibilityRole="button" onPress={reload}>
            <Text className="font-semibold text-primary">Try again</Text>
          </Pressable>
        </View>
      )}

      {!error && terminals.length === 0 && <Text className="text-muted">No terminals yet</Text>}

      {terminals.map((t) => (
        <View
          key={t.id}
          className="flex-row items-center gap-3 rounded-lg border border-border bg-white p-4"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Routes of ${t.name}`}
            onPress={() =>
              router.push({
                pathname: "/coop/routes",
                params: { terminalId: t.id, terminalName: t.name },
              })
            }
            className="flex-1 gap-1"
          >
            <Text className="text-lg font-semibold text-foreground">{t.name}</Text>
            <Text className="text-muted">
              {t.lat.toFixed(5)}, {t.lng.toFixed(5)} · Routes
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${t.name}`}
            onPress={() =>
              router.push({
                pathname: "/coop/terminal",
                params: { id: t.id, name: t.name, lat: String(t.lat), lng: String(t.lng) },
              })
            }
          >
            <Text className="font-semibold text-primary">Edit</Text>
          </Pressable>
        </View>
      ))}

      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/coop/terminal")}
          className="flex-1 items-center rounded-lg bg-primary py-3"
        >
          <Text className="font-semibold text-white">Add terminal</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/coop/vehicles")}
          className="flex-1 items-center rounded-lg border border-muted bg-white py-3"
        >
          <Text className="font-semibold text-foreground">Vehicles</Text>
        </Pressable>
      </View>

      <View className="items-center">
        <SignOutButton />
      </View>
    </ScrollView>
  );
}
