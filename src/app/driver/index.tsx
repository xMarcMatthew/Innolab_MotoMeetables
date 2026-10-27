import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Linking, ScrollView, Text, View } from "react-native";

import { VEHICLE_TYPE_LABELS } from "@/components/coop/vehicle-type-chips";
import { FirstTripChecklist } from "@/components/driver/first-trip-checklist";
import { PaymentQrSection } from "@/components/driver/payment-qr-section";
import { FormField } from "@/components/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/loading-state";
import { useMyVehicle } from "@/hooks/use-my-vehicle";
import { useSavedFlash } from "@/hooks/use-saved-flash";
import {
  getPassengersToday,
  setFare,
  setMyPaymentQr,
  setStatus,
  type VehicleStatus,
} from "@/lib/api/driver";
import { colors } from "@/lib/colors";
import { endTrip, isOnTrip, startTrip, type StartTripResult } from "@/lib/trip";
import { type Fare, fareSchema } from "@/lib/validation";

type TripDenied = Exclude<StartTripResult, "started">;
const TRIP_DENIED: Record<TripDenied, string> = {
  "location-denied": "Larga needs your location to share where your vehicle is.",
  "background-denied":
    'Set Location to "Allow all the time" so sharing keeps going with the screen off.',
};

// Status is always spelled out, never color alone. Orange accent only on "Now loading" (Palette A).
const STATUS_LABELS: Record<VehicleStatus, string> = {
  off_duty: "Off duty",
  loading: "Now loading",
  departed: "Departed",
};

// Same refresh as the QR tab. Drivers cannot read boardings, so no Realtime.
const COUNT_REFRESH_MS = 5000;

const peso = (n: number) => `₱${n.toFixed(2)}`;

