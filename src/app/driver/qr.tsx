import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
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

  if (loading) return <LoadingState />;

  // A failed reload keeps the QR already on screen; the error shows only when nothing loaded yet.
  if (error && !board) {
    return (
      <View className="flex-1 justify-center bg-background p-6">
        <ErrorState
          message={`Could not load your QR: ${error}`}
          onRetry={() => {
            setLoading(true);
            loadQr();
          }}
        />
      </View>
    );
  }

  if (!board) {
    return (
      <View className="flex-1 justify-center bg-background">
        <EmptyState
          icon="qrcode-remove"
          message="No vehicle assigned yet. Ask your coop to assign you one."
        />
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
      <View className="self-stretch">
        <Card>
          <Text className="text-2xl font-bold text-foreground">{board.plate}</Text>
          <Text className="text-muted">Passengers scan this when they get on.</Text>
          <Text className="text-lg text-foreground">
            Passengers today: <Text className="font-semibold">{passengers ?? "–"}</Text>
          </Text>
        </Card>
      </View>
    </View>
  );
}
