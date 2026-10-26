import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, useWindowDimensions, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { getMyBoardQr, getPassengersToday } from "@/lib/api/driver";

// How often the passenger count refreshes while this tab is open. Drivers cannot read boardings, so no Realtime.
const COUNT_REFRESH_MS = 5000;

// The board QR commuters scan when they get on (board_vehicle checks they are within 100 m), and today's count.
export default function DriverQr() {
  const { width } = useWindowDimensions();
  const [board, setBoard] = useState<{ board_token: string; plate: string } | null>(null);
  const [passengers, setPassengers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQr = useCallback(
    () =>
      getMyBoardQr()
        .then((b) => {
          setBoard(b);
          setError(null);
        })
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false)),
    [],
  );

  useFocusEffect(
    useCallback(() => {
      const refreshCount = () =>
        getPassengersToday()
          .then(setPassengers)
          .catch(() => {}); // keep the last count
      loadQr();
      refreshCount();
      const timer = setInterval(refreshCount, COUNT_REFRESH_MS);
      return () => clearInterval(timer);
    }, [loadQr]),
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  // A failed reload keeps the QR already on screen; the error shows only when nothing loaded yet.
  if (error && !board) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
        <Text className="text-center text-destructive">Could not load your QR: {error}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setLoading(true);
            loadQr();
          }}
          className="min-h-12 justify-center px-4 active:opacity-80"
        >
          <Text className="font-semibold text-primary">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!board) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-center text-muted">
          No vehicle assigned yet. Ask your coop to assign you one.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background p-6">
      {/* Black on white so phone cameras read it in sunlight. */}
      <View className="rounded-lg border border-border bg-white p-4">
        <QRCode
          value={board.board_token}
          size={Math.min(width - 80, 360)}
          color="black"
          backgroundColor="white"
        />
      </View>
      <View className="items-center gap-1">
        <Text className="text-2xl font-semibold text-foreground">{board.plate}</Text>
        <Text className="text-muted">Passengers scan this when they get on.</Text>
      </View>
      <Text className="text-lg text-foreground">
        Passengers today: <Text className="font-semibold">{passengers ?? "–"}</Text>
      </Text>
    </View>
  );
}
