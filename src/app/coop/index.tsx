import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { ScrollView, Text, View } from "react-native";

import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
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

  if (loading) return <LoadingState />;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-6">
      <Text className="text-2xl font-bold text-foreground">Terminals</Text>

      {error && <ErrorState message={error} onRetry={reload} />}

      {!error && terminals.length === 0 && (
        <EmptyState icon="map-marker-outline" message="No terminals yet" />
      )}

      {terminals.map((t) => (
        <Card key={t.id}>
          <Text className="text-lg font-semibold text-foreground">{t.name}</Text>
          <View className="flex-row">
            <Button
              label="View routes ›"
              variant="link"
              onPress={() =>
                router.push({
                  pathname: "/coop/routes",
                  params: { terminalId: t.id, terminalName: t.name },
                })
              }
            />
            <Button
              label="Edit ›"
              variant="link"
              onPress={() =>
                router.push({
                  pathname: "/coop/terminal",
                  params: { id: t.id, name: t.name, lat: String(t.lat), lng: String(t.lng) },
                })
              }
            />
          </View>
        </Card>
      ))}

      <View className="flex-row gap-3">
        <Button
          label="Add terminal"
          onPress={() => router.push("/coop/terminal")}
          className="flex-1"
        />
        <Button
          label="Vehicles"
          variant="outline"
          onPress={() => router.push("/coop/vehicles")}
          className="flex-1"
        />
      </View>

      <View className="items-center">
        <SignOutButton />
      </View>
    </ScrollView>
  );
}