// One obvious next step per stage: Start loading (share location and say so), Depart, End trip.
// The coop's dispatcher buttons remain the way to correct a status from outside.
export default function DriverHome() {
  const { vehicle, loading, error, reload } = useMyVehicle();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // null until we know whether a trip is already running (it survives an app restart).
  const [onTrip, setOnTrip] = useState<boolean | null>(null);
  const [tripAction, setTripAction] = useState<"starting" | "ending" | null>(null);
  const [tripDenied, setTripDenied] = useState<TripDenied | null>(null);
  const [passengers, setPassengers] = useState<number | null>(null);
  const [fareSaved, flashFareSaved] = useSavedFlash();
  const { control, handleSubmit } = useForm<Fare>({
    resolver: zodResolver(fareSchema),
    values: { fare: vehicle?.driver_fare?.toFixed(2) ?? "" },
    resetOptions: { keepDirtyValues: true }, // a reload after a status tap must not wipe a fare being typed
  });

  // Returns true when the action went through.
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      await reload();
      return true;
    } catch (e) {
      setActionError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  const onSaveFare = handleSubmit(async ({ fare }) => {
    if (await run(() => setFare(Number(fare)))) flashFareSaved();
  });

  useEffect(() => {
    isOnTrip().then(setOnTrip, () => setOnTrip(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      const refreshCount = () =>
        getPassengersToday()
          .then(setPassengers)
          .catch(() => {}); // keep the last count
      refreshCount();
      const timer = setInterval(refreshCount, COUNT_REFRESH_MS);
      return () => clearInterval(timer);
    }, []),
  );

  // Share location, then say the jeep is loading. A denied permission leaves the status alone.
  const onStartLoading = async () => {
    setTripAction("starting");
    await run(async () => {
      const result = await startTrip();
      setTripDenied(result === "started" ? null : result);
      setOnTrip(result === "started");
      if (result === "started") await setStatus("loading");
    });
    setTripAction(null);
  };

  const onEndTrip = async () => {
    setTripAction("ending");
    await run(async () => {
      // Offline, the GPS still stops but Off duty fails: show what is really running either way.
      try {
        await endTrip();
      } finally {
        setOnTrip(await isOnTrip());
      }
    });
    setTripAction(null);
  };

  if (loading) return <LoadingState />;

  if (error || !vehicle) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="grow items-center justify-center gap-4 p-6"
      >
        {!error && <FirstTripChecklist vehicleAssigned={false} />}
        <Text className={`text-center ${error ? "text-destructive" : "text-foreground"}`}>
          {error ?? "No vehicle assigned yet. Ask your coop."}
        </Text>
        <Button label="Check again" variant="link" onPress={reload} />
      </ScrollView>
    );
  }

  const { route, status } = vehicle;
  const aboveGuide =
    route !== null &&
    vehicle.driver_fare !== null &&
    vehicle.driver_fare > route.guide_fare_regular;
  const sharing = onTrip === true;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-6"
      keyboardShouldPersistTaps="handled"
    >
      <FirstTripChecklist vehicleAssigned />

      <Card>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-2xl font-bold text-foreground">
              {vehicle.plate} · {VEHICLE_TYPE_LABELS[vehicle.vehicle_type]}
            </Text>
            <Text className="text-muted">
              {route
                ? `${route.terminal.name} → ${route.destination_name}`
                : "No route set by your coop"}
            </Text>
          </View>
          <Badge
            label={STATUS_LABELS[status]}
            variant={status === "loading" ? "accent" : "neutral"}
          />
        </View>

        {onTrip !== null && (
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons
              name={sharing ? "map-marker-radius" : "map-marker-off"}
              size={20}
              color={sharing ? colors.primary : colors.muted}
              importantForAccessibility="no"
            />
            <Text className={sharing ? "text-foreground" : "text-muted"}>
              {sharing ? "Sharing your location with riders" : "Not sharing your location"}
            </Text>
          </View>
        )}
        <Text className="text-foreground">
          Passengers today: <Text className="font-semibold">{passengers ?? "–"}</Text>
        </Text>

        {onTrip !== null &&
          (!sharing ? (
            <Button
              label="Start loading"
              variant="accent"
              disabled={busy}
              loading={tripAction === "starting"}
              loadingLabel="Starting..."
              onPress={onStartLoading}
            />
          ) : status === "loading" ? (
            <>
              <Button
                label="Depart"
                disabled={busy}
                onPress={() => run(() => setStatus("departed"))}
              />
              <Button
                label="End trip"
                variant="outline"
                disabled={busy}
                loading={tripAction === "ending"}
                loadingLabel="Ending..."
                onPress={onEndTrip}
              />
            </>
          ) : status === "departed" ? (
            <>
              <Button
                label="End trip"
                disabled={busy}
                loading={tripAction === "ending"}
                loadingLabel="Ending..."
                onPress={onEndTrip}
              />
              <Button
                label="Back to loading"
                variant="link"
                disabled={busy}
                onPress={() => run(() => setStatus("loading"))}
              />
            </>
          ) : (
            // Sharing but Off duty: the coop set it, or saving "loading" failed right after Start.
            <>
              <Button
                label="Now loading"
                variant="accent"
                disabled={busy}
                onPress={() => run(() => setStatus("loading"))}
              />
              <Button
                label="End trip"
                variant="outline"
                disabled={busy}
                loading={tripAction === "ending"}
                loadingLabel="Ending..."
                onPress={onEndTrip}
              />
            </>
          ))}
        {tripDenied && (
          <>
            <Text className="text-destructive">{TRIP_DENIED[tripDenied]}</Text>
            <Button label="Open settings" variant="link" onPress={() => Linking.openSettings()} />
          </>
        )}
      </Card>

      <Card>
        <Text className="text-lg font-semibold text-foreground">Fare</Text>
        <FormField
          control={control}
          name="fare"
          label="Your fare (₱)"
          keyboardType="decimal-pad"
          placeholder="15.00"
        />
        {route && (
          <Text className="text-muted">
            Official fare guide: {peso(route.guide_fare_regular)}
            {route.guide_fare_discounted !== null &&
              ` (${peso(route.guide_fare_discounted)} discounted)`}
          </Text>
        )}
        {aboveGuide && (
          <Text className="font-semibold text-destructive">Above the official fare</Text>
        )}
        <Button label="Save fare" disabled={busy} onPress={onSaveFare} />
        {fareSaved && <Text className="font-semibold text-foreground">Saved ✓</Text>}
      </Card>

      <Card>
        <PaymentQrSection
          qr={vehicle.payment_qr}
          fare={vehicle.driver_fare ?? route?.guide_fare_regular ?? null}
          busy={busy}
          onSave={(qr) => run(() => setMyPaymentQr(qr))}
        />
      </Card>

      {actionError && (
        <Text accessibilityLiveRegion="polite" className="text-destructive">
          {actionError}
        </Text>
      )}
    </ScrollView>
  );
}
